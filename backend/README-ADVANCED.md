# Advanced Features Guide

This document covers advanced features including monitoring, performance optimization, and testing.

## 📊 Monitoring & Error Tracking

### Sentry Integration

1. **Install Sentry:**
```bash
npm install @sentry/node
```

2. **Configure environment variables:**
```env
SENTRY_DSN=your_sentry_dsn_here
SENTRY_TRACES_SAMPLE_RATE=0.1
```

3. **Initialize in your app:**
```typescript
import { initSentry, errorTrackingMiddleware } from './middleware/monitoring';

initSentry();
app.use(errorTrackingMiddleware);
```

### DataDog APM

1. **Install DataDog:**
```bash
npm install dd-trace
```

2. **Configure environment variables:**
```env
DD_SERVICE=sistema-pos-backend
DD_ENV=production
DD_VERSION=1.0.0
```

3. **Initialize in your app:**
```typescript
import { initDataDog, requestTrackingMiddleware } from './middleware/monitoring';

initDataDog();
app.use(requestTrackingMiddleware);
```

## ⚡ Performance Optimization

### Caching

The cache service is already configured. Use it in your routes:

```typescript
import { CacheService, cacheConfig } from './config/performance';

// Get from cache
const cached = await CacheService.get(cacheConfig.keys.orders(orderId));
if (cached) return cached;

// Set in cache
await CacheService.set(cacheConfig.keys.orders(orderId), orderData, cacheConfig.defaultTTL);
```

### Database Indexing

Recommended indexes are defined in `src/config/performance.ts`. Apply them:

```typescript
import { applyIndexes } from './config/performance';

await applyIndexes(pool);
```

Or create a migration to add them permanently.

## 🧪 Load Testing with k6

### Installation

```bash
# macOS
brew install k6

# Linux
sudo gpg -k
sudo gpg --no-default-keyring --keyring /usr/share/keyrings/k6-archive-keyring.gpg --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D53
echo "deb [signed-by=/usr/share/keyrings/k6-archive-keyring.gpg] https://dl.k6.io/deb stable main" | sudo tee /etc/apt/sources.list.d/k6.list
sudo apt-get update
sudo apt-get install k6
```

### Running Load Tests

```bash
# Basic test
k6 run k6-load-test.js

# With custom base URL
BASE_URL=http://localhost:3000 k6 run k6-load-test.js

# With custom credentials
TEST_EMAIL=user@example.com TEST_PASSWORD=password k6 run k6-load-test.js
```

### Test Scenarios

The load test script includes:
- Health check endpoint
- Orders listing
- Payments listing
- Menus listing

Modify `k6-load-test.js` to add more scenarios.

## 🎭 E2E Testing with Playwright

### Installation

```bash
npm install --save-dev @playwright/test
npx playwright install
```

### Running Tests

```bash
# Run all tests
npx playwright test

# Run specific test file
npx playwright test tests/e2e/auth.spec.ts

# Run in UI mode
npx playwright test --ui

# Run in headed mode
npx playwright test --headed
```

### Test Coverage

Current test files:
- `tests/e2e/auth.spec.ts` - Authentication tests
- `tests/e2e/orders.spec.ts` - Order management tests

Add more test files as needed.

### CI/CD Integration

Add to your CI pipeline:

```yaml
# GitHub Actions example
- name: Install Playwright
  run: npx playwright install --with-deps

- name: Run E2E tests
  run: npx playwright test
```

## 📈 Performance Metrics

Monitor these key metrics:

1. **Response Times:**
   - Health check: < 50ms
   - API endpoints: < 200ms (p95)
   - Database queries: < 100ms

2. **Error Rates:**
   - Target: < 0.1%
   - Alert threshold: > 1%

3. **Throughput:**
   - Requests per second
   - Concurrent users

4. **Resource Usage:**
   - CPU: < 70%
   - Memory: < 80%
   - Database connections: < 80% of pool

## 🔍 Debugging

### Enable Debug Logging

```env
DEBUG=*
NODE_ENV=development
```

### View Logs

```bash
# Docker
docker-compose logs -f backend

# PM2
pm2 logs sistema-pos-backend

# Direct
npm run dev
```

## 🚀 Production Checklist

- [ ] Sentry configured and tested
- [ ] DataDog APM enabled
- [ ] Database indexes applied
- [ ] Caching strategy implemented
- [ ] Load testing completed
- [ ] E2E tests passing
- [ ] Error tracking verified
- [ ] Performance metrics baseline established
- [ ] Alerting rules configured








