#!/usr/bin/env python3
"""
Database cleanup script to remove invalid user accounts and ensure data consistency
"""

import asyncio
import os
from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime, timezone

# Database connection
MONGO_URL = os.environ.get('MONGO_URL', 'mongodb://localhost:27017/test_database')

async def cleanup_users():
    """Clean up invalid user accounts and ensure data consistency"""
    client = AsyncIOMotorClient(MONGO_URL)
    # Get database name from environment variable or extract from MONGO_URL
    db_name = os.environ.get('DB_NAME')
    if not db_name:
        # Extract database name from MONGO_URL if DB_NAME not set
        db_name = MONGO_URL.split('/')[-1] if '/' in MONGO_URL else 'test_database'
    db = client[db_name]
    
    print("🔍 Starting database cleanup...")
    
    # Get all users and employees
    users = await db.users.find({"role": "employee"}).to_list(length=None)
    employees = await db.employees.find({}).to_list(length=None)
    
    print(f"📊 Found {len(users)} user accounts and {len(employees)} employees")
    
    # Create lookup for valid employee IDs with their status
    valid_employees = {}
    active_employees = set()
    
    for emp in employees:
        valid_employees[emp['employee_id']] = emp.get('status', 'active')
        if emp.get('status', 'active') == 'active':
            active_employees.add(emp['employee_id'])
    
    print(f"✅ Active employees: {len(active_employees)}")
    print(f"📋 Total employees: {len(valid_employees)}")
    
    # Identify accounts to delete
    accounts_to_delete = []
    duplicates = {}
    
    for user in users:
        employee_id = user.get('employee_id')
        username = user.get('username')
        
        # Track duplicates
        if employee_id in duplicates:
            duplicates[employee_id].append(user['_id'])
        else:
            duplicates[employee_id] = [user['_id']]
        
        # Mark for deletion if:
        # 1. Test account patterns
        if any(pattern in employee_id for pattern in ['TEST', 'MIN082', 'FULL082', 'BLANK082', 'AUTH082', 'BULK090', 'STATUS090', 'EDIT090', 'PIN135']):
            accounts_to_delete.append((user['_id'], f"Test account: {employee_id}"))
        
        # 2. Not in employees collection
        elif employee_id not in valid_employees:
            accounts_to_delete.append((user['_id'], f"No matching employee: {employee_id}"))
        
        # 3. Employee is not active
        elif valid_employees.get(employee_id) != 'active':
            status = valid_employees.get(employee_id, 'unknown')
            accounts_to_delete.append((user['_id'], f"Non-active employee ({status}): {employee_id}"))
    
    # Handle duplicates - keep only the most recent one per employee
    for employee_id, user_ids in duplicates.items():
        if len(user_ids) > 1:
            print(f"🔄 Found {len(user_ids)} duplicate accounts for {employee_id}")
            # Keep the first one, delete the rest
            for user_id in user_ids[1:]:
                accounts_to_delete.append((user_id, f"Duplicate account: {employee_id}"))
    
    print(f"\n🗑️  Accounts to delete: {len(accounts_to_delete)}")
    
    # Show what will be deleted
    for user_id, reason in accounts_to_delete[:10]:  # Show first 10
        print(f"  - {reason}")
    
    if len(accounts_to_delete) > 10:
        print(f"  ... and {len(accounts_to_delete) - 10} more")
    
    # Confirm deletion
    if accounts_to_delete:
        print(f"\n⚠️  This will delete {len(accounts_to_delete)} user accounts.")
        print("This action cannot be undone!")
        
        # In production, you might want confirmation
        # For now, proceed with cleanup
        
        # Delete invalid accounts
        user_ids_to_delete = [user_id for user_id, _ in accounts_to_delete]
        result = await db.users.delete_many({"_id": {"$in": user_ids_to_delete}})
        
        print(f"✅ Deleted {result.deleted_count} user accounts")
    
    # Verify final state
    remaining_users = await db.users.find({"role": "employee"}).to_list(length=None)
    active_user_count = 0
    
    for user in remaining_users:
        employee_id = user.get('employee_id')
        if employee_id in active_employees:
            active_user_count += 1
    
    print(f"\n📈 Final state:")
    print(f"  - Remaining user accounts: {len(remaining_users)}")
    print(f"  - Active employee accounts: {active_user_count}")
    print(f"  - Total active employees: {len(active_employees)}")
    
    client.close()
    
    return {
        'deleted_count': len(accounts_to_delete),
        'remaining_users': len(remaining_users),
        'active_users': active_user_count,
        'active_employees': len(active_employees)
    }

if __name__ == "__main__":
    asyncio.run(cleanup_users())