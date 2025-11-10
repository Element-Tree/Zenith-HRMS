// Feature mapping based on subscription plans
// Maps frontend menu items/features to backend subscription feature flags

export const FEATURE_MAP = {
  // Dashboard - Available to all
  dashboard: null, // null means always visible
  
  // Employee Management
  employees_view: 'employee_database',
  employees_add: 'employee_database',
  employees_import: 'bulk_employee_import',
  
  // Payroll
  payroll_run: 'payroll_processing_manual',
  payroll_automated: 'payroll_processing_automated',
  salary_structure: 'salary_structure_management',
  salary_components: 'custom_salary_components',
  
  // Deductions
  deductions: 'deductions_advanced',
  
  // Compliance
  compliance: 'compliance_reports_basic',
  compliance_full: 'compliance_reports_full',
  
  // Payslips
  payslips: 'payslip_generation',
  
  // Attendance & Leave
  attendance: 'attendance_tracking_basic',
  attendance_advanced: 'attendance_tracking_advanced',
  leave_management: 'leave_management_basic',
  leave_advanced: 'leave_management_advanced',
  
  // Loans & Advances
  loans: 'loans_advances',
  
  // Bank Advice
  bank_advice: 'bank_advice_generation',
  multi_bank: 'multi_bank_accounts',
  
  // Events
  events: 'event_management',
  
  // Settings
  settings: null, // Basic settings always available
  tax_configuration: 'salary_structure_management',
  
  // Employee Portal
  employee_portal: 'employee_portal',
  
  // Analytics
  analytics: 'payroll_analytics',
  
  // Advanced
  notifications: 'notifications',
  audit_logs: 'audit_logs',
  custom_reports: 'custom_reports',
  api_access: 'api_access'
};

// Menu items with their required features
export const getFilteredMenuItems = (hasFeature) => {
  const allMenuItems = [
    {
      title: "Dashboard",
      href: "/dashboard",
      icon: "LayoutDashboard",
      featureRequired: null // Always visible
    },
    {
      title: "Employees",
      icon: "Users",
      featureRequired: 'employee_database',
      items: [
        { 
          title: "All Employees", 
          href: "/employees", 
          icon: "Users",
          featureRequired: 'employee_database'
        },
        { 
          title: "Add New", 
          href: "/employees/new", 
          icon: "UserPlus",
          featureRequired: 'employee_database'
        },
        { 
          title: "Import Employees", 
          href: "/employees/import", 
          icon: "Upload",
          featureRequired: 'bulk_employee_import'
        }
      ]
    },
    {
      title: "Payroll",
      icon: "CreditCard",
      featureRequired: 'payroll_processing_manual',
      items: [
        { 
          title: "Run Payroll", 
          href: "/payroll/run", 
          icon: "CreditCard",
          featureRequired: 'payroll_processing_manual'
        },
        { 
          title: "Salary Structure", 
          href: "/payroll/salary-structure", 
          icon: "CreditCard",
          featureRequired: 'salary_structure_management'
        }
      ]
    },
    {
      title: "Deductions",
      href: "/deductions",
      icon: "Percent",
      featureRequired: 'deductions_advanced'
    },
    {
      title: "Compliance",
      href: "/compliance",
      icon: "Shield",
      featureRequired: 'compliance_reports_basic'
    },
    {
      title: "Payslips",
      href: "/payslips",
      icon: "FileText",
      featureRequired: 'payslip_generation'
    },
    {
      title: "Attendance",
      href: "/attendance",
      icon: "Calendar",
      featureRequired: 'attendance_tracking_basic'
    },
    {
      title: "Leave Management",
      href: "/leave-management",
      icon: "Calendar",
      featureRequired: 'leave_management_basic'
    },
    {
      title: "Loan Management",
      href: "/loan-management",
      icon: "DollarSign",
      featureRequired: 'loans_advances'
    },
    {
      title: "Bank Advice",
      href: "/bank-advice",
      icon: "Building2",
      featureRequired: 'bank_advice_generation'
    },
    {
      title: "Login Details",
      href: "/admin/login-details",
      icon: "Monitor",
      featureRequired: null // Always visible for admins
    },
    {
      title: "Event Management",
      href: "/admin/events",
      icon: "CalendarDays",
      featureRequired: 'event_management'
    },
    {
      title: "Settings",
      icon: "Settings",
      featureRequired: null, // Always visible
      items: [
        { 
          title: "General Settings", 
          href: "/settings", 
          icon: "Settings",
          featureRequired: null
        },
        { 
          title: "Salary Components", 
          href: "/salary-components", 
          icon: "CreditCard",
          featureRequired: 'custom_salary_components'
        },
        { 
          title: "Tax Configuration", 
          href: "/tax-configuration", 
          icon: "FileText",
          featureRequired: 'salary_structure_management'
        }
      ]
    }
  ];

  // Filter menu items based on subscription
  const filterItems = (items) => {
    return items.filter(item => {
      // If no feature required, always show
      if (!item.featureRequired) {
        // If it has subitems, filter them too
        if (item.items) {
          const filteredSubitems = filterItems(item.items);
          // Only show parent if it has at least one visible subitem or no feature required
          if (filteredSubitems.length > 0) {
            item.items = filteredSubitems;
            return true;
          }
          return false;
        }
        return true;
      }
      
      // Check if feature is available
      const hasAccess = hasFeature(item.featureRequired);
      
      if (hasAccess && item.items) {
        // Filter subitems
        item.items = filterItems(item.items);
      }
      
      return hasAccess;
    });
  };

  return filterItems(allMenuItems);
};

// Employee portal menu items
export const getFilteredEmployeeMenuItems = (hasFeature) => {
  const allEmployeeItems = [
    { 
      title: "Dashboard", 
      href: "/employee/dashboard",
      featureRequired: 'employee_portal'
    },
    { 
      title: "Profile", 
      href: "/employee/profile",
      featureRequired: 'employee_portal'
    },
    { 
      title: "Payslips", 
      href: "/employee/payslips",
      featureRequired: 'employee_portal'
    },
    { 
      title: "Leave", 
      href: "/employee/leave",
      featureRequired: 'leave_management_basic'
    },
    { 
      title: "Finances", 
      href: "/employee/loans",
      featureRequired: 'loans_advances'
    },
    { 
      title: "Attendance", 
      href: "/employee/attendance",
      featureRequired: 'attendance_tracking_basic'
    },
    { 
      title: "Documents", 
      href: "/employee/documents",
      featureRequired: 'employee_portal'
    },
    { 
      title: "Help", 
      href: "/employee/user-manual",
      featureRequired: null // Always visible
    }
  ];

  return allEmployeeItems.filter(item => {
    if (!item.featureRequired) return true;
    return hasFeature(item.featureRequired);
  });
};
