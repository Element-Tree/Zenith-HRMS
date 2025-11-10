# Employee Profile Fixes - Test Cases

## 1. Profile Photo Upload Fix
**Test Steps:**
- Login as employee
- Go to Profile page
- Click "Upload Photo" button
- Select a valid image file (JPG/PNG, <5MB)
- Verify photo uploads successfully
- Check if profile refreshes with new photo

**Expected Result:** Photo should save and display correctly

## 2. Emergency Contact Information Fix
**Test Steps:**
- Login as employee
- Go to Profile page
- Click "Edit Profile"
- Fill in emergency contact name and phone
- Add blood group from dropdown
- Click "Save Changes"
- Verify data persists after page refresh

**Expected Result:** Emergency contact and blood group should save correctly

## 3. Email Address Disabled for Employees
**Test Steps:**
- Login as employee
- Go to Profile page
- Click "Edit Profile"
- Try to modify email address field

**Expected Result:** Email field should be disabled with message "Email can only be updated by admin"

## 4. Blood Group Dropdown
**Test Steps:**
- Login as employee
- Go to Profile page
- Click "Edit Profile"
- Click on Blood Group dropdown

**Expected Result:** Should show all 8 blood types:
- A RhD positive (A+)
- A RhD negative (A-)
- B RhD positive (B+)
- B RhD negative (B-)
- O RhD positive (O+)
- O RhD negative (O-)
- AB RhD positive (AB+)
- AB RhD negative (AB-)

## 5. Remove Test Notifications (Admin Only)
**Test Steps:**
- Login as admin
- Click on notifications bell icon
- Look for "Remove Test Notifications" button
- Click it to remove test notifications

**Expected Result:** Test notifications should be removed, success message shown

## 6. Email Update Restriction
**Test Steps:**
- Login as admin
- Try to update employee email via API
- Login as employee
- Try to update own email via API

**Expected Result:** Admin should succeed, employee should get permission error