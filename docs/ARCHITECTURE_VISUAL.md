# POS System - Architecture Overview

## System Components

```
┌─────────────────────────────────────────────────────────────────┐
│                     POS SYSTEM ARCHITECTURE                      │
└─────────────────────────────────────────────────────────────────┘

┌──────────────────┐
│  POS Terminal    │ (React PWA - Frontend)
│  (Touch UI)      │
└────────┬─────────┘
         │ HTTP/WebSocket
         ▼
┌──────────────────────────────────────────────────────────────────┐
│                    EXPRESS BACKEND API                            │
├──────────────────────────────────────────────────────────────────┤
│                                                                   │
│  Routes:                                                          │
│  ├─ POST /payments/process          ──┐                         │
│  ├─ POST /payments/refund/:id          │                        │
│  ├─ GET  /payments/:id                 ├─→ paymentOrchestrator │
│  ├─ GET  /payments/methods             │                        │
│  ├─ POST /payments/terminal/pair     ──┘                         │
│                                                                   │
│  ├─ POST /webhooks/stripe                                        │
│  ├─ POST /webhooks/square      ───→ HMAC Verification          │
│  ├─ POST /webhooks/mercadopago         │                        │
│  └─ POST /webhooks/paypal              │                        │
│                                         ▼                        │
│  ├─ POST /orders          ──┐     Update DB                     │
│  ├─ GET  /orders            │     (async)                       │
│  └─ PUT  /orders/:id      ──┘                                    │
│                                                                   │
└──────────────────────────────────────────────────────────────────┘
         │         │              │
         │         │              │
    ┌────▼─┐   ┌──▼───┐    ┌─────▼──────┐
    │  DB  │   │Redis │    │  Webhooks  │
    │(PG)  │   │Cache │    │ (async)    │
    └──────┘   └──────┘    └────────────┘
```

## Payment Processing Flow

```
Client Request with Idempotency Key
         │
         ▼
┌────────────────────────────────────────┐
│ paymentOrchestrator.processPayment()   │
│                                        │
│ 1. Check Redis cache (idempotency)    │
│    ├─ HIT  → Return cached result     │
│    └─ MISS → Continue processing      │
│                                        │
│ 2. Retry loop (max 3 attempts):       │
│    ├─ Attempt 1: Wait 0ms             │
│    ├─ Attempt 2: Wait 1s, Retry      │
│    ├─ Attempt 3: Wait 2s, Retry      │
│    └─ Max reached: Throw error        │
│                                        │
│ 3. Route to provider:                 │
│    ├─ Stripe   → PaymentIntent        │
│    ├─ Square   → Payments API         │
│    └─ MercadoPago → Payment SDK       │
│                                        │
│ 4. Store in PostgreSQL:               │
│    ├─ payment_transactions table      │
│    ├─ Status: pending → succeeded/failed │
│    └─ Provider response metadata      │
│                                        │
│ 5. Cache result (24h):                │
│    └─ idempotency:{key} in Redis      │
└────────────────────────────────────────┘
         │
         ▼
    HTTP Response
    {
      "status": "succeeded",
      "transactionId": "txn_xxx",
      "providerTransactionId": "pi_xxx",
      "amount": 9999
    }
         │
         ▼
┌────────────────────────────────────────┐
│  Order Status Updated                  │
│  orders.payment_status = 'paid'        │
└────────────────────────────────────────┘
         │
         ▼
    [async] Provider sends Webhook
         │
         ▼
┌────────────────────────────────────────┐
│ POST /webhooks/{provider}              │
│                                        │
│ 1. Extract signature header            │
│ 2. Verify HMAC:                        │
│    ├─ Stripe: Built-in SDK            │
│    ├─ Square: x-square-hmac-sha256   │
│    └─ MercadoPago: x-signature        │
│ 3. Validate signature matches          │
│    ├─ Match   → Continue               │
│    └─ No match → Return 403            │
│ 4. Handle event:                       │
│    ├─ Update transaction status        │
│    └─ Update order status              │
│ 5. Emit WebSocket event                │
│    └─ KDS/receipt notified             │
└────────────────────────────────────────┘
         │
         ▼
    Order Ready for Fulfillment
```

## Data Flow

```
┌─────────────────────────────────────────────────────────────┐
│                    DATABASE SCHEMA                           │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  orders                     payment_transactions            │
│  ├─ id: UUID               ├─ id: UUID                     │
│  ├─ order_number: STRING   ├─ order_id: UUID (FK orders)  │
│  ├─ table_id: UUID         ├─ payment_method: STRING       │
│  ├─ subtotal: NUMERIC      ├─ payment_provider: STRING     │
│  ├─ tax: NUMERIC           ├─ amount: NUMERIC              │
│  ├─ tip: NUMERIC           ├─ status: VARCHAR (pending)    │
│  ├─ total: NUMERIC         ├─ provider_transaction_id      │
│  ├─ payment_status: VARCHAR├─ provider_response: JSONB     │
│  ├─ created_at: TIMESTAMP  ├─ card_last4: VARCHAR          │
│  └─ paid_at: TIMESTAMP     ├─ created_at: TIMESTAMP        │
│                            └─ updated_at: TIMESTAMP        │
│                                                              │
│  payment_terminals              refunds                    │
│  ├─ id: UUID                   ├─ id: UUID                 │
│  ├─ terminal_id: STRING        ├─ payment_transaction_id    │
│  ├─ provider: STRING (stripe)  ├─ amount: NUMERIC           │
│  ├─ device_type: STRING        ├─ reason: VARCHAR           │
│  ├─ status: VARCHAR            ├─ status: VARCHAR           │
│  ├─ last_seen_at: TIMESTAMP    ├─ provider_refund_id        │
│  └─ created_at: TIMESTAMP      └─ created_at: TIMESTAMP     │
│                                                              │
└─────────────────────────────────────────────────────────────┘

Indexes for Performance:
├─ payment_transactions(order_id)
├─ payment_transactions(status)
├─ payment_transactions(payment_provider, provider_transaction_id)
├─ payment_transactions(created_at DESC)
├─ refunds(payment_transaction_id)
└─ refunds(status)
```

## Idempotency Key Flow

```
┌──────────────────────────────────────────────────────────────┐
│  IDEMPOTENCY KEY DESIGN (Prevents Double Charging)          │
├──────────────────────────────────────────────────────────────┤
│                                                               │
│  Scenario: Network timeout after payment processed           │
│                                                               │
│  Request 1 (Idempotency Key: "idem_abc123")                 │
│  ├─ Check Redis: MISS                                        │
│  ├─ Process payment: SUCCESS                                 │
│  ├─ Cache result in Redis for 24 hours                      │
│  └─ Return response → Network timeout before client          │
│                                                               │
│  Request 2 (Same Idempotency Key: "idem_abc123")            │
│  ├─ Check Redis: HIT                                         │
│  ├─ Return cached result immediately                         │
│  └─ NO second charge (payment already processed)             │
│                                                               │
│  Architecture:                                                │
│  Redis Key: idempotency:{key}                               │
│  Value: { status, transactionId, amount, ... }             │
│  TTL: 86400 seconds (24 hours)                              │
│                                                               │
└──────────────────────────────────────────────────────────────┘
```

## Provider Integration

```
┌─────────────────────────────────────────────────────────────┐
│              STRIPE INTEGRATION                              │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Flow:                                                       │
│  1. Frontend tokenizes card → pm_1234567890 (PaymentMethod)│
│  2. POST /payments/process with paymentMethodId             │
│  3. paymentOrchestrator.processStripePayment()              │
│     ├─ stripe.paymentIntents.create({                       │
│     │   amount: 9999,                                       │
│     │   payment_method: "pm_1234567890",                   │
│     │   idempotency_key: "idem_xyz",                        │
│     │   confirm: true,                                      │
│     │   metadata: { orderId, ... }                          │
│     └─ })                                                    │
│  4. Return PaymentIntent status                             │
│  5. Webhook: payment_intent.succeeded                       │
│     └─ Update order status                                  │
│                                                              │
│  Key Features:                                               │
│  ├─ Idempotency: Built-in (idempotency_key parameter)     │
│  ├─ Retry: Handled by SDK                                   │
│  ├─ Webhook: Automatically signed by Stripe                │
│  └─ Security: Client token never exposes card details      │
│                                                              │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│              SQUARE INTEGRATION                              │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Flow:                                                       │
│  1. Frontend tokenizes card → nonce or token                │
│  2. POST /payments/process with paymentMethodId             │
│  3. paymentOrchestrator.processSquarePayment()              │
│     ├─ client.paymentsApi.createPayment({                   │
│     │   sourceId: "nonce_xyz",                              │
│     │   amountMoney: { amount: 999900, currency: "USD" },  │
│     │   idempotencyKey: "idem_xyz",                         │
│     │   metadata: { orderId, ... }                          │
│     └─ })                                                    │
│  4. Return Payment status                                   │
│  5. Webhook: payment.created/updated                        │
│     └─ Verify x-square-hmac-sha256 signature               │
│     └─ Update order status                                  │
│                                                              │
│  Key Features:                                               │
│  ├─ Idempotency: idempotencyKey parameter                  │
│  ├─ Retry: Handled by SDK with backoff                     │
│  ├─ Webhook: HMAC-SHA256 signed                            │
│  └─ Amount: In cents (must multiply by 100)                │
│                                                              │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│          MERCADO PAGO INTEGRATION                            │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Flow:                                                       │
│  1. Frontend tokenizes card → token or nonce                │
│  2. POST /payments/process with paymentMethodId             │
│  3. paymentOrchestrator.processMercadoPagoPayment()         │
│     ├─ client.payment.create({                              │
│     │   token: "token_xyz",                                 │
│     │   transaction_amount: 99.99,                          │
│     │   currency_id: "USD",                                 │
│     │   metadata: { orderId, ... }                          │
│     └─ })                                                    │
│  4. Return Payment status                                   │
│  5. Webhook: payment.updated                                │
│     └─ Verify x-signature HMAC                             │
│     └─ Update order status                                  │
│                                                              │
│  Key Features:                                               │
│  ├─ Idempotency: Manual via Redis (no SDK support)         │
│  ├─ Retry: Implemented in orchestrator                      │
│  ├─ Webhook: HMAC with timestamp                           │
│  └─ Amount: In pesos (no cents multiplier)                 │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

## Error Handling & Retries

```
Request → Process
    │
    ├─ Network timeout → Retry with backoff
    │  └─ Wait 1s, retry (attempt 2)
    │  └─ Wait 2s, retry (attempt 3)
    │  └─ Fail after 3 attempts
    │
    ├─ Invalid card → Fail immediately (no retry)
    │  └─ Return 400 Bad Request
    │
    ├─ Rate limit (429) → Retry with backoff
    │  └─ Wait 1s, retry
    │
    ├─ Server error (5xx) → Retry with backoff
    │  └─ Wait 1s, retry
    │
    ├─ Idempotency error → Return cached result
    │  └─ No re-processing (duplicate detected)
    │
    └─ Success → Cache & return 200 OK
```

## Deployment Components

```
┌──────────────────────────────────────────────────────────────┐
│                  DOCKER COMPOSE STACK                        │
├──────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌─────────────────┐  ┌──────────────┐  ┌──────────────┐    │
│  │ Backend (Node)  │  │ PostgreSQL   │  │ Redis        │    │
│  │ Port: 3000      │  │ Port: 5432   │  │ Port: 6379   │    │
│  │ ├─ Express API  │  │ ├─ Payments  │  │ ├─ Cache     │    │
│  │ ├─ Webhooks     │  │ ├─ Orders    │  │ ├─ Idempotent│    │
│  │ └─ Routes       │  │ └─ Terminals │  │ └─ Sessions  │    │
│  └──────┬──────────┘  └──────────────┘  └──────────────┘    │
│         │ TCP 5432       TCP 6379                            │
│         └──────────┬──────────────┘                          │
│                    │                                         │
│  ┌─────────────────────────────────────────────────────┐    │
│  │           Docker Network (bridge)                    │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                               │
│  Environment: Docker Compose with services defined in       │
│  docker-compose.yml                                          │
│                                                               │
└──────────────────────────────────────────────────────────────┘
```

## Security & Compliance

```
┌──────────────────────────────────────────────────────────────┐
│              SECURITY MEASURES (PCI DSS)                      │
├──────────────────────────────────────────────────────────────┤
│                                                               │
│ ✓ HMAC Signature Verification                               │
│   └─ All webhooks verified with provider secrets            │
│                                                               │
│ ✓ No Card Data Storage                                       │
│   └─ Only store payment method tokens (pm_xxx)              │
│   └─ Last 4 digits stored for UI (card_last4)              │
│                                                               │
│ ✓ Environment-Based Secrets                                  │
│   └─ API keys loaded from .env (never in code)             │
│   └─ Webhook secrets rotated per provider                   │
│                                                               │
│ ✓ HTTPS Required                                             │
│   └─ All API calls to providers over HTTPS                  │
│   └─ All webhooks received over HTTPS                       │
│                                                               │
│ ✓ Rate Limiting                                              │
│   └─ Prevent brute force attempts                           │
│   └─ Prevent abuse of webhook endpoints                     │
│                                                               │
│ ✓ Input Validation                                           │
│   └─ Validate amount, currency, payment method             │
│   └─ Validate webhook signatures before processing          │
│                                                               │
│ See docs/PCI_DSS_GUIDE.md for full compliance details      │
│                                                               │
└──────────────────────────────────────────────────────────────┘
```

## Performance Optimization

```
┌──────────────────────────────────────────────────────────────┐
│             CACHING & OPTIMIZATION                            │
├──────────────────────────────────────────────────────────────┤
│                                                               │
│ Redis Caching:                                               │
│ ├─ Idempotency results (24 hours)                          │
│ │  └─ Key: idempotency:{idempotencyKey}                    │
│ ├─ Payment methods (cached in frontend)                    │
│ ├─ Terminal status (real-time updates)                     │
│ └─ Session tokens (WebSocket auth)                         │
│                                                               │
│ Database Indexes:                                            │
│ ├─ payment_transactions(order_id)                          │
│ ├─ payment_transactions(status)                            │
│ ├─ payment_transactions(payment_provider, provider_id)    │
│ ├─ payment_transactions(created_at DESC)                   │
│ ├─ refunds(payment_transaction_id, status)                │
│ └─ orders(order_number, payment_status)                   │
│                                                               │
│ Query Optimization:                                          │
│ ├─ Avoid N+1 queries (use JOINs)                           │
│ ├─ Batch webhook processing                                │
│ └─ Async order updates (don't block payment response)      │
│                                                               │
└──────────────────────────────────────────────────────────────┘
```

## Monitoring & Observability

```
┌──────────────────────────────────────────────────────────────┐
│           MONITORING & LOGGING STRATEGY                       │
├──────────────────────────────────────────────────────────────┤
│                                                               │
│ Application Logs:                                            │
│ ├─ console.log() for development                            │
│ └─ Winston/Pino for production                              │
│                                                               │
│ Metrics to Track:                                            │
│ ├─ Payment success rate (%)                                 │
│ ├─ Average processing time (ms)                             │
│ ├─ Webhook delivery latency (ms)                            │
│ ├─ Database query time (ms)                                 │
│ ├─ Provider response time by provider                       │
│ └─ Error rate by type                                        │
│                                                               │
│ Alerts:                                                      │
│ ├─ Payment failure rate > 5%                                │
│ ├─ Webhook signature verification failures                  │
│ ├─ Database connection errors                               │
│ ├─ Redis connection errors                                  │
│ └─ Provider API errors                                      │
│                                                               │
│ Tools:                                                       │
│ ├─ Docker logs (dev): docker-compose logs -f               │
│ ├─ Sentry (prod): Error tracking                           │
│ ├─ DataDog (prod): APM & monitoring                         │
│ └─ ELK Stack (prod): Log aggregation                        │
│                                                               │
└──────────────────────────────────────────────────────────────┘
```

## Implementation Status

```
Component                Status      Details
─────────────────────────────────────────────────────────────
Payment Processing       ✅ DONE    Orchestration with retry logic
Idempotency Keys         ✅ DONE    Redis-backed caching
Provider Integration     ✅ DONE    Stripe, Square, MercadoPago
Webhook Handlers         ✅ DONE    HMAC verification for all
Database Schema          ✅ DONE    Tables & indexes created
Docker Compose           ✅ DONE    Local dev stack
API Documentation        ⏳ TODO    Swagger UI integration
Migrations/Seeds         ⏳ TODO    node-pg-migrate
PayPal Webhooks          ⏳ TODO    Signature verification
Frontend PWA             ⏳ TODO    React + TypeScript
Monitoring               ⏳ TODO    Sentry + DataDog
E2E Tests                ⏳ TODO    Playwright
```
