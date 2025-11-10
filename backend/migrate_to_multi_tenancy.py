"""
Migration script to add multi-tenancy support to Elevate Payroll System
This script:
1. Creates a 'companies' collection
2. Creates 'Element Tree' as the first company
3. Adds company_id field to all existing collections
4. Migrates all existing data to Element Tree company
5. Creates super admin user
"""

import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime, timezone
import uuid
import os
from dotenv import load_dotenv
from pathlib import Path
from passlib.context import CryptContext

# Load environment variables
ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Password hashing - using pbkdf2_sha256 to avoid bcrypt initialization issues
pwd_context = CryptContext(schemes=["pbkdf2_sha256"], deprecated="auto")

# Element Tree company ID (fixed UUID for consistency)
ELEMENT_TREE_COMPANY_ID = "c1a2b3c4-d5e6-f7a8-b9c0-d1e2f3a4b5c6"

async def migrate_to_multi_tenancy():
    """Main migration function"""
    
    print("=" * 70)
    print("ELEVATE PAYROLL - MULTI-TENANCY MIGRATION")
    print("=" * 70)
    print()
    
    # Step 1: Create companies collection and Element Tree company
    print("Step 1: Creating 'companies' collection and Element Tree company...")
    companies_collection = db['companies']
    
    # Check if Element Tree already exists
    existing_company = await companies_collection.find_one({"company_id": ELEMENT_TREE_COMPANY_ID})
    
    if existing_company:
        print("✓ Element Tree company already exists")
    else:
        # Create Element Tree company
        element_tree = {
            "company_id": ELEMENT_TREE_COMPANY_ID,
            "company_name": "Element Tree",
            "company_logo_url": "/elementtree-logo.png",
            "contact_email": "accounts@elementree.co.in",
            "phone": "+91-XXXXXXXXXX",
            "address": "Mumbai, India",
            "admin_user_id": None,  # Will be updated after admin creation
            "settings": {
                "working_days_config": {
                    "sunday_off": True,
                    "saturday_policy": "alternate",  # alternate, full_week, second_fourth_off
                    "week_start": "Monday"
                },
                "leave_policies": {
                    "annual_leave": 15,
                    "sick_leave": 10,
                    "casual_leave": 8
                },
                "default_working_hours": {
                    "start_time": "08:30",
                    "end_time": "17:30",
                    "total_hours": 9
                }
            },
            "status": "active",
            "subscription_info": {
                "plan": "enterprise",
                "start_date": datetime.now(timezone.utc).isoformat(),
                "status": "active"
            },
            "created_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat()
        }
        
        await companies_collection.insert_one(element_tree)
        print("✓ Element Tree company created successfully")
    
    print()
    
    # Step 2: Create super admin user
    print("Step 2: Creating super admin user...")
    users_collection = db['users']
    
    # Check if super admin already exists
    existing_super_admin = await users_collection.find_one({"username": "superadmin@elevate.com"})
    
    if existing_super_admin:
        print("✓ Super admin user already exists")
    else:
        # Create super admin user
        super_admin = {
            "id": str(uuid.uuid4()),
            "username": "superadmin@elevate.com",
            "hashed_password": pwd_context.hash("SuperAdmin@123"),
            "role": "super_admin",
            "company_id": None,  # Super admin is not tied to any company
            "email": "superadmin@elevate.com",
            "employee_id": None,
            "is_active": True,
            "pin": None,
            "created_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat()
        }
        
        await users_collection.insert_one(super_admin)
        print("✓ Super admin user created successfully")
        print(f"  Email: superadmin@elevate.com")
        print(f"  Password: SuperAdmin@123")
    
    print()
    
    # Step 3: Add company_id to all collections
    print("Step 3: Adding company_id to existing collections...")
    
    collections_to_migrate = [
        'employees',
        'users',
        'payroll_runs',
        'payslips',
        'leave_requests',
        'loan_requests',
        'ot_logs',
        'attendance',
        'late_arrivals',
        'notifications',
        'events',
        'holidays',
        'working_days_config',
        'company_bank_accounts',
        'employee_source_mapping',
        'bank_templates'
    ]
    
    for collection_name in collections_to_migrate:
        collection = db[collection_name]
        
        # Count documents without company_id
        count_without_company = await collection.count_documents({"company_id": {"$exists": False}})
        
        if count_without_company > 0:
            # Update all documents to add Element Tree company_id
            result = await collection.update_many(
                {"company_id": {"$exists": False}},
                {"$set": {"company_id": ELEMENT_TREE_COMPANY_ID}}
            )
            print(f"✓ {collection_name}: Added company_id to {result.modified_count} documents")
        else:
            print(f"✓ {collection_name}: Already migrated (0 documents without company_id)")
    
    print()
    
    # Step 4: Update admin user to have company_id
    print("Step 4: Updating existing admin users with Element Tree company_id...")
    
    # Find admin users without company_id (excluding super_admin)
    admin_users_to_update = await users_collection.count_documents({
        "role": {"$in": ["admin", "employee"]},
        "company_id": {"$exists": False}
    })
    
    if admin_users_to_update > 0:
        result = await users_collection.update_many(
            {
                "role": {"$in": ["admin", "employee"]},
                "company_id": {"$exists": False}
            },
            {"$set": {"company_id": ELEMENT_TREE_COMPANY_ID}}
        )
        print(f"✓ Updated {result.modified_count} admin/employee users with Element Tree company_id")
    else:
        print("✓ All admin/employee users already have company_id")
    
    print()
    
    # Step 5: Update Element Tree company with admin_user_id
    print("Step 5: Linking Element Tree company with admin user...")
    
    # Find the first admin user for Element Tree
    admin_user = await users_collection.find_one({
        "role": "admin",
        "company_id": ELEMENT_TREE_COMPANY_ID
    })
    
    if admin_user:
        await companies_collection.update_one(
            {"company_id": ELEMENT_TREE_COMPANY_ID},
            {"$set": {"admin_user_id": admin_user["id"]}}
        )
        print(f"✓ Linked admin user ({admin_user.get('username', 'unknown')}) to Element Tree company")
    else:
        print("⚠ No admin user found for Element Tree company")
    
    print()
    
    # Step 6: Create indexes for performance
    print("Step 6: Creating indexes for company_id...")
    
    for collection_name in collections_to_migrate:
        collection = db[collection_name]
        try:
            await collection.create_index("company_id")
            print(f"✓ Created index on {collection_name}.company_id")
        except Exception as e:
            print(f"⚠ Index creation for {collection_name} failed or already exists: {str(e)}")
    
    print()
    print("=" * 70)
    print("MIGRATION COMPLETED SUCCESSFULLY!")
    print("=" * 70)
    print()
    print("Summary:")
    print(f"  ✓ Element Tree company created (ID: {ELEMENT_TREE_COMPANY_ID})")
    print(f"  ✓ Super Admin user created")
    print(f"  ✓ All existing data migrated to Element Tree")
    print(f"  ✓ Indexes created for performance")
    print()
    print("Super Admin Credentials:")
    print(f"  Email: superadmin@elevate.com")
    print(f"  Password: SuperAdmin@123")
    print()
    print("You can now login as Super Admin to create new companies!")
    print()

# Run the migration
if __name__ == "__main__":
    asyncio.run(migrate_to_multi_tenancy())
