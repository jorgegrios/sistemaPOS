# Backend — sistemaPOS

Complete POS backend with multi-provider payment orchestration, webhooks, and production patterns.

## Features

✅ **Payment Orchestration**
- Multi-provider support (Stripe, Square, Mercado Pago, PayPal)
- Idempotency keys to prevent double-charging
- 3-retry mechanism with exponential backoff
- PostgreSQL audit trail
- Redis caching

✅ **Webhook Handlers**
- HMAC signature verification for all providers
- Real-time order/transaction status updates
- Automatic refund tracking

✅ **Production Ready**
- TypeScript strict mode
- Error handling with retries
- Database migrations ready
- Docker/Docker Compose support
- Environment-based configuration

## Quick Start

### Development (Local)

```bash
# 1. Copy environment variables
cp .env.example .env

# 2. Install dependencies
npm install

# 3. Build TypeScript
npm run build

# 4. Start server
npm start
```

Server runs on `http://localhost:3000`

### Docker (Recommended)

```bash
# Start all services (backend + postgres + redis)
docker-compose up -d

# View logs
docker-compose logs -f backend

# Stop services
docker-compose down
```

## API Endpoints

### Payments

- `POST /api/v1/payments/process` - Process payment with idempotency
- `POST /api/v1/payments/refund/:id` - Refund transaction
- `GET /api/v1/payments/:id` - Get transaction details
- `GET /api/v1/payments/methods` - List payment methods
- `POST /api/v1/payments/terminal/pair` - Register terminal
- `POST /api/v1/payments/qr/generate` - Generate QR code

### Webhooks

- `POST /api/v1/webhooks/stripe` - Stripe events
- `POST /api/v1/webhooks/square` - Square events  
- `POST /api/v1/webhooks/mercadopago` - Mercado Pago events
- `POST /api/v1/webhooks/paypal` - PayPal events (TODO)

### Orders

- `POST /api/v1/orders` - Create order
- `GET /api/v1/orders` - List orders
- `GET /api/v1/orders/:id` - Get order details
- `PUT /api/v1/orders/:id` - Update order
- `DELETE /api/v1/orders/:id` - Cancel order

## Configuration

### Environment Variables

```bash
# Database
DATABASE_URL=postgresql://user:pass@localhost/dbname
REDIS_URL=redis://localhost:6379

# Stripe
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
WEBHOOK_SECRET_STRIPE=whsec_...

# Square
SQUARE_ACCESS_TOKEN=...
SQUARE_ENVIRONMENT=sandbox
WEBHOOK_SECRET_SQUARE=...

# Mercado Pago
MERCADOPAGO_ACCESS_TOKEN=...
WEBHOOK_SECRET_MERCADOPAGO=...

# Server
PORT=3000
NODE_ENV=development
```

See `.env.example` for complete list.

## Payment Flow

```
Client Request
    ↓
POST /api/v1/payments/process
    ↓
paymentOrchestrator
    ├─ Check idempotency cache (Redis)
    ├─ Retry loop with exponential backoff (3 attempts)
    ├─ Route to provider (Stripe/Square/MercadoPago)
    ├─ Store transaction in PostgreSQL
    └─ Cache result
    ↓
HTTP Response
    ↓
Provider Webhook (async)
    ├─ Verify HMAC signature
    ├─ Update transaction status
    ├─ Update order status
    └─ Trigger KDS/receipt events
```

See `docs/PAYMENT_FLOW.md` for complete architecture.

## Development Scripts

```bash
# Build TypeScript
npm run build

# Start development server (with auto-reload)
npm run dev

# Run linter
npm run lint

# Format code
npm run format

# Run tests (TODO)
npm run test
```

## Database

### Initialize Schema

```bash
# Using psql
psql -U postgres < src/db/schema.sql

# Or via Docker
docker-compose exec postgres psql -U pos -d pos_dev < src/db/schema.sql
```

### Tables

- `payment_transactions` - All payment attempts
- `orders` - Restaurant orders  
- `payment_terminals` - POS terminals
- `refunds` - Refund records

### Migrations

Ready to implement with `node-pg-migrate`.

## Testing

### Manual Testing

```bash
# Test payment endpoint
curl -X POST http://localhost:3000/api/v1/payments/process \
  -H "Content-Type: application/json" \
  -d '{
    "orderId": "order_123",
    "amount": 9999,
    "currency": "USD",
    "method": "card",
    "provider": "stripe",
    "paymentMethodId": "pm_card_visa",
    "idempotencyKey": "'$(uuidgen)'"
  }'
```

### Webhook Testing

See `docs/WEBHOOK_TESTING.md` for:
- Stripe CLI setup
- Ngrok for public tunneling
- Manual webhook simulation
- Database verification queries

## Production Deployment

### Pre-Deployment Checklist

- [ ] All environment variables set
- [ ] Database schema created and tested
- [ ] Webhook endpoints registered with providers
- [ ] Stripe/Square/Mercado Pago accounts set up
- [ ] SSL certificates configured
- [ ] Error logging/monitoring enabled
- [ ] Rate limiting configured
- [ ] PCI DSS compliance verified (see `docs/PCI_DSS_GUIDE.md`)

### Deploy with Docker

```bash
# Build image
docker build -t pos-backend:latest .

# Push to registry
docker push your-registry/pos-backend:latest

# Deploy (Kubernetes, Heroku, AWS, etc.)
docker run -e DATABASE_URL=... -p 3000:3000 pos-backend:latest
```

## Troubleshooting

### Payment Processing Fails

1. Check STRIPE_SECRET_KEY in .env
2. Verify provider account is active
3. Check network connectivity
4. Review logs: `docker-compose logs backend`

### Webhook Signature Verification Fails

1. Verify webhook secret in .env matches provider dashboard
2. Check request signature header format
3. Ensure raw body is used (not parsed JSON)

### Database Connection Error

1. Check DATABASE_URL format
2. Verify PostgreSQL is running: `docker-compose logs postgres`
3. Test connection: `psql $DATABASE_URL`

### Redis Connection Error

1. Check REDIS_URL format
2. Verify Redis is running: `docker-compose logs redis`
3. Test connection: `redis-cli`

## Documentation

- `docs/PAYMENT_FLOW.md` - Complete payment architecture
- `docs/WEBHOOK_TESTING.md` - Webhook testing guide
- `docs/ARCHITECTURE.md` - System design
- `docs/PCI_DSS_GUIDE.md` - Security compliance
- `docs/OPENAPI_NOTES.md` - API documentation notes

## Next Steps

- [ ] Implement database migrations with node-pg-migrate
- [ ] Add Swagger UI for API documentation
- [ ] Implement PayPal webhook verification
- [ ] Add monitoring/alerting (Sentry, DataDog)
- [ ] Performance optimization (caching, indexing)
- [ ] Load testing with k6
- [ ] E2E tests with Playwright

## Support

For issues or questions:
1. Check logs: `docker-compose logs -f backend`
2. Review docs in `/docs` folder
3. Check provider documentation links in `docs/PAYMENT_FLOW.md`
