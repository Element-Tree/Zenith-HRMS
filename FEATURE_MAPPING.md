# Feature Mapping - Pricing Plans to Application Features

## How Pricing Features Map to Application Pages

### ✅ Features that Map Directly to Pages

| Pricing Feature | Application Page/Menu | Notes |
|----------------|---------------------|-------|
| Employee Database | `/employees` | EmployeeList.jsx - View, add, edit employees |
| Payslip Generation | `/payslips` | Payslips.jsx |
| Compliance | `/compliance` | Compliance.jsx - Reports and tracking |
| Event Management | `/admin/events` | EventManagement.jsx |
| Bank Advice | `/bank-advice` | BankAdvice.jsx |
| Loans & Advances | `/loan-management` | LoanManagement.jsx |
| Custom Salary Components | `/salary-components` | SalaryComponents.jsx |
| Bulk Import | `/employees/import` | EmployeeImport.jsx |

---

### 🔄 Features that Need Interpretation

#### 1. **Payroll Processing**

**Pricing Says:**
- Free Trial: Manual Payroll ✅
- Starter+: Automated Payroll ✅

**Application Reality:**
- One page: `/payroll/run` (RunPayroll.jsx)
- **Solution:** 
  - All plans can access this page (it's the same page)
  - "Automated" could mean scheduling/bulk features within the page
  - For now: Show page for all plans with `payroll_processing_manual: true`

**Recommendation:** Keep single "Run Payroll" menu item, visible if either manual OR automated is true.

---

#### 2. **Attendance Tracking**

**Pricing Says:**
- Free Trial: Basic Attendance ✅
- Starter+: Advanced Attendance ✅

**Application Reality:**
- One page: `/attendance` (LeaveAttendance.jsx)
- **Solution:**
  - Basic: View attendance records only
  - Advanced: Edit, import, advanced reports
  - For now: Show page if either basic OR advanced is true
  - Later: Can add feature flags within the page to enable/disable specific actions

**Recommendation:** Keep single "Attendance" menu item, visible if `attendance_tracking_basic` OR `attendance_tracking_advanced` is true.

---

#### 3. **Leave Management**

**Pricing Says:**
- Free Trial: Basic Leave ✅
- Starter+: Advanced Leave ✅

**Application Reality:**
- One page: `/leave-management` (LeaveManagement.jsx)
- **Solution:**
  - Basic: View and apply for leave
  - Advanced: Approve, advanced policies, carryover
  - For now: Show page if either basic OR advanced is true

**Recommendation:** Keep single "Leave Management" menu item, visible if `leave_management_basic` OR `leave_management_advanced` is true.

---

#### 4. **Salary Structure**

**Pricing Says:**
- Starter+: Salary Structure ✅

**Application Reality:**
- Page exists: `/payroll/salary-structure` (SalaryStructure.jsx)
- **Solution:** Show this menu item only if `salary_structure_management: true`

**Recommendation:** Add "Salary Structure" to Payroll submenu, visible for Starter+.

---

#### 5. **Compliance Reports**

**Pricing Says:**
- Professional: Basic Compliance ✅
- Enterprise: Full Compliance ✅

**Application Reality:**
- One page: `/compliance` (Compliance.jsx)
- **Solution:**
  - Basic: Show limited reports (PF, ESI)
  - Full: Show all reports including advanced statutory
  - For now: Show page if either basic OR full is true

**Recommendation:** Keep single "Compliance" menu item, visible if `compliance_reports_basic` OR `compliance_reports_full` is true.

---

#### 6. **Deductions**

**Pricing Says:**
- Professional+: Advanced Deductions ✅

**Application Reality:**
- Page exists: `/deductions` (Deductions.jsx)
- **Solution:** Show only for Professional+

**Recommendation:** Keep "Deductions" menu item, visible if `deductions_advanced: true`.

---

### ❌ Features NOT Yet Implemented in Application

These features are in pricing but don't have dedicated pages yet:

| Pricing Feature | Status | Recommended Action |
|----------------|--------|-------------------|
| Payroll Analytics | ❌ Not built | Hide for now OR create placeholder |
| Custom Reports | ❌ Not built | Hide for now OR create placeholder |
| Audit Logs | ❌ Not built | Hide for now OR create placeholder |
| API Access | ❌ Not built | Show indicator in Settings |
| White Labeling | ❌ Not built | Show option in Settings |
| Custom Integrations | ❌ Not built | Show option in Settings |
| SSO Security | ❌ Not built | Show option in Settings |
| Multi Bank Accounts | ❌ Not built | Feature within Bank Advice page |

---

### 📱 Employee Portal Features

**Pricing Says:**
- Free Trial+: Employee Portal ✅

**Application Reality:**
- Employee portal exists with multiple pages:
  - Dashboard: `/employee/dashboard`
  - Payslips: `/employee/payslips`
  - Leave: `/employee/leave`
  - Finances: `/employee/loans`
  - Attendance: `/employee/attendance`
  - Profile: `/employee/profile`

**Solution:** If `employee_portal: false`, employee users should not be able to access any employee portal pages.

---

## Recommended Feature Mapping Logic

### For Admin Sidebar Menu:

```javascript
// Show if ANY version of the feature is enabled
{
  title: "Attendance",
  href: "/attendance",
  featureRequired: null, // Custom logic
  checkFeature: (hasFeature) => {
    return hasFeature('attendance_tracking_basic') || 
           hasFeature('attendance_tracking_advanced');
  }
}

// Show only if specific feature is enabled
{
  title: "Salary Components",
  href: "/salary-components",
  featureRequired: 'custom_salary_components'
}
```

### For Employee Portal:

```javascript
// All employee routes require employee_portal feature
if (!hasFeature('employee_portal')) {
  // Redirect to upgrade page or show access denied
}
```

---

## Summary of Changes Needed

1. **Update Sidebar.jsx** to use OR logic for basic/advanced features
2. **Add "Salary Structure"** to Payroll submenu
3. **Create placeholder pages** for Analytics, Reports, Audit Logs OR hide them
4. **Add Settings indicators** for API Access, White Labeling, etc.
5. **Block Employee Portal** entirely if feature is disabled
6. **Within-page feature restrictions** (future enhancement)

