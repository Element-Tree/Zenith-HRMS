# Admin Comments on Leave Approval/Rejection - Test Cases

## 1. Admin Leave Management - Approval with Comments
**Test Steps:**
- Login as admin
- Navigate to Leave Management
- Find a pending leave request
- Click "Approve" button
- Verify approval dialog opens
- Add optional approval comment
- Click "Approve Leave"

**Expected Result:** 
- Dialog shows employee details and leave information
- Comment field is optional for approval
- Leave request is approved with admin comment stored
- Comment appears in both admin and employee views

## 2. Admin Leave Management - Rejection with Comments
**Test Steps:**
- Login as admin
- Navigate to Leave Management
- Find a pending leave request
- Click "Reject" button
- Verify rejection dialog opens
- Add rejection reason (mandatory)
- Click "Reject Leave"

**Expected Result:** 
- Dialog shows employee details and leave information  
- Rejection reason field is mandatory
- Cannot proceed without providing reason
- Leave request is rejected with reason stored
- Reason appears in both admin and employee views

## 3. Admin Comments Display in Leave Management
**Test Steps:**
- Navigate to Leave Management as admin
- Look at processed leave requests (approved/rejected)
- Verify admin comments are visible alongside status

**Expected Result:**
- Approved requests show: Status badge + "Admin: [comment]"
- Rejected requests show: Status badge + "Admin: [reason]"
- Comments are properly formatted and truncated if needed

## 4. Employee Portal - View Admin Comments
**Test Steps:**
- Login as employee
- Navigate to Leave Management
- Check leave history table
- Look for "Admin Comments" column
- Verify comments from admin are visible

**Expected Result:**
- New "Admin Comments" column in employee leave history
- Shows admin comments for both approved and rejected requests
- Comments are truncated with tooltip for long text
- Shows "-" for requests without admin comments

## 5. Backend API Testing
**Test Steps:**
- Test approval endpoint with admin_comment field
- Test rejection endpoint with admin_comment field
- Verify backward compatibility with existing data
- Check data storage in MongoDB

**Expected Result:**
- API accepts admin_comment for both approval and rejection
- Comments are properly stored in database
- Existing rejection_reason field maintained for backward compatibility
- All leave requests display correctly regardless of comment presence

## 6. Dialog Validation and UX
**Test Steps:**
- Test approval dialog:
  - Cancel button functionality
  - Form reset on cancel
  - Optional comment field behavior
- Test rejection dialog:
  - Mandatory reason field
  - Submit button disabled without reason
  - Cancel and form reset functionality

**Expected Result:**
- Proper form validation and state management
- Clear user feedback for required vs optional fields
- Clean dialog state on open/close/cancel

## 7. Comment Display Formatting
**Test Steps:**
- Add various types of comments:
  - Short comments
  - Long comments (test truncation)
  - Comments with special characters
  - Empty comments vs no comments

**Expected Result:**
- Short comments display fully
- Long comments are truncated with full text in tooltip
- Special characters handled properly
- Clear distinction between no comment and empty comment

## 8. Permission and Security Testing
**Test Steps:**
- Verify only admins can add approval/rejection comments
- Test that employee cannot modify admin comments
- Check that comments are visible to both admin and employee

**Expected Result:**
- Comment functionality restricted to admin users
- Employees can view but not modify comments
- Proper permission validation on backend

## Backend Changes:
- ✅ **Updated Model**: `LeaveApprovalRequest` now uses `admin_comment` field
- ✅ **Enhanced Logic**: Stores comments for both approval and rejection
- ✅ **Backward Compatibility**: Maintains `rejection_reason` field for existing data
- ✅ **API Enhancement**: Accepts optional admin comments in approval/rejection requests

## Frontend Changes:
- ✅ **Admin Interface**: Separate dialogs for approval and rejection with comment fields
- ✅ **Employee Interface**: New "Admin Comments" column in leave history
- ✅ **Comment Display**: Proper formatting and truncation in both interfaces
- ✅ **Form Validation**: Required field for rejection, optional for approval

## Comment Requirements:
- **Approval**: Optional admin comment
- **Rejection**: Mandatory rejection reason
- **Display**: Visible to both admin and employee
- **Formatting**: Truncated with tooltip for long comments