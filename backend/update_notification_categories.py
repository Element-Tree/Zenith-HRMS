#!/usr/bin/env python3
"""
Script to update existing notifications with proper categories
"""
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

MONGO_URL = os.environ.get("MONGO_URL")
DB_NAME = os.environ.get("DB_NAME")

async def update_notification_categories():
    """Update notifications without categories"""
    client = AsyncIOMotorClient(MONGO_URL)
    db = client[DB_NAME]
    
    print(f"Using database: {DB_NAME}")
    print("Fetching notifications without categories...")
    notifications = await db.notifications.find({}).to_list(length=None)
    
    print(f"Found {len(notifications)} total notifications")
    
    updated_count = 0
    for notif in notifications:
        title = (notif.get('title', '') or '').lower()
        message = (notif.get('message', '') or '').lower()
        category = notif.get('category')
        
        # Skip if already has a proper category (not general or None)
        if category and category != 'general':
            continue
        
        # Infer category from title and message
        new_category = None
        
        if 'ot log' in title or 'overtime' in title or 'overtime log' in message:
            new_category = 'ot'
        elif ('ot' in title and ('logged' in title or 'submitted' in title or 'approved' in title or 'rejected' in title)):
            new_category = 'ot'
        elif 'leave' in title or 'leave request' in message or 'leave application' in message:
            new_category = 'leave'
        elif 'loan' in title or 'loan application' in message or 'loan request' in message:
            new_category = 'loan'
        elif 'payslip' in title or 'payslip generated' in message:
            new_category = 'payslip'
        elif 'employee' in title or 'birthday' in title or 'new employee' in message:
            new_category = 'employee'
        
        if new_category:
            # Update the notification
            result = await db.notifications.update_one(
                {'id': notif['id']},
                {'$set': {'category': new_category}}
            )
            if result.modified_count > 0:
                updated_count += 1
                print(f"✓ Updated: '{notif['title']}' → category: {new_category}")
        else:
            print(f"⚠ Skipped: '{notif['title']}' (no category match)")
    
    print(f"\n✅ Updated {updated_count} notifications with categories")
    
    client.close()

if __name__ == '__main__':
    asyncio.run(update_notification_categories())
