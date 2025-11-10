import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os

async def check_attendance():
    # Get MongoDB URL from environment
    mongo_url = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
    db_name = os.environ.get('DB_NAME', 'test_database')
    
    print(f"Connecting to: {mongo_url}")
    print(f"Database: {db_name}")
    print("")
    
    # Connect to MongoDB
    client = AsyncIOMotorClient(mongo_url)
    db = client[db_name]
    
    # Check total attendance records
    total_count = await db.attendance.count_documents({})
    print(f"Total attendance records in database: {total_count}")
    
    # Check for 2025 records
    count_2025 = await db.attendance.count_documents({
        "date": {"$gte": "2025-01-01", "$lte": "2025-12-31"}
    })
    print(f"Attendance records for 2025: {count_2025}")
    
    # Check for today
    from datetime import date
    today = date.today().isoformat()
    count_today = await db.attendance.count_documents({"date": today})
    print(f"Attendance records for today ({today}): {count_today}")
    
    if count_today > 0:
        print(f"\nToday's records:")
        today_records = await db.attendance.find({"date": today}).to_list(length=20)
        for record in today_records:
            print(f"  {record.get('employee_id')} - Status: {record.get('status')} - Hours: {record.get('working_hours')}")
    
    # Sample a few records
    print("\nSample attendance records:")
    sample = await db.attendance.find({}).limit(5).to_list(length=5)
    for record in sample:
        print(f"  {record.get('employee_id')} - {record.get('date')} - {record.get('status')} - {record.get('working_hours')}h")
    
    client.close()

asyncio.run(check_attendance())
