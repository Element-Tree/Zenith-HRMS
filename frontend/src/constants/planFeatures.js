// Shared feature definitions for all plan-related pages
// This ensures consistency across Pricing Page, Plans Page, and Edit Plans Page

export const PLAN_FEATURES = {
  core: [
    { key: 'employee_database', label: 'Employee Database' },
    { key: 'payroll_processing_manual', label: 'Manual Payroll' },
    { key: 'payroll_processing_automated', label: 'Automated Payroll' },
    { key: 'payslip_generation', label: 'Payslip Generation' },
    { key: 'salary_structure_management', label: 'Salary Structure' },
    { key: 'custom_salary_components', label: 'Custom Salary' },
  ],
  
  attendanceLeave: [
    { key: 'attendance_tracking_basic', label: 'Basic Attendance' },
    { key: 'attendance_tracking_advanced', label: 'Advanced Attendance' },
    { key: 'leave_management_basic', label: 'Basic Leave' },
    { key: 'leave_management_advanced', label: 'Advanced Leave' },
  ],
  
  advanced: [
    { key: 'bank_advice_generation', label: 'Bank Advice' },
    { key: 'compliance_reports_basic', label: 'Basic Compliance' },
    { key: 'compliance_reports_full', label: 'Full Compliance' },
    { key: 'employee_portal', label: 'Employee Portal' },
    { key: 'loans_advances', label: 'Loans & Advances' },
    { key: 'deductions_advanced', label: 'Advanced Deductions' },
    { key: 'event_management', label: 'Event Management' },
    { key: 'payroll_analytics', label: 'Payroll Analytics' },
    { key: 'multi_bank_accounts', label: 'Multi Bank Accounts' },
    { key: 'bulk_employee_import', label: 'Bulk Import' },
    { key: 'notifications', label: 'Notifications' },
    { key: 'dark_mode', label: 'Dark Mode' },
  ],
  
  enterprise: [
    { key: 'api_access', label: 'API Access' },
    { key: 'white_labeling', label: 'White Labeling' },
    { key: 'custom_integrations', label: 'Custom Integrations' },
    { key: 'sso_security', label: 'SSO Security' },
    { key: 'custom_reports', label: 'Custom Reports' },
    { key: 'audit_logs', label: 'Audit Logs' },
    { key: 'sla_guarantee', label: 'SLA Guarantee' },
  ]
};

// Get all features as a flat array
export const getAllFeatures = () => {
  return [
    ...PLAN_FEATURES.core,
    ...PLAN_FEATURES.attendanceLeave,
    ...PLAN_FEATURES.advanced,
    ...PLAN_FEATURES.enterprise
  ];
};

// Get only enabled features for a plan (used in pricing cards)
export const getEnabledFeatures = (planFeatures) => {
  const allFeatures = getAllFeatures();
  return allFeatures.filter(feature => planFeatures[feature.key] === true);
};
