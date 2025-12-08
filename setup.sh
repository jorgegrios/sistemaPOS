#!/bin/bash

# Quick setup script for sistemaPOS backend

set -e

echo "🚀 Setting up sistemaPOS Backend..."
echo ""

# Check if in correct directory
if [ ! -f "package.json" ]; then
  echo "❌ Error: package.json not found. Run this script from backend/ directory"
  exit 1
fi

# Step 1: Copy environment variables
if [ ! -f ".env" ]; then
  echo "📝 Creating .env from .env.example..."
  cp .env.example .env
  echo "✅ .env created (edit with your credentials)"
else
  echo "✅ .env already exists"
fi

echo ""

# Step 2: Install dependencies
echo "📦 Installing dependencies..."
npm install > /dev/null 2>&1
echo "✅ Dependencies installed"

echo ""

# Step 3: Build TypeScript
echo "🔨 Building TypeScript..."
npm run build > /dev/null 2>&1
echo "✅ Build successful"

echo ""

# Step 4: Check database
echo "🗄️  Database setup..."
if command -v psql &> /dev/null; then
  echo "✅ PostgreSQL client found"
  echo "   To initialize schema:"
  echo "   psql \$DATABASE_URL < src/db/schema.sql"
else
  echo "⚠️  PostgreSQL client not found (install via: brew install postgresql)"
fi

echo ""

# Step 5: Check Redis
echo "🔴 Redis setup..."
if command -v redis-cli &> /dev/null; then
  echo "✅ Redis client found"
else
  echo "⚠️  Redis client not found (install via: brew install redis)"
fi

echo ""

echo "=== Setup Complete ==="
echo ""
echo "📋 Next steps:"
echo ""
echo "1. Edit .env with your API credentials"
echo ""
echo "2. Start PostgreSQL, Redis, and other services:"
echo "   docker-compose up -d"
echo ""
echo "3. Initialize database schema:"
echo "   docker-compose exec postgres psql -U pos -d pos_dev < src/db/schema.sql"
echo ""
echo "4. Start backend server:"
echo "   npm start"
echo ""
echo "   Or with auto-reload (development):"
echo "   npm run dev"
echo ""
echo "5. Backend will be available at:"
echo "   http://localhost:3000"
echo ""
echo "6. Test payment endpoint:"
echo "   curl -X POST http://localhost:3000/api/v1/payments/process \\"
echo "     -H 'Content-Type: application/json' \\"
echo "     -d '{...}'"
echo ""
echo "📚 Documentation:"
echo "   - docs/PAYMENT_FLOW.md - Complete payment architecture"
echo "   - docs/WEBHOOK_TESTING.md - How to test webhooks"
echo "   - docs/ARCHITECTURE_VISUAL.md - System diagrams"
echo "   - README.md - Backend overview"
echo ""
