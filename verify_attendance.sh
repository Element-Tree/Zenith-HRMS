#!/bin/bash

BACKEND_URL="${REACT_APP_BACKEND_URL:-http://localhost:8001}"
API="${BACKEND_URL}/api"

echo "=== Verifying Generated Attendance Data ==="
echo ""

# Login as admin
LOGIN_RESPONSE=$(curl -s -X POST "${API}/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"Admin$2022"}')

TOKEN=$(echo $LOGIN_RESPONSE | grep -o '"access_token":"[^"]*' | cut -d'"' -f4)

# Check attendance for first employee (ET-MUM-00001)
echo "Checking attendance for employee ET-MUM-00001..."
echo ""

# January 2025
echo "📅 January 2025:"
JAN_RESPONSE=$(curl -s -X GET "${API}/attendance/my-attendance?month=1&year=2025" \
  -H "Authorization: Bearer $TOKEN")
echo $JAN_RESPONSE | jq '.[] | select(.employee_id=="ET-MUM-00001") | {date, status, working_hours}' 2>/dev/null | head -20

# February 2025
echo ""
echo "📅 February 2025:"
FEB_RESPONSE=$(curl -s -X GET "${API}/attendance/my-attendance?month=2&year=2025" \
  -H "Authorization: Bearer $TOKEN")
echo $FEB_RESPONSE | jq '.[] | select(.employee_id=="ET-MUM-00001") | {date, status, working_hours}' 2>/dev/null | head -20

# October 2025 (current month)
echo ""
echo "📅 October 2025 (Current Month):"
OCT_RESPONSE=$(curl -s -X GET "${API}/attendance/my-attendance?month=10&year=2025" \
  -H "Authorization: Bearer $TOKEN")
echo $OCT_RESPONSE | jq '.[] | select(.employee_id=="ET-MUM-00001") | {date, status, working_hours}' 2>/dev/null | head -20

# Check rating
echo ""
echo "🏆 Current Month Rating for ET-MUM-00001:"
RATING_RESPONSE=$(curl -s -X GET "${API}/employees/ET-MUM-00001/rating?period=current_month" \
  -H "Authorization: Bearer $TOKEN")
echo $RATING_RESPONSE | jq '.'

echo ""
echo "🏆 YTD Rating for ET-MUM-00001:"
YTD_RATING=$(curl -s -X GET "${API}/employees/ET-MUM-00001/rating?period=ytd" \
  -H "Authorization: Bearer $TOKEN")
echo $YTD_RATING | jq '.'

