#!/usr/bin/env python3
"""
Migration Script: Convert Hardcoded Salary Structure to Component-Based System

This script:
1. Creates default salary components for each company (if not exist)
2. Migrates existing employee salaries to use the new component-based system
3. Maintains backward compatibility during transition
"""

import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os
from datetime import datetime, timezone
import uuid

# MongoDB connection
MONGO_URL = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
client = AsyncIOMotorClient(MONGO_URL)
# Use the correct database name from env or default
DB_NAME = os.environ.get('MONGO_DB_NAME', 'test_database')
db = client[DB_NAME]

# Mapping of legacy fields to component definitions
LEGACY_EARNINGS_MAPPING = [
    {"field": "basic_salary", "component_type": "Basic", "name": "Basic Salary", "name_in_payslip": "Basic"},
    {"field": "house_rent_allowance", "component_type": "House Rent Allowance", "name": "HRA", "name_in_payslip": "HRA"},
    {"field": "hra", "component_type": "House Rent Allowance", "name": "HRA", "name_in_payslip": "HRA"},  # Legacy
    {"field": "medical_allowance", "component_type": "Medical Allowance", "name": "Medical Allowance", "name_in_payslip": "Medical"},
    {"field": "leave_travel_allowance", "component_type": "Leave Travel Allowance", "name": "LTA", "name_in_payslip": "LTA"},
    {"field": "travel_allowance", "component_type": "Leave Travel Allowance", "name": "LTA", "name_in_payslip": "LTA"},  # Legacy
    {"field": "conveyance_allowance", "component_type": "Conveyance Allowance", "name": "Conveyance", "name_in_payslip": "Conveyance"},
    {"field": "performance_incentive", "component_type": "Incentive", "name": "Performance Incentive", "name_in_payslip": "Incentive"},
    {"field": "internet_allowance", "component_type": "Incentive", "name": "Internet Allowance", "name_in_payslip": "Internet"},  # Legacy
    {"field": "other_benefits", "component_type": "Other Benefits", "name": "Other Benefits", "name_in_payslip": "Other Benefits"},
    {"field": "special_allowance", "component_type": "Other Benefits", "name": "Special Allowance", "name_in_payslip": "Special"},  # Legacy
    {"field": "food_allowance", "component_type": "Food Allowance", "name": "Food Allowance", "name_in_payslip": "Food"},  # Legacy
]

LEGACY_DEDUCTIONS_MAPPING = [
    {"field": "pf_employee", "component_type": "Provident Fund", "name": "Employee PF", "name_in_payslip": "PF (Employee)"},
    {"field": "pf_employer", "component_type": "Provident Fund", "name": "Employer PF", "name_in_payslip": "PF (Employer)"},
    {"field": "esi_employee", "component_type": "ESI", "name": "Employee ESI", "name_in_payslip": "ESI (Employee)"},
    {"field": "esi_employer", "component_type": "ESI", "name": "Employer ESI", "name_in_payslip": "ESI (Employer)"},
    {"field": "professional_tax", "component_type": "Professional Tax", "name": "Professional Tax", "name_in_payslip": "PT"},
    {"field": "tds", "component_type": "TDS", "name": "TDS", "name_in_payslip": "TDS"},
    {"field": "loan_deductions", "component_type": "Loan Deduction", "name": "Loan Deduction", "name_in_payslip": "Loan"},
    {"field": "others", "component_type": "Other Deductions", "name": "Other Deductions", "name_in_payslip": "Others"},
]


async def create_default_components_for_company(company_id: str, company_name: str):
    """Create default salary components for a company based on legacy mappings"""
    print(f"\n📝 Creating default components for company: {company_name} ({company_id})")
    
    created_components = {"earnings": {}, "deductions": {}}
    
    # Create earnings components
    for mapping in LEGACY_EARNINGS_MAPPING:
        # Check if component already exists
        existing = await db.salary_components.find_one({
            "company_id": company_id,
            "component_type": mapping["component_type"],
            "category": "earnings"
        })
        
        if not existing:
            component_id = str(uuid.uuid4())
            component = {
                "component_id": component_id,
                "company_id": company_id,
                "category": "earnings",
                "component_type": mapping["component_type"],
                "component_name": mapping["name"],
                "name_in_payslip": mapping["name_in_payslip"],
                "is_variable": False,
                "calculation_type": "flat_amount",
                "amount_value": 0,
                "is_active": True,
                "part_of_salary_structure": True,
                "is_taxable": True if mapping["component_type"] != "House Rent Allowance" else False,
                "calculate_on_pro_rata": True,
                "consider_for_epf": True if mapping["component_type"] in ["Basic", "House Rent Allowance", "Dearness Allowance"] else False,
                "consider_for_esi": True,
                "show_in_payslip": True,
                "created_at": datetime.now(timezone.utc).isoformat(),
                "updated_at": datetime.now(timezone.utc).isoformat(),
                "created_by": "migration_script"
            }
            
            await db.salary_components.insert_one(component)
            created_components["earnings"][mapping["field"]] = component_id
            print(f"  ✅ Created earnings component: {mapping['name']}")
        else:
            created_components["earnings"][mapping["field"]] = existing["component_id"]
            print(f"  ℹ️  Earnings component already exists: {mapping['name']}")
    
    # Create deductions components
    for mapping in LEGACY_DEDUCTIONS_MAPPING:
        # Check if component already exists
        existing = await db.salary_components.find_one({
            "company_id": company_id,
            "component_type": mapping["component_type"],
            "category": "deductions"
        })
        
        if not existing:
            component_id = str(uuid.uuid4())
            component = {
                "component_id": component_id,
                "company_id": company_id,
                "category": "deductions",
                "component_type": mapping["component_type"],
                "component_name": mapping["name"],
                "name_in_payslip": mapping["name_in_payslip"],
                "is_active": True,
                "deduction_frequency": "recurring",
                "show_in_payslip": True,
                "created_at": datetime.now(timezone.utc).isoformat(),
                "updated_at": datetime.now(timezone.utc).isoformat(),
                "created_by": "migration_script"
            }
            
            await db.salary_components.insert_one(component)
            created_components["deductions"][mapping["field"]] = component_id
            print(f"  ✅ Created deductions component: {mapping['name']}")
        else:
            created_components["deductions"][mapping["field"]] = existing["component_id"]
            print(f"  ℹ️  Deductions component already exists: {mapping['name']}")
    
    return created_components


async def migrate_employee_salary(employee, component_mapping):
    """Migrate a single employee's salary to component-based system"""
    employee_id = employee.get("employee_id")
    salary_structure = employee.get("salary_structure", {})
    
    if not salary_structure:
        print(f"  ⚠️  {employee_id}: No salary structure")
        return
    
    # Check if already migrated
    if salary_structure.get("use_component_based_salary"):
        print(f"  ℹ️  {employee_id}: Already migrated")
        return
    
    # Build component-based salary
    salary_components = []
    
    # Migrate earnings
    for mapping in LEGACY_EARNINGS_MAPPING:
        field_name = mapping["field"]
        amount = salary_structure.get(field_name, 0)
        
        if amount > 0 and field_name in component_mapping["earnings"]:
            component_id = component_mapping["earnings"][field_name]
            salary_components.append({
                "component_id": component_id,
                "component_name": mapping["name"],
                "component_type": "earnings",
                "category": mapping["component_type"],
                "name_in_payslip": mapping["name_in_payslip"],
                "amount": amount,
                "is_active": True
            })
    
    # Migrate deductions
    for mapping in LEGACY_DEDUCTIONS_MAPPING:
        field_name = mapping["field"]
        amount = salary_structure.get(field_name, 0)
        
        if amount > 0 and field_name in component_mapping["deductions"]:
            component_id = component_mapping["deductions"][field_name]
            salary_components.append({
                "component_id": component_id,
                "component_name": mapping["name"],
                "component_type": "deductions",
                "category": mapping["component_type"],
                "name_in_payslip": mapping["name_in_payslip"],
                "amount": amount,
                "is_active": True
            })
    
    # Update employee with component-based salary
    if salary_components:
        update_data = {
            "salary_structure.salary_components": salary_components,
            "salary_structure.use_component_based_salary": True,
            "updated_at": datetime.now(timezone.utc).isoformat()
        }
        
        await db.employees.update_one(
            {"employee_id": employee_id},
            {"$set": update_data}
        )
        
        print(f"  ✅ {employee_id}: Migrated {len(salary_components)} components")
    else:
        print(f"  ⚠️  {employee_id}: No salary components to migrate")


async def migrate_all_companies():
    """Main migration function"""
    print("=" * 70)
    print("🚀 SALARY STRUCTURE MIGRATION - Hardcoded to Component-Based")
    print("=" * 70)
    
    # Get all companies
    companies = await db.companies.find({}, {"_id": 0, "company_id": 1, "company_name": 1}).to_list(length=None)
    
    if not companies:
        print("\n⚠️  No companies found in database")
        return
    
    print(f"\n📊 Found {len(companies)} companies to migrate")
    
    total_employees_migrated = 0
    
    for company in companies:
        company_id = company.get("company_id")
        company_name = company.get("company_name", "Unknown")
        
        print(f"\n{'='*70}")
        print(f"🏢 Processing Company: {company_name}")
        print(f"{'='*70}")
        
        # Step 1: Create default components
        component_mapping = await create_default_components_for_company(company_id, company_name)
        
        # Step 2: Migrate employees
        employees = await db.employees.find({"company_id": company_id}).to_list(length=None)
        
        print(f"\n👥 Migrating {len(employees)} employees...")
        
        for employee in employees:
            await migrate_employee_salary(employee, component_mapping)
            total_employees_migrated += 1
        
        print(f"\n✅ Completed migration for {company_name}")
    
    print(f"\n{'='*70}")
    print(f"🎉 MIGRATION COMPLETE!")
    print(f"{'='*70}")
    print(f"Total employees migrated: {total_employees_migrated}")
    print(f"Total companies processed: {len(companies)}")


async def verify_migration():
    """Verify the migration was successful"""
    print("\n" + "="*70)
    print("🔍 VERIFICATION")
    print("="*70)
    
    # Check component-based employees
    component_based_count = await db.employees.count_documents({
        "salary_structure.use_component_based_salary": True
    })
    
    total_employees = await db.employees.count_documents({})
    
    print(f"Total employees: {total_employees}")
    print(f"Component-based employees: {component_based_count}")
    print(f"Legacy employees: {total_employees - component_based_count}")
    
    if component_based_count > 0:
        print("\n✅ Migration verification successful!")
        
        # Show sample migrated employee
        sample = await db.employees.find_one({
            "salary_structure.use_component_based_salary": True
        })
        
        if sample:
            print(f"\n📋 Sample Migrated Employee: {sample.get('employee_id')}")
            components = sample.get("salary_structure", {}).get("salary_components", [])
            print(f"   Components: {len(components)}")
            for comp in components[:5]:  # Show first 5
                print(f"   - {comp.get('name_in_payslip')}: ₹{comp.get('amount')}")
    else:
        print("\n⚠️  No employees migrated yet")


if __name__ == "__main__":
    async def main():
        try:
            await migrate_all_companies()
            await verify_migration()
        finally:
            client.close()
    
    asyncio.run(main())
