#!/usr/bin/env python3

import requests
import sys
import json
from datetime import datetime, date, timedelta
from typing import Dict, Any

class ComprehensiveRatingTester:
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
                    if isinstance(response_data, dict) and len(str(response_data)) < 500:
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
        login_data = {
            "username": "admin",
            "password": "Admin$2022"
        }
        
        success, response = self.run_test(
            "Admin Authentication", 
            "POST", 
            "auth/login", 
            200, 
            login_data
        )
        
        if success and response and 'access_token' in response:
            self.admin_token = response['access_token']
            self.log_test("Admin Token Retrieved", True, "Admin authentication successful")
            return True
        
        self.log_test("Admin Token Retrieved", False, "Failed to get admin token")
        return False

    def get_auth_headers(self, token):
        """Get authorization headers"""
        return {"Authorization": f"Bearer {token}"}

    def test_rating_with_late_arrivals(self):
        """Test employee with late arrivals (should have rating deduction)"""
        if not self.admin_token:
            return False
        
        headers = self.get_auth_headers(self.admin_token)
        success, response = self.run_test(
            "Rating with Late Arrivals (ET-MUM-00003)", 
            "GET", 
            "employees/ET-MUM-00003/rating", 
            200,
            None,
            headers
        )
        
        if success and response:
            details = response.get("details", {})
            rating = response.get("rating", 0)
            late_arrivals = details.get("late_arrivals", 0)
            punctuality_bonus = details.get("punctuality_bonus", 0)
            
            # Verify late arrivals impact
            if late_arrivals > 0:
                expected_deduction = late_arrivals * 0.05
                expected_rating = 4.0 - expected_deduction  # No punctuality bonus
                
                if abs(rating - expected_rating) < 0.1:
                    self.log_test("Late Arrivals Deduction", True, f"Rating {rating} correctly reflects {late_arrivals} late arrivals")
                    return True
                else:
                    self.log_test("Late Arrivals Deduction", False, f"Expected rating ~{expected_rating}, got {rating}")
                    return False
            else:
                self.log_test("Late Arrivals Test", False, f"Employee {response.get('employee_id')} has no late arrivals for testing")
                return False
        
        return success

    def test_rating_with_approved_ot(self):
        """Test employee with approved OT hours (should have rating bonus)"""
        if not self.admin_token:
            return False
        
        headers = self.get_auth_headers(self.admin_token)
        
        # Test multiple employees to find one with OT hours
        test_employees = ["ET-MUM-00001", "ET-MUM-00002", "ET-MUM-00004", "ET-MUM-00005"]
        
        for emp_id in test_employees:
            success, response = self.run_test(
                f"Rating with OT Hours ({emp_id})", 
                "GET", 
                f"employees/{emp_id}/rating", 
                200,
                None,
                headers
            )
            
            if success and response:
                details = response.get("details", {})
                ot_hours = details.get("ot_hours", 0)
                
                if ot_hours > 0:
                    rating = response.get("rating", 0)
                    base_rating = details.get("base_rating", 0)
                    late_arrivals = details.get("late_arrivals", 0)
                    punctuality_bonus = details.get("punctuality_bonus", 0)
                    
                    # Calculate expected rating
                    expected_rating = base_rating
                    expected_rating -= (late_arrivals * 0.05)
                    expected_rating += (ot_hours * 0.02)
                    expected_rating += punctuality_bonus
                    expected_rating = min(expected_rating, 5.0)
                    
                    if abs(rating - expected_rating) < 0.1:
                        self.log_test("OT Hours Bonus", True, f"Rating {rating} correctly includes {ot_hours} OT hours bonus")
                        return True
                    else:
                        self.log_test("OT Hours Bonus", False, f"Expected rating ~{expected_rating}, got {rating}")
                        return False
        
        self.log_test("OT Hours Test", False, "No employees found with OT hours for testing")
        return False

    def test_perfect_attendance_bonus(self):
        """Test employee with perfect attendance (no late arrivals = punctuality bonus)"""
        if not self.admin_token:
            return False
        
        headers = self.get_auth_headers(self.admin_token)
        success, response = self.run_test(
            "Perfect Attendance Bonus (ET-MUM-00001)", 
            "GET", 
            "employees/ET-MUM-00001/rating", 
            200,
            None,
            headers
        )
        
        if success and response:
            details = response.get("details", {})
            late_arrivals = details.get("late_arrivals", 0)
            punctuality_bonus = details.get("punctuality_bonus", 0)
            
            if late_arrivals == 0 and punctuality_bonus == 0.3:
                self.log_test("Perfect Attendance Bonus", True, f"Punctuality bonus {punctuality_bonus} correctly applied for 0 late arrivals")
                return True
            else:
                self.log_test("Perfect Attendance Bonus", False, f"Expected bonus 0.3 for 0 late arrivals, got {punctuality_bonus}")
                return False
        
        return success

    def test_rating_response_format(self):
        """Test that response format matches expected structure"""
        if not self.admin_token:
            return False
        
        headers = self.get_auth_headers(self.admin_token)
        success, response = self.run_test(
            "Response Format Validation", 
            "GET", 
            "employees/ET-MUM-00001/rating", 
            200,
            None,
            headers
        )
        
        if success and response:
            # Check main structure
            required_fields = ["employee_id", "rating", "month", "year", "details"]
            missing_fields = [field for field in required_fields if field not in response]
            
            if missing_fields:
                self.log_test("Response Structure", False, f"Missing fields: {missing_fields}")
                return False
            
            # Check details structure
            details = response.get("details", {})
            required_details = ["base_rating", "late_arrivals", "ot_hours", "punctuality_bonus", "attendance_days"]
            missing_details = [field for field in required_details if field not in details]
            
            if missing_details:
                self.log_test("Details Structure", False, f"Missing detail fields: {missing_details}")
                return False
            
            # Verify data types
            if not isinstance(response.get("rating"), (int, float)):
                self.log_test("Rating Data Type", False, f"Rating should be numeric, got {type(response.get('rating'))}")
                return False
            
            if not isinstance(response.get("month"), int):
                self.log_test("Month Data Type", False, f"Month should be integer, got {type(response.get('month'))}")
                return False
            
            if not isinstance(response.get("year"), int):
                self.log_test("Year Data Type", False, f"Year should be integer, got {type(response.get('year'))}")
                return False
            
            self.log_test("Response Format Validation", True, "All required fields and data types correct")
            return True
        
        return success

    def test_multiple_months_data_isolation(self):
        """Test rating calculation for different months"""
        if not self.admin_token:
            return False
        
        headers = self.get_auth_headers(self.admin_token)
        
        # Test different months
        months_to_test = [
            {"month": 10, "year": 2025, "name": "October 2025"},
            {"month": 9, "year": 2025, "name": "September 2025"},
            {"month": 8, "year": 2025, "name": "August 2025"}
        ]
        
        all_passed = True
        
        for month_data in months_to_test:
            success, response = self.run_test(
                f"Rating for {month_data['name']}", 
                "GET", 
                f"employees/ET-MUM-00001/rating?month={month_data['month']}&year={month_data['year']}", 
                200,
                None,
                headers
            )
            
            if success and response:
                if response.get("month") == month_data["month"] and response.get("year") == month_data["year"]:
                    self.log_test(f"Month Isolation {month_data['name']}", True, f"Correct month/year in response")
                else:
                    self.log_test(f"Month Isolation {month_data['name']}", False, f"Month/year mismatch")
                    all_passed = False
            else:
                all_passed = False
        
        return all_passed

    def test_authentication_required(self):
        """Test that authentication is required for rating endpoint"""
        success, response = self.run_test(
            "Authentication Required", 
            "GET", 
            "employees/ET-MUM-00001/rating", 
            403,  # Should require authentication
            None,
            None  # No auth headers
        )
        
        return success

    def test_rating_bounds_verification(self):
        """Test that all ratings are within 0.0 to 5.0 bounds"""
        if not self.admin_token:
            return False
        
        headers = self.get_auth_headers(self.admin_token)
        
        # Test multiple employees
        test_employees = ["ET-MUM-00001", "ET-MUM-00002", "ET-MUM-00003", "ET-MUM-00004", "ET-MUM-00005"]
        all_passed = True
        
        for emp_id in test_employees:
            success, response = self.run_test(
                f"Rating Bounds ({emp_id})", 
                "GET", 
                f"employees/{emp_id}/rating", 
                200,
                None,
                headers
            )
            
            if success and response:
                rating = response.get("rating", 0)
                if not (0.0 <= rating <= 5.0):
                    self.log_test(f"Rating Bounds Check ({emp_id})", False, f"Rating {rating} out of bounds")
                    all_passed = False
                else:
                    self.log_test(f"Rating Bounds Check ({emp_id})", True, f"Rating {rating} within bounds")
            else:
                all_passed = False
        
        return all_passed

    def run_comprehensive_tests(self):
        """Run comprehensive Employee Rating System tests"""
        print("🚀 Starting Comprehensive Employee Rating System Testing...")
        print(f"   Base URL: {self.base_url}")
        print(f"   API URL: {self.api_url}")
        print("=" * 80)
        
        # Authentication
        admin_auth_success = self.authenticate_admin()
        
        if not admin_auth_success:
            print("\n❌ Admin authentication failed - cannot run rating tests")
            return False
        
        # Comprehensive Rating System tests
        print("\n⭐ COMPREHENSIVE EMPLOYEE RATING SYSTEM TESTING")
        print("=" * 60)
        
        print("\n📋 SCENARIO 1: Response Format & Structure")
        self.test_rating_response_format()
        
        print("\n📋 SCENARIO 2: Late Arrivals Impact")
        self.test_rating_with_late_arrivals()
        
        print("\n📋 SCENARIO 3: OT Hours Bonus")
        self.test_rating_with_approved_ot()
        
        print("\n📋 SCENARIO 4: Perfect Attendance Bonus")
        self.test_perfect_attendance_bonus()
        
        print("\n📋 SCENARIO 5: Month Data Isolation")
        self.test_multiple_months_data_isolation()
        
        print("\n📋 SCENARIO 6: Authentication Requirements")
        self.test_authentication_required()
        
        print("\n📋 SCENARIO 7: Rating Bounds Verification")
        self.test_rating_bounds_verification()
        
        # Print final results
        print("\n" + "="*80)
        print("📊 COMPREHENSIVE RATING SYSTEM TEST RESULTS")
        print("="*80)
        print(f"Total Tests Run: {self.tests_run}")
        print(f"Tests Passed: {self.tests_passed}")
        print(f"Tests Failed: {self.tests_run - self.tests_passed}")
        print(f"Success Rate: {(self.tests_passed/self.tests_run*100):.1f}%" if self.tests_run > 0 else "No tests run")
        
        if self.tests_passed == self.tests_run:
            print("🎉 ALL COMPREHENSIVE RATING TESTS PASSED!")
        else:
            print("❌ Some comprehensive rating tests failed. Check the details above.")
            
        return self.tests_passed == self.tests_run

if __name__ == "__main__":
    tester = ComprehensiveRatingTester()
    success = tester.run_comprehensive_tests()
    sys.exit(0 if success else 1)