"""
Script to update subscription plans to new per-user pricing model
and create the Free trial plan
"""
import os
import asyncio
from dotenv import load_dotenv
from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime, timezone

# Load environment variables
load_dotenv()

MONGO_URL = os.environ.get("MONGO_URL")
DB_NAME = os.environ.get("DB_NAME")


async def update_plans():
    """Update plans to new per-user pricing structure"""
    # Initialize MongoDB
    mongo_client = AsyncIOMotorClient(MONGO_URL)
    db = mongo_client[DB_NAME]
    plans_collection = db.subscription_plans
    
    print("🔄 Updating subscription plans to per-user pricing...")
    
    # Delete all existing plans
    result = await plans_collection.delete_many({})
    print(f"🗑️  Deleted {result.deleted_count} existing plans")
    
    # Define new plans
    new_plans = [
        {
            "plan_id": "free-trial",
            "plan_name": "Free Trial",
            "slug": "free",
            "description": "Try all basic features free for 30 days",
            "price_per_user_monthly": 0,
            "price_per_user_annual": 0,
            "currency": "INR",
            "is_trial": True,
            "features": {
                "employee_limit": 5,
                "admin_users_limit": 1,
                "trial_days": 30,
                
                # Core Features
                "employee_database": True,
                "payroll_processing_manual": True,
                "payroll_processing_automated": False,
                "payslip_generation": True,
                
                # Attendance & Leave
                "attendance_tracking_basic": True,
                "attendance_tracking_advanced": False,
                "leave_management_basic": True,
                "leave_management_advanced": False,
                
                # Payroll Features
                "salary_structure_management": False,
                "bank_advice_generation": False,
                "custom_salary_components": False,
                "bulk_employee_import": False,
                
                # Compliance
                "compliance_reports_basic": False,
                "compliance_reports_full": False,
                
                # Advanced Features
                "employee_portal": False,
                "loans_advances": False,
                "deductions_advanced": False,
                "event_management": False,
                "payroll_analytics": False,
                "multi_bank_accounts": False,
                "notifications": False,
                "dark_mode": False,
                
                # Enterprise Features
                "api_access": False,
                "white_labeling": False,
                "custom_integrations": False,
                "sso_security": False,
                "custom_reports": False,
                "audit_logs": False,
                "sla_guarantee": False,
                
                "support_level": "email"
            },
            "is_active": True,
            "display_order": 1,
            "created_at": datetime.now(timezone.utc),
            "updated_at": datetime.now(timezone.utc)
        },
        {
            "plan_id": "starter-plan",
            "plan_name": "Starter",
            "slug": "starter",
            "description": "Perfect for small teams getting started",
            "price_per_user_monthly": 99,
            "price_per_user_annual": 990,  # 10 months price
            "currency": "INR",
            "is_trial": False,
            "features": {
                "employee_limit": 10,
                "admin_users_limit": 2,
                "trial_days": 0,
                
                # Core Features
                "employee_database": True,
                "payroll_processing_manual": True,
                "payroll_processing_automated": True,
                "payslip_generation": True,
                
                # Attendance & Leave
                "attendance_tracking_basic": True,
                "attendance_tracking_advanced": True,
                "leave_management_basic": True,
                "leave_management_advanced": True,
                
                # Payroll Features
                "salary_structure_management": True,
                "bank_advice_generation": True,
                "custom_salary_components": False,
                "bulk_employee_import": False,
                
                # Compliance
                "compliance_reports_basic": True,
                "compliance_reports_full": False,
                
                # Advanced Features
                "employee_portal": True,
                "loans_advances": False,
                "deductions_advanced": False,
                "event_management": False,
                "payroll_analytics": False,
                "multi_bank_accounts": False,
                "notifications": True,
                "dark_mode": False,
                
                # Enterprise Features
                "api_access": False,
                "white_labeling": False,
                "custom_integrations": False,
                "sso_security": False,
                "custom_reports": False,
                "audit_logs": False,
                "sla_guarantee": False,
                
                "support_level": "priority_email"
            },
            "is_active": True,
            "display_order": 2,
            "created_at": datetime.now(timezone.utc),
            "updated_at": datetime.now(timezone.utc)
        },
        {
            "plan_id": "professional-plan",
            "plan_name": "Professional",
            "slug": "professional",
            "description": "For growing businesses with advanced needs",
            "price_per_user_monthly": 199,
            "price_per_user_annual": 1990,  # 10 months price
            "currency": "INR",
            "is_trial": False,
            "features": {
                "employee_limit": 25,
                "admin_users_limit": 5,
                "trial_days": 0,
                
                # Core Features
                "employee_database": True,
                "payroll_processing_manual": True,
                "payroll_processing_automated": True,
                "payslip_generation": True,
                
                # Attendance & Leave
                "attendance_tracking_basic": True,
                "attendance_tracking_advanced": True,
                "leave_management_basic": True,
                "leave_management_advanced": True,
                
                # Payroll Features
                "salary_structure_management": True,
                "bank_advice_generation": True,
                "custom_salary_components": True,
                "bulk_employee_import": True,
                
                # Compliance
                "compliance_reports_basic": True,
                "compliance_reports_full": True,
                
                # Advanced Features
                "employee_portal": True,
                "loans_advances": True,
                "deductions_advanced": True,
                "event_management": True,
                "payroll_analytics": True,
                "multi_bank_accounts": True,
                "notifications": True,
                "dark_mode": True,
                
                # Enterprise Features
                "api_access": False,
                "white_labeling": False,
                "custom_integrations": False,
                "sso_security": False,
                "custom_reports": False,
                "audit_logs": False,
                "sla_guarantee": False,
                
                "support_level": "priority_email_chat"
            },
            "is_active": True,
            "display_order": 3,
            "created_at": datetime.now(timezone.utc),
            "updated_at": datetime.now(timezone.utc)
        },
        {
            "plan_id": "enterprise-plan",
            "plan_name": "Enterprise",
            "slug": "enterprise",
            "description": "Complete solution for large organizations",
            "price_per_user_monthly": 299,
            "price_per_user_annual": 2990,  # 10 months price
            "currency": "INR",
            "is_trial": False,
            "features": {
                "employee_limit": -1,  # Unlimited
                "admin_users_limit": -1,  # Unlimited
                "trial_days": 0,
                
                # Core Features
                "employee_database": True,
                "payroll_processing_manual": True,
                "payroll_processing_automated": True,
                "payslip_generation": True,
                
                # Attendance & Leave
                "attendance_tracking_basic": True,
                "attendance_tracking_advanced": True,
                "leave_management_basic": True,
                "leave_management_advanced": True,
                
                # Payroll Features
                "salary_structure_management": True,
                "bank_advice_generation": True,
                "custom_salary_components": True,
                "bulk_employee_import": True,
                
                # Compliance
                "compliance_reports_basic": True,
                "compliance_reports_full": True,
                
                # Advanced Features
                "employee_portal": True,
                "loans_advances": True,
                "deductions_advanced": True,
                "event_management": True,
                "payroll_analytics": True,
                "multi_bank_accounts": True,
                "notifications": True,
                "dark_mode": True,
                
                # Enterprise Features
                "api_access": True,
                "white_labeling": True,
                "custom_integrations": True,
                "sso_security": True,
                "custom_reports": True,
                "audit_logs": True,
                "sla_guarantee": True,
                
                "support_level": "phone"
            },
            "is_active": True,
            "display_order": 4,
            "created_at": datetime.now(timezone.utc),
            "updated_at": datetime.now(timezone.utc)
        }
    ]
    
    # Insert new plans
    result = await plans_collection.insert_many(new_plans)
    print(f"✅ Created {len(result.inserted_ids)} new plans")
    
    # Display created plans
    for plan in new_plans:
        print(f"\n📦 {plan['plan_name']}")
        print(f"   Price: ₹{plan['price_per_user_monthly']}/user/month")
        if plan['price_per_user_annual'] > 0:
            print(f"   Annual: ₹{plan['price_per_user_annual']}/user/year (pay for 10 months)")
        print(f"   Employee Limit: {plan['features']['employee_limit'] if plan['features']['employee_limit'] > 0 else 'Unlimited'}")
        print(f"   Trial: {'Yes' if plan['is_trial'] else 'No'}")
    
    print("\n✨ Plan update completed!")
    mongo_client.close()


if __name__ == "__main__":
    asyncio.run(update_plans())
