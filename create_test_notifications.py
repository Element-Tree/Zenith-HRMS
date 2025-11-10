#!/usr/bin/env python3

import os
import asyncio
from pymongo import MongoClient
from dotenv import load_dotenv
from datetime import datetime, timezone, timedelta
import uuid

async def create_test_notifications():
    load_dotenv('backend/.env')
    mongo_url = os.getenv('MONGO_URL')
    db_name = os.getenv('DB_NAME', 'hr_elevate')
    
    client = MongoClient(mongo_url)
    db = client[db_name]
    
    print(f"Using database: {db_name}")
    
    employee_id = "ET-MUM-00001"
    
    # Clear existing notifications for this employee
    deleted = db.notifications.delete_many({"recipient_id": employee_id})
    print(f"Cleared {deleted.deleted_count} existing notifications")
    
    # Create test notifications with different timestamps
    notifications = [
        {
            "id": str(uuid.uuid4()),
            "title": "Payslip Generated",
            "message": "Your payslip for October 2025 is ready for download",
            "notification_type": "success",
            "recipient_id": employee_id,
            "recipient_role": "employee",
            "is_read": False,
            "created_at": datetime.now(timezone.utc) - timedelta(hours=1)
        },
        {
            "id": str(uuid.uuid4()),
            "title": "Leave Request Approved",
            "message": "Your casual leave request for Oct 15-16 has been approved",
            "notification_type": "success",
            "recipient_id": employee_id,
            "recipient_role": "employee",
            "is_read": False,
            "created_at": datetime.now(timezone.utc) - timedelta(hours=2)
        },
        {
            "id": str(uuid.uuid4()),
            "title": "Reminder: Update Profile",
            "message": "Please update your emergency contact information",
            "notification_type": "info",
            "recipient_id": employee_id,
            "recipient_role": "employee",
            "is_read": True,
            "read_at": datetime.now(timezone.utc) - timedelta(hours=3),
            "created_at": datetime.now(timezone.utc) - timedelta(hours=4)
        },
        {
            "id": str(uuid.uuid4()),
            "title": "Loan Request Update",
            "message": "Your loan request is under review",
            "notification_type": "info",
            "recipient_id": employee_id,
            "recipient_role": "employee",
            "is_read": True,
            "read_at": datetime.now(timezone.utc) - timedelta(days=1),
            "created_at": datetime.now(timezone.utc) - timedelta(days=2)
        },
        {
            "id": str(uuid.uuid4()),
            "title": "Welcome to Elevate",
            "message": "Welcome to the Elevate HR Management System",
            "notification_type": "info",
            "recipient_id": employee_id,
            "recipient_role": "employee",
            "is_read": False,
            "created_at": datetime.now(timezone.utc) - timedelta(minutes=30)
        }
    ]
    
    # Insert notifications
    result = db.notifications.insert_many(notifications)
    print(f"✅ Created {len(result.inserted_ids)} test notifications for employee {employee_id}")
    
    # Show what was created
    print("\nNotifications created (sorted by created_at desc):")
    sorted_notifs = sorted(notifications, key=lambda x: x['created_at'], reverse=True)
    for i, notif in enumerate(sorted_notifs, 1):
        status = "READ" if notif["is_read"] else "UNREAD"
        print(f"  {i}. [{status}] {notif['title']}")

if __name__ == "__main__":
    asyncio.run(create_test_notifications())
