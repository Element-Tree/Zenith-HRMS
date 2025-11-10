#!/bin/bash

BACKEND_URL="${REACT_APP_BACKEND_URL:-http://localhost:8001}"
API="${BACKEND_URL}/api"

echo "=== Testing Employee Attendance Endpoint ==="
echo ""

# Login as employee ET-MUM-00001
LOGIN_RESPONSE=$(curl -s -X POST "${API}/auth/employee-login" \
  -H "Content-Type: application/json" \
  -d '{"employee_id":"ET-MUM-00001","pin":"1234"}')

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
echo "Total records: $RECORD_COUNT"
echo ""

# Show today's record
TODAY=$(date +%Y-%m-%d)
echo "Today's attendance record ($TODAY):"
echo $ATTENDANCE_RESPONSE | jq ".[] | select(.date==\"${TODAY}\")" 2>/dev/null
echo ""

# Show first 5 records
echo "First 5 attendance records:"
echo $ATTENDANCE_RESPONSE | jq '.[0:5] | .[] | {date, status, working_hours}' 2>/dev/null

