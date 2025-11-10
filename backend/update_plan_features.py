#!/usr/bin/env python3
"""
Update subscription plan features to match the pricing page exactly
"""

import asyncio
import sys
from motor.motor_asyncio import AsyncIOMotorClient
import os

MONGO_URL = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
DB_NAME = os.environ.get('DB_NAME', 'test_database')

# Exact features from pricing page
PLAN_FEATURES = {
    "free": {
        "plan_name": "Free Trial",
        "employee_limit": 5,
        "admin_users_limit": 1,
        "employee_database": True,
        "payroll_processing_manual": True,
        "payroll_processing_automated": False,
        "payslip_generation": True,
        "salary_structure_management": False,
        "custom_salary_components": False,
        "attendance_tracking_basic": True,
        "attendance_tracking_advanced": False,
        "leave_management_basic": True,
        "leave_management_advanced": False,
        "bank_advice_generation": False,
        "compliance_reports_basic": False,
        "compliance_reports_full": False,
        "employee_portal": True,  # Free Trial HAS this
        "loans_advances": False,
        "deductions_advanced": False,
        "event_management": False,
        "payroll_analytics": False,
        "multi_bank_accounts": False,
        "bulk_employee_import": False,
        "notifications": False,
        "dark_mode": False,
        "api_access": False,
        "white_labeling": False,
        "custom_integrations": False,
        "sso_security": False,
        "custom_reports": False,
        "audit_logs": False,
        "sla_guarantee": False,
        "support_level": "email"
    },
    "starter": {
        "plan_name": "Starter",
        "employee_limit": 10,
        "admin_users_limit": 2,
        "employee_database": True,
        "payroll_processing_manual": True,
        "payroll_processing_automated": True,  # Starter has automated
        "payslip_generation": True,
        "salary_structure_management": True,  # Starter has this
        "custom_salary_components": True,   #Starter has this
        "attendance_tracking_basic": True,
        "attendance_tracking_advanced": True,  # Advanced
        "leave_management_basic": True,
        "leave_management_advanced": True,  # Advanced
        "bank_advice_generation": False,
        "compliance_reports_basic": False,
        "compliance_reports_full": False,
        "employee_portal": True,
        "loans_advances": False,
        "deductions_advanced": False,
        "event_management": False,
        "payroll_analytics": False,
        "multi_bank_accounts": False,
        "bulk_employee_import": False,
        "notifications": True,  # Starter has notifications
        "dark_mode": True,  # Starter has dark mode
        "api_access": False,
        "white_labeling": False,
        "custom_integrations": False,
        "sso_security": False,
        "custom_reports": False,
        "audit_logs": False,
        "sla_guarantee": False,
        "support_level": "priority_email"
    },
    "professional": {
        "plan_name": "Professional",
        "employee_limit": 25,
        "admin_users_limit": 5,
        "employee_database": True,
        "payroll_processing_manual": True,
        "payroll_processing_automated": True,
        "payslip_generation": True,
        "salary_structure_management": True,
        "custom_salary_components": True,  # Professional has custom salary
        "attendance_tracking_basic": True,
        "attendance_tracking_advanced": True,
        "leave_management_basic": True,
        "leave_management_advanced": True,
        "bank_advice_generation": True,  # Professional has bank advice
        "compliance_reports_basic": True,  # Basic compliance
        "compliance_reports_full": False,
        "employee_portal": True,
        "loans_advances": True,  # Professional has loans
        "deductions_advanced": True,  # Professional has advanced deductions
        "event_management": True,  # Professional has events
        "payroll_analytics": True,  # Professional has analytics
        "multi_bank_accounts": True,  # Professional has multi bank
        "bulk_employee_import": True,  # Professional has bulk import
        "notifications": True,
        "dark_mode": True,
        "api_access": False,
        "white_labeling": False,
        "custom_integrations": False,
        "sso_security": False,
        "custom_reports": False,
        "audit_logs": False,
        "sla_guarantee": False,
        "support_level": "priority"
    },
    "enterprise": {
        "plan_name": "Enterprise",
        "employee_limit": -1,  # Unlimited
        "admin_users_limit": -1,  # Unlimited
        "employee_database": True,
        "payroll_processing_manual": True,
        "payroll_processing_automated": True,
        "payslip_generation": True,
        "salary_structure_management": True,
        "custom_salary_components": True,
        "attendance_tracking_basic": True,
        "attendance_tracking_advanced": True,
        "leave_management_basic": True,
        "leave_management_advanced": True,
        "bank_advice_generation": True,
        "compliance_reports_basic": True,
        "compliance_reports_full": True,  # Enterprise has FULL compliance
        "employee_portal": True,
        "loans_advances": True,
        "deductions_advanced": True,
        "event_management": True,
        "payroll_analytics": True,
        "multi_bank_accounts": True,
        "bulk_employee_import": True,
        "notifications": True,
        "dark_mode": True,
        "api_access": True,  # Enterprise has API access
        "white_labeling": True,  # Enterprise has white labeling
        "custom_integrations": True,  # Enterprise has custom integrations
        "sso_security": True,  # Enterprise has SSO
        "custom_reports": True,  # Enterprise has custom reports
        "audit_logs": True,  # Enterprise has audit logs
        "sla_guarantee": True,  # Enterprise has SLA
        "support_level": "phone"
    }
}

async def main():
    client = AsyncIOMotorClient(MONGO_URL)
    db = client[DB_NAME]
    
    print("=" * 70)
    print("🔄 UPDATING SUBSCRIPTION PLAN FEATURES")
    print("=" * 70)
    print()
    
    for slug, features in PLAN_FEATURES.items():
        plan = await db.subscription_plans.find_one({"slug": slug})
        
        if not plan:
            print(f"⚠️  Plan '{slug}' not found, skipping...")
            continue
        
        # Update the plan with new features
        result = await db.subscription_plans.update_one(
            {"slug": slug},
            {"$set": {"features": features}}
        )
        
        if result.modified_count > 0:
            print(f"✅ Updated: {features['plan_name']}")
            print(f"   Employee Limit: {features['employee_limit']}")
            print(f"   Key Features:")
            print(f"     - Employee Portal: {'✅' if features['employee_portal'] else '❌'}")
            print(f"     - Automated Payroll: {'✅' if features['payroll_processing_automated'] else '❌'}")
            print(f"     - Custom Salary: {'✅' if features['custom_salary_components'] else '❌'}")
            print(f"     - Bank Advice: {'✅' if features['bank_advice_generation'] else '❌'}")
            print(f"     - Loans: {'✅' if features['loans_advances'] else '❌'}")
            print(f"     - Event Management: {'✅' if features['event_management'] else '❌'}")
            print(f"     - Notifications: {'✅' if features['notifications'] else '❌'}")
            print(f"     - Dark Mode: {'✅' if features['dark_mode'] else '❌'}")
            print()
        else:
            print(f"ℹ️  {features['plan_name']} - No changes needed")
            print()
    
    print("=" * 70)
    print("✅ Subscription plan features updated successfully!")
    print("=" * 70)
    
    client.close()

if __name__ == "__main__":
    asyncio.run(main())
