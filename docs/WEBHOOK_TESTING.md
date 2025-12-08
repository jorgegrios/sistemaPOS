# Webhook Testing Guide

## Local Development Setup

### Option 1: Using Stripe CLI (Recommended)

```bash
# Install Stripe CLI
brew install stripe/stripe-cli/stripe

# Login
stripe login

# Forward webhook events to your local server
stripe listen --forward-to localhost:3000/api/v1/webhooks/stripe

# Trigger test events
stripe trigger payment_intent.succeeded

# Verify events
stripe logs tail
```

### Option 2: Using Ngrok for Public Tunnel

```bash
# Install ngrok
brew install ngrok

# Start tunnel
ngrok http 3000

# Get your public URL (e.g., https://abc123.ngrok.io)

# Set webhook URL in Stripe Dashboard:
# https://abc123.ngrok.io/api/v1/webhooks/stripe

# Now Stripe can send real webhooks to your local server
```

## Manual Webhook Testing

### Test Stripe Webhook Signature Verification

```bash
# Using Stripe's test CLI
stripe trigger payment_intent.succeeded

# Or manually craft a webhook (without signature - will fail verification):
curl -X POST http://localhost:3000/api/v1/webhooks/stripe \
  -H "Content-Type: application/json" \
  -H "Stripe-Signature: t=$(date +%s),v1=invalid_signature" \
  -d '{
    "type": "payment_intent.succeeded",
    "data": {
      "object": {
        "id": "pi_test_123",
        "status": "succeeded",
        "amount": 9999,
        "metadata": {"orderId": "order_123"}
      }
    }
  }'

# Expected response: 400 Bad Request (invalid signature)
```

### Test Square Webhook

```bash
# Square Webhooks use x-square-hmac-sha256 header
curl -X POST http://localhost:3000/api/v1/webhooks/square \
  -H "Content-Type: application/json" \
  -H "x-square-hmac-sha256: invalid_signature" \
  -d '{
    "type": "payment.created",
    "data": {
      "object": {
        "payment": {
          "id": "payment_123",
          "status": "COMPLETED",
          "amount_money": {
            "amount": 9999,
            "currency": "USD"
          }
        }
      }
    }
  }'

# Expected response: 403 Forbidden (invalid signature)
```

### Test Mercado Pago Webhook

```bash
# Mercado Pago Webhooks use x-signature header
curl -X POST http://localhost:3000/api/v1/webhooks/mercadopago \
  -H "Content-Type: application/json" \
  -H "x-signature: ts=1614556800,v1=invalid_signature" \
  -H "x-request-id: request_123" \
  -d '{
    "type": "payment",
    "action": "payment.updated",
    "id": "payment_123",
    "status": "approved"
  }'

# Expected response: 403 Forbidden (invalid signature)
```

## End-to-End Flow Test

### 1. Start Your Backend
```bash
cd sistemaPOS/backend
npm install
npm run build
npm start
```

### 2. Process a Payment
```bash
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

### 3. Monitor Logs
```bash
# In another terminal
docker-compose logs -f backend
```

### 4. Trigger Webhook Event
Using Stripe CLI:
```bash
stripe trigger payment_intent.succeeded --override metadata.orderId=order_123
```

### 5. Verify Database Update
```bash
# Check transaction status was updated
psql -U pos -d pos_dev -c \
  "SELECT id, status, provider_response FROM payment_transactions ORDER BY created_at DESC LIMIT 1;"
```

## Database Queries for Testing

```sql
-- View all transactions
SELECT id, order_id, status, payment_provider, provider_transaction_id 
FROM payment_transactions 
ORDER BY created_at DESC;

-- View transaction with webhook response
SELECT id, status, provider_response 
FROM payment_transactions 
WHERE id = 'your-transaction-id';

-- View refunds
SELECT * FROM refunds ORDER BY created_at DESC;

-- View order payment status
SELECT order_number, payment_status, paid_at 
FROM orders 
WHERE id = 'your-order-id';

-- Check idempotency in Redis
redis-cli
> GET idempotency:your-idempotency-key
```

## Docker Compose for Full Stack Test

```bash
# Start all services
docker-compose up -d

# Check services are running
docker-compose ps

# View logs
docker-compose logs -f backend
docker-compose logs -f postgres
docker-compose logs -f redis

# Access databases
# PostgreSQL
psql -h localhost -U pos -d pos_dev

# Redis
redis-cli -h localhost

# Stop everything
docker-compose down
```

## Webhook Event Payloads

### Stripe Payment Success
```json
{
  "type": "payment_intent.succeeded",
  "data": {
    "object": {
      "id": "pi_1234567890",
      "status": "succeeded",
      "amount": 9999,
      "currency": "usd",
      "metadata": {
        "orderId": "order_123"
      }
    }
  }
}
```

### Square Payment Completed
```json
{
  "type": "payment.created",
  "data": {
    "object": {
      "payment": {
        "id": "qTb2c54c6bIqGH",
        "status": "COMPLETED",
        "amount_money": {
          "amount": 9999,
          "currency": "USD"
        },
        "metadata": {
          "orderId": "order_123"
        }
      }
    }
  }
}
```

### Mercado Pago Payment Approved
```json
{
  "type": "payment",
  "action": "payment.updated",
  "id": "11111111",
  "status": "approved",
  "metadata": {
    "orderId": "order_123"
  }
}
```

## Troubleshooting

### Webhook Not Received
1. Check firewall/network (port 3000 open)
2. Verify webhook URL in provider dashboard
3. Check backend logs: `docker-compose logs backend`
4. Use Stripe CLI to monitor: `stripe logs tail`

### Signature Verification Fails
1. Ensure webhook secret is correct in `.env`
2. Use raw body for verification (not parsed JSON)
3. Stripe CLI automatically handles signatures

### Database Not Updated
1. Check PostgreSQL is running: `docker-compose logs postgres`
2. Verify connection string in `.env`
3. Check SQL schema created: `psql -U pos -d pos_dev -c "\dt"`

## Next Steps

- Implement PayPal webhook verification
- Add monitoring/alerting for failed webhooks
- Create webhook retry mechanism (for when backend is down)
- Add webhook signature rotation support
