# PIN Management Email Feature - Test Cases

## 1. Employee Selection
**Test Steps:**
- Login as admin
- Navigate to PIN Management page
- Check individual employee checkboxes
- Verify selection count updates
- Use "Select All" button
- Use "Clear Selection" button

**Expected Result:** Checkboxes should work correctly, selection count should be accurate

## 2. Email All PINs
**Test Steps:**
- Click "Email All PINs" button
- Verify email sending process starts
- Check if emails are sent to all employees with email addresses
- Verify employees without emails are skipped with warning

**Expected Result:** All employees with emails should receive PIN emails

## 3. Email Selected PINs
**Test Steps:**
- Select specific employees using checkboxes
- Click "Email Selected (X)" button where X is the count
- Verify only selected employees receive emails
- Test with mix of employees with/without emails

**Expected Result:** Only selected employees with emails should receive PIN emails

## 4. Email Content Verification
**Test Steps:**
- Check received email contains:
  - Employee name
  - Username
  - PIN (4 digits)
  - App link (http://localhost:3000)
  - Professional styling with Ocean Green theme
- Verify email subject line format
- Check BCC to accounts@elementree.co.in

**Expected Result:** Email should contain all required information in proper format

## 5. Error Handling
**Test Steps:**
- Try sending to employees without PINs
- Try sending to employees without emails
- Verify error messages are clear
- Check success/failure counts are accurate

**Expected Result:** Proper error handling with informative messages

## 6. Email Template Features
**Email should include:**
- Professional header with company branding
- Clear credentials box with username and PIN
- Prominent "Access Employee Portal" button
- Security note about keeping credentials safe
- Proper footer with contact information
- Ocean Green color scheme (#006B5B)
- Aptos Display font family