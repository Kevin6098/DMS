#!/bin/bash
# Test script for DMS API endpoints

echo "=== DMS API Test Script ==="
echo ""

# Base URL
BASE_URL="http://localhost:5000"
API_URL="${BASE_URL}/api"

echo "1. Testing Health Endpoint..."
curl -s "${BASE_URL}/health" | python3 -m json.tool || echo "❌ Health check failed"
echo ""

echo "2. Testing Login..."
LOGIN_RESPONSE=$(curl -s -X POST "${API_URL}/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"member@demo.com","password":"member123"}')

echo "$LOGIN_RESPONSE" | python3 -m json.tool || echo "$LOGIN_RESPONSE"
echo ""

# Extract token
TOKEN=$(echo "$LOGIN_RESPONSE" | grep -o '"token":"[^"]*' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
  echo "❌ Failed to get token. Cannot continue."
  exit 1
fi

echo "✅ Token obtained: ${TOKEN:0:20}..."
echo ""

echo "3. Testing Files Endpoint..."
FILES_RESPONSE=$(curl -s -H "Authorization: Bearer $TOKEN" \
  "${API_URL}/files?page=1&limit=10")

echo "$FILES_RESPONSE" | python3 -m json.tool || echo "$FILES_RESPONSE"
echo ""

# Check if it succeeded
if echo "$FILES_RESPONSE" | grep -q '"success":true'; then
  echo "✅ Files endpoint working!"
else
  echo "❌ Files endpoint failed!"
  echo "Response: $FILES_RESPONSE"
fi

echo ""
echo "4. Testing Folders Endpoint..."
FOLDERS_RESPONSE=$(curl -s -H "Authorization: Bearer $TOKEN" \
  "${API_URL}/files/folders/list")

echo "$FOLDERS_RESPONSE" | python3 -m json.tool || echo "$FOLDERS_RESPONSE"
echo ""

echo "=== Test Complete ==="

