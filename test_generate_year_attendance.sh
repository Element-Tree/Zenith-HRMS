#!/bin/bash

BACKEND_URL="${REACT_APP_BACKEND_URL:-http://localhost:8001}"
API="${BACKEND_URL}/api"

echo "=== Testing Generate Year Attendance Endpoint ==="
echo ""

# Step 1: Login as admin
echo "1. Logging in as admin..."
LOGIN_RESPONSE=$(curl -s -X POST "${API}/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"Admin$2022"}')

TOKEN=$(echo $LOGIN_RESPONSE | grep -o '"access_token":"[^"]*' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
  echo "❌ Failed to get admin token"
  echo "Response: $LOGIN_RESPONSE"
  exit 1
fi

echo "✅ Admin token received"
echo ""

# Step 2: Generate attendance for year 2025
echo "2. Generating attendance for entire year 2025..."
GENERATE_RESPONSE=$(curl -s -X POST "${API}/attendance/generate-year?year=2025" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json")

echo "Response:"
echo $GENERATE_RESPONSE | jq '.' 2>/dev/null || echo $GENERATE_RESPONSE
echo ""

# Check if successful
if echo $GENERATE_RESPONSE | grep -q "Successfully generated"; then
  echo "✅ Attendance generation completed successfully"
else
  echo "❌ Attendance generation failed"
fi

