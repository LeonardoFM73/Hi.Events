#!/bin/bash

# Test script for Xendit Mock API
# This script tests all endpoints of the Xendit mock API

MOCKOON_URL="${MOCKOON_URL:-http://localhost:3000}"
API_KEY="${XENDIT_API_KEY:-test_api_key}"

echo "🧪 Testing Xendit Mock API at $MOCKOON_URL"
echo "================================================"

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test 1: Create Invoice
echo -e "\n${YELLOW}Test 1: Create Invoice${NC}"
echo "POST $MOCKOON_URL/v2/invoices"

RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$MOCKOON_URL/v2/invoices" \
  -H "Content-Type: application/json" \
  -u "$API_KEY:" \
  -d '{
    "external_id": "order_test_'$(date +%s)'",
    "amount": 100000,
    "payer_email": "customer@example.com",
    "description": "Event: Test Event - Order: ABC123",
    "invoice_duration": 86400,
    "currency": "IDR",
    "items": [
      {
        "name": "Event Tickets",
        "quantity": 1,
        "price": 100000
      }
    ],
    "customer": {
      "given_names": "John Doe",
      "email": "customer@example.com"
    }
  }')

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')

if [ "$HTTP_CODE" = "200" ]; then
  echo -e "${GREEN}✓ Success (HTTP $HTTP_CODE)${NC}"
  INVOICE_ID=$(echo "$BODY" | grep -o '"id":"[^"]*' | cut -d'"' -f4)
  echo "Invoice ID: $INVOICE_ID"
  echo "Response: $BODY" | head -c 200
  echo "..."
else
  echo -e "${RED}✗ Failed (HTTP $HTTP_CODE)${NC}"
  echo "Response: $BODY"
fi

# Test 2: Get Invoice
if [ ! -z "$INVOICE_ID" ]; then
  echo -e "\n${YELLOW}Test 2: Get Invoice${NC}"
  echo "GET $MOCKOON_URL/v2/invoices/$INVOICE_ID"
  
  RESPONSE=$(curl -s -w "\n%{http_code}" -X GET "$MOCKOON_URL/v2/invoices/$INVOICE_ID" \
    -H "Content-Type: application/json" \
    -u "$API_KEY:")
  
  HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
  BODY=$(echo "$RESPONSE" | sed '$d')
  
  if [ "$HTTP_CODE" = "200" ]; then
    echo -e "${GREEN}✓ Success (HTTP $HTTP_CODE)${NC}"
    echo "Response: $BODY" | head -c 200
    echo "..."
  else
    echo -e "${RED}✗ Failed (HTTP $HTTP_CODE)${NC}"
    echo "Response: $BODY"
  fi
else
  echo -e "\n${YELLOW}Test 2: Get Invoice${NC}"
  echo -e "${YELLOW}⊘ Skipped (no invoice ID from previous test)${NC}"
fi

# Test 3: Expire Invoice
if [ ! -z "$INVOICE_ID" ]; then
  echo -e "\n${YELLOW}Test 3: Expire Invoice${NC}"
  echo "POST $MOCKOON_URL/invoices/$INVOICE_ID/expire"
  
  RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$MOCKOON_URL/invoices/$INVOICE_ID/expire" \
    -H "Content-Type: application/json" \
    -u "$API_KEY:")
  
  HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
  BODY=$(echo "$RESPONSE" | sed '$d')
  
  if [ "$HTTP_CODE" = "200" ]; then
    echo -e "${GREEN}✓ Success (HTTP $HTTP_CODE)${NC}"
    echo "Response: $BODY"
  else
    echo -e "${RED}✗ Failed (HTTP $HTTP_CODE)${NC}"
    echo "Response: $BODY"
  fi
else
  echo -e "\n${YELLOW}Test 3: Expire Invoice${NC}"
  echo -e "${YELLOW}⊘ Skipped (no invoice ID from previous test)${NC}"
fi

# Test 4: Mock Payment Page
echo -e "\n${YELLOW}Test 4: Mock Payment Page${NC}"
echo "GET $MOCKOON_URL/mock-payment/test-payment-id"

RESPONSE=$(curl -s -w "\n%{http_code}" -X GET "$MOCKOON_URL/mock-payment/test-payment-id")

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')

if [ "$HTTP_CODE" = "200" ]; then
  echo -e "${GREEN}✓ Success (HTTP $HTTP_CODE)${NC}"
  echo "Payment page is accessible"
  echo "URL: $MOCKOON_URL/mock-payment/test-payment-id"
else
  echo -e "${RED}✗ Failed (HTTP $HTTP_CODE)${NC}"
  echo "Response: $BODY"
fi

echo -e "\n================================================"
echo "🎉 Testing completed!"
echo ""
echo "To test the payment page in browser, visit:"
echo "$MOCKOON_URL/mock-payment/test-payment-id"
