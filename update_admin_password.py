#!/usr/bin/env python3

import asyncio
import os
from motor.motor_asyncio import AsyncIOMotorClient
from passlib.context import CryptContext
from datetime import datetime, timezone

# Password hashing - using pbkdf2_sha256 to match backend
pwd_context = CryptContext(schemes=["pbkdf2_sha256"], deprecated="auto")

async def update_admin_password():
    """Update admin password directly in database"""
    try:
        # Connect to MongoDB
        mongo_url = "mongodb://localhost:27017"
        client = AsyncIOMotorClient(mongo_url)
        db = client["test_database"]
        
        # Hash the new password
        new_password_hash = pwd_context.hash("Admin$2022")
        
        # Update admin user password
        result = await db.users.update_one(
            {"username": "admin", "role": "admin"},
            {
                "$set": {
                    "hashed_password": new_password_hash,
                    "updated_at": datetime.now(timezone.utc).isoformat()
                }
            }
        )
        
        if result.matched_count > 0:
            print("✅ Admin password updated successfully to 'Admin$2022'")
            print(f"   Modified {result.modified_count} document(s)")
            return True
        else:
            print("❌ No admin user found to update")
            return False
            
    except Exception as e:
        print(f"❌ Error updating admin password: {str(e)}")
        return False
    finally:
        client.close()

if __name__ == "__main__":
    success = asyncio.run(update_admin_password())
    if success:
        print("\n🎉 Admin password update completed!")
    else:
        print("\n💥 Admin password update failed!")