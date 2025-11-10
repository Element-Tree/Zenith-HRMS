#!/bin/bash

BACKEND_URL="https://elevatesubs.preview.emergentagent.com/api"

# Login
LOGIN_RESPONSE=$(curl -s -X POST "${BACKEND_URL}/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"username": "ET-MUM-00001", "pin": "1234"}')

TOKEN=$(echo $LOGIN_RESPONSE | grep -o '"access_token":"[^"]*' | cut -d'"' -f4)

# Get notifications again
echo "📋 Notifications after clearing read ones:"
NOTIFICATIONS=$(curl -s -X GET "${BACKEND_URL}/notifications" \
  -H "Authorization: Bearer $TOKEN")

echo "$NOTIFICATIONS" | python3 -m json.tool | grep -E '"title"|"is_read"'
