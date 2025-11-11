import React, { useState, useEffect, useMemo } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
// DropdownMenu imports removed - not used in this component
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Search,
  Plus,
  Eye,
  Edit,
  Trash2,
  Filter,
  Download,
  Upload,
  Users,
  X,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  FileText,
  Mail,
  Phone,
  MapPin,
  Lock,
  Sparkles,
  Calendar,
  Building2,
  User,
  Star,
  TrendingUp,
  Heart,
  Shield,
  AlertCircle,
} from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { formatDate, formatCurrency, getStatusColor, debounce, generateEmployeeId, calculateGrossSalary, calculateTotalDeductions } from "@/lib/utils";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { toast } from "sonner";
import * as XLSX from "xlsx";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const EmployeeList = () => {
  const navigate = useNavigate();
  const { hasFeature, planSlug, planName } = useSubscription();
  const location = useLocation();
  const [employees, setEmployees] = useState([]);
  const [filteredEmployees, setFilteredEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("active");
  const [departmentFilter, setDepartmentFilter] = useState("all");
  const [deleteDialog, setDeleteDialog] = useState({ open: false, employee: null });
  const [bulkDeleteDialog, setBulkDeleteDialog] = useState({ open: false });
  const [selectedEmployees, setSelectedEmployees] = useState(new Set());
  const [importing, setImporting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const [viewDialog, setViewDialog] = useState({ open: false, employee: null, rating: null });
  const [exporting, setExporting] = useState(false);
  const [employeeRatings, setEmployeeRatings] = useState({});
  const [ratingDialog, setRatingDialog] = useState({ open: false, employee: null, rating: null });
  
  // Check if bulk import is enabled
  const canBulkImport = hasFeature('bulk_employee_import');
  
  // Check if export features are available (Professional+ only)
  const canExport = planSlug === 'professional' || planSlug === 'enterprise';
  
  // Employee limit state
  const [employeeLimit, setEmployeeLimit] = useState(null);

  // Fetch employee limit status
  const fetchEmployeeLimit = async () => {
    try {
      const response = await axios.get(`${API}/employees/limit-status`);
      setEmployeeLimit(response.data);
    } catch (error) {
      console.error('Error fetching employee limit:', error);
    }
  };

  useEffect(() => {
    fetchEmployeeLimit();
    fetchEmployees();
  }, []);

  useEffect(() => {
    filterEmployees();
  }, [employees, searchTerm, statusFilter, departmentFilter]);

  const fetchEmployees = async () => {
    try {
      const response = await axios.get(`${API}/employees`);
      setEmployees(response.data);
      console.log(response.data)
      // Fetch ratings for all employees
      fetchAllRatings(response.data);
    } catch (error) {
      console.error('Error fetching employees:', error);
      toast.error('Failed to load employees');
    } finally {
      setLoading(false);
    }
  };

  const fetchAllRatings = async (employeeList) => {
    const ratingsMap = {};
    // Fetch ratings for all active employees
    const activeEmployees = employeeList.filter(emp => emp.status === 'active');
    
    // Get current year for YTD ratings
    const currentYear = new Date().getFullYear();
    
    await Promise.all(
      activeEmployees.map(async (employee) => {
        try {
          // Fetch YTD rating by not passing month parameter (backend will calculate YTD)
          const response = await axios.get(`${API}/employees/${employee.employee_id}/rating`, {
            params: { year: currentYear }
          });
          ratingsMap[employee.employee_id] = response.data;
        } catch (error) {
          console.error(`Error fetching rating for ${employee.employee_id}:`, error);
          // Set default rating if fetch fails
          ratingsMap[employee.employee_id] = null;
        }
      })
    );
    
    setEmployeeRatings(ratingsMap);
  };

  const handleViewRating = async (employee) => {
    const rating = employeeRatings[employee.employee_id];
    setRatingDialog({ open: true, employee, rating });
  };

  // Color coding function based on rating value
  const getRatingColor = (rating) => {
    if (rating >= 4.5) {
      return {
        bg: 'from-primary/5 to-primary/10 dark:from-primary/10 dark:to-primary/20',
        border: 'border-green-200 dark:border-green-700',
        text: 'text-green-600 dark:text-green-400',
        star: 'fill-green-500 text-green-500',
        starInactive: 'text-green-200 dark:text-green-800',
        icon: 'bg-green-100 dark:bg-green-800',
        label: 'Outstanding',
        emoji: '🌟'
      };
    } else if (rating >= 4.0) {
      return {
        bg: 'from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20',
        border: 'border-blue-200 dark:border-blue-700',
        text: 'text-blue-600 dark:text-blue-400',
        star: 'fill-blue-500 text-blue-500',
        starInactive: 'text-blue-200 dark:text-blue-800',
        icon: 'bg-blue-100 dark:bg-blue-800',
        label: 'Excellent',
        emoji: '✨'
      };
    } else if (rating >= 3.5) {
      return {
        bg: 'from-yellow-50 to-amber-50 dark:from-yellow-900/20 dark:to-amber-900/20',
        border: 'border-yellow-200 dark:border-yellow-700',
        text: 'text-yellow-600 dark:text-yellow-400',
        star: 'fill-yellow-500 text-yellow-500',
        starInactive: 'text-yellow-200 dark:text-yellow-800',
        icon: 'bg-yellow-100 dark:bg-yellow-800',
        label: 'Good',
        emoji: '👍'
      };
    } else if (rating >= 3.0) {
      return {
        bg: 'from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20',
        border: 'border-orange-200 dark:border-orange-700',
        text: 'text-orange-600 dark:text-orange-400',
        star: 'fill-orange-500 text-orange-500',
        starInactive: 'text-orange-200 dark:text-orange-800',
        icon: 'bg-orange-100 dark:bg-orange-800',
        label: 'Satisfactory',
        emoji: '👌'
      };
    } else {
      return {
        bg: 'from-red-50 to-rose-50 dark:from-red-900/20 dark:to-rose-900/20',
        border: 'border-red-200 dark:border-red-700',
        text: 'text-red-600 dark:text-red-400',
        star: 'fill-red-500 text-red-500',
        starInactive: 'text-red-200 dark:text-red-800',
        icon: 'bg-red-100 dark:bg-red-800',
        label: 'Needs Improvement',
        emoji: '⚠️'
      };
    }
  };

  const filterEmployees = debounce(() => {
    let filtered = employees;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(
        (employee) =>
          employee.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          employee.employee_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
          employee.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
          employee.department.toLowerCase().includes(searchTerm.toLowerCase()) ||
          employee.designation.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter((employee) => employee.status === statusFilter);
    }

    // Department filter
    if (departmentFilter !== "all") {
      filtered = filtered.filter((employee) => employee.department === departmentFilter);
    }

    setFilteredEmployees(filtered);
  }, 300);

  const handleDeleteEmployee = async () => {
    try {
      await axios.delete(`${API}/employees/${deleteDialog.employee.employee_id}`);
      toast.success('Employee deleted successfully');
      setDeleteDialog({ open: false, employee: null });
      fetchEmployees();
    } catch (error) {
      console.error('Error deleting employee:', error);
      toast.error('Failed to delete employee');
    }
  };

  // Bulk delete functions
  const handleSelectAll = (checked) => {
    if (checked) {
      const allIds = new Set(sortedEmployees.map(emp => emp.employee_id));
      setSelectedEmployees(allIds);
    } else {
      setSelectedEmployees(new Set());
    }
  };

  const handleSelectEmployee = (employeeId, checked) => {
    const newSelection = new Set(selectedEmployees);
    if (checked) {
      newSelection.add(employeeId);
    } else {
      newSelection.delete(employeeId);
    }
    setSelectedEmployees(newSelection);
  };

  const handleBulkDelete = async () => {
    if (selectedEmployees.size === 0) {
      toast.error('No employees selected');
      return;
    }

    setDeleting(true);
    try {
      const response = await axios.delete(`${API}/employees/bulk`, {
        data: {
          employee_ids: Array.from(selectedEmployees)
        }
      });
      
      toast.success(`${response.data.deleted_count} employees deleted successfully`);
      
      if (response.data.errors && response.data.errors.length > 0) {
        response.data.errors.forEach(error => {
          toast.error(error);
        });
      }
      
      setBulkDeleteDialog({ open: false });
      setSelectedEmployees(new Set());
      fetchEmployees();
    } catch (error) {
      console.error('Error bulk deleting employees:', error);
      toast.error(error.response?.data?.detail || 'Failed to delete employees');
    } finally {
      setDeleting(false);
    }
  };

  // Handle view employee with rating fetch
  const handleViewEmployee = async (employee) => {
    setViewDialog({ open: true, employee, rating: null });
    
    try {
      const now = new Date();
      const response = await axios.get(`${API}/employees/${employee.employee_id}/rating`, {
        params: {
          month: now.getMonth() + 1,
          year: now.getFullYear()
        }
      });
      setViewDialog({ open: true, employee, rating: response.data });
    } catch (error) {
      console.error('Error fetching employee rating:', error);
      // Set default rating on error
      setViewDialog({ 
        open: true, 
        employee, 
        rating: {
          rating: 4.0,
          details: {
            attendance_days: 0
          }
        }
      });
    }
  };


  const clearSelection = () => {
    setSelectedEmployees(new Set());
  };

  // Sorting functionality
  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const getSortIcon = (columnKey) => {
    if (sortConfig.key !== columnKey) {
      return <ArrowUpDown className="w-4 h-4" />;
    }
    return sortConfig.direction === 'asc' 
      ? <ArrowUp className="w-4 h-4" />
      : <ArrowDown className="w-4 h-4" />;
  };

  const getNestedValue = (obj, path) => {
    const keys = path.split('.');
    let value = obj;
    for (let key of keys) {
      value = value?.[key];
    }
    return value || '';
  };

  const sortedEmployees = useMemo(() => {
    if (!sortConfig.key) return filteredEmployees;

    return [...filteredEmployees].sort((a, b) => {
      // Special handling for rating column
      if (sortConfig.key === 'rating') {
        const aRating = employeeRatings[a.employee_id]?.rating || 0;
        const bRating = employeeRatings[b.employee_id]?.rating || 0;
        
        if (aRating < bRating) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aRating > bRating) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      }
      // Special handling for salary (computed gross)
      if (sortConfig.key === 'salary') {
        const aSalary = calculateGrossSalary(a.salary_structure || {});
        const bSalary = calculateGrossSalary(b.salary_structure || {});
        if (aSalary < bSalary) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aSalary > bSalary) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      }
      
      // Default sorting for other columns
      const aValue = getNestedValue(a, sortConfig.key);
      const bValue = getNestedValue(b, sortConfig.key);

      if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filteredEmployees, sortConfig, employeeRatings]);

  // Export functionality
  const exportEmployeeData = async () => {
    setExporting(true);
    try {
      const exportData = employees.map(emp => ({
        'Employee ID': emp.employee_id,
        'Name': emp.name,
        'Email': emp.email,
        'Phone': emp.phone || '',
        'Gender': emp.gender || '',
        'Date of Birth': emp.date_of_birth || '',
        'Aadhar Number': emp.aadhar_number || '',
        'PAN Number': emp.pan_number || '',
        'Marital Status': emp.marital_status || '',
        'Address': emp.address || '',
        'Department': emp.department,
        'Designation': emp.designation,
        'Date of Joining': emp.date_of_joining || '',
        'Work Location': emp.work_location || '',
        'Status': emp.status,
        'Resignation Date': emp.resignation_date || '',
        'Termination Date': emp.termination_date || '',
        'Status Reason': emp.status_reason || '',
        'Bank Name': emp.bank_info?.bank_name || '',
        'Account Number': emp.bank_info?.account_number || '',
        'IFSC Code': emp.bank_info?.ifsc_code || '',
        'Branch': emp.bank_info?.branch || '',
        'Basic Salary': emp.salary_structure?.basic_salary || 0,
        'HRA': emp.salary_structure?.house_rent_allowance || emp.salary_structure?.hra || 0,
        'Medical Allowance': emp.salary_structure?.medical_allowance || 0,
        'Leave Travel Allowance': emp.salary_structure?.leave_travel_allowance || emp.salary_structure?.travel_allowance || 0,
        'Bonus': emp.salary_structure?.conveyance_allowance || emp.salary_structure?.food_allowance || 0,
        'Performance Incentive': emp.salary_structure?.performance_incentive || emp.salary_structure?.internet_allowance || 0,
        'Other Benefits': emp.salary_structure?.other_benefits || emp.salary_structure?.special_allowance || 0,
        'PF Employee': emp.salary_structure?.pf_employee || 0,
        'PF Employer': emp.salary_structure?.pf_employer || 0,
        'ESI Employee': emp.salary_structure?.esi_employee || 0,
        'ESI Employer': emp.salary_structure?.esi_employer || 0,
        'Professional Tax': emp.salary_structure?.professional_tax || 0,
        'TDS': emp.salary_structure?.tds || 0,
      }));

      const ws = XLSX.utils.json_to_sheet(exportData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Employees');
      XLSX.writeFile(wb, `Employees_Export_${new Date().toISOString().split('T')[0]}.xlsx`);
      
      toast.success('Employee data exported successfully!');
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export employee data');
    } finally {
      setExporting(false);
    }
  };

  const exportPayrollData = async () => {
    setExporting(true);
    try {
      const response = await axios.get(`${API}/employees/export/payroll`);
      const payrollData = response.data.payroll_data;

      const ws = XLSX.utils.json_to_sheet(payrollData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Payroll');
      XLSX.writeFile(wb, `Payroll_Export_${new Date().toISOString().split('T')[0]}.xlsx`);
      
      toast.success('Payroll data exported successfully!');
    } catch (error) {
      console.error('Payroll export error:', error);
      toast.error('Failed to export payroll data');
    } finally {
      setExporting(false);
    }
  };

  const getInitials = (name) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const departments = [...new Set(employees.map(emp => emp.department))];

  const generateSampleExcel = () => {
    const sampleData = [
      {
        'Employee ID': 'ET-MUM-00001',
        'Name': 'John Doe',
        'Email': 'john.doe@company.com',
        'Phone': '9876543210',
        'Gender': 'male',
        'Date of Birth': '1990-01-15',
        'Aadhar Number': '123456789012',
        'PAN Number': 'ABCDE1234F',
        'Marital Status': 'single',
        'Address': '123 Main Street, Mumbai, Maharashtra',
        'Emergency Contact Name': 'Jane Doe',
        'Emergency Contact Phone': '9876543211',
        'Blood Group': 'O+',
        'Department': 'Software Development',
        'Designation': 'Senior Developer',
        'Date of Joining': '2024-01-15',
        'Work Location': 'Mumbai Office',
        'Status': 'active',
        'Resignation Date': '',
        'Termination Date': '',
        'Status Reason': '',
        'Bank Name': 'HDFC Bank',
        'Account Number': '50100123456789',
        'IFSC Code': 'HDFC0001234',
        'Branch': 'Andheri East'
      }
    ];

    const ws = XLSX.utils.json_to_sheet(sampleData);
    
    // Set column widths for better readability (25 columns total)
    const columnWidths = [
      { wch: 15 }, // Employee ID
      { wch: 20 }, // Name
      { wch: 28 }, // Email
      { wch: 15 }, // Phone
      { wch: 10 }, // Gender
      { wch: 15 }, // Date of Birth
      { wch: 18 }, // Aadhar Number
      { wch: 12 }, // PAN Number
      { wch: 15 }, // Marital Status
      { wch: 40 }, // Address
      { wch: 25 }, // Emergency Contact Name
      { wch: 22 }, // Emergency Contact Phone
      { wch: 12 }, // Blood Group
      { wch: 25 }, // Department
      { wch: 25 }, // Designation
      { wch: 18 }, // Date of Joining
      { wch: 20 }, // Work Location
      { wch: 12 }, // Status
      { wch: 18 }, // Resignation Date
      { wch: 18 }, // Termination Date
      { wch: 30 }, // Status Reason
      { wch: 20 }, // Bank Name
      { wch: 20 }, // Account Number
      { wch: 15 }, // IFSC Code
      { wch: 20 }  // Branch
    ];
    ws['!cols'] = columnWidths;
    
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Employees");
    
    // Add instructions sheet
    const instructions = [
      ['Employee Import Template - Complete (25 Columns)'],
      [''],
      ['SECTION', 'FIELD', 'DESCRIPTION', 'EXAMPLE', 'REQUIRED'],
      ['Personal', 'Employee ID', 'Unique employee identifier', 'ET-MUM-00001', 'Yes'],
      ['Personal', 'Name', 'Full name of employee', 'John Doe', 'Yes'],
      ['Personal', 'Email', 'Work email address', 'john.doe@company.com', 'Yes'],
      ['Personal', 'Phone', 'Contact number', '9876543210', 'Yes'],
      ['Personal', 'Gender', 'Gender: male, female, other', 'male', 'Yes'],
      ['Personal', 'Date of Birth', 'Format: YYYY-MM-DD', '1990-01-15', 'Yes'],
      ['Personal', 'Aadhar Number', '12-digit Aadhar number', '123456789012', 'No'],
      ['Personal', 'PAN Number', '10-character PAN', 'ABCDE1234F', 'No'],
      ['Personal', 'Marital Status', 'single, married, divorced, widowed', 'single', 'No'],
      ['Personal', 'Address', 'Complete address', '123 Main St, Mumbai', 'No'],
      ['Emergency', 'Emergency Contact Name', 'Emergency contact person', 'Jane Doe', 'No'],
      ['Emergency', 'Emergency Contact Phone', 'Emergency contact number', '9876543211', 'No'],
      ['Emergency', 'Blood Group', 'Blood group (A+, B+, O+, AB+, etc)', 'O+', 'No'],
      ['Job', 'Department', 'Department name', 'Software Development', 'Yes'],
      ['Job', 'Designation', 'Job title/position', 'Senior Developer', 'Yes'],
      ['Job', 'Date of Joining', 'Format: YYYY-MM-DD', '2024-01-15', 'Yes'],
      ['Job', 'Work Location', 'Office location', 'Mumbai Office', 'No'],
      ['Status', 'Status', 'active, inactive, resigned, terminated', 'active', 'No (defaults to active)'],
      ['Status', 'Resignation Date', 'If resigned: YYYY-MM-DD', '2024-12-31', 'No'],
      ['Status', 'Termination Date', 'If terminated: YYYY-MM-DD', '', 'No'],
      ['Status', 'Status Reason', 'Reason for resignation/termination', 'Personal reasons', 'No'],
      ['Bank', 'Bank Name', 'Name of the bank', 'HDFC Bank', 'No'],
      ['Bank', 'Account Number', 'Bank account number', '50100123456789', 'No'],
      ['Bank', 'IFSC Code', 'Bank IFSC code', 'HDFC0001234', 'No'],
      ['Bank', 'Branch', 'Bank branch name', 'Andheri East', 'No'],
      [''],
      ['NOTE', 'Salary details can be configured later from the Edit Employee page', '', '', ''],
      [''],
      ['IMPORTANT NOTES:'],
      ['1. All date fields must be in YYYY-MM-DD format (e.g., 2024-01-15)'],
      ['2. Employee ID must be unique and follow the format: ET-LOCATION-XXXXX'],
      ['3. Leave blank for optional fields if not applicable'],
      ['4. Gender must be one of: male, female, other'],
      ['5. Marital Status must be one of: single, married, divorced, widowed'],
      ['6. Status must be one of: active, inactive, resigned, terminated (defaults to active if blank)'],
      ['7. Resignation Date and Termination Date are required only if Status is resigned or terminated'],
      ['8. After import, configure salary details from Edit Employee page'],
      ['9. If importing multiple employees, add new rows below the sample data'],
      ['10. Do not change column headers - they must match exactly']
    ];
    
    const ws2 = XLSX.utils.aoa_to_sheet(instructions);
    ws2['!cols'] = [{ wch: 20 }, { wch: 30 }, { wch: 50 }, { wch: 25 }, { wch: 10 }];
    XLSX.utils.book_append_sheet(wb, ws2, 'Instructions');
    
    XLSX.writeFile(wb, "Employee_Import_Template.xlsx");
    toast.success("Complete template with 25 columns downloaded! Fill employee data and upload.");
  };

  const handleExcelImport = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
      toast.error('Please select a valid Excel file (.xlsx or .xls)');
      return;
    }

    setImporting(true);
    const reader = new FileReader();
    
    reader.onload = async (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);

        if (jsonData.length === 0) {
          toast.error('Excel file is empty');
          setImporting(false);
          return;
        }

        // Check employee limit before import
        let limitedJsonData = jsonData;
        try {
          const limitResponse = await axios.get(`${API}/employees/limit-status`);
          const { limit, current_count, remaining } = limitResponse.data;
          
          if (limit !== -1 && jsonData.length > remaining) {
            limitedJsonData = jsonData.slice(0, remaining);
            toast.warning(
              `Your plan allows ${limit} employees total. You have ${current_count}, so only importing first ${remaining} employees (${jsonData.length - remaining} skipped). Upgrade to import all.`,
              { duration: 8000 }
            );
          }
        } catch (error) {
          console.error('Error checking employee limit:', error);
        }

        // Process and validate each row
        const processedEmployees = [];
        const validationErrors = [];

        for (let i = 0; i < limitedJsonData.length; i++) {
          const row = limitedJsonData[i];
          const rowNum = i + 2; // Excel row number (1-indexed + header)

          try {
            // Validate required fields
            const requiredFields = [
              { field: 'Name', value: row['Name'] },
              { field: 'Email', value: row['Email'] },
              { field: 'Phone', value: row['Phone'] },
              { field: 'Gender', value: row['Gender'] },
              { field: 'Date of Birth', value: row['Date of Birth'] },
              { field: 'Department', value: row['Department'] },
              { field: 'Designation', value: row['Designation'] },
              { field: 'Date of Joining', value: row['Date of Joining'] }
            ];

            const missingFields = requiredFields.filter(f => !f.value).map(f => f.field);
            if (missingFields.length > 0) {
              validationErrors.push(`Row ${rowNum}: Missing required fields: ${missingFields.join(', ')}`);
              continue;
            }

            // Validate email format
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(row['Email'])) {
              validationErrors.push(`Row ${rowNum}: Invalid email format - ${row['Email']}`);
              continue;
            }

            // Validate gender
            const validGenders = ['male', 'female', 'other'];
            if (!validGenders.includes(row['Gender']?.toLowerCase())) {
              validationErrors.push(`Row ${rowNum}: Invalid gender. Must be: male, female, or other`);
              continue;
            }

            // Validate date formats
            const dateFields = [
              { name: 'Date of Birth', value: row['Date of Birth'] },
              { name: 'Date of Joining', value: row['Date of Joining'] }
            ];
            
            let dateError = false;
            for (const dateField of dateFields) {
              if (dateField.value && !/^\d{4}-\d{2}-\d{2}$/.test(dateField.value)) {
                validationErrors.push(`Row ${rowNum}: Invalid ${dateField.name} format. Use YYYY-MM-DD (e.g., 2024-01-15)`);
                dateError = true;
                break;
              }
            }
            if (dateError) continue;

            // Validate Status if provided
            const validStatuses = ['active', 'inactive', 'resigned', 'terminated'];
            const employeeStatus = row['Status']?.toLowerCase() || 'active';
            if (!validStatuses.includes(employeeStatus)) {
              validationErrors.push(`Row ${rowNum}: Invalid Status. Must be: active, inactive, resigned, or terminated`);
              continue;
            }

            // Check if resignation/termination dates are required
            if (employeeStatus === 'resigned' && !row['Resignation Date']) {
              validationErrors.push(`Row ${rowNum}: Resignation Date is required when Status is 'resigned'`);
              continue;
            }
            if (employeeStatus === 'terminated' && !row['Termination Date']) {
              validationErrors.push(`Row ${rowNum}: Termination Date is required when Status is 'terminated'`);
              continue;
            }

            const employee = {
              employee_id: row['Employee ID'] || generateEmployeeId(),
              name: row['Name'],
              email: row['Email'],
              phone: row['Phone'],
              gender: row['Gender']?.toLowerCase(),
              date_of_birth: row['Date of Birth'],
              aadhar_number: row['Aadhar Number'] || '',
              pan_number: row['PAN Number'] || '',
              marital_status: row['Marital Status']?.toLowerCase() || 'single',
              address: row['Address'] || '',
              emergency_contact: {
                name: row['Emergency Contact Name'] || '',
                phone: row['Emergency Contact Phone'] || '',
                blood_group: row['Blood Group'] || ''
              },
              department: row['Department'],
              designation: row['Designation'],
              date_of_joining: row['Date of Joining'],
              work_location: row['Work Location'] || '',
              status: employeeStatus,
              resignation_date: row['Resignation Date'] || null,
              termination_date: row['Termination Date'] || null,
              status_reason: row['Status Reason'] || '',
              bank_info: {
                bank_name: row['Bank Name'] || '',
                account_number: row['Account Number'] || '',
                ifsc_code: row['IFSC Code'] || '',
                branch: row['Branch'] || ''
              }
            };

            processedEmployees.push(employee);
          } catch (error) {
            validationErrors.push(`Row ${rowNum}: Unexpected error - ${error.message}`);
          }
        }

        // Show validation errors if any
        if (validationErrors.length > 0) {
          const errorMessage = validationErrors.slice(0, 5).join('\n');
          const moreErrors = validationErrors.length > 5 ? `\n...and ${validationErrors.length - 5} more errors` : '';
          toast.error(
            <div>
              <strong>Import Validation Errors:</strong>
              <div style={{ whiteSpace: 'pre-line', marginTop: '8px', fontSize: '12px' }}>
                {errorMessage}{moreErrors}
              </div>
            </div>,
            { duration: 10000 }
          );
        }

        if (processedEmployees.length === 0) {
          toast.error('No valid employee data found to import. Please check the errors above.');
          setImporting(false);
          return;
        }

        // Import employees one by one
        let successCount = 0;
        const importErrors = [];

        for (const employee of processedEmployees) {
          try {
            await axios.post(`${API}/employees`, employee);
            successCount++;
          } catch (error) {
            const errorMsg = error.response?.data?.detail || error.message;
            importErrors.push(`${employee.name}: ${errorMsg}`);
            
            // If limit reached, stop importing
            if (error.response?.status === 403 && errorMsg.includes('limit')) {
              break;
            }
          }
        }

        // Show final results
        if (successCount > 0) {
          toast.success(`✅ Successfully imported ${successCount} employee(s)`);
          fetchEmployees(); // Refresh the list
          fetchEmployeeLimit(); // Refresh limit status
        }

        if (importErrors.length > 0) {
          const errorMessage = importErrors.slice(0, 3).join('\n');
          const moreErrors = importErrors.length > 3 ? `\n...and ${importErrors.length - 3} more errors` : '';
          toast.error(
            <div>
              <strong>Import Failed for {importErrors.length} employee(s):</strong>
              <div style={{ whiteSpace: 'pre-line', marginTop: '8px', fontSize: '12px' }}>
                {errorMessage}{moreErrors}
              </div>
            </div>,
            { duration: 10000 }
          );
        }

      } catch (error) {
        console.error('Error processing Excel file:', error);
        toast.error('Error processing Excel file. Please check the format.');
      } finally {
        setImporting(false);
        // Reset file input
        event.target.value = '';
      }
    };

    reader.readAsArrayBuffer(file);
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-10 bg-gray-200 rounded-lg w-64"></div>
        <div className="h-96 bg-gray-200 rounded-lg"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="employee-list">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
            Employees
          </h1>
          <p className="text-gray-500 dark:text-gray-400">
            Manage your organization's employees
          </p>
        </div>
        <div className="flex space-x-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <span>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => {
                      if (!canExport) {
                        navigate('/upgrade-required', { state: { from: location.pathname, requiredFeature: 'custom_reports', currentPlan: planName, currentPlanSlug: planSlug } });
                        return;
                      }
                      exportEmployeeData();
                    }}
                    disabled={exporting}
                    className={`${
                      'dark:border-gray-600 dark:text-gray-300'
                    }`}
                  >
                    {!canExport && <Lock className="w-4 h-4 mr-2" />}
                    {exporting ? (
                      <>
                        <div className="w-4 h-4 mr-2 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600"></div>
                        Exporting...
                      </>
                    ) : (
                      <>
                        {canExport && <FileText className="w-4 h-4 mr-2 dark:text-gray-400" />}
                        Export Employees
                        {!canExport && <Sparkles className="w-4 h-4 ml-2" />}
                      </>
                    )}
                  </Button>
                </span>
              </TooltipTrigger>
              {!canExport && (
                <TooltipContent>
                  <p className="font-semibold">Export Employees - Professional Feature</p>
                  <p className="text-xs">Upgrade to Professional or Enterprise to export employee data</p>
                </TooltipContent>
              )}
            </Tooltip>
          </TooltipProvider>
          
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <span>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => {
                      if (!canExport) {
                        navigate('/upgrade-required', { state: { from: location.pathname, requiredFeature: 'payroll_analytics', currentPlan: planName, currentPlanSlug: planSlug } });
                        return;
                      }
                      exportPayrollData();
                    }}
                    disabled={exporting}
                    className={`${
                      'dark:border-gray-600 dark:text-gray-300'
                    }`}
                  >
                    {!canExport && <Lock className="w-4 h-4 mr-2" />}
                    {exporting ? (
                      <>
                        <div className="w-4 h-4 mr-2 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600"></div>
                        Exporting...
                      </>
                    ) : (
                      <>
                        {canExport && <FileText className="w-4 h-4 mr-2 dark:text-gray-400" />}
                        Export Payroll
                        {!canExport && <Sparkles className="w-4 h-4 ml-2" />}
                      </>
                    )}
                  </Button>
                </span>
              </TooltipTrigger>
              {!canExport && (
                <TooltipContent>
                  <p className="font-semibold">Export Payroll - Professional Feature</p>
                  <p className="text-xs">Upgrade to Professional or Enterprise to export payroll data</p>
                </TooltipContent>
              )}
            </Tooltip>
          </TooltipProvider>
          
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <span>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => {
                      if (!canExport) {
                        navigate('/upgrade-required', { state: { from: location.pathname, requiredFeature: 'custom_reports', currentPlan: planName, currentPlanSlug: planSlug } });
                        return;
                      }
                      generateSampleExcel();
                    }}
                    className={`${
                      'dark:border-gray-600 dark:text-gray-300'
                    }`}
                  >
                    {!canExport && <Lock className="w-4 h-4 mr-2" />}
                    {canExport && <Download className="w-4 h-4 mr-2 dark:text-gray-400" />}
                    Template
                    {!canExport && <Sparkles className="w-4 h-4 ml-2" />}
                  </Button>
                </span>
              </TooltipTrigger>
              {!canExport && (
                <TooltipContent>
                  <p className="font-semibold">Download Template - Professional Feature</p>
                  <p className="text-xs">Upgrade to Professional or Enterprise to download import template</p>
                </TooltipContent>
              )}
            </Tooltip>
          </TooltipProvider>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <span>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className={`${
                      !canBulkImport 
                        ? 'dark:border-gray-600 dark:text-gray-300 cursor-pointer' 
                        : 'dark:border-gray-600 dark:text-gray-300 cursor-pointer'
                    }`}
                    asChild={canBulkImport}
                    onClick={() => {
                      if (!canBulkImport) {
                        navigate('/upgrade-required', { state: { from: location.pathname, requiredFeature: 'bulk_employee_import', currentPlan: planName, currentPlanSlug: planSlug } });
                      }
                    }}
                  >
                    <label 
                      htmlFor={canBulkImport ? "excel-import" : undefined} 
                      className={`flex items-center ${canBulkImport ? 'cursor-pointer' : 'cursor-pointer'}`}
                    >
                      {importing ? (
                        <>
                          <div className="w-4 h-4 mr-2 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600"></div>
                          Importing...
                        </>
                      ) : (
                        <>
                          {!canBulkImport && <Lock className="w-4 h-4 mr-2" />}
                          {canBulkImport && <Upload className="w-4 h-4 mr-2 dark:text-gray-400" />}
                          Import Excel
                          {!canBulkImport && <Sparkles className="w-4 h-4 ml-2" />}
                        </>
                      )}
                    </label>
                  </Button>
                </span>
              </TooltipTrigger>
              {!canBulkImport && (
                <TooltipContent>
                  <p className="font-semibold">Bulk Import - Professional Feature</p>
                  <p className="text-xs">Upgrade to Professional or Enterprise to import employees from Excel</p>
                </TooltipContent>
              )}
            </Tooltip>
          </TooltipProvider>
          {canBulkImport && (
            <input
              id="excel-import"
              type="file"
              accept=".xlsx,.xls"
              onChange={handleExcelImport}
              className="hidden"
              disabled={importing}
            />
          )}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <span>
                  <Button 
                    size="sm" 
                    className={`${
                      employeeLimit && !employeeLimit.can_add_more ? '' : ''
                    }`}
                    onClick={() => {
                      if (employeeLimit && !employeeLimit.can_add_more) {
                        navigate('/upgrade-required', { state: { from: location.pathname, requiredFeature: 'employee_limit', currentPlan: planName, currentPlanSlug: planSlug } });
                        return;
                      }
                      navigate('/employees/new');
                    }}
                  >
                    {employeeLimit && !employeeLimit.can_add_more && <Lock className="w-4 h-4 mr-2" />}
                    <Plus className="w-4 h-4 mr-2" />
                    Add Employee
                    {employeeLimit && !employeeLimit.can_add_more && <AlertCircle className="w-4 h-4 ml-2" />}
                  </Button>
                </span>
              </TooltipTrigger>
              {employeeLimit && !employeeLimit.can_add_more && (
                <TooltipContent>
                  <p className="font-semibold">Employee Limit Reached</p>
                  <p className="text-xs">{employeeLimit.message}</p>
                  <p className="text-xs mt-1">Upgrade your plan to add more employees</p>
                </TooltipContent>
              )}
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-5">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Users className="h-8 w-8 text-primary" />
              <div>
                <p className="text-2xl font-bold">{employees.length}</p>
                <p className="text-xs text-gray-500">Total Employees</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                <div className="w-4 h-4 bg-primary rounded-full"></div>
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {employees.filter(emp => emp.status === 'active').length}
                </p>
                <p className="text-xs text-gray-500">Active</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                <div className="w-4 h-4 bg-yellow-600 rounded-full"></div>
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {employees.filter(emp => emp.status === 'resigned').length}
                </p>
                <p className="text-xs text-gray-500">Resigned</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                <div className="w-4 h-4 bg-red-600 rounded-full"></div>
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {employees.filter(emp => emp.status === 'terminated').length}
                </p>
                <p className="text-xs text-gray-500">Terminated</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <div className="w-4 h-4 bg-blue-600 rounded-full"></div>
              </div>
              <div>
                <p className="text-2xl font-bold">{departments.length}</p>
                <p className="text-xs text-gray-500">Departments</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <CardTitle>Employee Directory</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search employees by name, ID, email, or department..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                  data-testid="search-input"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="resigned">Resigned</SelectItem>
                  <SelectItem value="terminated">Terminated</SelectItem>
                </SelectContent>
              </Select>
              <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Department" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Departments</SelectItem>
                  {departments.map(dept => (
                    <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Bulk Actions Bar */}
          {selectedEmployees.size > 0 && (
            <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-500/30 rounded-lg flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <span className="text-sm font-medium text-blue-800 dark:text-blue-300">
                  {selectedEmployees.size} employee{selectedEmployees.size === 1 ? '' : 's'} selected
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearSelection}
                >
                  <X className="w-4 h-4 mr-2" />
                  Clear Selection
                </Button>
              </div>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => setBulkDeleteDialog({ open: true })}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete Selected
              </Button>
            </div>
          )}

          {/* Employee Table */}
          <div className="border border-gray-200 dark:border-gray-700 rounded-lg">
            <Table>
              <TableHeader>
                <TableRow className="border-b border-gray-200 dark:border-gray-700">
                  <TableHead className="w-12 text-gray-700 dark:text-gray-300">
                    <Checkbox
                      checked={
                        sortedEmployees.length > 0 && 
                        sortedEmployees.every(emp => selectedEmployees.has(emp.employee_id))
                      }
                      onCheckedChange={handleSelectAll}
                    />
                  </TableHead>
                  <TableHead 
                    className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300"
                    onClick={() => handleSort('name')}
                  >
                    <div className="flex items-center space-x-2">
                      <span>Employee</span>
                      {getSortIcon('name')}
                    </div>
                  </TableHead>
                  <TableHead 
                    className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300"
                    onClick={() => handleSort('employee_id')}
                  >
                    <div className="flex items-center space-x-2">
                      <span>Employee ID</span>
                      {getSortIcon('employee_id')}
                    </div>
                  </TableHead>
                  <TableHead 
                    className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300"
                    onClick={() => handleSort('department')}
                  >
                    <div className="flex items-center space-x-2">
                      <span>Job Details</span>
                      {getSortIcon('department')}
                    </div>
                  </TableHead>
                  <TableHead 
                    className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300"
                    onClick={() => handleSort('date_of_joining')}
                  >
                    <div className="flex items-center space-x-2">
                      <span>Dates</span>
                      {getSortIcon('date_of_joining')}
                    </div>
                  </TableHead>
                  <TableHead 
                    className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300"
                    onClick={() => handleSort('status')}
                  >
                    <div className="flex items-center space-x-2">
                      <span>Status</span>
                      {getSortIcon('status')}
                    </div>
                  </TableHead>
                  <TableHead 
                    className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300"
                    onClick={() => handleSort('salary')}
                  >
                    <div className="flex items-center space-x-2">
                      <span>Salary</span>
                      {getSortIcon('salary')}
                    </div>
                  </TableHead>
                  <TableHead 
                    className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300"
                    onClick={() => handleSort('rating')}
                  >
                    <div className="flex items-center space-x-2">
                      <span>Rating</span>
                      {getSortIcon('rating')}
                    </div>
                  </TableHead>
                  <TableHead className="text-right text-gray-700 dark:text-gray-300">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedEmployees.length === 0 ? (
                  <TableRow className="border-b border-gray-200 dark:border-gray-700">
                    <TableCell colSpan={10} className="text-center py-8 text-gray-500 dark:text-gray-400">
                      <div className="flex flex-col items-center space-y-2">
                        <Users className="h-8 w-8 text-gray-400" />
                        <p className="text-gray-500">No employees found</p>
                        {employees.length === 0 ? (
                          <Button size="sm" asChild>
                            <Link to="/employees/new">
                              Add your first employee
                            </Link>
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSearchTerm("");
                              setStatusFilter("all");
                              setDepartmentFilter("all");
                            }}
                          >
                            Clear filters
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  sortedEmployees.map((employee) => (
                    <TableRow key={employee.id} className="border-b border-gray-200 dark:border-gray-700">
                      <TableCell>
                        <Checkbox
                          checked={selectedEmployees.has(employee.employee_id)}
                          onCheckedChange={(checked) => 
                            handleSelectEmployee(employee.employee_id, checked)
                          }
                        />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-3">
                          <Avatar>
                            <AvatarFallback className="bg-primary/10 dark:bg-primary/20 text-primary">
                              {getInitials(employee.name)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium text-gray-900 dark:text-gray-200">{employee.name}</div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">{employee.email}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-gray-800 dark:text-gray-300">{employee.employee_id}</TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium text-sm text-gray-900 dark:text-gray-200">{employee.department}</div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">{employee.designation}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium text-sm text-gray-900 dark:text-gray-200">
                            {employee.date_of_joining ? formatDate(employee.date_of_joining) : 'Not set'}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {employee.status === 'active' 
                              ? 'Active' 
                              : employee.status === 'resigned' && employee.resignation_date
                                ? `Left: ${formatDate(employee.resignation_date)}`
                                : employee.status === 'terminated' && employee.termination_date
                                  ? `Left: ${formatDate(employee.termination_date)}`
                                  : `Status: ${employee.status}`}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(employee.status)}>
                          {employee.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-gray-800 dark:text-gray-300">{formatCurrency(calculateGrossSalary(employee.salary_structure))}</TableCell>
                      <TableCell>
                        {employee.status === 'active' ? (
                          employeeRatings[employee.employee_id] ? (
                            (() => {
                              const colors = getRatingColor(employeeRatings[employee.employee_id].rating);
                              return (
                                <button
                                  onClick={() => handleViewRating(employee)}
                                  className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-gradient-to-r ${colors.bg} border ${colors.border} hover:shadow-md transition-all cursor-pointer group`}
                                >
                                  <div className="flex items-center space-x-1">
                                    <Star className={`h-4 w-4 ${colors.star}`} />
                                    <span className={`font-bold text-lg ${colors.text}`}>
                                      {employeeRatings[employee.employee_id].rating.toFixed(2)}
                                    </span>
                                  </div>
                                  <div className="flex items-center space-x-0.5">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                      <Star
                                        key={star}
                                        className={`h-3 w-3 ${
                                          star <= Math.round(employeeRatings[employee.employee_id].rating)
                                            ? colors.star
                                            : colors.starInactive
                                        }`}
                                      />
                                    ))}
                                  </div>
                                  <Eye className={`h-3 w-3 ${colors.text} opacity-0 group-hover:opacity-100 transition-opacity`} />
                                </button>
                              );
                            })()
                          ) : (
                            <span className="text-sm text-gray-400 dark:text-gray-500 italic">Loading...</span>
                          )
                        ) : (
                          <span className="text-sm text-gray-400 dark:text-gray-500 italic">N/A</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end space-x-2">
                          {/* View Details Button */}
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 hover:bg-blue-100 hover:text-blue-600"
                            onClick={() => handleViewEmployee(employee)}
                            title="View Details"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          
                          {/* Edit Employee Button */}
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 hover:bg-primary/10 hover:text-primary"
                            onClick={() => navigate(`/employees/${employee.employee_id}/edit`)}
                            title="Edit Employee"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          
                          {/* Delete Employee Button */}
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 hover:bg-red-100 hover:text-red-600"
                            onClick={() => setDeleteDialog({ open: true, employee })}
                            title="Delete Employee"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialog.open} onOpenChange={(open) => !open && setDeleteDialog({ open: false, employee: null })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the employee
              <strong> {deleteDialog.employee?.name} </strong>
              and remove their data from our servers.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={handleDeleteEmployee}
              data-testid="confirm-delete-btn"
            >
              Delete Employee
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Bulk Delete Dialog */}
      <AlertDialog open={bulkDeleteDialog.open} onOpenChange={(open) => setBulkDeleteDialog({ open })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center space-x-2">
              <Trash2 className="h-5 w-5 text-red-600" />
              <span>Delete Multiple Employees</span>
            </AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete 
              <strong> {selectedEmployees.size} employee{selectedEmployees.size === 1 ? '' : 's'} </strong>
              and remove their data from our servers.
              
              <div className="mt-3 p-3 bg-gray-50 rounded-md">
                <p className="text-sm text-gray-600 mb-2">Employees to be deleted:</p>
                <div className="max-h-32 overflow-y-auto">
                  {Array.from(selectedEmployees).map((employeeId) => {
                    const emp = employees.find(e => e.employee_id === employeeId);
                    return emp ? (
                      <div key={employeeId} className="text-sm">
                        • {emp.name} ({emp.employee_id})
                      </div>
                    ) : null;
                  })}
                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={handleBulkDelete}
              disabled={deleting}
            >
              {deleting ? (
                <>
                  <div className="w-4 h-4 mr-2 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete {selectedEmployees.size} Employee{selectedEmployees.size === 1 ? '' : 's'}
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* View Employee Details Modal */}
      <Dialog open={viewDialog.open} onOpenChange={(open) => setViewDialog({ open, employee: open ? viewDialog.employee : null })}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-3">
              <Avatar className="h-12 w-12">
                <AvatarFallback className="bg-primary/10 text-primary text-lg">
                  {viewDialog.employee ? getInitials(viewDialog.employee.name) : ''}
                </AvatarFallback>
              </Avatar>
              <div>
                <h2 className="text-xl font-semibold">{viewDialog.employee?.name}</h2>
                <p className="text-sm text-gray-500">{viewDialog.employee?.employee_id}</p>
              </div>
            </DialogTitle>
          </DialogHeader>
          
          {viewDialog.employee && (
            <div className="grid gap-6 py-4">
              {/* Personal Information */}
              <div>
                <h3 className="text-lg font-semibold mb-3 flex items-center space-x-2 text-gray-900 dark:text-gray-100">
                  <User className="h-5 w-5" />
                  <span>Personal Information</span>
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <Mail className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Email</p>
                      <p className="font-medium text-gray-900 dark:text-gray-200">{viewDialog.employee.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Phone className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Phone</p>
                      <p className="font-medium text-gray-900 dark:text-gray-200">{viewDialog.employee.phone || 'Not provided'}</p>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Gender</p>
                    <p className="font-medium text-gray-900 dark:text-gray-200">{viewDialog.employee.gender ? viewDialog.employee.gender.charAt(0).toUpperCase() + viewDialog.employee.gender.slice(1) : 'Not specified'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Date of Birth</p>
                    <p className="font-medium text-gray-900 dark:text-gray-200">{viewDialog.employee.date_of_birth ? formatDate(viewDialog.employee.date_of_birth) : 'Not provided'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Marital Status</p>
                    <p className="font-medium text-gray-900 dark:text-gray-200">{viewDialog.employee.marital_status ? viewDialog.employee.marital_status.charAt(0).toUpperCase() + viewDialog.employee.marital_status.slice(1) : 'Not specified'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">PAN Number</p>
                    <p className="font-medium font-mono text-gray-900 dark:text-gray-200">{viewDialog.employee.pan_number || 'Not provided'}</p>
                  </div>
                </div>
                {viewDialog.employee.address && (
                  <div className="mt-4 bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                    <div className="flex items-start space-x-2">
                      <MapPin className="h-4 w-4 text-gray-400 dark:text-gray-500 mt-1" />
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Address</p>
                        <p className="font-medium text-gray-900 dark:text-gray-200">{viewDialog.employee.address}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Emergency Contact & Medical Information */}
              <div>
                <h3 className="text-lg font-semibold mb-3 flex items-center space-x-2 text-gray-900 dark:text-gray-100">
                  <Shield className="h-5 w-5" />
                  <span>Emergency Contact & Medical Information</span>
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <User className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Emergency Contact Name</p>
                      <p className="font-medium text-gray-900 dark:text-gray-200">{viewDialog.employee.emergency_contact_name || 'Not provided'}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Phone className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Emergency Contact Phone</p>
                      <p className="font-medium text-gray-900 dark:text-gray-200">{viewDialog.employee.emergency_contact_phone || 'Not provided'}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Heart className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Blood Group</p>
                      <p className="font-medium text-gray-900 dark:text-gray-200">{viewDialog.employee.blood_group || 'Not provided'}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Job Information */}
              <div>
                <h3 className="text-lg font-semibold mb-3 flex items-center space-x-2 text-gray-900 dark:text-gray-100">
                  <Building2 className="h-5 w-5" />
                  <span>Job Information</span>
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Department</p>
                    <p className="font-medium text-gray-900 dark:text-gray-200">{viewDialog.employee.department}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Designation</p>
                    <p className="font-medium text-gray-900 dark:text-gray-200">{viewDialog.employee.designation}</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Date of Joining</p>
                      <p className="font-medium text-gray-900 dark:text-gray-200">{viewDialog.employee.date_of_joining ? formatDate(viewDialog.employee.date_of_joining) : 'Not set'}</p>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Work Location</p>
                    <p className="font-medium text-gray-900 dark:text-gray-200">{viewDialog.employee.work_location || 'Not specified'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Status</p>
                    <Badge className={getStatusColor(viewDialog.employee.status)}>
                      {viewDialog.employee.status}
                    </Badge>
                  </div>
                  {(viewDialog.employee.resignation_date || viewDialog.employee.termination_date) && (
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {viewDialog.employee.status === 'resigned' ? 'Resignation Date' : 'Termination Date'}
                      </p>
                      <p className="font-medium text-gray-900 dark:text-gray-200">
                        {formatDate(viewDialog.employee.resignation_date || viewDialog.employee.termination_date)}
                      </p>
                    </div>
                  )}
                </div>

              {/* Performance Rating */}
              <div>
                <h3 className="text-lg font-semibold mb-3 flex items-center space-x-2 text-gray-900 dark:text-gray-100">
                  <TrendingUp className="h-5 w-5" />
                  <span>Performance Rating</span>
                </h3>
                <div className="bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20 p-6 rounded-lg border border-orange-200 dark:border-orange-700">
                  {viewDialog.rating ? (
                    <div className="flex items-center space-x-6">
                      <div className="flex flex-col items-center">
                        <div className="text-5xl font-bold text-orange-600 dark:text-orange-400">
                          {viewDialog.rating.rating.toFixed(2)}
                        </div>
                        <div className="flex items-center space-x-1 mt-2">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              className={`h-5 w-5 ${
                                star <= Math.round(viewDialog.rating.rating)
                                  ? 'fill-orange-500 text-orange-500'
                                  : 'text-gray-300 dark:text-gray-600'
                              }`}
                            />
                          ))}
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                          Based on {viewDialog.rating.details.attendance_days} days attendance
                        </p>
                      </div>
                      <div className="flex-1 grid grid-cols-2 gap-4">
                        <div className="bg-white dark:bg-gray-800 p-3 rounded-lg">
                          <p className="text-xs text-gray-500 dark:text-gray-400">Late Arrivals</p>
                          <p className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
                            {viewDialog.rating.details.late_arrivals}
                          </p>
                          <p className="text-xs text-red-600 dark:text-red-400">
                            -{(viewDialog.rating.details.late_arrivals * 0.05).toFixed(2)} pts
                          </p>
                        </div>
                        <div className="bg-white dark:bg-gray-800 p-3 rounded-lg">
                          <p className="text-xs text-gray-500 dark:text-gray-400">OT Hours</p>
                          <p className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
                            {viewDialog.rating.details.ot_hours}
                          </p>
                          <p className="text-xs text-green-600 dark:text-green-400">
                            +{(viewDialog.rating.details.ot_hours * 0.02).toFixed(2)} pts
                          </p>
                        </div>
                        <div className="bg-white dark:bg-gray-800 p-3 rounded-lg col-span-2">
                          <p className="text-xs text-gray-500 dark:text-gray-400">Punctuality Bonus</p>
                          <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                            {viewDialog.rating.details.punctuality_bonus > 0 ? '✓ Earned' : '✗ Not Earned'}
                          </p>
                          <p className="text-xs text-green-600 dark:text-green-400">
                            {viewDialog.rating.details.punctuality_bonus > 0 ? '+0.30 pts (No late arrivals this month)' : '0 pts'}
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center py-8">
                      <p className="text-gray-500 dark:text-gray-400">Loading rating...</p>
                    </div>
                  )}
                </div>
              </div>

                {viewDialog.employee.status_reason && (
                  <div className="mt-4 bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg border border-yellow-200 dark:border-yellow-700">
                    <p className="text-sm text-gray-500 dark:text-gray-400">Status Reason</p>
                    <p className="font-medium text-gray-900 dark:text-gray-200">{viewDialog.employee.status_reason}</p>
                  </div>
                )}
              </div>

              {/* Bank Information */}
              {viewDialog.employee.bank_info && (
                <div>
                  <h3 className="text-lg font-semibold mb-3 text-gray-900 dark:text-gray-100">Bank Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Bank Name</p>
                      <p className="font-medium text-gray-900 dark:text-gray-200">{viewDialog.employee.bank_info.bank_name || 'Not provided'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Account Number</p>
                      <p className="font-medium font-mono text-gray-900 dark:text-gray-200">{viewDialog.employee.bank_info.account_number || 'Not provided'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">IFSC Code</p>
                      <p className="font-medium font-mono text-gray-900 dark:text-gray-200">{viewDialog.employee.bank_info.ifsc_code || 'Not provided'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Branch</p>
                      <p className="font-medium text-gray-900 dark:text-gray-200">{viewDialog.employee.bank_info.branch || 'Not provided'}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Salary Structure */}
              {viewDialog.employee.salary_structure && (
                <div>
                  <h3 className="text-lg font-semibold mb-3 text-gray-900 dark:text-gray-100">Salary Structure</h3>

                  {Array.isArray(viewDialog.employee.salary_structure.salary_components) && viewDialog.employee.salary_structure.salary_components.length > 0 && viewDialog.employee.salary_structure.use_component_based_salary ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Earnings from components */}
                      <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border border-green-200 dark:border-green-700">
                        <h4 className="font-semibold text-green-800 dark:text-green-300 mb-3">Earnings</h4>
                        <div className="space-y-2">
                          {viewDialog.employee.salary_structure.salary_components.filter(c => c.component_type === 'earnings' && c.is_active !== false).map((c, idx) => (
                            <div key={`earn-${idx}`} className="flex justify-between">
                              <span className="text-sm text-gray-700 dark:text-gray-300">{c.name_in_payslip || c.component_name || 'Earning'}</span>
                              <span className="font-medium text-gray-900 dark:text-gray-200">{formatCurrency(Number(c.amount) || 0)}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Deductions from components */}
                      <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg border border-red-200 dark:border-red-700">
                        <h4 className="font-semibold text-red-800 dark:text-red-300 mb-3">Deductions</h4>
                        <div className="space-y-2">
                          {viewDialog.employee.salary_structure.salary_components.filter(c => c.component_type === 'deductions' && c.is_active !== false).map((c, idx) => (
                            <div key={`ded-${idx}`} className="flex justify-between">
                              <span className="text-sm text-gray-700 dark:text-gray-300">{c.name_in_payslip || c.component_name || 'Deduction'}</span>
                              <span className="font-medium text-gray-900 dark:text-gray-200">{formatCurrency(Number(c.amount) || 0)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Earnings - legacy fields */}
                      <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border border-green-200 dark:border-green-700">
                        <h4 className="font-semibold text-green-800 dark:text-green-300 mb-3">Earnings</h4>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-700 dark:text-gray-300">Basic Salary</span>
                            <span className="font-medium text-gray-900 dark:text-gray-200">{formatCurrency(viewDialog.employee.salary_structure.basic_salary || 0)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-700 dark:text-gray-300">House Rent Allowance</span>
                            <span className="font-medium text-gray-900 dark:text-gray-200">{formatCurrency(viewDialog.employee.salary_structure.house_rent_allowance || viewDialog.employee.salary_structure.hra || 0)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-700 dark:text-gray-300">Medical Allowance</span>
                            <span className="font-medium text-gray-900 dark:text-gray-200">{formatCurrency(viewDialog.employee.salary_structure.medical_allowance || 0)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-700 dark:text-gray-300">Leave Travel Allowance</span>
                            <span className="font-medium text-gray-900 dark:text-gray-200">{formatCurrency(viewDialog.employee.salary_structure.leave_travel_allowance || viewDialog.employee.salary_structure.travel_allowance || 0)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-700 dark:text-gray-300">Bonus</span>
                            <span className="font-medium text-gray-900 dark:text-gray-200">{formatCurrency(viewDialog.employee.salary_structure.conveyance_allowance || viewDialog.employee.salary_structure.food_allowance || 0)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-700 dark:text-gray-300">Performance Incentive</span>
                            <span className="font-medium text-gray-900 dark:text-gray-200">{formatCurrency(viewDialog.employee.salary_structure.performance_incentive || viewDialog.employee.salary_structure.internet_allowance || 0)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-700 dark:text-gray-300">Other Benefits</span>
                            <span className="font-medium text-gray-900 dark:text-gray-200">{formatCurrency(viewDialog.employee.salary_structure.other_benefits || viewDialog.employee.salary_structure.special_allowance || 0)}</span>
                          </div>
                        </div>
                      </div>

                      {/* Deductions - legacy fields */}
                      <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg border border-red-200 dark:border-red-700">
                        <h4 className="font-semibold text-red-800 dark:text-red-300 mb-3">Deductions</h4>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-700 dark:text-gray-300">PF (Employee)</span>
                            <span className="font-medium text-gray-900 dark:text-gray-200">{formatCurrency(viewDialog.employee.salary_structure.pf_employee || 0)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-700 dark:text-gray-300">ESI (Employee)</span>
                            <span className="font-medium text-gray-900 dark:text-gray-200">{formatCurrency(viewDialog.employee.salary_structure.esi_employee || 0)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-700 dark:text-gray-300">Professional Tax</span>
                            <span className="font-medium text-gray-900 dark:text-gray-200">{formatCurrency(viewDialog.employee.salary_structure.professional_tax || 0)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-700 dark:text-gray-300">TDS</span>
                            <span className="font-medium text-gray-900 dark:text-gray-200">{formatCurrency(viewDialog.employee.salary_structure.tds || 0)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-700 dark:text-gray-300">Loan Deductions</span>
                            <span className="font-medium text-gray-900 dark:text-gray-200">{formatCurrency(viewDialog.employee.salary_structure.loan_deductions || 0)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-700 dark:text-gray-300">Others</span>
                            <span className="font-medium text-gray-900 dark:text-gray-200">{formatCurrency(viewDialog.employee.salary_structure.others || 0)}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Net Salary */}
                  <div className="mt-4 bg-primary/10 dark:bg-primary/20 p-4 rounded-lg border border-primary/30 dark:border-primary/40">
                    <div className="flex justify-between items-center">
                      <span className="font-semibold text-primary">Net Salary</span>
                      <span className="text-xl font-bold text-primary">
                        {formatCurrency(
                          calculateGrossSalary(viewDialog.employee.salary_structure) - 
                          calculateTotalDeductions(viewDialog.employee.salary_structure)
                        )}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Leave Configuration */}
              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-700">
                <h3 className="font-semibold text-blue-900 dark:text-blue-300 mb-3">Leave Configuration</h3>
                <div className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
                  {viewDialog.employee.probation_end_date ? (
                    <>
                      <div className="flex justify-between">
                        <span>Probation Status:</span>
                        <span className="font-medium text-orange-600 dark:text-orange-400">
                          {new Date(viewDialog.employee.probation_end_date) > new Date() ? 'In Probation' : 'Completed'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Probation End Date:</span>
                        <span className="font-medium text-gray-900 dark:text-gray-100">{formatDate(viewDialog.employee.probation_end_date)}</span>
                      </div>
                    </>
                  ) : (
                    <div className="text-gray-600 dark:text-gray-400">No probation period</div>
                  )}
                  <div className="flex justify-between">
                    <span>Casual Leave Rate:</span>
                    <span className="font-medium text-gray-900 dark:text-gray-100">{viewDialog.employee.custom_casual_leave_per_month || '1.5'} days/month</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Sick Leave Entitlement:</span>
                    <span className="font-medium text-gray-900 dark:text-gray-100">{viewDialog.employee.custom_sick_leave_per_year || '7'} days/year</span>
                  </div>
                  {viewDialog.employee.annual_leave_days && (
                    <div className="flex justify-between">
                      <span>Annual Leave:</span>
                      <span className="font-medium text-gray-900 dark:text-gray-100">{viewDialog.employee.annual_leave_days} days</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Button */}
              <div className="flex justify-end pt-4 border-t">
                <Button 
                  onClick={() => {
                    setViewDialog({ open: false, employee: null });
                    navigate(`/employees/${viewDialog.employee.employee_id}/edit`);
                  }}
                  className="bg-primary hover:bg-primary/90"
                >
                  <Edit className="w-4 h-4 mr-2" />
                  Edit Employee
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Rating Details Modal */}
      <Dialog open={ratingDialog.open} onOpenChange={(open) => setRatingDialog({ open, employee: open ? ratingDialog.employee : null, rating: open ? ratingDialog.rating : null })}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-3">
              {ratingDialog.rating && (() => {
                const colors = getRatingColor(ratingDialog.rating.rating);
                return (
                  <div className={`h-12 w-12 rounded-full bg-gradient-to-r ${colors.bg} border ${colors.border} flex items-center justify-center`}>
                    <Star className={`h-6 w-6 ${colors.star}`} />
                  </div>
                );
              })()}
              {!ratingDialog.rating && (
                <div className="h-12 w-12 rounded-full bg-gradient-to-r from-gray-400 to-gray-400 flex items-center justify-center">
                  <Star className="h-6 w-6 fill-white text-white" />
                </div>
              )}
              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Performance Rating Analysis (YTD)</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {ratingDialog.employee?.name} ({ratingDialog.employee?.employee_id})
                </p>
              </div>
            </DialogTitle>
          </DialogHeader>

          {ratingDialog.rating ? (
            (() => {
              const colors = getRatingColor(ratingDialog.rating.rating);
              return (
                <div className="space-y-6 py-4">
                  {/* Current Rating Display */}
                  <div className={`bg-gradient-to-r ${colors.bg} p-6 rounded-lg border ${colors.border}`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-6">
                        <div className="text-center">
                          <div className={`text-6xl font-bold ${colors.text}`}>
                            {ratingDialog.rating.rating.toFixed(3)}
                          </div>
                          <div className="flex items-center justify-center space-x-1 mt-3">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star
                                key={star}
                                className={`h-6 w-6 ${
                                  star <= Math.round(ratingDialog.rating.rating)
                                    ? colors.star
                                    : colors.starInactive
                                }`}
                              />
                            ))}
                          </div>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                            Year-to-Date {ratingDialog.rating.year}
                          </p>
                        </div>
                        
                        <div className="h-20 w-px bg-gray-300 dark:bg-gray-600"></div>
                        
                        <div>
                          <div className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
                            {colors.emoji} {colors.label}
                          </div>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                            Based on {ratingDialog.rating.details.attendance_days} days attendance
                          </p>
                          {ratingDialog.rating.details.progress_from_baseline !== undefined && (
                            <div className={`mt-2 text-sm font-medium ${
                              ratingDialog.rating.details.progress_from_baseline >= 0 
                                ? 'text-green-600 dark:text-green-400' 
                                : 'text-red-600 dark:text-red-400'
                            }`}>
                              {ratingDialog.rating.details.progress_from_baseline >= 0 ? '↗' : '↘'} 
                              {Math.abs(ratingDialog.rating.details.progress_from_baseline).toFixed(3)} from baseline (4.0)
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

              {/* Rating Breakdown */}
              <div>
                <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">Rating Breakdown</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Base Rating */}
                  <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-700">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Starting Rating</p>
                        <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                          {ratingDialog.rating.details.starting_rating?.toFixed(2) || '4.00'}
                        </p>
                      </div>
                      <div className="h-12 w-12 bg-blue-100 dark:bg-blue-800 rounded-full flex items-center justify-center">
                        <span className="text-2xl">🎯</span>
                      </div>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                      Base rating or carried forward from previous month
                    </p>
                  </div>

                  {/* Late Arrivals Impact */}
                  <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg border border-red-200 dark:border-red-700">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Late Arrivals</p>
                        <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                          {ratingDialog.rating.details.late_arrivals} times
                        </p>
                      </div>
                      <div className="h-12 w-12 bg-red-100 dark:bg-red-800 rounded-full flex items-center justify-center">
                        <span className="text-2xl">⏰</span>
                      </div>
                    </div>
                    <p className="text-xs font-semibold text-red-600 dark:text-red-400 mt-2">
                      -{(ratingDialog.rating.details.late_arrivals * 0.05).toFixed(3)} points (0.05 per late arrival)
                    </p>
                  </div>

                  {/* OT Hours Impact */}
                  <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border border-green-200 dark:border-green-700">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Overtime Hours</p>
                        <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                          {ratingDialog.rating.details.ot_hours}h
                        </p>
                      </div>
                      <div className="h-12 w-12 bg-green-100 dark:bg-green-800 rounded-full flex items-center justify-center">
                        <span className="text-2xl">💪</span>
                      </div>
                    </div>
                    <p className="text-xs font-semibold text-green-600 dark:text-green-400 mt-2">
                      +{(ratingDialog.rating.details.ot_hours * 0.02).toFixed(3)} points (0.02 per hour)
                    </p>
                  </div>

                  {/* Punctuality Bonus */}
                  <div className={`p-4 rounded-lg border ${
                    ratingDialog.rating.details.punctuality_bonus > 0
                      ? 'bg-primary/10 dark:bg-primary/20 border-primary/30 dark:border-primary/40'
                      : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700'
                  }`}>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Punctuality Bonus</p>
                        <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                          {ratingDialog.rating.details.punctuality_bonus > 0 ? '✓ Earned' : '✗ Not Earned'}
                        </p>
                      </div>
                      <div className={`h-12 w-12 rounded-full flex items-center justify-center ${
                        ratingDialog.rating.details.punctuality_bonus > 0
                          ? 'bg-primary/10 dark:bg-primary/20'
                          : 'bg-gray-200 dark:bg-gray-700'
                      }`}>
                        <span className="text-2xl">{ratingDialog.rating.details.punctuality_bonus > 0 ? '🏆' : '⭕'}</span>
                      </div>
                    </div>
                    <p className={`text-xs font-semibold mt-2 ${
                      ratingDialog.rating.details.punctuality_bonus > 0
                        ? 'text-primary'
                        : 'text-gray-500 dark:text-gray-400'
                    }`}>
                      {ratingDialog.rating.details.punctuality_bonus > 0
                        ? `+${ratingDialog.rating.details.punctuality_bonus.toFixed(3)} points (No late arrivals!)`
                        : '0.00 points (Late arrivals present)'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Performance Insights */}
              <div className="bg-purple-50 dark:bg-purple-900/20 p-5 rounded-lg border border-purple-200 dark:border-purple-700">
                <h3 className="text-lg font-semibold mb-3 flex items-center space-x-2 text-purple-900 dark:text-purple-300">
                  <span>💡</span>
                  <span>Performance Insights & Recommendations</span>
                </h3>
                <div className="space-y-3 text-sm">
                  {/* Positive Aspects */}
                  {(ratingDialog.rating.details.punctuality_bonus > 0 || ratingDialog.rating.details.ot_hours > 10 || ratingDialog.rating.rating >= 4.5) && (
                    <div className="bg-white dark:bg-gray-800 p-3 rounded-lg">
                      <p className="font-semibold text-green-700 dark:text-green-400 mb-2">✅ Strengths:</p>
                      <ul className="list-disc list-inside space-y-1 text-gray-700 dark:text-gray-300">
                        {ratingDialog.rating.details.punctuality_bonus > 0 && (
                          <li>Perfect punctuality - zero late arrivals this month</li>
                        )}
                        {ratingDialog.rating.details.ot_hours > 10 && (
                          <li>Strong commitment with {ratingDialog.rating.details.ot_hours} hours of overtime</li>
                        )}
                        {ratingDialog.rating.rating >= 4.5 && (
                          <li>Outstanding performance - exceeding expectations</li>
                        )}
                      </ul>
                    </div>
                  )}

                  {/* Areas for Improvement */}
                  {(ratingDialog.rating.details.late_arrivals > 0 || ratingDialog.rating.details.ot_hours < 5 || ratingDialog.rating.rating < 4.0) && (
                    <div className="bg-white dark:bg-gray-800 p-3 rounded-lg">
                      <p className="font-semibold text-amber-700 dark:text-amber-400 mb-2">⚠️ Areas for Improvement:</p>
                      <ul className="list-disc list-inside space-y-1 text-gray-700 dark:text-gray-300">
                        {ratingDialog.rating.details.late_arrivals > 0 && (
                          <li>
                            Reduce late arrivals ({ratingDialog.rating.details.late_arrivals} this month) - 
                            potential rating gain: +{(ratingDialog.rating.details.late_arrivals * 0.05).toFixed(2)} points
                          </li>
                        )}
                        {ratingDialog.rating.details.late_arrivals > 0 && ratingDialog.rating.details.punctuality_bonus === 0 && (
                          <li>
                            Achieve perfect punctuality to earn bonus: +0.30 points
                          </li>
                        )}
                        {ratingDialog.rating.details.ot_hours < 5 && ratingDialog.rating.rating < 4.5 && (
                          <li>
                            Consider additional overtime contributions - current: {ratingDialog.rating.details.ot_hours}h 
                            (10h = +0.20 rating boost)
                          </li>
                        )}
                      </ul>
                    </div>
                  )}

                  {/* Path to 5.0 */}
                  {ratingDialog.rating.rating < 5.0 && (
                    <div className="bg-white dark:bg-gray-800 p-3 rounded-lg">
                      <p className="font-semibold text-blue-700 dark:text-blue-400 mb-2">🎯 Path to Maximum Rating (5.0):</p>
                      <p className="text-gray-700 dark:text-gray-300">
                        Current gap: {(5.0 - ratingDialog.rating.rating).toFixed(3)} points. 
                        {ratingDialog.rating.rating < 4.7 && ratingDialog.rating.details.late_arrivals > 0 && (
                          <> Eliminate late arrivals and maintain perfect punctuality to reach 5.0.</>
                        )}
                        {ratingDialog.rating.rating >= 4.7 && ratingDialog.rating.rating < 5.0 && (
                          <> You're very close! Continue current performance to maintain top rating.</>
                        )}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Rating System Info */}
              <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-2 flex items-center space-x-2">
                  <span>ℹ️</span>
                  <span>Rating System Details</span>
                </h4>
                <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                  <p>• <strong>Base Rating:</strong> Starts at 4.0 or carries forward from previous month</p>
                  <p>• <strong>Late Arrivals:</strong> -0.05 points per occurrence</p>
                  <p>• <strong>Overtime:</strong> +0.02 points per hour (capped at maximum rating)</p>
                  <p>• <strong>Punctuality Bonus:</strong> +0.30 points if zero late arrivals</p>
                  <p>• <strong>Maximum Rating:</strong> 5.0 (capped)</p>
                  <p>• <strong>System:</strong> Cumulative - rating carries forward month-to-month</p>
                </div>
              </div>
            </div>
              );
            })()
          ) : (
            <div className="py-8 text-center">
              <p className="text-gray-500 dark:text-gray-400">Rating data not available</p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default EmployeeList;
