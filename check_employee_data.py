import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os

async def check_employee():
    # Get MongoDB URL from environment
    mongo_url = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
    
    # Connect to MongoDB
    client = AsyncIOMotorClient(mongo_url)
    db_name = mongo_url.split('/')[-1] if '/' in mongo_url else 'elevate_db'
    db = client[db_name]
    
    # Check user for ET-MUM-00001
    user = await db.users.find_one({"username": "ET-MUM-00001"})
    
    if user:
        print("User found:")
        print(f"  Username: {user.get('username')}")
        print(f"  Role: {user.get('role')}")
        print(f"  PIN: {user.get('pin')}")
        print(f"  Employee ID: {user.get('employee_id')}")
    else:
        print("User not found")
    
    # Also check attendance count for October
    count = await db.attendance.count_documents({
        "employee_id": "ET-MUM-00001",
        "date": {"$gte": "2025-10-01", "$lte": "2025-10-31"}
    })
    print(f"\nAttendance records for October 2025: {count}")
    
    # Get today's attendance
    from datetime import date
    today = date.today().isoformat()
    today_attendance = await db.attendance.find_one({
        "employee_id": "ET-MUM-00001",
        "date": today
    })
    
    if today_attendance:
        print(f"\nToday's attendance ({today}):")
        print(f"  Status: {today_attendance.get('status')}")
        print(f"  Working Hours: {today_attendance.get('working_hours')}")
    else:
        print(f"\nNo attendance record for today ({today})")
    
    client.close()

asyncio.run(check_employee())
