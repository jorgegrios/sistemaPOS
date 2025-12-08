# 🚀 Quick Start Guide - Sistema POS

## Prerequisites

- Node.js 20+ 
- Docker & Docker Compose
- PostgreSQL 16 (via Docker)
- Redis 7 (via Docker)

## Installation

### 1. Clone the repository
```bash
git clone <repo-url>
cd sistemaPOS
```

### 2. Setup all dependencies
```bash
npm run setup
```

This will install:
- Root dependencies (concurrently)
- Backend dependencies (Express, TypeScript, pg, etc)
- Frontend dependencies (React, Vite, React Router, etc)

## Running the Application (3 Steps)

### Step 1: Start Docker
```bash
npm run docker:up
```

This starts PostgreSQL and Redis containers.

### Step 2: Setup Database
```bash
npm run migrate:up      # Run migrations
npm run seed            # Seed test data
```

### Step 3: Start Dev Servers
```bash
npm run dev             # Starts both backend and frontend
```

✅ You're done! Open:
- **Frontend:** http://localhost:5173
- **Backend:** http://localhost:3000
- **API Docs:** http://localhost:3000/api/docs

## Login with Test Credentials

Use any of these accounts (password = password_<role>):

```
Email: waiter@testrestaurant.com
Password: password_waiter

Email: cashier@testrestaurant.com  
Password: password_cashier

Email: manager@testrestaurant.com
Password: password_manager

Email: admin@testrestaurant.com
Password: password_admin
```

## Alternative: Run Separately

If you prefer running backend and frontend in separate terminals:

```bash
# Terminal 1: Backend
cd backend
npm run dev

# Terminal 2: Frontend
cd frontend
npm run dev
```

## Useful Commands

```bash
# Docker
npm run docker:up       # Start containers
npm run docker:down     # Stop containers
npm run docker:logs     # View logs

# Database
npm run migrate:up      # Apply migrations
npm run migrate:down    # Rollback migrations
npm run migrate:reset   # Reset database
npm run seed            # Seed test data

# Development
npm run dev             # Both backend + frontend
npm run dev:backend     # Just backend
npm run dev:frontend    # Just frontend

# Building
npm run build           # Build both
npm run build:backend   # Just backend
npm run build:frontend  # Just frontend
```

## Project Structure

```
sistemaPOS/
├── backend/             # Node.js + Express API
│   ├── src/
│   │   ├── routes/      # API endpoints
│   │   ├── services/    # Business logic
│   │   └── index.ts
│   ├── migrations/      # Database migrations
│   └── scripts/
│
├── frontend/            # React 18 + Vite + PWA
│   ├── src/
│   │   ├── pages/       # Page components
│   │   ├── components/  # UI components
│   │   └── services/    # API services
│   └── public/
│
└── docs/                # Documentation
```

## Features

✅ **Full Backend API**
  - Multi-provider payments (Stripe, Square, Mercado Pago, PayPal)
  - Order & menu management
  - JWT authentication with 4 roles
  - Real-time updates via Socket.io

✅ **Modern Frontend (React PWA)**
  - Touch-friendly POS interface
  - Order creation & management
  - Menu browsing
  - Payment processing
  - Installable as web app

✅ **Developer Experience**
  - Swagger UI for API docs
  - TypeScript for type safety
  - Docker Compose for quick setup
  - Database migrations

## Troubleshooting

**Q: "Cannot connect to database"**
A: Run `npm run docker:up` to start PostgreSQL

**Q: "Port 3000 already in use"**  
A: Kill process with `lsof -i :3000` then `kill -9 <PID>`

**Q: "npm: command not found"**
A: Install Node.js from https://nodejs.org

**Q: Frontend can't connect to API**
A: Make sure backend is running and check `VITE_API_URL` in frontend/.env

## API Documentation

Interactive API docs available at:
**http://localhost:3000/api/docs**

All 25+ endpoints documented with examples and try-it-out functionality.

## Next Steps

1. ✅ Backend API is fully functional
2. ✅ Frontend UI is ready
3. Create more orders and payments
4. Customize database seed data
5. Deploy to production

---

**Everything set up? Start creating orders!** 🎉
```

Expected output:
```
NAME                COMMAND                  SERVICE             STATUS
sistemapros-postgres-1    "docker-entrypoint.sh postgres"    postgres            Up
sistemapros-redis-1       "redis-server"                     redis              Up
sistemapros-backend-1     "npm start"                        backend            Up
```

## 4️⃣ Initialize Database

```bash
# Create schema and tables
docker-compose exec postgres psql -U pos -d pos_dev < backend/src/db/schema.sql

# Verify (should show 4 tables)
docker-compose exec postgres psql -U pos -d pos_dev -c "\dt"
```

## 5️⃣ Start Backend

```bash
cd backend

# Option A: Production mode
npm run build && npm start

# Option B: Development mode (with auto-reload)
npm run dev
```

Server will be available at: **http://localhost:3000**

## 6️⃣ Test Payment Endpoint

```bash
# Test card payment
curl -X POST http://localhost:3000/api/v1/payments/process \
  -H "Content-Type: application/json" \
  -d '{
    "orderId": "order_'$(date +%s)'",
    "amount": 9999,
    "currency": "USD",
    "method": "card",
    "provider": "stripe",
    "paymentMethodId": "pm_card_visa",
    "idempotencyKey": "'$(uuidgen)'"
  }'
```

Expected response:
```json
{
  "status": "succeeded",
  "transactionId": "txn_...",
  "amount": 9999,
  "currency": "USD"
}
```

## 7️⃣ Test Webhook Flow

### Using Stripe CLI (Recommended)

```bash
# 1. Install Stripe CLI
brew install stripe/stripe-cli/stripe

# 2. Login to Stripe account
stripe login

# 3. Forward webhooks to local server
stripe listen --forward-to localhost:3000/api/v1/webhooks/stripe

# 4. In another terminal, trigger test event
stripe trigger payment_intent.succeeded

# 5. Check logs to see webhook processed
docker-compose logs -f backend
```

### Using Ngrok (For Public Testing)

```bash
# 1. Install ngrok
brew install ngrok

# 2. Start tunnel
ngrok http 3000

# 3. Register webhook URL in provider dashboard
# https://YOUR_NGROK_URL/api/v1/webhooks/stripe

# 4. Provider will send real webhooks to your local server
```

## 8️⃣ API Endpoints Reference

### Payments

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/api/v1/payments/process` | Process payment with orchestration |
| POST | `/api/v1/payments/refund/:id` | Refund transaction |
| GET | `/api/v1/payments/:id` | Get transaction details |
| GET | `/api/v1/payments/methods` | List payment methods |
| POST | `/api/v1/payments/terminal/pair` | Register terminal |

### Webhooks

| Method | Endpoint | Provider |
|--------|----------|----------|
| POST | `/api/v1/webhooks/stripe` | Stripe |
| POST | `/api/v1/webhooks/square` | Square |
| POST | `/api/v1/webhooks/mercadopago` | Mercado Pago |
| POST | `/api/v1/webhooks/paypal` | PayPal |

## 9️⃣ View Logs

```bash
# Backend logs
docker-compose logs -f backend

# Database logs
docker-compose logs -f postgres

# Redis logs
docker-compose logs -f redis

# All logs
docker-compose logs -f
```

## 🔟 Database Queries

```bash
# Connect to database
docker-compose exec postgres psql -U pos -d pos_dev

# View transactions
SELECT id, order_id, status, provider_transaction_id 
FROM payment_transactions 
ORDER BY created_at DESC LIMIT 10;

# View specific transaction
SELECT * FROM payment_transactions WHERE id = 'txn_xxx';

# View order status
SELECT order_number, payment_status FROM orders;

# View refunds
SELECT * FROM refunds;

# Exit psql
\q
```

## Troubleshooting

### Port already in use
```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill -9

# Or use different port
PORT=3001 npm start
```

### Database connection error
```bash
# Check PostgreSQL is running
docker-compose logs postgres

# Test connection
docker-compose exec postgres psql -U pos -d pos_dev -c "SELECT 1"
```

### Redis connection error
```bash
# Check Redis is running
docker-compose logs redis

# Test connection
docker-compose exec redis redis-cli ping
# Should output: PONG
```

### Webhook signature verification fails
```bash
# Verify webhook secret in .env
grep WEBHOOK_SECRET backend/.env

# Make sure it matches provider dashboard
# Stripe: Settings → Webhooks → Signing secret
# Square: Developer → Webhooks → Signing key
# Mercado Pago: Webhooks settings
```

## Environment Variables

Located in `backend/.env` (create from `.env.example`):

```bash
# Required for payments
STRIPE_SECRET_KEY=sk_test_...
SQUARE_ACCESS_TOKEN=EAAA...
MERCADOPAGO_ACCESS_TOKEN=TEST-...

# Required for webhooks
WEBHOOK_SECRET_STRIPE=whsec_...
WEBHOOK_SECRET_SQUARE=...
WEBHOOK_SECRET_MERCADOPAGO=...

# Database & Cache
DATABASE_URL=postgresql://pos:pospass@postgres:5432/pos_dev
REDIS_URL=redis://redis:6379

# Server
PORT=3000
NODE_ENV=development
```

## Next Steps

1. **Test with real payment credentials**: Update `.env` with your Stripe/Square/Mercado Pago API keys

2. **Build frontend**: Create POS UI to tokenize cards and call `/api/v1/payments/process`

3. **Register webhooks**: Add webhook URLs in each provider's dashboard

4. **Setup monitoring**: Configure error tracking (Sentry) and APM (DataDog)

5. **Implement migrations**: Use `node-pg-migrate` for versioned schema management

## Documentation

- **[PAYMENT_FLOW.md](docs/PAYMENT_FLOW.md)** - Complete architecture
- **[WEBHOOK_TESTING.md](docs/WEBHOOK_TESTING.md)** - Testing guide
- **[ARCHITECTURE_VISUAL.md](docs/ARCHITECTURE_VISUAL.md)** - System diagrams
- **[PCI_DSS_GUIDE.md](docs/PCI_DSS_GUIDE.md)** - Security compliance
- **[backend/README.md](backend/README.md)** - API reference

## Support

For issues:
1. Check logs: `docker-compose logs -f backend`
2. Review documentation in `/docs` folder
3. Check provider API documentation:
   - [Stripe Docs](https://stripe.com/docs)
   - [Square Docs](https://developer.squareup.com)
   - [Mercado Pago Docs](https://developer.mercadopago.com)
