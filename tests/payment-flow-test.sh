#!/bin/bash

# Payment Flow Test Script
# This script demonstrates the complete payment flow with idempotency

API_URL="http://localhost:3000/api/v1"
IDEMPOTENCY_KEY=$(uuidgen)
ORDER_ID=$(uuidgen)

echo "=== Payment Flow Test ==="
echo "API URL: $API_URL"
echo "Idempotency Key: $IDEMPOTENCY_KEY"
echo "Order ID: $ORDER_ID"
echo ""

# Test 1: Process a card payment
echo "1️⃣  Processing card payment..."
RESPONSE=$(curl -s -X POST "$API_URL/payments/process" \
  -H "Content-Type: application/json" \
  -d "{
    \"orderId\": \"$ORDER_ID\",
    \"amount\": 9999,
    \"currency\": \"USD\",
    \"method\": \"card\",
    \"provider\": \"stripe\",
    \"paymentMethodId\": \"pm_card_visa\",
    \"idempotencyKey\": \"$IDEMPOTENCY_KEY\",
    \"tip\": 200,
    \"metadata\": {
      \"table\": \"5\",
      \"waiter\": \"John\",
      \"restaurant\": \"Test Restaurant\"
    }
  }")

echo "Response:"
echo "$RESPONSE" | jq '.'
echo ""

# Extract transaction ID
TRANSACTION_ID=$(echo "$RESPONSE" | jq -r '.transactionId // .transactionId')
echo "Transaction ID: $TRANSACTION_ID"
echo ""

# Test 2: Verify idempotency - submit same request again
echo "2️⃣  Testing idempotency (same request again)..."
RESPONSE2=$(curl -s -X POST "$API_URL/payments/process" \
  -H "Content-Type: application/json" \
  -d "{
    \"orderId\": \"$ORDER_ID\",
    \"amount\": 9999,
    \"currency\": \"USD\",
    \"method\": \"card\",
    \"provider\": \"stripe\",
    \"paymentMethodId\": \"pm_card_visa\",
    \"idempotencyKey\": \"$IDEMPOTENCY_KEY\",
    \"tip\": 200
  }")

echo "Response:"
echo "$RESPONSE2" | jq '.'
echo ""

# Test 3: Get transaction details
echo "3️⃣  Getting transaction details..."
if [ -n "$TRANSACTION_ID" ] && [ "$TRANSACTION_ID" != "null" ]; then
  RESPONSE3=$(curl -s -X GET "$API_URL/payments/$TRANSACTION_ID")
  echo "Response:"
  echo "$RESPONSE3" | jq '.'
else
  echo "Skipping (no transaction ID)"
fi
echo ""

# Test 4: Get payment methods
echo "4️⃣  Getting available payment methods..."
RESPONSE4=$(curl -s -X GET "$API_URL/payments/methods")
echo "Response:"
echo "$RESPONSE4" | jq '.'
echo ""

# Test 5: Simulate webhook event (Stripe)
echo "5️⃣  Simulating Stripe webhook (payment_intent.succeeded)..."
WEBHOOK_PAYLOAD=$(cat <<EOF
{
  "type": "payment_intent.succeeded",
  "data": {
    "object": {
      "id": "pi_test_123",
      "amount": 9999,
      "currency": "usd",
      "status": "succeeded",
      "metadata": {
        "orderId": "$ORDER_ID"
      }
    }
  }
}
EOF
)

echo "Note: Webhook verification requires valid Stripe signature."
echo "Payload:"
echo "$WEBHOOK_PAYLOAD" | jq '.'
echo ""

echo "=== Test Complete ==="
echo "To test with real webhooks:"
echo "1. Set up Stripe webhook endpoint in Stripe Dashboard"
echo "2. Point it to: https://yourdomain.com/api/v1/webhooks/stripe"
echo "3. Stripe will send signed events to your endpoint"
