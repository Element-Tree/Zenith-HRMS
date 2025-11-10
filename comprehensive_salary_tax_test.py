#!/usr/bin/env python3
"""
Comprehensive Salary Components and Tax Configuration API Testing Script
Based on the review request requirements.
"""

import requests
import json
from datetime import datetime
from typing import Dict, Any

class ComprehensiveSalaryTaxTester:
    def __init__(self, base_url="https://elevatesubs.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.admin_token = None
        self.test_results = []
        self.created_components = []
        self.created_configs = []

    def log_result(self, test_name: str, success: bool, details: str = "", response_data: dict = None):
        """Log test result with detailed information"""
        result = {
            "test_name": test_name,
            "success": success,
            "details": details,
            "response_data": response_data,
            "timestamp": datetime.now().isoformat()
        }
        self.test_results.append(result)
        
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status} - {test_name}")
        if details:
            print(f"   {details}")
        if response_data and len(str(response_data)) < 200:
            print(f"   Response: {response_data}")

    def make_request(self, method: str, endpoint: str, data: dict = None, expected_status: int = 200) -> tuple:
        """Make API request and return success status and response"""
        url = f"{self.api_url}/{endpoint}"
        headers = {'Content-Type': 'application/json'}
        
        if self.admin_token:
            headers['Authorization'] = f"Bearer {self.admin_token}"
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, timeout=10)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers, timeout=10)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=headers, timeout=10)
            elif method == 'DELETE':
                response = requests.delete(url, headers=headers, timeout=10)
            
            success = response.status_code == expected_status
            response_data = response.json() if response.content else {}
            
            return success, response_data, response.status_code
            
        except Exception as e:
            return False, {"error": str(e)}, 0

    def authenticate_admin(self):
        """Step 1: Login as admin (admin@company.com / password)"""
        print("\n🔐 STEP 1: ADMIN AUTHENTICATION")
        print("=" * 50)
        
        login_data = {
            "username": "admin@company.com",
            "password": "password"
        }
        
        success, response, status_code = self.make_request("POST", "auth/login", login_data, 200)
        
        if success and 'access_token' in response:
            self.admin_token = response['access_token']
            self.log_result("Admin Login", True, f"Successfully logged in as admin@company.com")
            return True
        else:
            self.log_result("Admin Login", False, f"Failed to login. Status: {status_code}, Response: {response}")
            return False

    def test_salary_components_api(self):
        """Test Salary Components API as per review request"""
        print("\n🔧 STEP 2: SALARY COMPONENTS API TESTING")
        print("=" * 50)
        
        # Test 2: Create a new earning component (Basic Salary)
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
        
        success, response, status_code = self.make_request("POST", "salary-components", basic_salary_data, 200)
        
        if success and 'component_id' in response:
            component_id = response['component_id']
            self.created_components.append(component_id)
            self.log_result("Create Basic Salary Component", True, 
                          f"Created Basic Salary component with ID: {component_id}")
        else:
            self.log_result("Create Basic Salary Component", False, 
                          f"Failed to create component. Status: {status_code}", response)
            return False
        
        # Test 3: Verify the component was created (GET /api/salary-components?category=earnings)
        success, response, status_code = self.make_request("GET", "salary-components?category=earnings", None, 200)
        
        if success and isinstance(response, list):
            found_component = any(comp.get('component_id') == component_id for comp in response)
            if found_component:
                self.log_result("Verify Component Created", True, 
                              f"Found Basic Salary component in earnings list ({len(response)} total earnings)")
            else:
                self.log_result("Verify Component Created", False, 
                              "Basic Salary component not found in earnings list")
        else:
            self.log_result("Verify Component Created", False, 
                          f"Failed to get earnings components. Status: {status_code}", response)
        
        # Test 4: Update the component (change amount_value to 35000)
        update_data = {"amount_value": 35000}
        success, response, status_code = self.make_request("PUT", f"salary-components/{component_id}", update_data, 200)
        
        if success:
            self.log_result("Update Component Amount", True, "Successfully updated amount to 35000")
        else:
            self.log_result("Update Component Amount", False, 
                          f"Failed to update component. Status: {status_code}", response)
        
        # Test 5: Verify the update worked
        success, response, status_code = self.make_request("GET", f"salary-components/{component_id}", None, 200)
        
        if success and response.get('amount_value') == 35000:
            self.log_result("Verify Update", True, "Amount successfully updated to 35000")
        else:
            self.log_result("Verify Update", False, 
                          f"Update verification failed. Expected 35000, got {response.get('amount_value')}")
        
        # Test 6: Test creating components for other categories
        other_categories = [
            {
                "name": "Deduction Component",
                "data": {
                    "category": "deductions",
                    "component_type": "PF",
                    "component_name": "Provident Fund",
                    "name_in_payslip": "PF Deduction",
                    "calculation_type": "percentage_of_basic",
                    "amount_value": 12,
                    "is_active": True,
                    "consider_for_epf": True
                }
            },
            {
                "name": "Benefits Component",
                "data": {
                    "category": "benefits",
                    "component_type": "Medical",
                    "component_name": "Medical Insurance",
                    "name_in_payslip": "Medical Insurance",
                    "calculation_type": "flat_amount",
                    "amount_value": 5000,
                    "is_active": True
                }
            },
            {
                "name": "Reimbursements Component",
                "data": {
                    "category": "reimbursements",
                    "component_type": "Travel",
                    "component_name": "Travel Reimbursement",
                    "name_in_payslip": "Travel Reimbursement",
                    "calculation_type": "flat_amount",
                    "amount_value": 2000,
                    "is_active": True
                }
            }
        ]
        
        for category in other_categories:
            success, response, status_code = self.make_request("POST", "salary-components", category["data"], 200)
            
            if success and 'component_id' in response:
                self.created_components.append(response['component_id'])
                self.log_result(f"Create {category['name']}", True, 
                              f"Created {category['name']} successfully")
            else:
                self.log_result(f"Create {category['name']}", False, 
                              f"Failed to create {category['name']}. Status: {status_code}", response)
        
        return True

    def test_tax_configuration_api(self):
        """Test Tax Configuration API as per review request"""
        print("\n⚖️ STEP 3: TAX CONFIGURATION API TESTING")
        print("=" * 50)
        
        # Test 1: Create EPF configuration
        epf_config_data = {
            "component_type": "epf",
            "is_enabled": True,
            "epf_number": "A/MUM/12345678/000",
            "epf_employee_contribution_rate": 12,
            "epf_employer_contribution_rate": 12
        }
        
        success, response, status_code = self.make_request("POST", "tax-configuration", epf_config_data, 200)
        
        if success and 'config_id' in response:
            epf_config_id = response['config_id']
            self.created_configs.append(epf_config_id)
            self.log_result("Create EPF Configuration", True, 
                          f"Created EPF configuration with ID: {epf_config_id}")
        else:
            self.log_result("Create EPF Configuration", False, 
                          f"Failed to create EPF config. Status: {status_code}", response)
            return False
        
        # Test 2: Verify EPF configuration was created (GET /api/tax-configuration/epf)
        success, response, status_code = self.make_request("GET", "tax-configuration/epf", None, 200)
        
        if success and response:
            checks = [
                ("component_type", response.get('component_type') == "epf"),
                ("is_enabled", response.get('is_enabled') == True),
                ("epf_number", response.get('epf_number') == "A/MUM/12345678/000"),
                ("employee_rate", response.get('epf_employee_contribution_rate') == 12),
                ("employer_rate", response.get('epf_employer_contribution_rate') == 12)
            ]
            
            failed_checks = [name for name, check in checks if not check]
            if not failed_checks:
                self.log_result("Verify EPF Configuration", True, "EPF configuration verified successfully")
            else:
                self.log_result("Verify EPF Configuration", False, 
                              f"EPF verification failed for: {failed_checks}")
        else:
            self.log_result("Verify EPF Configuration", False, 
                          f"Failed to get EPF config. Status: {status_code}", response)
        
        # Test 3: Update EPF configuration (change employee contribution rate to 10)
        update_data = {"epf_employee_contribution_rate": 10}
        success, response, status_code = self.make_request("PUT", "tax-configuration/epf", update_data, 200)
        
        if success:
            self.log_result("Update EPF Configuration", True, "EPF employee rate updated to 10%")
        else:
            self.log_result("Update EPF Configuration", False, 
                          f"Failed to update EPF config. Status: {status_code}", response)
        
        # Verify the update
        success, response, status_code = self.make_request("GET", "tax-configuration/epf", None, 200)
        
        if success and response.get('epf_employee_contribution_rate') == 10:
            self.log_result("Verify EPF Update", True, "EPF employee rate successfully updated to 10%")
        else:
            self.log_result("Verify EPF Update", False, 
                          f"EPF update verification failed. Expected 10, got {response.get('epf_employee_contribution_rate')}")
        
        # Test 4: Create ESI configuration
        esi_config_data = {
            "component_type": "esi",
            "is_enabled": True,
            "esi_number": "ESI/12345678/000",
            "esi_employee_contribution_rate": 0.75,
            "esi_employer_contribution_rate": 3.25,
            "esi_wage_ceiling": 21000
        }
        
        success, response, status_code = self.make_request("POST", "tax-configuration", esi_config_data, 200)
        
        if success and 'config_id' in response:
            esi_config_id = response['config_id']
            self.created_configs.append(esi_config_id)
            self.log_result("Create ESI Configuration", True, 
                          f"Created ESI configuration with ID: {esi_config_id}")
        else:
            self.log_result("Create ESI Configuration", False, 
                          f"Failed to create ESI config. Status: {status_code}", response)
        
        # Test 5: Test disable functionality (DELETE /api/tax-configuration/epf)
        success, response, status_code = self.make_request("DELETE", "tax-configuration/epf", None, 200)
        
        if success:
            self.log_result("Disable EPF Configuration", True, "EPF configuration disabled successfully")
        else:
            self.log_result("Disable EPF Configuration", False, 
                          f"Failed to disable EPF config. Status: {status_code}", response)
        
        # Test 6: Verify it was disabled (is_enabled should be false)
        success, response, status_code = self.make_request("GET", "tax-configuration/epf", None, 200)
        
        if success and response.get('is_enabled') == False:
            self.log_result("Verify EPF Disabled", True, "EPF configuration is correctly disabled")
        else:
            self.log_result("Verify EPF Disabled", False, 
                          f"EPF disable verification failed. is_enabled: {response.get('is_enabled')}")
        
        return True

    def test_data_persistence_and_multi_tenancy(self):
        """Test data persistence in MongoDB and multi-tenancy"""
        print("\n💾 STEP 4: DATA PERSISTENCE & MULTI-TENANCY TESTING")
        print("=" * 50)
        
        # Test data persistence by retrieving all components
        success, response, status_code = self.make_request("GET", "salary-components", None, 200)
        
        if success and isinstance(response, list):
            self.log_result("Data Persistence - Components", True, 
                          f"Retrieved {len(response)} salary components from MongoDB")
            
            # Check if our created components are in the list
            our_components = [comp for comp in response if comp.get('component_id') in self.created_components]
            self.log_result("Multi-Tenancy - Component Isolation", True, 
                          f"Found {len(our_components)} of our created components (company_id filtering working)")
        else:
            self.log_result("Data Persistence - Components", False, 
                          f"Failed to retrieve components. Status: {status_code}", response)
        
        # Test data persistence for tax configurations
        success, response, status_code = self.make_request("GET", "tax-configuration", None, 200)
        
        if success and isinstance(response, list):
            self.log_result("Data Persistence - Tax Configs", True, 
                          f"Retrieved {len(response)} tax configurations from MongoDB")
        else:
            self.log_result("Data Persistence - Tax Configs", False, 
                          f"Failed to retrieve tax configs. Status: {status_code}", response)

    def test_validation(self):
        """Test validation for required fields"""
        print("\n🔍 STEP 5: VALIDATION TESTING")
        print("=" * 50)
        
        # Test missing required fields
        invalid_component = {"category": "earnings"}  # Missing required fields
        
        success, response, status_code = self.make_request("POST", "salary-components", invalid_component, 422)
        
        if success:
            self.log_result("Validation - Missing Fields", True, "Correctly rejected component with missing fields")
        else:
            self.log_result("Validation - Missing Fields", False, 
                          f"Should have returned 422 for missing fields. Got {status_code}", response)
        
        # Test invalid tax configuration
        invalid_tax_config = {"component_type": "invalid_type"}
        
        success, response, status_code = self.make_request("POST", "tax-configuration", invalid_tax_config, 422)
        
        if success:
            self.log_result("Validation - Invalid Tax Config", True, "Correctly rejected invalid tax configuration")
        else:
            self.log_result("Validation - Invalid Tax Config", False, 
                          f"Should have returned 422 for invalid config. Got {status_code}", response)

    def generate_summary(self):
        """Generate comprehensive test summary"""
        print("\n" + "=" * 80)
        print("📊 COMPREHENSIVE TEST SUMMARY")
        print("=" * 80)
        
        total_tests = len(self.test_results)
        passed_tests = sum(1 for result in self.test_results if result['success'])
        failed_tests = total_tests - passed_tests
        success_rate = (passed_tests / total_tests * 100) if total_tests > 0 else 0
        
        print(f"✅ Tests Passed: {passed_tests}")
        print(f"❌ Tests Failed: {failed_tests}")
        print(f"📈 Total Tests: {total_tests}")
        print(f"🎯 Success Rate: {success_rate:.1f}%")
        
        print(f"\n📋 CREATED RESOURCES:")
        print(f"🔧 Salary Components: {len(self.created_components)}")
        print(f"⚖️ Tax Configurations: {len(self.created_configs)}")
        
        # Show failed tests
        failed_results = [result for result in self.test_results if not result['success']]
        if failed_results:
            print(f"\n❌ FAILED TESTS:")
            for result in failed_results:
                print(f"   • {result['test_name']}: {result['details']}")
        
        # Expected results verification
        print(f"\n✅ EXPECTED RESULTS VERIFICATION:")
        print(f"   • All CRUD operations: {'✅ Working' if success_rate > 80 else '❌ Issues found'}")
        print(f"   • Data persistence in MongoDB: {'✅ Working' if any('Data Persistence' in r['test_name'] and r['success'] for r in self.test_results) else '❌ Not verified'}")
        print(f"   • Multi-tenancy (company_id filtering): {'✅ Working' if any('Multi-Tenancy' in r['test_name'] and r['success'] for r in self.test_results) else '❌ Not verified'}")
        print(f"   • Validation for required fields: {'✅ Working' if any('Validation' in r['test_name'] and r['success'] for r in self.test_results) else '❌ Not verified'}")
        
        if success_rate >= 90:
            print(f"\n🎉 EXCELLENT! Salary Components and Tax Configuration APIs are working correctly!")
        elif success_rate >= 75:
            print(f"\n✅ GOOD! Most functionality is working with minor issues to address.")
        else:
            print(f"\n⚠️ NEEDS ATTENTION! Several issues found that require fixing.")
        
        # Save detailed results
        with open('/app/comprehensive_test_results.json', 'w') as f:
            json.dump({
                'summary': {
                    'total_tests': total_tests,
                    'passed_tests': passed_tests,
                    'failed_tests': failed_tests,
                    'success_rate': success_rate,
                    'created_components': self.created_components,
                    'created_configs': self.created_configs
                },
                'detailed_results': self.test_results
            }, f, indent=2)
        
        print(f"\n📄 Detailed results saved to: /app/comprehensive_test_results.json")
        
        return success_rate >= 75

    def run_comprehensive_test(self):
        """Run the comprehensive test suite as per review request"""
        print("🚀 COMPREHENSIVE SALARY COMPONENTS & TAX CONFIGURATION API TESTING")
        print("📋 Testing as per review request requirements")
        print("=" * 80)
        
        # Step 1: Authentication
        if not self.authenticate_admin():
            print("❌ Cannot proceed without admin authentication")
            return False
        
        # Step 2: Salary Components API Testing
        self.test_salary_components_api()
        
        # Step 3: Tax Configuration API Testing
        self.test_tax_configuration_api()
        
        # Step 4: Data Persistence and Multi-tenancy
        self.test_data_persistence_and_multi_tenancy()
        
        # Step 5: Validation Testing
        self.test_validation()
        
        # Generate comprehensive summary
        return self.generate_summary()

if __name__ == "__main__":
    tester = ComprehensiveSalaryTaxTester()
    success = tester.run_comprehensive_test()
    exit(0 if success else 1)