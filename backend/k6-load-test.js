/**
 * k6 Load Testing Script
 * Run with: k6 run k6-load-test.js
 * 
 * Install k6: https://k6.io/docs/getting-started/installation/
 */

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('errors');

// Test configuration
export const options = {
  stages: [
    { duration: '30s', target: 20 },   // Ramp up to 20 users
    { duration: '1m', target: 20 },    // Stay at 20 users
    { duration: '30s', target: 50 },   // Ramp up to 50 users
    { duration: '1m', target: 50 },    // Stay at 50 users
    { duration: '30s', target: 0 },    // Ramp down to 0 users
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'],  // 95% of requests should be below 500ms
    http_req_failed: ['rate<0.01'],     // Error rate should be less than 1%
    errors: ['rate<0.01'],
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';
const API_URL = `${BASE_URL}/api/v1`;

// Test user credentials (should be in environment or test data)
const TEST_EMAIL = __ENV.TEST_EMAIL || 'waiter@testrestaurant.com';
const TEST_PASSWORD = __ENV.TEST_PASSWORD || 'password_waiter';

let authToken = '';

export function setup() {
  // Login and get token
  const loginRes = http.post(`${API_URL}/auth/login`, JSON.stringify({
    email: TEST_EMAIL,
    password: TEST_PASSWORD
  }), {
    headers: { 'Content-Type': 'application/json' },
  });

  if (loginRes.status === 200) {
    const body = JSON.parse(loginRes.body);
    return { token: body.token };
  }

  return { token: null };
}

export default function (data) {
  const token = data.token;
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  };

  // Test 1: Health check
  let res = http.get(`${BASE_URL}/health`);
  check(res, {
    'health check status 200': (r) => r.status === 200,
  }) || errorRate.add(1);

  sleep(1);

  // Test 2: Get orders
  res = http.get(`${API_URL}/orders`, { headers });
  check(res, {
    'get orders status 200': (r) => r.status === 200,
    'get orders has data': (r) => JSON.parse(r.body).orders !== undefined,
  }) || errorRate.add(1);

  sleep(1);

  // Test 3: Get payments
  res = http.get(`${API_URL}/payments`, { headers });
  check(res, {
    'get payments status 200': (r) => r.status === 200,
    'get payments has data': (r) => JSON.parse(r.body).payments !== undefined,
  }) || errorRate.add(1);

  sleep(1);

  // Test 4: Get menus
  res = http.get(`${API_URL}/menus`, { headers });
  check(res, {
    'get menus status 200': (r) => r.status === 200,
  }) || errorRate.add(1);

  sleep(1);
}

export function teardown(data) {
  console.log('Load test completed');
}







