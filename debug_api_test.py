#!/usr/bin/env python3
"""
Debug API Test - Understanding actual API behavior
"""

import requests
import json
from datetime import datetime

class DebugAPITester:
    def __init__(self, base_url="https://elevatesubs.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.admin_token = None

    def authenticate(self):
        """Authenticate as admin"""
        login_data = {
            "username": "admin@company.com",
            "password": "password"
        }
        
        response = requests.post(f"{self.api_url}/auth/login", json=login_data)
        if response.status_code == 200:
            data = response.json()
            self.admin_token = data['access_token']
            print("✅ Authentication successful")
            return True
        else:
            print(f"❌ Authentication failed: {response.status_code} - {response.text}")
            return False

    def debug_api_call(self, method, endpoint, data=None):
        """Make API call and show detailed response"""
        url = f"{self.api_url}/{endpoint}"
        headers = {'Content-Type': 'application/json'}
        
        if self.admin_token:
            headers['Authorization'] = f"Bearer {self.admin_token}"
        
        print(f"\n🔍 {method} {url}")
        if data:
            print(f"📤 Request Data: {json.dumps(data, indent=2)}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=headers)
            elif method == 'DELETE':
                response = requests.delete(url, headers=headers)
            
            print(f"📥 Status Code: {response.status_code}")
            print(f"📥 Headers: {dict(response.headers)}")
            
            try:
                response_data = response.json()
                print(f"📥 Response Data: {json.dumps(response_data, indent=2)}")
                return response.status_code, response_data
            except:
                print(f"📥 Response Text: {response.text}")
                return response.status_code, response.text
                
        except Exception as e:
            print(f"❌ Error: {str(e)}")
            return 0, str(e)

    def run_debug_tests(self):
        """Run debug tests to understand API behavior"""
        print("🔍 DEBUG API TESTING - Understanding Actual Behavior")
        print("=" * 60)
        
        if not self.authenticate():
            return
        
        # Test 1: Check existing salary components
        print("\n1️⃣ GET ALL SALARY COMPONENTS")
        self.debug_api_call("GET", "salary-components")
        
        # Test 2: Check existing tax configurations
        print("\n2️⃣ GET ALL TAX CONFIGURATIONS")
        self.debug_api_call("GET", "tax-configuration")
        
        # Test 3: Try to create a unique salary component
        print("\n3️⃣ CREATE UNIQUE SALARY COMPONENT")
        unique_component = {
            "category": "earnings",
            "component_type": "Allowance",
            "component_name": f"Test Allowance {datetime.now().strftime('%H%M%S')}",
            "name_in_payslip": f"Test Allowance {datetime.now().strftime('%H%M%S')}",
            "calculation_type": "flat_amount",
            "amount_value": 5000,
            "is_active": True
        }
        status, response = self.debug_api_call("POST", "salary-components", unique_component)
        
        if status == 200 and isinstance(response, dict) and 'component_id' in response:
            component_id = response['component_id']
            
            # Test 4: Get the specific component
            print(f"\n4️⃣ GET SPECIFIC COMPONENT ({component_id})")
            self.debug_api_call("GET", f"salary-components/{component_id}")
            
            # Test 5: Update the component
            print(f"\n5️⃣ UPDATE COMPONENT ({component_id})")
            update_data = {"amount_value": 7500}
            self.debug_api_call("PUT", f"salary-components/{component_id}", update_data)
            
            # Test 6: Get earnings category
            print(f"\n6️⃣ GET EARNINGS CATEGORY")
            self.debug_api_call("GET", "salary-components?category=earnings")
        
        # Test 7: Try to create EPF configuration
        print("\n7️⃣ CREATE EPF CONFIGURATION")
        epf_config = {
            "component_type": "epf",
            "is_enabled": True,
            "epf_number": "TEST/EPF/123456",
            "epf_employee_contribution_rate": 12,
            "epf_employer_contribution_rate": 12
        }
        status, response = self.debug_api_call("POST", "tax-configuration", epf_config)
        
        # Test 8: Get EPF configuration
        print("\n8️⃣ GET EPF CONFIGURATION")
        self.debug_api_call("GET", "tax-configuration/epf")
        
        # Test 9: Test validation with invalid data
        print("\n9️⃣ TEST VALIDATION - MISSING FIELDS")
        invalid_component = {"category": "earnings"}
        self.debug_api_call("POST", "salary-components", invalid_component)
        
        # Test 10: Test validation with invalid category
        print("\n🔟 TEST VALIDATION - INVALID CATEGORY")
        invalid_category = {
            "category": "invalid_category",
            "component_name": "Test",
            "name_in_payslip": "Test"
        }
        self.debug_api_call("POST", "salary-components", invalid_category)

if __name__ == "__main__":
    tester = DebugAPITester()
    tester.run_debug_tests()