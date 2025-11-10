#!/bin/bash

BACKEND_URL="${REACT_APP_BACKEND_URL:-http://localhost:8001}"
API="${BACKEND_URL}/api"

echo "=== Testing Employee Attendance Endpoint ==="
echo ""

# Login as employee ET-MUM-00001 with PIN
LOGIN_RESPONSE=$(curl -s -X POST "${API}/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"username":"ET-MUM-00001","pin":"1234"}')

TOKEN=$(echo $LOGIN_RESPONSE | jq -r '.access_token' 2>/dev/null)

if [ -z "$TOKEN" ] || [ "$TOKEN" = "null" ]; then
  echo "❌ Failed to get employee token"
  echo "Response: $LOGIN_RESPONSE"
  exit 1
fi

echo "✅ Employee token received"
echo ""

# Fetch attendance for current month (October 2025)
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
TODAY_RECORD=$(echo $ATTENDANCE_RESPONSE | jq ".[] | select(.date==\"${TODAY}\")" 2>/dev/null)

if [ -z "$TODAY_RECORD" ] || [ "$TODAY_RECORD" = "null" ]; then
  echo "❌ No record found for today"
else
  echo "$TODAY_RECORD"
fi
echo ""

# Check if array is empty or has data
if [ "$RECORD_COUNT" = "0" ] || [ -z "$RECORD_COUNT" ]; then
  echo "⚠️  API returned empty array - this triggers frontend calculation fallback"
  echo "This means changes won't reflect in Employee Portal"
else
  echo "✅ API returned $RECORD_COUNT records"
  echo ""
  echo "Sample records (showing status and hours):"
  echo $ATTENDANCE_RESPONSE | jq '.[0:5] | .[] | {date, status, working_hours}' 2>/dev/null
fi

