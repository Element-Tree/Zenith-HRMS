# Medical Certificate Viewing Feature - Test Cases

## 1. Admin Leave Management - View Medical Certificates
**Test Steps:**
- Login as admin
- Navigate to Leave Management
- Look for leave requests with "View Medical Cert" button (green dot)
- Click "View Medical Cert" button
- Verify medical certificate opens in new tab

**Expected Result:** 
- Medical certificate should open in new browser tab
- PDFs should display in browser PDF viewer
- Images should display directly in browser

## 2. Employee Leave History - View Own Certificates
**Test Steps:**
- Login as employee
- Navigate to Leave Management
- Look at leave history table
- Find sick leave applications with attachments
- Click "View Cert" button in Attachments column

**Expected Result:** 
- Employee can view their own medical certificates
- File opens in new tab for viewing
- Only their own certificates are accessible

## 3. File Type Handling
**Test Steps:**
- Test viewing different file types:
  - PDF medical certificates
  - JPG/JPEG medical certificates  
  - PNG medical certificates
- Verify each file type displays correctly

**Expected Result:** 
- PDFs open in browser PDF viewer
- Images display directly in browser
- No download prompt, direct viewing

## 4. Permission Testing
**Test Steps:**
- Login as employee A and try to view employee B's medical certificate (if possible)
- Login as admin and view any employee's medical certificate
- Test with invalid leave request IDs

**Expected Result:**
- Employees can only view their own certificates
- Admins can view any employee's certificate
- Proper error messages for unauthorized access

## 5. Error Handling
**Test Steps:**
- Try viewing medical certificate for leave request without attachment
- Try viewing with invalid leave ID
- Test network error scenarios

**Expected Result:**
- Clear error messages for different scenarios:
  - "Medical certificate not found"
  - "You do not have permission to view this medical certificate"
  - "Failed to load medical certificate"

## 6. UI/UX Verification
**Test Areas:**
- "View Medical Cert" button styling and hover effects
- Proper column alignment in both admin and employee views
- Green dot indicator for certificates present
- "None" text for leave requests without attachments
- Button responsiveness and loading states

## 7. Backend API Testing
**Test Steps:**
- Test endpoint `/api/leaves/{leave_id}/medical-certificate`
- Verify proper base64 decoding
- Check file metadata (filename, content_type) is preserved
- Test permission validation in API

**Expected Result:**
- Proper file data retrieval
- Correct MIME types returned
- Security permissions enforced at API level

## Technical Features:
- ✅ **Backend Endpoint**: `/api/leaves/{leave_id}/medical-certificate`
- ✅ **Permission Control**: Admins + employee who submitted the request
- ✅ **File Handling**: Base64 to Blob conversion for viewing
- ✅ **Browser Integration**: Opens files in new tab with proper MIME types
- ✅ **Error Handling**: Comprehensive error messages and validation
- ✅ **UI Enhancement**: Clickable buttons in both admin and employee interfaces

## Browser Compatibility:
- ✅ **PDF Viewing**: Modern browsers with built-in PDF viewers
- ✅ **Image Viewing**: All browsers support JPG/PNG display
- ✅ **File Download**: Fallback download option if viewing fails