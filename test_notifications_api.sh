#!/bin/bash

BACKEND_URL="https://elevatesubs.preview.emergentagent.com/api"

# Login as employee
echo "🔐 Logging in as employee ET-MUM-00001..."
LOGIN_RESPONSE=$(curl -s -X POST "${BACKEND_URL}/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "ET-MUM-00001",
    "pin": "1234"
  }')

TOKEN=$(echo $LOGIN_RESPONSE | grep -o '"access_token":"[^"]*' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
    echo "❌ Login failed!"
    echo "Response: $LOGIN_RESPONSE"
    exit 1
fi

echo "✅ Login successful!"

# Get notifications
echo ""
echo "📋 Fetching notifications..."
NOTIFICATIONS=$(curl -s -X GET "${BACKEND_URL}/notifications" \
  -H "Authorization: Bearer $TOKEN")

echo "$NOTIFICATIONS" | python3 -m json.tool 2>/dev/null

# Count notifications
COUNT=$(echo "$NOTIFICATIONS" | python3 -c "import sys, json; print(len(json.load(sys.stdin)))" 2>/dev/null)
echo ""
echo "Total notifications: $COUNT"

# Test toggle read/unread
if [ "$COUNT" -gt "0" ]; then
    echo ""
    echo "👁️ Testing toggle read/unread..."
    FIRST_ID=$(echo "$NOTIFICATIONS" | python3 -c "import sys, json; print(json.load(sys.stdin)[0]['id'])" 2>/dev/null)
    FIRST_READ=$(echo "$NOTIFICATIONS" | python3 -c "import sys, json; print(json.load(sys.stdin)[0]['is_read'])" 2>/dev/null)
    
    echo "First notification ID: $FIRST_ID"
    echo "Current read status: $FIRST_READ"
    
    # Toggle to opposite
    if [ "$FIRST_READ" == "True" ]; then
        NEW_STATUS="false"
    else
        NEW_STATUS="true"
    fi
    
    echo "Toggling to: $NEW_STATUS"
    TOGGLE_RESULT=$(curl -s -X PUT "${BACKEND_URL}/notifications/${FIRST_ID}/read" \
      -H "Authorization: Bearer $TOKEN" \
      -H "Content-Type: application/json" \
      -d "{\"is_read\": $NEW_STATUS}")
    
    echo "Toggle result: $TOGGLE_RESULT"
    
    # Test clear read notifications
    echo ""
    echo "🗑️ Testing clear read notifications..."
    CLEAR_RESULT=$(curl -s -X DELETE "${BACKEND_URL}/notifications/clear-read" \
      -H "Authorization: Bearer $TOKEN")
    
    echo "Clear result: $CLEAR_RESULT"
fi
