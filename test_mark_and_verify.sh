#!/bin/bash

BACKEND_URL="${REACT_APP_BACKEND_URL:-http://localhost:8001}"
API="${BACKEND_URL}/api"
TODAY=$(date +%Y-%m-%d)

# Login as admin
LOGIN_RESPONSE=$(curl -s -X POST "${API}/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"Admin$2022"}')

TOKEN=$(echo $LOGIN_RESPONSE | jq -r '.access_token' 2>/dev/null)

echo "=== Before Marking Absent ==="
python3 -c "
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os

async def check():
    client = AsyncIOMotorClient(os.environ.get('MONGO_URL', 'mongodb://localhost:27017'))
    db = client[os.environ.get('DB_NAME', 'test_database')]
    record = await db.attendance.find_one({'employee_id': 'ET-MUM-00001', 'date': '${TODAY}'})
    if record:
        print(f\"Status: {record.get('status')}, Hours: {record.get('working_hours')}\")
    else:
        print('No record found')
    client.close()

asyncio.run(check())
"

echo ""
echo "=== Marking ET-MUM-00001 as ABSENT ==="
curl -s -X POST "${API}/attendance/mark" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"employee_id\": \"ET-MUM-00001\",
    \"date\": \"${TODAY}\",
    \"status\": \"absent\",
    \"working_hours\": 0
  }" | jq '.'

echo ""
echo "=== After Marking Absent ==="
python3 -c "
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os

async def check():
    client = AsyncIOMotorClient(os.environ.get('MONGO_URL', 'mongodb://localhost:27017'))
    db = client[os.environ.get('DB_NAME', 'test_database')]
    record = await db.attendance.find_one({'employee_id': 'ET-MUM-00001', 'date': '${TODAY}'})
    if record:
        print(f\"Status: {record.get('status')}, Hours: {record.get('working_hours')}\")
    else:
        print('No record found')
    client.close()

asyncio.run(check())
"

