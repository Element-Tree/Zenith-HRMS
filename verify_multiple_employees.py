#!/usr/bin/env python3

import requests
import json

class MultipleEmployeeAuthTester:
    def __init__(self, base_url="https://elevatesubs.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"

    def get_employees(self):
        """Get list of employees"""
        try:
            response = requests.get(f"{self.api_url}/employees", timeout=10)
            if response.status_code == 200:
                return response.json()
            return []
        except:
            return []

    def test_employee_auth(self, employee_id: str, employee_name: str):
        """Test employee authentication"""
        pin = employee_id[-5:] if len(employee_id) >= 5 else employee_id
        
        login_data = {
            "username": employee_id,
            "pin": pin
        }
        
        try:
            response = requests.post(f"{self.api_url}/auth/login", json=login_data, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                user_info = data.get('user', {})
                print(f"✅ {employee_name} ({employee_id}) - PIN: {pin} - SUCCESS")
                return True
            else:
                print(f"❌ {employee_name} ({employee_id}) - PIN: {pin} - FAILED: {response.status_code}")
                return False
        except Exception as e:
            print(f"❌ {employee_name} ({employee_id}) - PIN: {pin} - ERROR: {str(e)}")
            return False

    def run_test(self):
        """Test multiple employees"""
        print("🔍 TESTING MULTIPLE EMPLOYEE AUTHENTICATION")
        print("="*60)
        
        employees = self.get_employees()
        if not employees:
            print("❌ Could not fetch employees")
            return
        
        print(f"Found {len(employees)} employees. Testing first 10...")
        print()
        
        successful = 0
        total_tested = 0
        
        for i, emp in enumerate(employees[:10]):  # Test first 10 employees
            employee_id = emp.get('employee_id', '')
            employee_name = emp.get('name', 'Unknown')
            
            if employee_id:
                total_tested += 1
                if self.test_employee_auth(employee_id, employee_name):
                    successful += 1
        
        print()
        print("="*60)
        print(f"📊 RESULTS: {successful}/{total_tested} employees authenticated successfully")
        
        if successful == total_tested:
            print("🎉 ALL EMPLOYEE AUTHENTICATIONS WORKING!")
        else:
            print(f"⚠️  {total_tested - successful} employee authentications failed")

if __name__ == "__main__":
    tester = MultipleEmployeeAuthTester()
    tester.run_test()