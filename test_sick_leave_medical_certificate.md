# Sick Leave Medical Certificate Mandatory Upload - Test Cases

## 1. File Upload Requirements
**Test Steps:**
- Login as employee
- Navigate to Leave Management
- Click "Apply Leave"
- Select "Sick Leave" from dropdown
- Verify medical certificate upload section appears
- Verify mandatory upload warning is displayed

**Expected Result:** Medical certificate upload becomes mandatory when sick leave is selected

## 2. File Validation Tests
**Test Steps:**
- Try uploading files of different types:
  - ✅ Valid: PDF, JPG, PNG files
  - ❌ Invalid: DOC, TXT, MP4 files
- Try uploading files of different sizes:
  - ✅ Valid: Files under 5MB
  - ❌ Invalid: Files over 5MB
- Verify appropriate error messages for invalid files

**Expected Result:** Only PDF, JPG, PNG files under 5MB should be accepted

## 3. Form Submission Validation
**Test Steps:**
- Fill all leave form fields for sick leave
- Try submitting without uploading medical certificate
- Verify error message appears
- Upload medical certificate and try submitting again

**Expected Result:** 
- Cannot submit without medical certificate
- Clear error message: "Medical certificate is mandatory for sick leave applications"
- Successful submission after upload

## 4. UI/UX Behavior
**Test Steps:**
- Select sick leave and verify upload section appears
- Change to another leave type (Annual/Casual) and verify upload section disappears
- Upload a file and verify it shows filename and size
- Use remove button to delete uploaded file
- Test cancel button clears all form data including uploaded file

**Expected Result:** 
- Dynamic UI showing/hiding upload section
- Clear file information display
- Proper cleanup on cancel/remove actions

## 5. Submit Button States
**Test Steps:**
- Verify submit button states:
  - Disabled when sick leave selected but no certificate
  - Shows "Upload Medical Certificate Required" text when disabled
  - Enabled when certificate is uploaded
  - Shows "Submitting..." during submission

**Expected Result:** Clear button feedback for required actions

## 6. Backend Integration
**Test Steps:**
- Submit sick leave with medical certificate
- Verify request appears in Leave Management (admin)
- Check "Attachments" column shows "Medical Cert" with green indicator
- Verify other leave types show "None" in attachments column

**Expected Result:** 
- Successful file upload and storage
- Admin can see which requests have medical certificates
- Clear distinction between requests with/without attachments

## 7. File Storage and Retrieval
**Test Steps:**
- Upload medical certificate and submit
- Check if file is properly stored in database
- Verify file metadata (filename, size, type) is preserved
- Test file size limit enforcement (5MB max)

**Expected Result:** Files stored as base64 with complete metadata

## 8. Other Leave Types (Control Test)
**Test Steps:**
- Apply for Annual Leave, Casual Leave, Maternity Leave, Paternity Leave
- Verify medical certificate upload is NOT required
- Verify submission works normally without any file upload

**Expected Result:** Only sick leave requires medical certificate

## Security & Error Handling
**Test Areas:**
- File type validation (no script files allowed)
- File size limits enforced
- Proper error messages for all validation failures
- Form state cleanup on errors
- Network error handling during file upload

## File Format Support:
- ✅ **Supported**: PDF (.pdf), JPEG (.jpg, .jpeg), PNG (.png)
- ❌ **Not Supported**: DOC, DOCX, TXT, MP4, etc.
- 📏 **Size Limit**: 5MB maximum
- 💾 **Storage**: Base64 encoding in database