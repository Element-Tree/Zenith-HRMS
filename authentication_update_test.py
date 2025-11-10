#!/usr/bin/env python3

import requests
import json
from datetime import datetime

class AuthenticationUpdateTester:
    def __init__(self, base_url="https://elevatesubs.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.admin_token = None
        self.results = []

    def log_result(self, step: str, success: bool, details: str = ""):
        """Log test result"""
        result = {
            "step": step,
            "success": success,
            "details": details,
            "timestamp": datetime.now().isoformat()
        }
        self.results.append(result)
        
        status = "✅ SUCCESS" if success else "❌ FAILED"
        print(f"\n{status} - {step}")
        if details:
            print(f"   Details: {details}")

    def make_request(self, method: str, endpoint: str, data: dict = None, headers: dict = None) -> tuple:
        """Make HTTP request and return success status and response"""
        url = f"{self.api_url}/{endpoint}" if endpoint else self.api_url
        default_headers = {'Content-Type': 'application/json'}
        if headers:
            default_headers.update(headers)

        try:
            if method == 'GET':
                response = requests.get(url, headers=default_headers, timeout=10)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=default_headers, timeout=10)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=default_headers, timeout=10)
            else:
                raise ValueError(f"Unsupported method: {method}")

            return response.status_code, response.json() if response.content else {}

        except requests.exceptions.Timeout:
            return 408, {"error": "Request timeout"}
        except requests.exceptions.ConnectionError:
            return 503, {"error": "Connection error - server may be down"}
        except Exception as e:
            return 500, {"error": str(e)}

    def step_1_update_admin_password(self):
        """Step 1: Call POST /api/init-users to set admin password to 'Admin$2022'"""
        print("\n" + "="*60)
        print("STEP 1: UPDATE ADMIN PASSWORD")
        print("="*60)
        
        # First try to authenticate with current password to get admin token
        current_passwords = ["password", "Admin$2022"]  # Try both possible passwords
        admin_authenticated = False
        
        for pwd in current_passwords:
            login_data = {"username": "admin", "password": pwd}
            status_code, response = self.make_request('POST', 'auth/login', login_data)
            
            if status_code == 200 and 'access_token' in response:
                self.admin_token = response['access_token']
                admin_authenticated = True
                self.log_result(
                    "Current Admin Authentication", 
                    True, 
                    f"Admin authenticated with password '{pwd}'"
                )
                break
        
        if not admin_authenticated:
            self.log_result(
                "Current Admin Authentication", 
                False, 
                "Could not authenticate admin with any known password"
            )
        
        # Now call init-users to ensure admin password is set to Admin$2022
        status_code, response = self.make_request('POST', 'init-users')
        
        if status_code == 200:
            admin_created = response.get('admin_created', False)
            if admin_created:
                self.log_result(
                    "Update Admin Password", 
                    True, 
                    f"New admin user created with password 'Admin$2022'. Response: {response}"
                )
            else:
                self.log_result(
                    "Update Admin Password", 
                    True, 
                    f"Admin user already exists. Response: {response}. Will verify password in next step."
                )
            return True
        else:
            self.log_result(
                "Update Admin Password", 
                False, 
                f"Failed with status {status_code}: {response}"
            )
            return False

    def step_2_authenticate_admin(self):
        """Authenticate admin with new password to get token for next step"""
        print("\n" + "="*60)
        print("STEP 2: AUTHENTICATE ADMIN (for employee PIN update)")
        print("="*60)
        
        # Try both possible passwords since we're not sure which one is active
        passwords_to_try = ["Admin$2022", "password"]
        
        for pwd in passwords_to_try:
            login_data = {
                "username": "admin",
                "password": pwd
            }
            
            status_code, response = self.make_request('POST', 'auth/login', login_data)
            
            if status_code == 200 and 'access_token' in response:
                self.admin_token = response['access_token']
                self.log_result(
                    "Admin Authentication", 
                    True, 
                    f"Admin authenticated successfully with password '{pwd}'. Token obtained."
                )
                return True
        
        self.log_result(
            "Admin Authentication", 
            False, 
            f"Failed to authenticate admin with any password. Last response: {response}"
        )
        return False

    def step_3_update_employee_pins(self):
        """Step 2: Call POST /api/update-employee-pins to set all employee PINs to last 5 digits of employee ID"""
        print("\n" + "="*60)
        print("STEP 3: UPDATE EMPLOYEE PINS")
        print("="*60)
        
        if not self.admin_token:
            self.log_result(
                "Update Employee PINs", 
                False, 
                "No admin token available. Admin authentication failed."
            )
            return False
        
        headers = {"Authorization": f"Bearer {self.admin_token}"}
        status_code, response = self.make_request('POST', 'update-employee-pins', headers=headers)
        
        if status_code == 200:
            updated_count = response.get('updated_count', 0)
            self.log_result(
                "Update Employee PINs", 
                True, 
                f"Updated PINs for {updated_count} employees. Response: {response}"
            )
            return True
        else:
            self.log_result(
                "Update Employee PINs", 
                False, 
                f"Failed with status {status_code}: {response}"
            )
            return False

    def step_4_verify_admin_authentication(self):
        """Step 3a: Verify admin login with new password"""
        print("\n" + "="*60)
        print("STEP 4: VERIFY ADMIN AUTHENTICATION")
        print("="*60)
        
        # Test both passwords to see which one works
        passwords_to_test = [
            ("Admin$2022", "NEW PASSWORD"),
            ("password", "OLD PASSWORD")
        ]
        
        working_passwords = []
        
        for pwd, label in passwords_to_test:
            login_data = {
                "username": "admin",
                "password": pwd
            }
            
            status_code, response = self.make_request('POST', 'auth/login', login_data)
            
            if status_code == 200 and 'access_token' in response:
                user_info = response.get('user', {})
                working_passwords.append((pwd, label))
                self.log_result(
                    f"Verify Admin Login ({label})", 
                    True, 
                    f"Admin login successful with '{pwd}'. User: {user_info.get('username')}, Role: {user_info.get('role')}"
                )
        
        if working_passwords:
            if any(pwd == "Admin$2022" for pwd, _ in working_passwords):
                self.log_result(
                    "Admin Password Update Status", 
                    True, 
                    "Admin password 'Admin$2022' is working correctly"
                )
                return True
            else:
                self.log_result(
                    "Admin Password Update Status", 
                    False, 
                    "Admin password still using old password 'password', not updated to 'Admin$2022'"
                )
                return False
        else:
            self.log_result(
                "Verify Admin Login", 
                False, 
                "No admin passwords are working"
            )
            return False

    def step_5_get_employee_for_testing(self):
        """Get an employee ID for testing employee authentication"""
        print("\n" + "="*60)
        print("STEP 5: GET EMPLOYEE FOR TESTING")
        print("="*60)
        
        status_code, response = self.make_request('GET', 'employees')
        
        if status_code == 200 and isinstance(response, list) and len(response) > 0:
            # Get first employee
            employee = response[0]
            employee_id = employee.get('employee_id')
            employee_name = employee.get('name')
            
            if employee_id:
                self.log_result(
                    "Get Employee for Testing", 
                    True, 
                    f"Found employee: {employee_name} (ID: {employee_id})"
                )
                return employee_id
            else:
                self.log_result(
                    "Get Employee for Testing", 
                    False, 
                    "Employee found but no employee_id field"
                )
                return None
        else:
            self.log_result(
                "Get Employee for Testing", 
                False, 
                f"Failed to get employees. Status: {status_code}, Response: {response}"
            )
            return None

    def step_6_verify_employee_authentication(self, employee_id: str):
        """Step 3b: Verify employee login with PIN as last 5 digits of employee ID"""
        print("\n" + "="*60)
        print("STEP 6: VERIFY EMPLOYEE AUTHENTICATION")
        print("="*60)
        
        # Generate PIN from last 5 digits of employee ID
        pin = employee_id[-5:] if len(employee_id) >= 5 else employee_id
        
        login_data = {
            "username": employee_id,
            "pin": pin
        }
        
        status_code, response = self.make_request('POST', 'auth/login', login_data)
        
        if status_code == 200 and 'access_token' in response:
            user_info = response.get('user', {})
            self.log_result(
                "Verify Employee Login", 
                True, 
                f"Employee login successful. Employee ID: {employee_id}, PIN: {pin}, User: {user_info.get('username')}, Role: {user_info.get('role')}"
            )
            return True
        else:
            self.log_result(
                "Verify Employee Login", 
                False, 
                f"Failed with Employee ID: {employee_id}, PIN: {pin}. Status: {status_code}, Response: {response}"
            )
            return False

    def run_authentication_update_test(self):
        """Run the complete authentication update test"""
        print("🚀 STARTING AUTHENTICATION UPDATE TEST")
        print("="*80)
        
        # Step 1: Update admin password
        step1_success = self.step_1_update_admin_password()
        
        # Step 2: Authenticate admin to get token
        step2_success = self.step_2_authenticate_admin() if step1_success else False
        
        # Step 3: Update employee PINs
        step3_success = self.step_3_update_employee_pins() if step2_success else False
        
        # Step 4: Verify admin authentication
        step4_success = self.step_4_verify_admin_authentication()
        
        # Step 5: Get employee for testing
        employee_id = self.step_5_get_employee_for_testing()
        
        # Step 6: Verify employee authentication
        step6_success = self.step_6_verify_employee_authentication(employee_id) if employee_id else False
        
        # Summary
        print("\n" + "="*80)
        print("🏁 AUTHENTICATION UPDATE TEST SUMMARY")
        print("="*80)
        
        total_steps = 6
        successful_steps = sum([step1_success, step2_success, step3_success, step4_success, bool(employee_id), step6_success])
        
        print(f"✅ Successful Steps: {successful_steps}/{total_steps}")
        print(f"❌ Failed Steps: {total_steps - successful_steps}/{total_steps}")
        
        if successful_steps == total_steps:
            print("\n🎉 ALL AUTHENTICATION UPDATES COMPLETED SUCCESSFULLY!")
            print("✅ Admin password updated to 'Admin$2022'")
            print("✅ Employee PINs updated to last 5 digits of employee ID")
            print("✅ Admin authentication working with new password")
            print("✅ Employee authentication working with new PIN system")
        else:
            print("\n⚠️  SOME AUTHENTICATION UPDATES FAILED")
            print("Please check the detailed results above.")
        
        return successful_steps == total_steps

if __name__ == "__main__":
    tester = AuthenticationUpdateTester()
    success = tester.run_authentication_update_test()
    
    if success:
        print("\n✅ Authentication update test completed successfully!")
    else:
        print("\n❌ Authentication update test failed!")