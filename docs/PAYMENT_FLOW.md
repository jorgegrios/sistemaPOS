# Payment Flow Implementation Guide

## Overview
El sistema POS implementa un flujo de pagos completo con soporte para múltiples proveedores (Stripe, Square, Mercado Pago) con características de producción como idempotency keys, retry logic, y webhook HMAC verification.

## Architecture

```
Cliente (POS Terminal)
    ↓
POST /api/v1/payments/process
    ↓
paymentOrchestrator.processPayment()
    ├─ Check idempotency cache (Redis)
    ├─ If cached → return cached result
    ├─ Retry loop (3 attempts, exponential backoff):
    │  ├─ Route to provider (Stripe/Square/MercadoPago)
    │  ├─ Provider returns result
    │  └─ Store in PostgreSQL
    └─ Cache result (Redis)
    ↓
HTTP Response → Client
    ↓
Provider sends Webhook Event
    ↓
POST /api/v1/webhooks/{provider}
    ├─ Verify HMAC signature
    └─ Update transaction/order status in DB
```

## Implementation Files

### 1. `src/services/paymentOrchestrator.ts`
**Purpose**: Centralized payment processing with idempotency and retry logic
**Key Features**:
- Idempotency via Redis cache (prevents double-charging)
- 3-retry mechanism with exponential backoff (1s, 2s, 3s delays)
- Provider routing (Stripe PaymentIntent, Square Payments API, Mercado Pago SDK)
- PostgreSQL audit trail via `storePendingTransaction()`
- Type-safe interfaces (PaymentRequest/PaymentResponse)

**Example Usage**:
```typescript
const response = await paymentOrchestrator.processPayment({
  orderId: 'order_123',
  amount: 9999, // cents
  currency: 'USD',
  method: 'card',
  provider: 'stripe',
  paymentMethodId: 'pm_1234567890', // Token from frontend
  idempotencyKey: 'unique_key_xyz' // Client generates this
});

// Response: { status: 'succeeded', transactionId: 'txn_xxx', providerTransactionId: 'pi_xxx' }
```

### 2. `src/routes/payments.ts`
**Purpose**: HTTP endpoint layer for payment operations
**Endpoints**:
- `POST /process` - Process payment (calls paymentOrchestrator)
- `POST /refund/:id` - Refund existing transaction
- `GET /:id` - Get transaction details
- `GET /methods` - List enabled payment methods
- `POST /terminal/pair` - Register payment terminal
- `POST /qr/generate` - Generate dynamic QR code
- `POST /validate` - Validate QR/wallet payment

**Example Request**:
```bash
curl -X POST http://localhost:3000/api/v1/payments/process \
  -H "Content-Type: application/json" \
  -d '{
    "orderId": "order_123",
    "amount": 9999,
    "currency": "USD",
    "method": "card",
    "provider": "stripe",
    "paymentMethodId": "pm_1234567890",
    "idempotencyKey": "uuid-here",
    "tip": 200,
    "metadata": {"table": "5", "waiter": "John"}
  }'
```

### 3. `src/lib/webhooks.ts`
**Purpose**: Webhook signature verification and event handling
**Functions**:
- `verifyStripeSignature()` - HMAC SHA-256 verification
- `verifySquareSignature()` - Base64 HMAC verification
- `verifyMercadoPagoSignature()` - HMAC with timestamp
- `handleStripeWebhook()` - Process Stripe events
- `handleSquareWebhook()` - Process Square events
- `handleMercadoPagoWebhook()` - Process Mercado Pago events

**Example**:
```typescript
// Stripe verifies automatically via SDK
const event = stripe.webhooks.constructEvent(
  rawBody,
  signature,
  webhookSecret
);

// Square and Mercado Pago use custom verification
if (!verifySquareSignature(body, signature, secret)) {
  throw new Error('Invalid signature');
}
```

### 4. `src/routes/webhooks.ts`
**Purpose**: Webhook HTTP endpoints with signature verification
**Endpoints**:
- `POST /stripe` - Stripe webhooks (payment_intent.succeeded/failed, charge.refunded)
- `POST /square` - Square webhooks (payment.created/updated, refund.created)
- `POST /mercadopago` - Mercado Pago webhooks (payment.updated)
- `POST /paypal` - PayPal webhooks (PAYMENT.CAPTURE.COMPLETED/DENIED)

**Example**:
```bash
# Stripe webhook (sent by Stripe)
curl -X POST http://localhost:3000/api/v1/webhooks/stripe \
  -H "Stripe-Signature: t=1614556800,v1=..." \
  -d '{"type":"payment_intent.succeeded",...}'
```

### 5. `src/db/schema.sql`
**Tables**:
- `payment_transactions` - All payment attempts with idempotency tracking
- `orders` - Order details with payment status
- `payment_terminals` - Registered POS terminals
- `refunds` - Refund records (NEW)

**Key Columns**:
```sql
payment_transactions:
  - id: UUID (transaction record)
  - order_id: UUID (links to order)
  - payment_method: VARCHAR (card, qr, wallet, cash)
  - payment_provider: VARCHAR (stripe, square, mercadopago, paypal, cash)
  - status: VARCHAR (pending, succeeded, failed)
  - provider_transaction_id: VARCHAR (Stripe PI ID, Square payment ID, etc.)
  - provider_response: JSONB (full provider response for debugging)
```

## Payment Provider Integration

### Stripe
- **Endpoint**: Stripe API v2022-11-15
- **Method**: PaymentIntent
- **Idempotency**: Built-in via `idempotencyKey` header
- **Webhook Event**: `payment_intent.succeeded`, `payment_intent.payment_failed`

### Square
- **Endpoint**: Square Payments API
- **Method**: Payments.create() with sourceId (token)
- **Idempotency**: Via `idempotencyKey` parameter
- **Webhook Event**: `payment.created`, `payment.updated`

### Mercado Pago
- **Endpoint**: Mercado Pago Payment API
- **Method**: payment.create() with source (token)
- **Idempotency**: Manual via Redis (paymentOrchestrator)
- **Webhook Event**: `payment.updated`

## Retry Logic

The `paymentOrchestrator` implements exponential backoff:
```typescript
// Max 3 attempts
// Wait times: 1s, 2s, 3s
for (let i = 0; i < 3; i++) {
  try {
    return await processWithProvider();
  } catch (err) {
    const wait = 1000 * Math.pow(2, i); // 1s, 2s, 4s
    await sleep(wait);
  }
}
```

## Idempotency Flow

1. **Client Generates**: Client creates UUID as `idempotencyKey`
2. **First Request**: POST /payments/process with idempotencyKey
   - Check Redis cache `idempotency:{key}` → miss
   - Process payment with provider
   - Cache result for 24 hours
   - Return response
3. **Duplicate Request**: Same idempotencyKey
   - Check Redis cache `idempotency:{key}` → HIT
   - Return cached response immediately (no re-processing)

## Error Handling

### Provider Errors
```typescript
// Network timeout → retry with backoff
// Invalid card → fail immediately, don't retry
// Rate limit → retry with backoff
// Idempotency error → return cached result
```

### Webhook Errors
```typescript
// Invalid signature → 403 Forbidden
// Missing signature → 400 Bad Request
// Database error → 500 Internal Server Error
// Unknown event type → 200 OK (acknowledge anyway)
```

## Environment Variables Required

```bash
# Stripe
STRIPE_SECRET_KEY=sk_live_...
STRIPE_PUBLISHABLE_KEY=pk_live_...
WEBHOOK_SECRET_STRIPE=whsec_...

# Square
SQUARE_ACCESS_TOKEN=...
SQUARE_ENVIRONMENT=production
WEBHOOK_SECRET_SQUARE=...

# Mercado Pago
MERCADOPAGO_ACCESS_TOKEN=...
WEBHOOK_SECRET_MERCADOPAGO=...

# PayPal (optional)
PAYPAL_CLIENT_ID=...
PAYPAL_SECRET=...

# Database
DATABASE_URL=postgresql://...

# Redis
REDIS_URL=redis://...

# Webhook
WEBHOOK_URL=https://api.yourdomain.com/webhooks
```

## Testing Payment Flow

### 1. Test Card Payments
```bash
curl -X POST http://localhost:3000/api/v1/payments/process \
  -H "Content-Type: application/json" \
  -d '{
    "orderId": "test_order_1",
    "amount": 5000,
    "currency": "USD",
    "method": "card",
    "provider": "stripe",
    "paymentMethodId": "pm_card_visa",
    "idempotencyKey": "'$(uuidgen)'"
  }'
```

### 2. Test Idempotency
```bash
# Run same request twice with same idempotencyKey
# Should return identical response both times
```

### 3. Test Webhook
```bash
curl -X POST http://localhost:3000/api/v1/webhooks/stripe \
  -H "Stripe-Signature: $(echo -n 'test' | openssl dgst -sha256 -hmac 'whsec_test')" \
  -d '{"type":"payment_intent.succeeded",...}'
```

## Next Steps

1. ✅ Payment orchestration (Implemented)
2. ✅ Webhook handlers with HMAC verification (Implemented)
3. 🔄 Migrations & seed data (TODO)
4. 🔄 Swagger UI + OpenAPI (TODO)
5. 🔄 Frontend PWA (TODO)
6. 🔄 E2E tests (TODO)

## References

- [Stripe Webhooks](https://stripe.com/docs/webhooks)
- [Square Webhooks](https://developer.squareup.com/docs/webhooks)
- [Mercado Pago Webhooks](https://developer.mercadopago.com/en/docs/webhooks)
- [Idempotency Keys RFC 7231](https://datatracker.ietf.org/doc/html/rfc7231#section-6.3.1)
