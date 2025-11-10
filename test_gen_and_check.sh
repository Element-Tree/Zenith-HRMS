#!/bin/bash

BACKEND_URL="${REACT_APP_BACKEND_URL:-http://localhost:8001}"
API="${BACKEND_URL}/api"

# Login as admin
LOGIN_RESPONSE=$(curl -s -X POST "${API}/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"Admin$2022"}')

TOKEN=$(echo $LOGIN_RESPONSE | jq -r '.access_token' 2>/dev/null)

echo "Generating attendance..."
curl -s -X POST "${API}/attendance/generate-year?year=2025" \
  -H "Authorization: Bearer $TOKEN" | jq '.'

echo ""
echo "Checking database immediately..."
python3 check_attendance.py

