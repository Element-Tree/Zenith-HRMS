# Bank Advice System - Testing Checklist

## Overview
This document provides a comprehensive testing checklist for the newly implemented Bank Advice Management System with four tabs: Bank Advice, Company Bank Accounts, Employee Source Mapping, and Template Upload.

---

## Tab 1: Bank Advice (Enhanced Existing Functionality)

### Basic Functionality
- [ ] Navigate to Admin Portal → Bank Advice page
- [ ] Verify all 4 tabs are visible (Bank Advice, Company Bank Accounts, Employee Source Mapping, Template Upload)
- [ ] Verify Bank Advice tab is selected by default
- [ ] Check that stats cards display correct values (Total Amount, Employees, Banks, Month/Year)
- [ ] Verify "Generate New Bank Advice" form is visible with Month and Year dropdowns
- [ ] Check Bank-wise Breakdown section shows grouped employee data by bank

### Bank Advice Generation
- [ ] Select a month and year from dropdowns
- [ ] Click "Generate Bank Advice" button
- [ ] Verify loading state (spinning icon appears)
- [ ] Verify success toast notification appears
- [ ] Check that new bank advice appears in "Bank Advice History" table
- [ ] Verify reference number format (e.g., BA/OCT25/001)
- [ ] Check employee count and total amount are correct
- [ ] Verify status badge shows "generated" (blue)

### Bank Advice Actions
- [ ] Click Download button on a bank advice entry
- [ ] Verify download toast notification
- [ ] Click Send button on a "generated" advice
- [ ] Verify status changes to "sent" (yellow badge)
- [ ] Click Complete button on a "sent" advice  
- [ ] Verify status changes to "completed" (green badge)

### Employee Transfer Details
- [ ] Scroll to "Employee Transfer Details" table
- [ ] Verify all employees are listed with masked account numbers (****1234)
- [ ] Check IFSC codes, bank names, and branches are displayed
- [ ] Verify net salary amounts are shown correctly

### Dark Mode
- [ ] Toggle dark mode and verify all elements are properly styled

---

## Tab 2: Company Bank Accounts

### Navigation
- [ ] Click on "Company Bank Accounts" tab
- [ ] Verify tab content loads and displays page header
- [ ] Check "Add Account" button is visible in top right

### Create Company Bank Account
- [ ] Click "Add Account" button
- [ ] Verify dialog opens with "Add Company Bank Account" title
- [ ] Fill in all fields:
  - Account Name: "Primary Salary Account"
  - Bank Name: "HDFC Bank"
  - Account Number: "123456789012"
  - IFSC Code: "HDFC0001234"
  - Branch: "Mumbai Main Branch"
  - Active checkbox: checked
- [ ] Click "Create" button
- [ ] Verify success toast: "Company bank account created successfully"
- [ ] Check new account appears in the table
- [ ] Verify account number is masked (****9012)

### Account Number Visibility Toggle
- [ ] Click Eye icon next to masked account number
- [ ] Verify full account number is revealed
- [ ] Click EyeOff icon
- [ ] Verify account number is masked again

### Edit Company Bank Account
- [ ] Click Edit button (pencil icon) on an account
- [ ] Verify dialog opens with "Edit Company Bank Account" title
- [ ] Verify form is pre-filled with existing data
- [ ] Modify some fields (e.g., change Branch name)
- [ ] Click "Update" button
- [ ] Verify success toast: "Company bank account updated successfully"
- [ ] Check changes are reflected in the table

### Account Status Toggle
- [ ] Edit an account
- [ ] Uncheck "Active Account" checkbox
- [ ] Save changes
- [ ] Verify status badge changes from "Active" (green) to "Inactive" (red)
- [ ] Re-enable and verify it changes back to "Active"

### Delete Company Bank Account (No Mappings)
- [ ] Create a new test account
- [ ] Click Delete button (trash icon) on the new account
- [ ] Verify confirmation dialog appears
- [ ] Confirm deletion
- [ ] Verify success toast: "Company bank account deleted successfully"
- [ ] Check account is removed from table

### Delete Company Bank Account (With Mappings)
- [ ] First, create an employee mapping (see Tab 3 tests)
- [ ] Try to delete the company account that has mappings
- [ ] Verify error toast shows: "Cannot delete account. X employees are mapped to this account."
- [ ] Check account is NOT deleted

### Validation
- [ ] Try creating account with duplicate account number
- [ ] Verify error toast: "Account number already exists"
- [ ] Try creating account with empty required fields
- [ ] Verify validation errors

### Dark Mode
- [ ] Toggle dark mode and verify all table elements, dialogs, and forms are properly styled

---

## Tab 3: Employee Source Mapping

### Navigation
- [ ] Click on "Employee Source Mapping" tab
- [ ] Verify tab content loads with page header
- [ ] Check "Add Mapping" and "Bulk Mapping" buttons are visible

### Warning Banner (No Company Accounts)
- [ ] If no company accounts exist, verify yellow warning banner appears
- [ ] Check message: "Please create company bank accounts in the 'Company Bank Accounts' tab before mapping employees."

### Create Single Employee Mapping
- [ ] Click "Add Mapping" button
- [ ] Verify dialog opens
- [ ] Select an employee from dropdown (e.g., ET-MUM-00001 - Anuj Ghadge)
- [ ] Select a company account from dropdown
- [ ] Click "Create Mapping" button
- [ ] Verify success toast: "Employee source mapping saved successfully"
- [ ] Check new mapping appears in the table with:
  - Employee ID
  - Employee Name
  - Department
  - Company Account Name
  - Bank Name

### Update Existing Mapping
- [ ] Create a mapping for an employee
- [ ] Create another mapping for the same employee with a different company account
- [ ] Verify success toast: "Employee source mapping saved successfully" (updated)
- [ ] Check that the mapping is updated (not duplicated)

### Bulk Employee Mapping
- [ ] Click "Bulk Mapping" button
- [ ] Verify dialog opens with employee selection list
- [ ] Select a company account from dropdown
- [ ] Check a few individual employees using checkboxes
- [ ] Verify selected count updates (e.g., "3 selected")
- [ ] Click "Map X Employees" button
- [ ] Verify success toast with count: "Successfully mapped X employees"
- [ ] Check all selected employees appear in the mappings table

### Bulk Select/Deselect All
- [ ] Open "Bulk Mapping" dialog
- [ ] Click "Select All" button
- [ ] Verify all employees are checked and count shows total (e.g., "32 selected")
- [ ] Click "Deselect All" button
- [ ] Verify all employees are unchecked and count shows "0 selected"

### Delete Employee Mapping
- [ ] Click Delete button (trash icon) on a mapping
- [ ] Verify confirmation dialog appears
- [ ] Confirm deletion
- [ ] Verify success toast: "Employee mapping deleted successfully"
- [ ] Check mapping is removed from table

### Validation
- [ ] Open "Add Mapping" dialog
- [ ] Try to create mapping without selecting employee
- [ ] Verify error handling
- [ ] Try to create mapping without selecting company account
- [ ] Verify error handling
- [ ] Open "Bulk Mapping" dialog
- [ ] Try to map without selecting any employees
- [ ] Verify error toast: "Please select at least one employee"
- [ ] Try to map without selecting company account
- [ ] Verify error toast: "Please select a company account"

### Dark Mode
- [ ] Toggle dark mode and verify all elements are properly styled
- [ ] Check dialogs, dropdowns, checkboxes, and tables

---

## Tab 4: Template Upload

### Navigation
- [ ] Click on "Template Upload" tab
- [ ] Verify tab content loads with page header
- [ ] Check "Upload Template" button is visible

### Empty State
- [ ] If no templates exist, verify empty state card appears
- [ ] Check message: "No bank templates uploaded yet. Click 'Upload Template' to add one."
- [ ] Verify Upload icon is displayed in center

### Upload Bank Template
- [ ] Prepare a test Excel file (.xlsx format)
- [ ] Click "Upload Template" button
- [ ] Verify dialog opens
- [ ] Enter bank name: "Axis Bank"
- [ ] Click "Choose File" and select Excel file
- [ ] Verify file name appears
- [ ] Click "Upload" button
- [ ] Verify success toast: "Bank template uploaded successfully"
- [ ] Check new template card appears in grid layout

### Template Card Display
- [ ] Verify template card shows:
  - Bank icon (FileText icon in blue)
  - Bank name as title
  - File name
  - File size in KB
  - Upload date (formatted)
  - Uploaded by (admin username)
  - Download button
  - Delete button (trash icon)

### Download Template
- [ ] Click "Download" button on a template card
- [ ] Verify file download starts
- [ ] Check downloaded file opens correctly in Excel
- [ ] Verify success toast: "Template downloaded successfully"

### Update Existing Template
- [ ] Upload a template for a bank that already has a template (same bank name)
- [ ] Verify success toast: "Bank template for [Bank Name] updated successfully"
- [ ] Check template card updates with new file details (updated timestamp)
- [ ] Verify old template is replaced (not duplicated)

### Delete Template
- [ ] Click Delete button (trash icon) on a template card
- [ ] Verify confirmation dialog appears
- [ ] Confirm deletion
- [ ] Verify success toast: "Bank template deleted successfully"
- [ ] Check template card is removed from grid

### Multiple Templates Display
- [ ] Upload templates for different banks (e.g., Axis Bank, HDFC Bank, ICICI Bank)
- [ ] Verify all templates appear in responsive grid layout
- [ ] Check grid adjusts based on screen size (3 columns on large, 2 on medium, 1 on small)

### File Validation
- [ ] Try uploading without entering bank name
- [ ] Verify error toast: "Please enter bank name"
- [ ] Try uploading without selecting file
- [ ] Verify error toast: "Please select a file"
- [ ] Try uploading non-Excel file (e.g., .pdf, .txt)
- [ ] Verify file input restriction (only .xlsx, .xls allowed)

### Dark Mode
- [ ] Toggle dark mode and verify all template cards, dialogs, and buttons are properly styled

---

## Cross-Tab Integration Tests

### Complete Workflow Test
1. [ ] Go to "Company Bank Accounts" tab
2. [ ] Create 2 company bank accounts (e.g., HDFC Primary, ICICI Secondary)
3. [ ] Go to "Employee Source Mapping" tab
4. [ ] Map 5 employees to HDFC Primary using bulk mapping
5. [ ] Map 3 employees to ICICI Secondary individually
6. [ ] Go to "Template Upload" tab
7. [ ] Upload templates for HDFC Bank and ICICI Bank
8. [ ] Go to "Bank Advice" tab
9. [ ] Generate bank advice for current month
10. [ ] Verify bank advice is created successfully

### Data Consistency
- [ ] Verify employee count in Bank Advice matches total mapped employees
- [ ] Check bank count matches number of unique banks in employee bank details
- [ ] Verify total amount matches sum of all employee net salaries
- [ ] Confirm Bank-wise Breakdown shows correct groupings

### Delete Protection Test
- [ ] Create company account
- [ ] Map employees to it
- [ ] Try to delete the company account
- [ ] Verify error prevents deletion
- [ ] Delete all employee mappings for that account
- [ ] Try deleting company account again
- [ ] Verify deletion succeeds this time

---

## API Integration Tests (Backend)

### Company Bank Accounts Endpoints
- [ ] GET /api/company-bank-accounts - Verify returns all accounts
- [ ] POST /api/company-bank-accounts - Verify creates account with valid data
- [ ] POST /api/company-bank-accounts - Verify rejects duplicate account number
- [ ] PUT /api/company-bank-accounts/{id} - Verify updates account
- [ ] PUT /api/company-bank-accounts/{id} - Verify prevents duplicate account number on update
- [ ] DELETE /api/company-bank-accounts/{id} - Verify deletes account without mappings
- [ ] DELETE /api/company-bank-accounts/{id} - Verify prevents deletion with existing mappings

### Employee Source Mapping Endpoints
- [ ] GET /api/employee-source-mapping - Verify returns enriched mappings with employee/account details
- [ ] POST /api/employee-source-mapping - Verify creates new mapping
- [ ] POST /api/employee-source-mapping - Verify updates existing mapping for same employee
- [ ] POST /api/employee-source-mapping/bulk - Verify bulk creates/updates mappings
- [ ] POST /api/employee-source-mapping/bulk - Verify handles mix of valid/invalid employee IDs
- [ ] DELETE /api/employee-source-mapping/{id} - Verify deletes mapping
- [ ] DELETE /api/employee-source-mapping/by-employee/{employee_id} - Verify deletes by employee ID

### Bank Template Endpoints
- [ ] GET /api/bank-templates - Verify returns all templates (without full template_data for performance)
- [ ] POST /api/bank-templates - Verify uploads new template
- [ ] POST /api/bank-templates - Verify updates existing template for same bank
- [ ] GET /api/bank-templates/{id} - Verify returns full template including base64 data
- [ ] GET /api/bank-templates/by-bank/{bank_name} - Verify returns template by bank name
- [ ] DELETE /api/bank-templates/{id} - Verify deletes template

### Authentication & Authorization
- [ ] Verify all endpoints require admin authentication
- [ ] Test with employee token - verify 403 Forbidden responses
- [ ] Test without token - verify 401 Unauthorized responses

---

## Performance Tests

### Large Dataset Handling
- [ ] Test with 100+ employees in bulk mapping dialog
- [ ] Verify dropdown performance with many employees
- [ ] Check table rendering with 50+ mappings
- [ ] Test bank advice generation with large employee count
- [ ] Verify template upload with large Excel files (5-10MB)

### UI Responsiveness
- [ ] Test all tabs on mobile viewport (320px width)
- [ ] Test on tablet viewport (768px width)
- [ ] Test on desktop viewport (1920px width)
- [ ] Verify dialogs are scrollable on small screens
- [ ] Check tables have horizontal scroll on mobile

---

## Error Handling Tests

### Network Errors
- [ ] Simulate API timeout (delay backend response)
- [ ] Verify appropriate error toasts appear
- [ ] Test offline scenario
- [ ] Verify graceful degradation

### Invalid Data
- [ ] Try submitting forms with missing required fields
- [ ] Test with special characters in input fields
- [ ] Try uploading corrupted Excel file
- [ ] Test with extremely long text in input fields

### Edge Cases
- [ ] Test with no employees in system
- [ ] Test with no company accounts
- [ ] Test mapping employee that doesn't exist
- [ ] Test mapping to company account that doesn't exist
- [ ] Try deleting already deleted items

---

## Browser Compatibility

- [ ] Test in Chrome
- [ ] Test in Firefox
- [ ] Test in Safari
- [ ] Test in Edge
- [ ] Verify consistent behavior across browsers

---

## Accessibility Tests

- [ ] Navigate with keyboard only (Tab, Enter, Escape keys)
- [ ] Verify focus indicators are visible
- [ ] Check dialog close on Escape key
- [ ] Test with screen reader
- [ ] Verify proper label associations
- [ ] Check color contrast ratios

---

## Reminder: Pending Validations

**Note to implement later (as requested by user):**
- [ ] IFSC code format validation
- [ ] Account number length validation  
- [ ] Bank-specific validations

---

## Final Integration Test Scenario

### Complete End-to-End Flow:
1. Fresh admin login
2. Navigate to Bank Advice page
3. Create 3 company bank accounts for different banks
4. Verify account masking works correctly
5. Map all employees using bulk mapping to different company accounts
6. Upload bank templates for each bank
7. Generate bank advice for current month
8. Download bank advice file
9. Verify file contains correct data
10. Mark advice as sent
11. Mark advice as completed
12. Verify status progression throughout workflow

### Success Criteria:
- [ ] All operations complete without errors
- [ ] Data is consistent across all tabs
- [ ] No console errors in browser
- [ ] All toasts show appropriate messages
- [ ] UI remains responsive throughout
- [ ] Dark mode works seamlessly
- [ ] Data persists after page refresh

---

## Test Completion Sign-off

**Tested By:** _______________  
**Date:** _______________  
**Environment:** _______________  
**Overall Result:** ☐ Pass ☐ Fail  
**Notes:** _______________

