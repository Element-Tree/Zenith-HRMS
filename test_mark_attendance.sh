#!/bin/bash

BACKEND_URL="${REACT_APP_BACKEND_URL:-http://localhost:8001}"
API="${BACKEND_URL}/api"

echo "=== Testing Mark Attendance Endpoint ==="
echo ""

# Login as admin
LOGIN_RESPONSE=$(curl -s -X POST "${API}/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"Admin$2022"}')

TOKEN=$(echo $LOGIN_RESPONSE | grep -o '"access_token":"[^"]*' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
  echo "❌ Failed to get admin token"
  exit 1
fi

echo "✅ Admin token received"
echo ""

# Test 1: Mark employee as absent for today
echo "1. Marking ET-MUM-00001 as absent for today..."
TODAY=$(date +%Y-%m-%d)

MARK_RESPONSE=$(curl -s -X POST "${API}/attendance/mark" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"employee_id\": \"ET-MUM-00001\",
    \"date\": \"${TODAY}\",
    \"status\": \"absent\",
    \"working_hours\": 0
  }")

echo "Response:"
echo $MARK_RESPONSE | jq '.' 2>/dev/null || echo $MARK_RESPONSE
echo ""

if echo $MARK_RESPONSE | grep -q "Attendance"; then
  echo "✅ Successfully marked as absent"
else
  echo "❌ Failed to mark as absent"
fi
echo ""

# Test 2: Verify attendance record
echo "2. Fetching today's attendance records..."
ATTENDANCE_RESPONSE=$(curl -s -X GET "${API}/attendance/all" \
  -H "Authorization: Bearer $TOKEN")

echo $ATTENDANCE_RESPONSE | jq ".[] | select(.employee_id==\"ET-MUM-00001\" and .date==\"${TODAY}\") | {employee_id, date, status, working_hours}" 2>/dev/null

echo ""

# Test 3: Mark back as present
echo "3. Marking ET-MUM-00001 back as present..."
MARK_PRESENT=$(curl -s -X POST "${API}/attendance/mark" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"employee_id\": \"ET-MUM-00001\",
    \"date\": \"${TODAY}\",
    \"status\": \"present\",
    \"working_hours\": 8
  }")

echo "Response:"
echo $MARK_PRESENT | jq '.' 2>/dev/null || echo $MARK_PRESENT
echo ""

if echo $MARK_PRESENT | grep -q "Attendance"; then
  echo "✅ Successfully marked as present"
else
  echo "❌ Failed to mark as present"
fi

