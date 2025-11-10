# Payroll Features Implementation Plan

## Current Implementation (MVP)

### ✅ Phase 1: Feature Visibility (COMPLETED)
- All plans can access the same "Run Payroll" page
- No distinction between Manual and Automated at page level
- Focus: Get feature access control working first

**Rationale:**
- Even Free Trial users need a way to process payroll
- One unified page is simpler to maintain
- Can enhance with conditional features later

---

## Future Enhancements

### 🔄 Phase 2: Conditional Features Within Page (Future)

When we enhance the Run Payroll page, here's how features will be conditionally shown:

#### **FREE TRIAL Users** (`payroll_processing_manual: true`)
**What They See:**
- Basic employee list for payroll
- Manual input fields for each employee
- Manual entry of:
  - Overtime hours
  - Bonuses
  - Additional deductions
- "Process Payroll" button (requires manual action each time)
- Basic payslip generation

**What They DON'T See:**
- ❌ "Auto-Calculate from Attendance" button
- ❌ Scheduling options
- ❌ "Bulk Auto-Process" button
- ❌ "Auto-Email Payslips" checkbox
- ❌ Approval workflow indicators

---

#### **STARTER+ Users** (`payroll_processing_automated: true`)
**Additional Features Visible:**
- ✅ **"Auto-Calculate from Attendance"** button
  - Automatically calculates salary based on days present/absent
  - Shows attendance summary for each employee
  - Auto-deducts for unpaid leaves
  - Auto-calculates overtime from attendance logs

- ✅ **"Bulk Auto-Process"** button
  - One-click to process all employees at once
  - Shows progress bar with employee count
  - Auto-calculates all components for all employees

- ✅ **"Auto-Email Payslips"** checkbox
  - When enabled, automatically sends payslips to all employees after processing
  - Shows email delivery status for each employee

- ✅ **Scheduling Panel**
  - Set recurring payroll run date (e.g., "1st of every month")
  - Enable/disable automatic processing
  - View scheduled runs

- ✅ **Enhanced Calculations**
  - Auto-calculation indicators showing "Calculated from Attendance"
  - Breakdown showing: Base Days × Daily Rate + Overtime
  - Visual indicators for auto-calculated vs manual values

---

### 🎨 UI Implementation Examples

#### Free Trial - Manual Mode:
```
┌─────────────────────────────────────────┐
│ Run Payroll - March 2024               │
├─────────────────────────────────────────┤
│ Employee List (10)                      │
│ ┌─────────────────────────────────────┐ │
│ │ ☑ John Doe                          │ │
│ │   Base Salary: ₹50,000             │ │
│ │   Overtime (hrs): [___]  (manual)  │ │
│ │   Bonus: [___]          (manual)  │ │
│ │   Deductions: [___]     (manual)  │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ [Process Payroll] [Cancel]             │
└─────────────────────────────────────────┘
```

#### Starter+ - Automated Mode:
```
┌─────────────────────────────────────────┐
│ Run Payroll - March 2024               │
│ [🤖 Auto-Calculate from Attendance]    │
│ [📅 Schedule: Monthly on 1st] [Edit]   │
├─────────────────────────────────────────┤
│ Employee List (50)                      │
│ ┌─────────────────────────────────────┐ │
│ │ ☑ John Doe                          │ │
│ │   Base Salary: ₹50,000             │ │
│ │   Work Days: 22/26 ✓ (from attend)│ │
│ │   Overtime: 10 hrs ✓ (auto-calc)  │ │
│ │   Amount: ₹5,000 ✓ (auto)         │ │
│ │   Bonus: [___]          (manual)  │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ ☑ Auto-Email Payslips after processing│
│ [🚀 Bulk Auto-Process All] [Review]   │
└─────────────────────────────────────────┘
```

---

## Implementation Checklist (Future)

### Backend APIs Needed:
- [ ] `POST /api/payroll/auto-calculate` - Calculate from attendance
- [ ] `POST /api/payroll/schedule` - Set recurring schedule
- [ ] `POST /api/payroll/bulk-process` - Process all employees
- [ ] `POST /api/payroll/auto-email` - Send payslips automatically
- [ ] `GET /api/payroll/attendance-summary/{employee_id}` - Get attendance data

### Frontend Components:
- [ ] AutoCalculateButton component (conditional on `payroll_processing_automated`)
- [ ] BulkProcessButton component (conditional on `payroll_processing_automated`)
- [ ] SchedulePanel component (conditional on `payroll_processing_automated`)
- [ ] AutoEmailToggle component (conditional on `payroll_processing_automated`)
- [ ] AttendanceIndicators component (shows auto-calculated values)

### Feature Flags to Check:
```javascript
import { useSubscription } from '@/contexts/SubscriptionContext';

const { hasFeature } = useSubscription();

// In Run Payroll page
{hasFeature('payroll_processing_automated') && (
  <AutoCalculateButton />
)}

{hasFeature('payroll_processing_automated') && (
  <BulkProcessButton />
)}
```

---

## Similar Approach for Other Features

### Attendance: Basic vs Advanced
- **Basic (Free):** View attendance, manual punch in/out
- **Advanced (Starter+):** Bulk import, GPS tracking, shift management, reports

### Leave: Basic vs Advanced  
- **Basic (Free):** Apply for leave, view balance
- **Advanced (Starter+):** Approval workflows, carryover rules, multiple leave types

### Compliance: Basic vs Full
- **Basic (Professional):** PF, ESI reports
- **Full (Enterprise):** All statutory reports, Form 16, Labour Welfare Fund

---

## Current Status Summary

✅ **Implemented:**
- Feature visibility based on subscription plans
- All plans can access Run Payroll page
- Menu items show/hide based on plan features

🔜 **Next Phase (When Needed):**
- Add conditional features within Run Payroll page
- Implement auto-calculation from attendance
- Add scheduling capabilities
- Enhance with approval workflows

📋 **Decision:**
Keep it simple for MVP - one page for all plans, enhance later with conditional features based on user feedback and priority.

