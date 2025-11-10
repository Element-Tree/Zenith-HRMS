#!/usr/bin/env python3
"""
Migration Script: Convert Employee Login from PIN to Email+Password

This script:
1. Updates all employee users to have hashed passwords
2. Sets default password "Test@1234" for all employees
3. Removes PIN-based authentication
"""

import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os
from datetime import datetime, timezone
from passlib.context import CryptContext

# MongoDB connection
MONGO_URL = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
client = AsyncIOMotorClient(MONGO_URL)
DB_NAME = os.environ.get('MONGO_DB_NAME', 'test_database')
db = client[DB_NAME]

# Password hashing - using pbkdf2_sha256 to match server.py
pwd_context = CryptContext(schemes=["pbkdf2_sha256"], deprecated="auto")
DEFAULT_PASSWORD = "Test@1234"

async def migrate_employee_users():
    """Update all employee users to use email+password authentication"""
    print("=" * 70)
    print("🚀 EMPLOYEE LOGIN MIGRATION - PIN to Email+Password")
    print("=" * 70)
    
    # Get all employee users
    employee_users = await db.users.find({"role": "employee"}).to_list(length=None)
    
    if not employee_users:
        print("\n⚠️  No employee users found in database")
        return
    
    print(f"\n📊 Found {len(employee_users)} employee users to migrate")
    
    migrated_count = 0
    already_migrated = 0
    
    # Hash the default password
    hashed_password = pwd_context.hash(DEFAULT_PASSWORD)
    
    for user in employee_users:
        username = user.get("username")
        email = user.get("email")
        
        # Check if already migrated (has hashed_password)
        if user.get("hashed_password"):
            print(f"  ℹ️  {username}: Already has password authentication")
            already_migrated += 1
            continue
        
        # Check if employee has email
        if not email:
            print(f"  ⚠️  {username}: No email found, skipping")
            continue
        
        # Update user with hashed password
        update_data = {
            "hashed_password": hashed_password,
            "pin": None,  # Remove PIN
            "updated_at": datetime.now(timezone.utc).isoformat()
        }
        
        await db.users.update_one(
            {"username": username},
            {"$set": update_data}
        )
        
        print(f"  ✅ {username} ({email}): Migrated to password authentication")
        migrated_count += 1
    
    print(f"\n{'='*70}")
    print(f"🎉 MIGRATION COMPLETE!")
    print(f"{'='*70}")
    print(f"Total employee users: {len(employee_users)}")
    print(f"Newly migrated: {migrated_count}")
    print(f"Already migrated: {already_migrated}")
    print(f"\nDefault password for all employees: {DEFAULT_PASSWORD}")
    print(f"{'='*70}")


async def verify_migration():
    """Verify the migration was successful"""
    print("\n" + "="*70)
    print("🔍 VERIFICATION")
    print("="*70)
    
    # Check employee users with password
    password_based = await db.users.count_documents({
        "role": "employee",
        "hashed_password": {"$exists": True, "$ne": None}
    })
    
    # Check employee users with PIN
    pin_based = await db.users.count_documents({
        "role": "employee",
        "pin": {"$exists": True, "$ne": None}
    })
    
    total_employees = await db.users.count_documents({"role": "employee"})
    
    print(f"Total employee users: {total_employees}")
    print(f"Password-based authentication: {password_based}")
    print(f"PIN-based authentication (old): {pin_based}")
    
    if password_based > 0 and pin_based == 0:
        print("\n✅ Migration verification successful!")
        print(f"All {password_based} employees now use email+password authentication")
        
        # Show sample employee
        sample = await db.users.find_one({
            "role": "employee",
            "hashed_password": {"$exists": True, "$ne": None}
        })
        
        if sample:
            print(f"\n📋 Sample Employee User:")
            print(f"   Username: {sample.get('username')}")
            print(f"   Email: {sample.get('email')}")
            print(f"   Has Password: Yes")
            print(f"   PIN Removed: {'Yes' if not sample.get('pin') else 'No'}")
    else:
        print("\n⚠️  Migration incomplete or mixed authentication methods detected")


if __name__ == "__main__":
    async def main():
        try:
            await migrate_employee_users()
            await verify_migration()
        finally:
            client.close()
    
    asyncio.run(main())
