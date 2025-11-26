#!/bin/bash
# Simple API test script for VPS

echo "=========================================="
echo "DMS API Test Script"
echo "=========================================="
echo ""

BASE_URL="http://localhost:5000"

# Test 1: Health Check
echo "1️⃣  Testing Health Endpoint..."
HEALTH=$(curl -s "${BASE_URL}/health")
if echo "$HEALTH" | grep -q "OK"; then
  echo "✅ Health check: OK"
  echo "$HEALTH" | python3 -m json.tool 2>/dev/null || echo "$HEALTH"
else
  echo "❌ Health check failed"
  echo "$HEALTH"
fi
echo ""

# Test 2: Login
echo "2️⃣  Testing Login..."
LOGIN_RESPONSE=$(curl -s -X POST "${BASE_URL}/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"member@demo.com","password":"member123"}')

if echo "$LOGIN_RESPONSE" | grep -q '"success":true'; then
  echo "✅ Login successful"
  TOKEN=$(echo "$LOGIN_RESPONSE" | grep -o '"token":"[^"]*' | cut -d'"' -f4)
  echo "Token: ${TOKEN:0:30}..."
else
  echo "❌ Login failed"
  echo "$LOGIN_RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$LOGIN_RESPONSE"
  exit 1
fi
echo ""

# Test 3: Files Endpoint
echo "3️⃣  Testing Files Endpoint (/api/files?page=1&limit=10)..."
FILES_RESPONSE=$(curl -s -w "\nHTTP_CODE:%{http_code}" \
  -H "Authorization: Bearer $TOKEN" \
  "${BASE_URL}/api/files?page=1&limit=10")

HTTP_CODE=$(echo "$FILES_RESPONSE" | grep "HTTP_CODE" | cut -d: -f2)
BODY=$(echo "$FILES_RESPONSE" | grep -v "HTTP_CODE")

if [ "$HTTP_CODE" = "200" ]; then
  echo "✅ Files endpoint: HTTP 200"
  if echo "$BODY" | grep -q '"success":true'; then
    echo "✅ Response indicates success"
    echo "$BODY" | python3 -m json.tool 2>/dev/null || echo "$BODY"
  else
    echo "⚠️  HTTP 200 but response shows error:"
    echo "$BODY" | python3 -m json.tool 2>/dev/null || echo "$BODY"
  fi
else
  echo "❌ Files endpoint: HTTP $HTTP_CODE"
  echo "Response:"
  echo "$BODY" | python3 -m json.tool 2>/dev/null || echo "$BODY"
fi
echo ""

# Test 4: Folders Endpoint
echo "4️⃣  Testing Folders Endpoint..."
FOLDERS_RESPONSE=$(curl -s -H "Authorization: Bearer $TOKEN" \
  "${BASE_URL}/api/files/folders/list")

if echo "$FOLDERS_RESPONSE" | grep -q '"success":true'; then
  echo "✅ Folders endpoint working"
else
  echo "⚠️  Folders endpoint response:"
  echo "$FOLDERS_RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$FOLDERS_RESPONSE"
fi
echo ""

echo "=========================================="
echo "Test Complete"
echo "=========================================="

