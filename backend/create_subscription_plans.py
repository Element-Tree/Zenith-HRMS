"""
Create subscription plans collection and seed initial data
"""

import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime, timezone
import uuid
import os
from dotenv import load_dotenv
from pathlib import Path

# Load environment variables
ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

async def create_subscription_plans():
    """Create subscription plans collection with initial data"""
    
    print("=" * 70)
    print("CREATING SUBSCRIPTION PLANS")
    print("=" * 70)
    print()
    
    plans_collection = db['subscription_plans']
    
    # Check if plans already exist
    existing_count = await plans_collection.count_documents({})
    if existing_count > 0:
        print(f"⚠️  {existing_count} plans already exist. Skipping...")
        return
    
    # Define the 3 subscription plans
    plans = [
        {
            "plan_id": str(uuid.uuid4()),
            "plan_name": "Starter",
            "slug": "starter",
            "description": "Perfect for small businesses and startups",
            "monthly_price": 999,
            "annual_price": 9999,
            "currency": "INR",
            "features": {
                "employee_limit": 10,
                "admin_users_limit": 1,
                "data_retention_months": 3,
                "basic_payroll": True,
                "employee_portal": True,
                "leave_management": True,
                "attendance_tracking": True,
                "basic_reports": True,
                "loan_advances": False,
                "overtime_management": False,
                "bank_advice": False,
                "compliance_reports": False,
                "custom_salary_structures": False,
                "multi_location": False,
                "api_access": False,
                "white_labeling": False,
                "excel_pdf_export": False,
                "support_level": "email"
            },
            "is_active": True,
            "display_order": 1,
            "created_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "plan_id": str(uuid.uuid4()),
            "plan_name": "Professional",
            "slug": "professional",
            "description": "Ideal for growing businesses",
            "monthly_price": 2999,
            "annual_price": 29999,
            "currency": "INR",
            "features": {
                "employee_limit": 50,
                "admin_users_limit": 3,
                "data_retention_months": 12,
                "basic_payroll": True,
                "employee_portal": True,
                "leave_management": True,
                "attendance_tracking": True,
                "basic_reports": True,
                "loan_advances": True,
                "overtime_management": True,
                "bank_advice": True,
                "compliance_reports": True,
                "custom_salary_structures": True,
                "multi_location": False,
                "api_access": False,
                "white_labeling": False,
                "excel_pdf_export": True,
                "support_level": "priority_email"
            },
            "is_active": True,
            "display_order": 2,
            "created_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "plan_id": str(uuid.uuid4()),
            "plan_name": "Enterprise",
            "slug": "enterprise",
            "description": "Complete solution for large organizations",
            "monthly_price": 7999,
            "annual_price": 79999,
            "currency": "INR",
            "features": {
                "employee_limit": -1,  # -1 means unlimited
                "admin_users_limit": -1,  # -1 means unlimited
                "data_retention_months": -1,  # -1 means unlimited
                "basic_payroll": True,
                "employee_portal": True,
                "leave_management": True,
                "attendance_tracking": True,
                "basic_reports": True,
                "loan_advances": True,
                "overtime_management": True,
                "bank_advice": True,
                "compliance_reports": True,
                "custom_salary_structures": True,
                "multi_location": True,
                "api_access": True,
                "white_labeling": True,
                "excel_pdf_export": True,
                "support_level": "phone_email"
            },
            "is_active": True,
            "display_order": 3,
            "created_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat()
        }
    ]
    
    # Insert plans
    result = await plans_collection.insert_many(plans)
    
    print(f"✅ Created {len(result.inserted_ids)} subscription plans:")
    for plan in plans:
        print(f"   - {plan['plan_name']}: ₹{plan['monthly_price']}/month or ₹{plan['annual_price']}/year")
    
    print()
    print("=" * 70)
    print("SUBSCRIPTION PLANS CREATED SUCCESSFULLY!")
    print("=" * 70)
    print()

# Run the script
if __name__ == "__main__":
    asyncio.run(create_subscription_plans())
