#!/bin/bash

BACKEND_URL="${REACT_APP_BACKEND_URL:-http://localhost:8001}"
API="${BACKEND_URL}/api"

echo "=== Testing Employee Attendance Endpoint ==="
echo ""

# Login as employee ET-MUM-00001 with PIN
LOGIN_RESPONSE=$(curl -s -X POST "${API}/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"username":"ET-MUM-00001","password":"1234"}')

TOKEN=$(echo $LOGIN_RESPONSE | grep -o '"access_token":"[^"]*' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
  echo "❌ Failed to get employee token"
  echo "Response: $LOGIN_RESPONSE"
  exit 1
fi

echo "✅ Employee token received"
echo ""

# Fetch attendance for current month
echo "Fetching attendance for October 2025..."
ATTENDANCE_RESPONSE=$(curl -s -X GET "${API}/attendance/my-attendance?month=10&year=2025" \
  -H "Authorization: Bearer $TOKEN")

# Count records
RECORD_COUNT=$(echo $ATTENDANCE_RESPONSE | jq '. | length' 2>/dev/null)
echo "Total records returned: $RECORD_COUNT"
echo ""

# Show today's record
TODAY=$(date +%Y-%m-%d)
echo "Today's attendance record ($TODAY):"
echo $ATTENDANCE_RESPONSE | jq ".[] | select(.date==\"${TODAY}\")" 2>/dev/null
echo ""

# Check if array is empty or has data
if [ "$RECORD_COUNT" = "0" ] || [ -z "$RECORD_COUNT" ]; then
  echo "⚠️  API returned empty array - this triggers frontend calculation fallback"
else
  echo "✅ API returned $RECORD_COUNT records"
  echo ""
  echo "Sample records:"
  echo $ATTENDANCE_RESPONSE | jq '.[0:3] | .[] | {date, status, working_hours}' 2>/dev/null
fi

