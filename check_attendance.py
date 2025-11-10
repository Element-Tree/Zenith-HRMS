import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os

async def check_attendance():
    # Get MongoDB URL from environment
    mongo_url = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
    
    # Connect to MongoDB
    client = AsyncIOMotorClient(mongo_url)
    db_name = mongo_url.split('/')[-1] if '/' in mongo_url else 'elevate_db'
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
    
    # Sample a few records
    print("\nSample attendance records:")
    sample = await db.attendance.find({}).limit(5).to_list(length=5)
    for record in sample:
        print(f"  {record.get('employee_id')} - {record.get('date')} - {record.get('status')} - {record.get('working_hours')}h")
    
    client.close()

asyncio.run(check_attendance())
