#!/usr/bin/env python3

import requests
import sys
import json
from datetime import datetime, date, timedelta
from typing import Dict, Any

class EmployeeRatingTester:
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
        # Try both possible passwords
        passwords_to_try = ["password", "Admin$2022"]
        
        for password in passwords_to_try:
            login_data = {
                "username": "admin",
                "password": password
            }
            
            success, response = self.run_test(
                f"Admin Authentication (password: {password})", 
                "POST", 
                "auth/login", 
                200, 
                login_data
            )
            
            if success and response and 'access_token' in response:
                self.admin_token = response['access_token']
                self.log_test("Admin Token Retrieved", True, f"Admin authentication successful with password: {password}")
                return True
        
        self.log_test("Admin Token Retrieved", False, "Failed to get admin token with any password")
        return False

    def get_auth_headers(self, token):
        """Get authorization headers"""
        return {"Authorization": f"Bearer {token}"}

    def test_employee_rating_valid_calculation(self):
        """Test valid employee rating calculation with ET-MUM-00001"""
        if not self.admin_token:
            self.log_test("Employee Rating - Valid Calculation", False, "No admin token available")
            return False
        
        headers = self.get_auth_headers(self.admin_token)
        success, response = self.run_test(
            "Employee Rating - Valid Calculation (ET-MUM-00001)", 
            "GET", 
            "employees/ET-MUM-00001/rating", 
            200,
            None,
            headers
        )
        
        if success and response:
            # Verify response structure
            required_fields = ["employee_id", "rating", "month", "year", "details"]
            missing_fields = [field for field in required_fields if field not in response]
            
            if missing_fields:
                self.log_test("Rating Response Structure", False, f"Missing fields: {missing_fields}")
                return False
            
            # Verify details structure
            details = response.get("details", {})
            detail_fields = ["base_rating", "late_arrivals", "ot_hours", "punctuality_bonus", "attendance_days"]
            missing_detail_fields = [field for field in detail_fields if field not in details]
            
            if missing_detail_fields:
                self.log_test("Rating Details Structure", False, f"Missing detail fields: {missing_detail_fields}")
                return False
            
            # Verify rating is within valid range (0.0 to 5.0)
            rating = response.get("rating", 0)
            if not (0.0 <= rating <= 5.0):
                self.log_test("Rating Range Validation", False, f"Rating {rating} is outside valid range 0.0-5.0")
                return False
            
            # Verify base rating is 4.0
            base_rating = details.get("base_rating", 0)
            if base_rating != 4.0:
                self.log_test("Base Rating Validation", False, f"Expected base rating 4.0, got {base_rating}")
                return False
            
            self.log_test("Employee Rating Structure Validation", True, f"Rating: {rating}, Base: {base_rating}")
            return True
        
        return success

    def test_employee_rating_different_month_year(self):
        """Test employee rating with specific month and year parameters"""
        if not self.admin_token:
            self.log_test("Employee Rating - Different Month/Year", False, "No admin token available")
            return False
        
        headers = self.get_auth_headers(self.admin_token)
        success, response = self.run_test(
            "Employee Rating - Specific Month/Year (Oct 2025)", 
            "GET", 
            "employees/ET-MUM-00001/rating?month=10&year=2025", 
            200,
            None,
            headers
        )
        
        if success and response:
            # Verify the month and year are correctly set
            if response.get("month") == 10 and response.get("year") == 2025:
                self.log_test("Month/Year Parameter Validation", True, "Correct month and year in response")
                return True
            else:
                self.log_test("Month/Year Parameter Validation", False, f"Expected month=10, year=2025, got month={response.get('month')}, year={response.get('year')}")
                return False
        
        return success

    def test_employee_rating_algorithm_verification(self):
        """Test rating algorithm calculation verification"""
        if not self.admin_token:
            self.log_test("Employee Rating - Algorithm Verification", False, "No admin token available")
            return False
        
        headers = self.get_auth_headers(self.admin_token)
        success, response = self.run_test(
            "Employee Rating - Algorithm Verification", 
            "GET", 
            "employees/ET-MUM-00001/rating", 
            200,
            None,
            headers
        )
        
        if success and response:
            details = response.get("details", {})
            rating = response.get("rating", 0)
            
            # Extract algorithm components
            base_rating = details.get("base_rating", 0)
            late_arrivals = details.get("late_arrivals", 0)
            ot_hours = details.get("ot_hours", 0)
            punctuality_bonus = details.get("punctuality_bonus", 0)
            
            # Calculate expected rating based on Base 4.0 algorithm
            expected_rating = base_rating
            expected_rating -= (late_arrivals * 0.05)  # -0.05 per late arrival
            expected_rating += (ot_hours * 0.02)       # +0.02 per OT hour
            expected_rating += punctuality_bonus        # +0.3 if no late arrivals
            expected_rating = min(expected_rating, 5.0) # Cap at 5.0
            expected_rating = max(expected_rating, 0.0) # Floor at 0.0
            
            # Allow small floating point variance
            if abs(rating - expected_rating) < 0.1:
                self.log_test("Rating Algorithm Calculation", True, f"Calculated rating {rating} matches expected {expected_rating:.1f}")
                return True
            else:
                self.log_test("Rating Algorithm Calculation", False, f"Rating {rating} doesn't match expected {expected_rating:.1f}")
                return False
        
        return success

    def test_employee_rating_punctuality_bonus(self):
        """Test punctuality bonus logic (should be 0.3 if no late arrivals, 0.0 otherwise)"""
        if not self.admin_token:
            self.log_test("Employee Rating - Punctuality Bonus", False, "No admin token available")
            return False
        
        headers = self.get_auth_headers(self.admin_token)
        success, response = self.run_test(
            "Employee Rating - Punctuality Bonus Logic", 
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
            
            # Verify punctuality bonus logic
            if late_arrivals == 0:
                expected_bonus = 0.3
            else:
                expected_bonus = 0.0
            
            if punctuality_bonus == expected_bonus:
                self.log_test("Punctuality Bonus Logic", True, f"Correct bonus {punctuality_bonus} for {late_arrivals} late arrivals")
                return True
            else:
                self.log_test("Punctuality Bonus Logic", False, f"Expected bonus {expected_bonus}, got {punctuality_bonus} for {late_arrivals} late arrivals")
                return False
        
        return success

    def test_employee_rating_cap_at_five(self):
        """Test that rating is capped at 5.0 maximum"""
        if not self.admin_token:
            self.log_test("Employee Rating - Cap at 5.0", False, "No admin token available")
            return False
        
        headers = self.get_auth_headers(self.admin_token)
        success, response = self.run_test(
            "Employee Rating - Maximum Cap Verification", 
            "GET", 
            "employees/ET-MUM-00001/rating", 
            200,
            None,
            headers
        )
        
        if success and response:
            rating = response.get("rating", 0)
            
            if rating <= 5.0:
                self.log_test("Rating Maximum Cap", True, f"Rating {rating} is within maximum limit of 5.0")
                return True
            else:
                self.log_test("Rating Maximum Cap", False, f"Rating {rating} exceeds maximum limit of 5.0")
                return False
        
        return success

    def test_employee_rating_invalid_employee_id(self):
        """Test rating endpoint with non-existent employee ID"""
        if not self.admin_token:
            self.log_test("Employee Rating - Invalid Employee ID", False, "No admin token available")
            return False
        
        headers = self.get_auth_headers(self.admin_token)
        success, response = self.run_test(
            "Employee Rating - Invalid Employee ID", 
            "GET", 
            "employees/INVALID-EMP-ID/rating", 
            200,  # Should return default rating, not 404
            None,
            headers
        )
        
        if success and response:
            # Should return default rating (4.0) with zero details for invalid employee
            rating = response.get("rating", 0)
            details = response.get("details", {})
            
            if rating == 4.0 and details.get("base_rating") == 4.0:
                self.log_test("Invalid Employee Default Rating", True, "Returns default rating 4.0 for invalid employee")
                return True
            else:
                self.log_test("Invalid Employee Default Rating", False, f"Expected default rating 4.0, got {rating}")
                return False
        
        return success

    def test_employee_rating_edge_cases(self):
        """Test rating calculation edge cases"""
        if not self.admin_token:
            self.log_test("Employee Rating - Edge Cases", False, "No admin token available")
            return False
        
        # Test with different employees to check edge cases
        test_employees = ["ET-MUM-00001", "ET-MUM-00002", "ET-MUM-00003"]
        
        headers = self.get_auth_headers(self.admin_token)
        all_passed = True
        
        for emp_id in test_employees:
            success, response = self.run_test(
                f"Employee Rating - Edge Case ({emp_id})", 
                "GET", 
                f"employees/{emp_id}/rating", 
                200,
                None,
                headers
            )
            
            if success and response:
                rating = response.get("rating", 0)
                details = response.get("details", {})
                
                # Verify rating is within bounds
                if not (0.0 <= rating <= 5.0):
                    self.log_test(f"Rating Bounds Check ({emp_id})", False, f"Rating {rating} out of bounds")
                    all_passed = False
                    continue
                
                # Verify all detail fields are present and non-negative
                required_details = ["base_rating", "late_arrivals", "ot_hours", "punctuality_bonus", "attendance_days"]
                for field in required_details:
                    if field not in details or details[field] < 0:
                        self.log_test(f"Detail Field Check ({emp_id})", False, f"Invalid {field}: {details.get(field)}")
                        all_passed = False
                        break
                else:
                    self.log_test(f"Edge Case Validation ({emp_id})", True, f"All validations passed for {emp_id}")
            else:
                all_passed = False
        
        return all_passed

    def test_employee_rating_data_isolation(self):
        """Test that rating data is properly isolated by month"""
        if not self.admin_token:
            self.log_test("Employee Rating - Data Isolation", False, "No admin token available")
            return False
        
        headers = self.get_auth_headers(self.admin_token)
        
        # Test current month vs different month
        success1, response1 = self.run_test(
            "Employee Rating - Current Month", 
            "GET", 
            "employees/ET-MUM-00001/rating", 
            200,
            None,
            headers
        )
        
        success2, response2 = self.run_test(
            "Employee Rating - Different Month (Sep 2025)", 
            "GET", 
            "employees/ET-MUM-00001/rating?month=9&year=2025", 
            200,
            None,
            headers
        )
        
        if success1 and success2 and response1 and response2:
            # The ratings might be different due to different data for different months
            rating1 = response1.get("rating", 0)
            rating2 = response2.get("rating", 0)
            
            month1 = response1.get("month")
            month2 = response2.get("month")
            
            if month1 != month2:
                self.log_test("Month Data Isolation", True, f"Different months return different contexts: {month1} vs {month2}")
                return True
            else:
                self.log_test("Month Data Isolation", False, "Month parameters not properly handled")
                return False
        
        return success1 and success2

    def run_rating_tests(self):
        """Run all Employee Rating System tests"""
        print("🚀 Starting Employee Rating System API Testing (Base 4.0)...")
        print(f"   Base URL: {self.base_url}")
        print(f"   API URL: {self.api_url}")
        print("=" * 80)
        
        # Authentication
        admin_auth_success = self.authenticate_admin()
        
        if not admin_auth_success:
            print("\n❌ Admin authentication failed - cannot run rating tests")
            return False
        
        # Employee Rating System tests
        print("\n⭐ EMPLOYEE RATING SYSTEM API TESTING (Base 4.0)")
        print("=" * 60)
        
        self.test_employee_rating_valid_calculation()
        self.test_employee_rating_different_month_year()
        self.test_employee_rating_algorithm_verification()
        self.test_employee_rating_punctuality_bonus()
        self.test_employee_rating_cap_at_five()
        self.test_employee_rating_invalid_employee_id()
        self.test_employee_rating_edge_cases()
        self.test_employee_rating_data_isolation()
        
        # Print final results
        print("\n" + "="*80)
        print("📊 EMPLOYEE RATING SYSTEM TEST RESULTS")
        print("="*80)
        print(f"Total Tests Run: {self.tests_run}")
        print(f"Tests Passed: {self.tests_passed}")
        print(f"Tests Failed: {self.tests_run - self.tests_passed}")
        print(f"Success Rate: {(self.tests_passed/self.tests_run*100):.1f}%" if self.tests_run > 0 else "No tests run")
        
        if self.tests_passed == self.tests_run:
            print("🎉 ALL RATING TESTS PASSED!")
        else:
            print("❌ Some rating tests failed. Check the details above.")
            
        return self.tests_passed == self.tests_run

if __name__ == "__main__":
    tester = EmployeeRatingTester()
    success = tester.run_rating_tests()
    sys.exit(0 if success else 1)