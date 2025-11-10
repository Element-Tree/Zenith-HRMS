#!/usr/bin/env python3
"""
Salary Components and Tax Configuration API Testing Script
Tests the newly created backend APIs for salary components and tax configuration management.
"""

import requests
import json
from datetime import datetime
from typing import Dict, Any

class SalaryTaxAPITester:
    def __init__(self, base_url="https://elevatesubs.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.tests_run = 0
        self.tests_passed = 0
        self.admin_token = None
        self.test_results = []

    def log_test(self, name: str, success: bool, details: str = ""):
        """Log test result"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
        
        result = {
            "test_name": name,
            "success": success,
            "details": details,
            "timestamp": datetime.now().isoformat()
        }
        self.test_results.append(result)
        
        status = "✅ PASSED" if success else "❌ FAILED"
        print(f"{status} - {name}")
        if details:
            print(f"   Details: {details}")

    def run_test(self, name: str, method: str, endpoint: str, expected_status: int, data: Dict[Any, Any] = None, headers: Dict[str, str] = None) -> tuple:
        """Run a single API test"""
        url = f"{self.api_url}/{endpoint}" if endpoint else self.api_url
        default_headers = {'Content-Type': 'application/json'}
        if headers:
            default_headers.update(headers)

        print(f"\n🔍 Testing {name}...")
        print(f"   URL: {url}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=default_headers, timeout=10)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=default_headers, timeout=10)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=default_headers, timeout=10)
            elif method == 'DELETE':
                response = requests.delete(url, json=data, headers=default_headers, timeout=10)
            else:
                raise ValueError(f"Unsupported method: {method}")

            success = response.status_code == expected_status
            
            if success:
                details = f"Status: {response.status_code}"
                try:
                    response_data = response.json()
                    if isinstance(response_data, dict) and len(str(response_data)) < 300:
                        details += f", Response: {response_data}"
                except:
                    pass
            else:
                details = f"Expected {expected_status}, got {response.status_code}"
                try:
                    error_data = response.json()
                    details += f", Error: {error_data}"
                except:
                    details += f", Response: {response.text[:200]}"

            self.log_test(name, success, details)
            return success, response.json() if response.content else {}

        except requests.exceptions.Timeout:
            self.log_test(name, False, "Request timeout (10s)")
            return False, {}
        except requests.exceptions.ConnectionError:
            self.log_test(name, False, "Connection error - server may be down")
            return False, {}
        except Exception as e:
            self.log_test(name, False, f"Error: {str(e)}")
            return False, {}

    def authenticate_admin(self):
        """Authenticate as admin user"""
        # Try the credentials specified in the review request first
        credentials_to_try = [
            {"username": "admin@company.com", "password": "password"},
            {"username": "admin", "password": "password"},
            {"username": "admin", "password": "Admin$2022"}
        ]
        
        for creds in credentials_to_try:
            success, response = self.run_test(
                f"Admin Authentication ({creds['username']})", 
                "POST", 
                "auth/login", 
                200, 
                creds
            )
            
            if success and response and 'access_token' in response:
                self.admin_token = response['access_token']
                self.log_test("Admin Token Retrieved", True, f"Admin authentication successful")
                return True
        
        self.log_test("Admin Token Retrieved", False, "Failed to get admin token with any credentials")
        return False

    def get_auth_headers(self):
        """Get authorization headers"""
        return {"Authorization": f"Bearer {self.admin_token}"}

    def test_salary_components_crud(self):
        """Test Salary Components CRUD operations"""
        if not self.admin_token:
            self.log_test("Salary Components CRUD", False, "No admin token available")
            return False
        
        headers = self.get_auth_headers()
        
        # Test 1: Create Basic Salary component
        basic_salary_data = {
            "category": "earnings",
            "component_type": "Basic",
            "component_name": "Basic Salary",
            "name_in_payslip": "Basic",
            "calculation_type": "flat_amount",
            "amount_value": 30000,
            "is_active": True,
            "consider_for_epf": True,
            "consider_for_esi": True
        }
        
        success1, response1 = self.run_test(
            "Create Basic Salary Component",
            "POST",
            "salary-components",
            200,
            basic_salary_data,
            headers
        )
        
        if not success1 or not response1 or 'component_id' not in response1:
            return False
        
        component_id = response1['component_id']
        
        # Test 2: Get earnings components
        success2, response2 = self.run_test(
            "Get Earnings Components",
            "GET",
            "salary-components?category=earnings",
            200,
            None,
            headers
        )
        
        if not success2 or not isinstance(response2, list):
            return False
        
        # Verify our component is in the list
        found_component = any(comp.get('component_id') == component_id for comp in response2)
        if not found_component:
            self.log_test("Verify Component in List", False, "Created component not found in earnings list")
            return False
        else:
            self.log_test("Verify Component in List", True, "Component found in earnings list")
        
        # Test 3: Update component amount
        update_data = {
            "amount_value": 35000
        }
        
        success3, response3 = self.run_test(
            "Update Component Amount",
            "PUT",
            f"salary-components/{component_id}",
            200,
            update_data,
            headers
        )
        
        if success3 and response3 and response3.get('amount_value') == 35000:
            self.log_test("Update Verification", True, "Amount updated to 35000")
        else:
            self.log_test("Update Verification", False, f"Expected 35000, got {response3.get('amount_value') if response3 else 'None'}")
            return False
        
        # Test 4: Create components for other categories
        categories_to_test = [
            {
                "category": "deductions",
                "component_type": "PF",
                "component_name": "Provident Fund",
                "name_in_payslip": "PF Deduction",
                "calculation_type": "percentage_of_basic",
                "amount_value": 12,
                "is_active": True,
                "consider_for_epf": True
            },
            {
                "category": "benefits",
                "component_type": "Medical",
                "component_name": "Medical Insurance",
                "name_in_payslip": "Medical Insurance",
                "calculation_type": "flat_amount",
                "amount_value": 5000,
                "is_active": True
            },
            {
                "category": "reimbursements",
                "component_type": "Travel",
                "component_name": "Travel Reimbursement",
                "name_in_payslip": "Travel Reimbursement",
                "calculation_type": "flat_amount",
                "amount_value": 2000,
                "is_active": True
            }
        ]
        
        for i, category_data in enumerate(categories_to_test):
            success, response = self.run_test(
                f"Create {category_data['category'].title()} Component",
                "POST",
                "salary-components",
                200,
                category_data,
                headers
            )
            
            if not success:
                return False
        
        # Test 5: Get all components
        success5, response5 = self.run_test(
            "Get All Salary Components",
            "GET",
            "salary-components",
            200,
            None,
            headers
        )
        
        if success5 and isinstance(response5, list) and len(response5) >= 4:
            self.log_test("All Components Retrieved", True, f"Found {len(response5)} components")
        else:
            self.log_test("All Components Retrieved", False, f"Expected at least 4 components, got {len(response5) if response5 else 0}")
            return False
        
        return True

    def test_tax_configuration_crud(self):
        """Test Tax Configuration CRUD operations"""
        if not self.admin_token:
            self.log_test("Tax Configuration CRUD", False, "No admin token available")
            return False
        
        headers = self.get_auth_headers()
        
        # Test 1: Create EPF configuration
        epf_config_data = {
            "component_type": "epf",
            "is_enabled": True,
            "epf_number": "A/MUM/12345678/000",
            "epf_employee_contribution_rate": 12,
            "epf_employer_contribution_rate": 12
        }
        
        success1, response1 = self.run_test(
            "Create EPF Configuration",
            "POST",
            "tax-configuration",
            200,
            epf_config_data,
            headers
        )
        
        if not success1:
            return False
        
        # Test 2: Get EPF configuration
        success2, response2 = self.run_test(
            "Get EPF Configuration",
            "GET",
            "tax-configuration/epf",
            200,
            None,
            headers
        )
        
        if success2 and response2:
            checks = [
                (response2.get('component_type') == "epf", "component_type"),
                (response2.get('is_enabled') == True, "is_enabled"),
                (response2.get('epf_number') == "A/MUM/12345678/000", "epf_number"),
                (response2.get('epf_employee_contribution_rate') == 12, "employee_rate"),
                (response2.get('epf_employer_contribution_rate') == 12, "employer_rate")
            ]
            
            failed_checks = [field for check, field in checks if not check]
            if failed_checks:
                self.log_test("EPF Config Verification", False, f"Failed checks: {failed_checks}")
                return False
            else:
                self.log_test("EPF Config Verification", True, "EPF configuration correct")
        else:
            return False
        
        # Test 3: Update EPF configuration
        update_data = {
            "epf_employee_contribution_rate": 10
        }
        
        success3, response3 = self.run_test(
            "Update EPF Employee Rate",
            "PUT",
            "tax-configuration/epf",
            200,
            update_data,
            headers
        )
        
        if success3 and response3 and response3.get('epf_employee_contribution_rate') == 10:
            self.log_test("EPF Update Verification", True, "Employee contribution rate updated to 10%")
        else:
            self.log_test("EPF Update Verification", False, "Failed to update employee contribution rate")
            return False
        
        # Test 4: Create ESI configuration
        esi_config_data = {
            "component_type": "esi",
            "is_enabled": True,
            "esi_number": "ESI/12345678/000",
            "esi_employee_contribution_rate": 0.75,
            "esi_employer_contribution_rate": 3.25,
            "esi_wage_ceiling": 21000
        }
        
        success4, response4 = self.run_test(
            "Create ESI Configuration",
            "POST",
            "tax-configuration",
            200,
            esi_config_data,
            headers
        )
        
        if not success4:
            return False
        
        # Test 5: Get all tax configurations
        success5, response5 = self.run_test(
            "Get All Tax Configurations",
            "GET",
            "tax-configuration",
            200,
            None,
            headers
        )
        
        if success5 and isinstance(response5, list) and len(response5) >= 2:
            self.log_test("All Tax Configs Retrieved", True, f"Found {len(response5)} configurations")
        else:
            self.log_test("All Tax Configs Retrieved", False, f"Expected at least 2 configurations, got {len(response5) if response5 else 0}")
            return False
        
        # Test 6: Disable EPF configuration (DELETE)
        success6, response6 = self.run_test(
            "Disable EPF Configuration",
            "DELETE",
            "tax-configuration/epf",
            200,
            None,
            headers
        )
        
        if not success6:
            return False
        
        # Test 7: Verify EPF is disabled
        success7, response7 = self.run_test(
            "Verify EPF Disabled",
            "GET",
            "tax-configuration/epf",
            200,
            None,
            headers
        )
        
        if success7 and response7 and response7.get('is_enabled') == False:
            self.log_test("EPF Disable Verification", True, "EPF configuration disabled successfully")
        else:
            self.log_test("EPF Disable Verification", False, "EPF configuration not disabled")
            return False
        
        return True

    def test_data_persistence(self):
        """Test that data persists in MongoDB"""
        if not self.admin_token:
            self.log_test("Data Persistence Test", False, "No admin token available")
            return False
        
        headers = self.get_auth_headers()
        
        # Create a test component
        test_component = {
            "category": "earnings",
            "component_type": "Test",
            "component_name": "Test Component",
            "name_in_payslip": "Test Component",
            "calculation_type": "flat_amount",
            "amount_value": 1000,
            "is_active": True
        }
        
        success1, response1 = self.run_test(
            "Create Test Component for Persistence",
            "POST",
            "salary-components",
            200,
            test_component,
            headers
        )
        
        if not success1 or not response1 or 'component_id' not in response1:
            return False
        
        component_id = response1['component_id']
        
        # Retrieve the component to verify persistence
        success2, response2 = self.run_test(
            "Verify Component Persistence",
            "GET",
            f"salary-components/{component_id}",
            200,
            None,
            headers
        )
        
        if success2 and response2:
            checks = [
                (response2.get('component_name') == "Test Component", "component_name"),
                (response2.get('amount_value') == 1000, "amount_value"),
                (response2.get('is_active') == True, "is_active")
            ]
            
            failed_checks = [field for check, field in checks if not check]
            if failed_checks:
                self.log_test("Data Persistence Verification", False, f"Failed checks: {failed_checks}")
                return False
            else:
                self.log_test("Data Persistence Verification", True, "Component data persisted correctly")
                return True
        
        return False

    def test_validation_errors(self):
        """Test validation for required fields"""
        if not self.admin_token:
            self.log_test("Validation Test", False, "No admin token available")
            return False
        
        headers = self.get_auth_headers()
        
        # Test 1: Missing required fields
        invalid_data = {
            "category": "earnings"
            # Missing name_in_payslip and other required fields
        }
        
        success1, _ = self.run_test(
            "Invalid Component - Missing Fields",
            "POST",
            "salary-components",
            422,  # Validation error
            invalid_data,
            headers
        )
        
        # Test 2: Invalid category
        invalid_category_data = {
            "category": "invalid_category",
            "component_name": "Test Component",
            "name_in_payslip": "Test"
        }
        
        success2, _ = self.run_test(
            "Invalid Component - Invalid Category",
            "POST",
            "salary-components",
            422,
            invalid_category_data,
            headers
        )
        
        return success1 and success2

    def run_all_tests(self):
        """Run all salary components and tax configuration tests"""
        print("🚀 Starting Salary Components & Tax Configuration API Testing...")
        print(f"📍 Base URL: {self.base_url}")
        print(f"📍 API URL: {self.api_url}")
        print("=" * 80)
        
        # Test authentication
        admin_auth_success = self.authenticate_admin()
        
        if not admin_auth_success:
            print("\n❌ Admin authentication failed - cannot proceed with tests")
            return False
        
        print("\n🔧 SALARY COMPONENTS API TESTING")
        print("=" * 50)
        
        # Test salary components
        salary_components_success = self.test_salary_components_crud()
        
        print("\n⚖️ TAX CONFIGURATION API TESTING")
        print("=" * 50)
        
        # Test tax configuration
        tax_config_success = self.test_tax_configuration_crud()
        
        print("\n🔍 DATA VALIDATION & PERSISTENCE TESTING")
        print("=" * 50)
        
        # Test data persistence and validation
        persistence_success = self.test_data_persistence()
        validation_success = self.test_validation_errors()
        
        # Print summary
        print("\n" + "=" * 80)
        print("📊 TEST SUMMARY")
        print("=" * 80)
        print(f"✅ Tests Passed: {self.tests_passed}")
        print(f"❌ Tests Failed: {self.tests_run - self.tests_passed}")
        print(f"📈 Total Tests: {self.tests_run}")
        print(f"🎯 Success Rate: {(self.tests_passed/self.tests_run)*100:.1f}%")
        
        # Detailed results
        print("\n📋 DETAILED RESULTS:")
        print("-" * 40)
        print(f"🔧 Salary Components CRUD: {'✅ PASSED' if salary_components_success else '❌ FAILED'}")
        print(f"⚖️ Tax Configuration CRUD: {'✅ PASSED' if tax_config_success else '❌ FAILED'}")
        print(f"💾 Data Persistence: {'✅ PASSED' if persistence_success else '❌ FAILED'}")
        print(f"🔍 Validation: {'✅ PASSED' if validation_success else '❌ FAILED'}")
        
        if self.tests_passed == self.tests_run:
            print("\n🎉 ALL TESTS PASSED! 🎉")
            print("✅ Salary Components and Tax Configuration APIs are working correctly!")
        else:
            print(f"\n⚠️  {self.tests_run - self.tests_passed} test(s) failed. Check details above.")
        
        # Save results to file
        with open('/app/salary_tax_test_results.json', 'w') as f:
            json.dump(self.test_results, f, indent=2)
        
        print(f"\n📄 Detailed results saved to: /app/salary_tax_test_results.json")
        
        return self.tests_passed == self.tests_run

if __name__ == "__main__":
    tester = SalaryTaxAPITester()
    tester.run_all_tests()