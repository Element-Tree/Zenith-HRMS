import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

// Format currency in Indian Rupees
export function formatCurrency(amount) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

// Format number with Indian number system (lakhs, crores)
export function formatNumber(num) {
  return new Intl.NumberFormat('en-IN').format(num);
}

// Calculate percentage
export function calculatePercentage(value, total) {
  if (total === 0) return 0;
  return ((value / total) * 100).toFixed(1);
}

// Validate PAN number
export function validatePAN(pan) {
  const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
  return panRegex.test(pan);
}

// Validate Aadhar number
export function validateAadhar(aadhar) {
  const aadharRegex = /^[2-9]{1}[0-9]{3}\s[0-9]{4}\s[0-9]{4}$/;
  return aadharRegex.test(aadhar);
}

// Validate IFSC code
export function validateIFSC(ifsc) {
  const ifscRegex = /^[A-Z]{4}0[A-Z0-9]{6}$/;
  return ifscRegex.test(ifsc);
}

// Calculate age from date of birth
export function calculateAge(dateOfBirth) {
  const today = new Date();
  const birthDate = new Date(dateOfBirth);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  
  return age;
}

// Calculate experience in years and months
export function calculateExperience(joiningDate) {
  const today = new Date();
  const joinDate = new Date(joiningDate);
  
  let years = today.getFullYear() - joinDate.getFullYear();
  let months = today.getMonth() - joinDate.getMonth();
  
  if (months < 0) {
    years--;
    months += 12;
  }
  
  return { years, months };
}

// Format date for display (uses browser's local timezone)
export function formatDate(date, options = {}) {
  if (!date) return 'N/A';
  
  const defaultOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    ...options
  };
  
  // Use browser's default locale for proper timezone conversion
  return new Date(date).toLocaleDateString(undefined, defaultOptions);
}


export function formatDateTime(date, options = {}) {
  if (!date) return 'N/A';
  
  const defaultOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
    ...options
  };
  
  // Use browser's default locale for proper timezone conversion
  return new Date(date).toLocaleString(undefined, defaultOptions);
}

// Format time only (uses browser's local timezone)
export function formatTime(date) {
  if (!date) return '';
  
  // Use browser's default locale for proper timezone conversion
  return new Date(date).toLocaleTimeString(undefined, {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });
}

// Format date and time separately for display
export function formatDateTimeSeparate(date) {
  if (!date) return { date: 'N/A', time: '' };
  
  const dateObj = new Date(date);
  return {
    date: dateObj.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    }),
    time: dateObj.toLocaleTimeString(undefined, {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    })
  };
}

// Generate employee ID
export function generateEmployeeId(prefix = 'EMP') {
  const timestamp = Date.now().toString().slice(-6);
  const random = Math.random().toString(36).substr(2, 3).toUpperCase();
  return `${prefix}${timestamp}${random}`;
}

// Calculate gross salary
export function calculateGrossSalary(salaryStructure) {
  if (!salaryStructure) return 0;
  
  const {
    basic_salary = 0,
    house_rent_allowance = 0,
    hra = 0, // Legacy field
    medical_allowance = 0,
    leave_travel_allowance = 0,
    travel_allowance = 0, // Legacy field
    conveyance_allowance = 0,
    food_allowance = 0, // Legacy field
    performance_incentive = 0,
    internet_allowance = 0, // Legacy field
    other_benefits = 0,
    special_allowance = 0 // Legacy field
  } = salaryStructure;
  
  // Convert all values to numbers to prevent NaN
  const toNum = (val) => Number(val) || 0;
  
  return toNum(basic_salary) + 
         toNum(house_rent_allowance || hra) + 
         toNum(medical_allowance) + 
         toNum(leave_travel_allowance || travel_allowance) + 
         toNum(conveyance_allowance || food_allowance) + 
         toNum(performance_incentive || internet_allowance) + 
         toNum(other_benefits || special_allowance);
}

// Calculate total deductions
export function calculateTotalDeductions(salaryStructure) {
  if (!salaryStructure) return 0;
  
  const {
    pf_employee = 0,
    esi_employee = 0,
    professional_tax = 0,
    tds = 0,
    loan_deductions = 0,
    others = 0
  } = salaryStructure;
  
  // Convert all values to numbers to prevent NaN
  const toNum = (val) => Number(val) || 0;
  
  return toNum(pf_employee) + toNum(esi_employee) + toNum(professional_tax) + toNum(tds) + toNum(loan_deductions) + toNum(others);
}

// Calculate net salary
export function calculateNetSalary(salaryStructure) {
  const gross = calculateGrossSalary(salaryStructure);
  const deductions = calculateTotalDeductions(salaryStructure);
  return gross - deductions;
}

// Get status color
export function getStatusColor(status) {
  switch (status?.toLowerCase()) {
    case 'active':
      return 'text-emerald-600 bg-emerald-100';
    case 'resigned':
      return 'text-yellow-600 bg-yellow-100';
    case 'terminated':
      return 'text-red-600 bg-red-100';
    default:
      return 'text-gray-600 bg-gray-100';
  }
}

// Debounce function
export function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}