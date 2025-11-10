#!/usr/bin/env python3
"""
Create test companies with different subscription plans for testing feature access control
"""

import asyncio
import sys
from motor.motor_asyncio import AsyncIOMotorClient
from passlib.context import CryptContext
import os
from datetime import datetime, timezone
import uuid

# Password hashing
pwd_context = CryptContext(schemes=["pbkdf2_sha256"], deprecated="auto")

MONGO_URL = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
DB_NAME = os.environ.get('DB_NAME', 'test_database')

async def main():
    client = AsyncIOMotorClient(MONGO_URL)
    db = client[DB_NAME]
    
    print("=" * 70)
    print("🚀 CREATING TEST COMPANIES WITH DIFFERENT SUBSCRIPTION PLANS")
    print("=" * 70)
    print()
    
    # Get subscription plans from database
    plans = await db.subscription_plans.find({}, {'_id': 0}).to_list(length=None)
    
    if not plans:
        print("❌ No subscription plans found in database!")
        print("   Please create subscription plans first.")
        client.close()
        return
    
    print(f"✅ Found {len(plans)} subscription plans:\n")
    for plan in plans:
        print(f"   - {plan.get('plan_name')} ({plan.get('slug')})")
    print()
    
    # Test companies to create
    test_companies = [
        {
            "company_name": "Free Plan Company",
            "plan_slug": "free",
            "admin_email": "admin.free@test.com",
            "admin_name": "Free Admin"
        },
        {
            "company_name": "Starter Plan Company",
            "plan_slug": "starter",
            "admin_email": "admin.starter@test.com",
            "admin_name": "Starter Admin"
        },
        {
            "company_name": "Professional Plan Company",
            "plan_slug": "professional",
            "admin_email": "admin.professional@test.com",
            "admin_name": "Professional Admin"
        },
        {
            "company_name": "Enterprise Plan Company",
            "plan_slug": "enterprise",
            "admin_email": "admin.enterprise@test.com",
            "admin_name": "Enterprise Admin"
        }
    ]
    
    created_count = 0
    
    for test_company in test_companies:
        # Find the plan
        plan = next((p for p in plans if p.get('slug') == test_company['plan_slug']), None)
        
        if not plan:
            print(f"⚠️  Plan '{test_company['plan_slug']}' not found, skipping...")
            continue
        
        # Check if company already exists
        existing_company = await db.companies.find_one({"company_name": test_company['company_name']})
        if existing_company:
            print(f"ℹ️  Company '{test_company['company_name']}' already exists, skipping...")
            continue
        
        # Create company
        company_id = str(uuid.uuid4())
        company_doc = {
            "company_id": company_id,
            "company_name": test_company['company_name'],
            "industry": "Technology",
            "company_size": "10-50",
            "address": "Test Address",
            "city": "Mumbai",
            "state": "Maharashtra",
            "pincode": "400001",
            "country": "India",
            "contact_email": test_company['admin_email'],
            "contact_phone": "+91 9876543210",
            "gst_number": f"TEST{company_id[:10]}",
            "pan_number": f"TEST{company_id[:5]}",
            "subscription_info": {
                "plan": test_company['plan_slug'],
                "plan_id": plan.get('plan_id'),
                "status": "active",
                "subscribed_at": datetime.now(timezone.utc).isoformat(),
                "current_period_start": datetime.now(timezone.utc).isoformat(),
                "current_period_end": datetime.now(timezone.utc).isoformat()
            },
            "is_active": True,
            "created_at": datetime.now(timezone.utc).isoformat(),
            "created_by": "system"
        }
        
        await db.companies.insert_one(company_doc)
        
        # Create admin user
        hashed_password = pwd_context.hash("password")
        user_doc = {
            "username": test_company['admin_name'].lower().replace(' ', '_'),
            "email": test_company['admin_email'],
            "hashed_password": hashed_password,
            "role": "admin",
            "company_id": company_id,
            "is_active": True,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        
        await db.users.insert_one(user_doc)
        
        print(f"✅ Created: {test_company['company_name']}")
        print(f"   Plan: {plan.get('plan_name')}")
        print(f"   Email: {test_company['admin_email']}")
        print(f"   Password: password")
        print()
        
        created_count += 1
    
    print("=" * 70)
    print(f"✅ Successfully created {created_count} test companies!")
    print("=" * 70)
    print()
    print("📋 LOGIN CREDENTIALS:")
    print()
    
    for test_company in test_companies:
        plan = next((p for p in plans if p.get('slug') == test_company['plan_slug']), None)
        if plan:
            print(f"🏢 {test_company['company_name']} ({plan.get('plan_name')} Plan)")
            print(f"   Email:    {test_company['admin_email']}")
            print(f"   Password: password")
            print()
    
    print("=" * 70)
    print("💡 Use these credentials to test feature access control")
    print("   Different plans will show/hide different menu items!")
    print("=" * 70)
    
    client.close()

if __name__ == "__main__":
    asyncio.run(main())
