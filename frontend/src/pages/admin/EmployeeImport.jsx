import React, { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Alert,
  AlertDescription,
} from '@/components/ui/alert';
import {
  Upload,
  FileText,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Download,
  Users,
  Loader2,
  Lock,
  Sparkles
} from 'lucide-react';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';
import axios from 'axios';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { getErrorMessage } from '@/utils/errorHandler';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const EmployeeImport = () => {
  const { hasFeature, planName } = useSubscription();
  const [importing, setImporting] = useState(false);
  const [importResults, setImportResults] = useState(null);
  const [showResults, setShowResults] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [importData, setImportData] = useState(null);
  const [conflictData, setConflictData] = useState(null);
  const [progress, setProgress] = useState(0);
  const fileInputRef = useRef(null);
  
  // Check if bulk import is enabled
  const canBulkImport = hasFeature('bulk_employee_import');

  const columnMapping = {
    // Personal Information
    'Employee ID': 'employee_id',
    'Name': 'name',
    'Email': 'email',
    'Phone': 'phone',
    'Gender': 'gender',
    'Date of Birth': 'date_of_birth',
    'Aadhar Number': 'aadhar_number',
    'PAN Number': 'pan_number',
    'Marital Status': 'marital_status',
    'Address': 'address',
    
    // Emergency Contact
    'Emergency Contact Name': 'emergency_contact_name',
    'Emergency Contact Phone': 'emergency_contact_phone',
    'Blood Group': 'blood_group',
    
    // Job Information
    'Department': 'department',
    'Designation': 'designation',
    'Date of Joining': 'date_of_joining',
    'Work Location': 'work_location',
    
    // Bank Information (nested under bank_info)
    'Bank Name': 'bank_name',
    'Account Number': 'account_number',
    'IFSC Code': 'ifsc_code',
    'Branch': 'branch',
    
    // Salary Structure - Earnings (nested under salary_structure)
    'Basic Salary': 'basic_salary',
    'House Rent Allowance': 'house_rent_allowance',
    'Medical Allowance': 'medical_allowance',
    'Leave Travel Allowance': 'leave_travel_allowance',
    'Bonus': 'conveyance_allowance',
    'Performance Incentive': 'performance_incentive',
    'Other Benefits': 'other_benefits',
    
    // Salary Structure - Deductions (nested under salary_structure)
    'PF Employee': 'pf_employee',
    'PF Employer': 'pf_employer',
    'ESI Employee': 'esi_employee',
    'ESI Employer': 'esi_employer',
    'Professional Tax': 'professional_tax',
    'TDS': 'tds',
    'Loan Deductions': 'loan_deductions',
    'Others': 'others',
    
    // Leave Configuration
    'Is On Probation': 'is_on_probation',
    'Probation End Date': 'probation_end_date',
    'Custom Casual Leave Per Month': 'custom_casual_leave_per_month',
    'Custom Sick Leave Per Year': 'custom_sick_leave_per_year',
    'Annual Leave Days': 'annual_leave_days'
  };

  const requiredFields = ['employee_id', 'name', 'email', 'department', 'designation'];

  const validateEmployeeData = (employee, rowIndex) => {
    const errors = [];
    
    // Check required fields
    requiredFields.forEach(field => {
      if (!employee[field] || employee[field].toString().trim() === '') {
        errors.push(`Row ${rowIndex + 2}: Missing required field - ${field}`);
      }
    });

    // Email validation
    if (employee.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(employee.email)) {
      errors.push(`Row ${rowIndex + 2}: Invalid email format - ${employee.email}`);
    }

    // Phone validation (only if phone is provided)
    if (employee.phone && employee.phone.toString().trim() !== '') {
      const cleanPhone = employee.phone.toString().replace(/\D/g, '');
      if (cleanPhone.length !== 10) {
        errors.push(`Row ${rowIndex + 2}: Invalid phone number - ${employee.phone} (must be 10 digits)`);
      }
    }

    // Date validations (only if dates are provided)
    if (employee.date_of_birth && employee.date_of_birth.toString().trim() !== '' && isNaN(Date.parse(employee.date_of_birth))) {
      errors.push(`Row ${rowIndex + 2}: Invalid date of birth - ${employee.date_of_birth}`);
    }

    if (employee.date_of_joining && employee.date_of_joining.toString().trim() !== '' && isNaN(Date.parse(employee.date_of_joining))) {
      errors.push(`Row ${rowIndex + 2}: Invalid date of joining - ${employee.date_of_joining}`);
    }

    // Gender validation (only if provided)
    if (employee.gender && employee.gender.toString().trim() !== '' && !['male', 'female', 'other'].includes(employee.gender.toLowerCase())) {
      errors.push(`Row ${rowIndex + 2}: Invalid gender - ${employee.gender} (must be male, female, or other)`);
    }

    // Marital status validation (only if provided)
    if (employee.marital_status && employee.marital_status.toString().trim() !== '' && !['single', 'married', 'divorced', 'widowed'].includes(employee.marital_status.toLowerCase())) {
      errors.push(`Row ${rowIndex + 2}: Invalid marital status - ${employee.marital_status}`);
    }

    // Numeric field validations (only if provided)
    const numericFields = ['basic_salary', 'house_rent_allowance', 'medical_allowance', 'leave_travel_allowance', 'conveyance_allowance', 'performance_incentive', 'other_benefits', 'pf_employee', 'pf_employer', 'esi_employee', 'esi_employer', 'professional_tax', 'tds', 'loan_deductions', 'others', 'custom_casual_leave_per_month', 'custom_sick_leave_per_year', 'annual_leave_days'];
    
    numericFields.forEach(field => {
      if (employee[field] && employee[field].toString().trim() !== '' && isNaN(parseFloat(employee[field]))) {
        errors.push(`Row ${rowIndex + 2}: Invalid numeric value for ${field} - ${employee[field]}`);
      }
    });

    return errors;
  };

  const parseExcelData = (data) => {
    const employees = [];
    const errors = [];

    data.forEach((row, index) => {
      const employee = {};
      
      // Map Excel columns to employee object
      Object.entries(columnMapping).forEach(([excelColumn, dbField]) => {
        const value = row[excelColumn];
        // Handle all values, including empty ones
        if (dbField.includes('date')) {
          if (value && value !== '') {
            // Handle Excel date parsing
            const date = typeof value === 'number' ? new Date((value - 25569) * 86400 * 1000) : new Date(value);
            if (!isNaN(date.getTime())) {
              employee[dbField] = date.toISOString().split('T')[0];
            }
          }
        } else if (dbField === 'gender' || dbField === 'marital_status') {
          if (value && value !== '') {
            employee[dbField] = value.toString().toLowerCase();
          }
        } else if (value !== undefined && value !== null && value !== '') {
          employee[dbField] = value.toString().trim();
        }
      });

      // Build nested structures with proper handling of blank values
      employee.bank_info = {
        bank_name: employee.bank_name || '',
        account_number: employee.account_number || '',
        ifsc_code: employee.ifsc_code || '',
        branch: employee.branch || ''
      };

      employee.salary_structure = {
        basic_salary: employee.basic_salary ? parseFloat(employee.basic_salary) : 0,
        house_rent_allowance: employee.house_rent_allowance ? parseFloat(employee.house_rent_allowance) : 0,
        medical_allowance: employee.medical_allowance ? parseFloat(employee.medical_allowance) : 0,
        leave_travel_allowance: employee.leave_travel_allowance ? parseFloat(employee.leave_travel_allowance) : 0,
        conveyance_allowance: employee.conveyance_allowance ? parseFloat(employee.conveyance_allowance) : 0,
        performance_incentive: employee.performance_incentive ? parseFloat(employee.performance_incentive) : 0,
        other_benefits: employee.other_benefits ? parseFloat(employee.other_benefits) : 0,
        pf_employee: employee.pf_employee ? parseFloat(employee.pf_employee) : 0,
        pf_employer: employee.pf_employer ? parseFloat(employee.pf_employer) : 0,
        esi_employee: employee.esi_employee ? parseFloat(employee.esi_employee) : 0,
        esi_employer: employee.esi_employer ? parseFloat(employee.esi_employer) : 0,
        professional_tax: employee.professional_tax ? parseFloat(employee.professional_tax) : 0,
        tds: employee.tds ? parseFloat(employee.tds) : 0,
        loan_deductions: employee.loan_deductions ? parseFloat(employee.loan_deductions) : 0,
        others: employee.others ? parseFloat(employee.others) : 0
      };

      // Handle probation fields - convert Yes/No to boolean
      if (employee.is_on_probation) {
        employee.is_on_probation = employee.is_on_probation.toString().toLowerCase() === 'yes';
      }
      
      // Handle leave configuration fields - convert to numbers if provided
      if (employee.custom_casual_leave_per_month) {
        employee.custom_casual_leave_per_month = parseFloat(employee.custom_casual_leave_per_month);
      }
      if (employee.custom_sick_leave_per_year) {
        employee.custom_sick_leave_per_year = parseFloat(employee.custom_sick_leave_per_year);
      }
      if (employee.annual_leave_days) {
        employee.annual_leave_days = parseFloat(employee.annual_leave_days);
      }

      // Remove individual fields that are now in nested objects
      delete employee.bank_name;
      delete employee.account_number;
      delete employee.ifsc_code;
      delete employee.branch;
      delete employee.basic_salary;
      delete employee.house_rent_allowance;
      delete employee.medical_allowance;
      delete employee.leave_travel_allowance;
      delete employee.conveyance_allowance;
      delete employee.performance_incentive;
      delete employee.other_benefits;
      delete employee.pf_employee;
      delete employee.pf_employer;
      delete employee.esi_employee;
      delete employee.esi_employer;
      delete employee.professional_tax;
      delete employee.tds;
      delete employee.loan_deductions;
      delete employee.others;

      // Set default status
      employee.status = 'active';

      // Validate employee data
      const validationErrors = validateEmployeeData(employee, index);
      errors.push(...validationErrors);

      employees.push(employee);
    });

    return { employees, errors };
  };

  const checkExistingEmployees = async (employees) => {
    try {
      const response = await axios.get(`${API}/employees`);
      const existingEmployees = response.data;
      const existingIds = existingEmployees.map(emp => emp.employee_id);
      
      const conflicts = employees.filter(emp => existingIds.includes(emp.employee_id));
      
      return {
        conflicts,
        hasConflicts: conflicts.length > 0
      };
    } catch (error) {
      console.error('Error checking existing employees:', error);
      toast.error(`Error checking existing employees: ${getErrorMessage(error)}`);
      return { conflicts: [], hasConflicts: false };
    }
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Validate file type
    const validTypes = ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/vnd.ms-excel'];
    if (!validTypes.includes(file.type)) {
      toast.error('Please select a valid Excel file (.xlsx or .xls)');
      return;
    }

    try {
      setImporting(true);
      setProgress(10);

      // Read Excel file
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);

      setProgress(30);

      if (jsonData.length === 0) {
        toast.error('Excel file is empty or has no data');
        setImporting(false);
        return;
      }

      // Check employee limit before import
      let limitedJsonData = jsonData;
      try {
        const limitResponse = await axios.get(`${BACKEND_URL}/api/employees/limit-status`);
        const { limit, current_count, remaining } = limitResponse.data;
        
        // Check if importing would exceed limit
        if (limit !== -1) {
          if (jsonData.length > remaining) {
            // Limit the import to remaining slots
            limitedJsonData = jsonData.slice(0, remaining);
            toast.warning(
              `Your plan allows ${limit} employees total. You have ${current_count}, so only importing first ${remaining} employees from the Excel file (${jsonData.length - remaining} will be skipped). ` +
              `Upgrade your plan to import all employees.`,
              { duration: 8000 }
            );
          }
        }
      } catch (error) {
        console.error('Error checking employee limit:', error);
        // Continue with import if limit check fails
      }

      setProgress(40);

      // Use limited data for parsing
      jsonData = limitedJsonData;

      // Parse and validate data
      const { employees, errors } = parseExcelData(jsonData);
      setProgress(50);

      if (errors.length > 0) {
        setImportResults({
          success: false,
          total: employees.length,
          errors: errors,
          processed: 0,
          created: 0,
          updated: 0
        });
        setShowResults(true);
        setImporting(false);
        return;
      }

      // Check for existing employees
      const { conflicts, hasConflicts } = await checkExistingEmployees(employees);
      setProgress(70);

      if (hasConflicts) {
        setImportData(employees);
        setConflictData(conflicts);
        setShowConfirmDialog(true);
        setImporting(false);
      } else {
        // No conflicts, proceed with import
        await processImport(employees);
      }
    } catch (error) {
      console.error('Error processing file:', error);
      toast.error(`Error processing Excel file: ${getErrorMessage(error)}`);
      setImporting(false);
    }
  };

  const processImport = async (employees) => {
    setImporting(true);
    setShowConfirmDialog(false);
    
    const results = {
      total: employees.length,
      processed: 0,
      created: 0,
      updated: 0,
      errors: [],
      success: true
    };

    for (let i = 0; i < employees.length; i++) {
      try {
        setProgress(70 + (i / employees.length) * 30);
        
        // Check if employee exists
        const existingResponse = await axios.get(`${API}/employees`);
        const existingEmployee = existingResponse.data.find(emp => emp.employee_id === employees[i].employee_id);
        
        if (existingEmployee) {
          // Update existing employee
          await axios.put(`${API}/employees/${employees[i].employee_id}`, employees[i]);
          results.updated++;
        } else {
          // Create new employee
          await axios.post(`${API}/employees`, employees[i]);
          results.created++;
        }
        
        results.processed++;
      } catch (error) {
        console.error(`Error processing employee ${employees[i].employee_id}:`, error);
        
        const errorMessage = getErrorMessage(error);
        
        // Check if it's an employee limit error
        if (error.response?.status === 403 && errorMessage.includes('limit')) {
          results.errors.push(`LIMIT REACHED: Cannot add more employees. ${errorMessage}`);
          // Stop processing further employees if limit reached
          break;
        } else {
          results.errors.push(`Error processing ${employees[i].name || employees[i].employee_id}: ${errorMessage}`);
        }
        results.success = false;
      }
    }

    setProgress(100);
    setImportResults(results);
    setShowResults(true);
    setImporting(false);

    if (results.success && results.errors.length === 0) {
      toast.success(`Import completed successfully! ${results.created} created, ${results.updated} updated.`);
    } else {
      toast.error(`Import completed with errors. Please check the results.`);
    }

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const downloadSampleTemplate = () => {
    const sampleData = [
      {
        // Personal Information
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
        
        // Emergency Contact
        'Emergency Contact Name': 'Jane Doe',
        'Emergency Contact Phone': '9876543211',
        'Blood Group': 'O+',
        
        // Job Information
        'Department': 'Software Development',
        'Designation': 'Senior Developer',
        'Date of Joining': '2024-01-15',
        'Work Location': 'Mumbai Office',
        
        // Bank Information (Optional - can be added later)
        'Bank Name': '',
        'Account Number': '',
        'IFSC Code': '',
        'Branch': ''
      }
    ];

    const ws = XLSX.utils.json_to_sheet(sampleData);
    
    // Set column widths for better readability
    const columnWidths = [
      { wch: 15 }, // Employee ID
      { wch: 20 }, // Name
      { wch: 25 }, // Email
      { wch: 15 }, // Phone
      { wch: 10 }, // Gender
      { wch: 15 }, // Date of Birth
      { wch: 15 }, // Aadhar
      { wch: 12 }, // PAN
      { wch: 12 }, // Marital Status
      { wch: 40 }, // Address
      { wch: 20 }, // Emergency Name
      { wch: 20 }, // Emergency Phone
      { wch: 12 }, // Blood Group
      { wch: 25 }, // Department
      { wch: 25 }, // Designation
      { wch: 15 }, // Date of Joining
      { wch: 20 }, // Work Location
      { wch: 20 }, // Bank Name
      { wch: 20 }, // Account Number
      { wch: 12 }, // IFSC
      { wch: 20 }  // Branch
    ];
    
    ws['!cols'] = columnWidths;
    
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Employees');
    
    // Add instructions sheet
    const instructions = [
      ['Employee Import Template - Instructions (All Fields Aligned with Add Employee Form)'],
      [''],
      ['SECTION', 'FIELD', 'DESCRIPTION', 'EXAMPLE', 'REQUIRED'],
      ['Personal Info', 'Employee ID', 'Unique employee identifier', 'ET-MUM-00001', 'Yes'],
      ['Personal Info', 'Name', 'Full name of employee', 'John Doe', 'Yes'],
      ['Personal Info', 'Email', 'Work email address', 'john.doe@company.com', 'Yes'],
      ['Personal Info', 'Phone', 'Contact number', '9876543210', 'Yes'],
      ['Personal Info', 'Gender', 'Gender: male, female, other', 'male', 'Yes'],
      ['Personal Info', 'Date of Birth', 'Format: YYYY-MM-DD', '1990-01-15', 'Yes'],
      ['Personal Info', 'Aadhar Number', '12-digit Aadhar number', '123456789012', 'No'],
      ['Personal Info', 'PAN Number', '10-character PAN', 'ABCDE1234F', 'No'],
      ['Personal Info', 'Marital Status', 'single, married, divorced, widowed', 'single', 'No'],
      ['Personal Info', 'Address', 'Complete address', '123 Main St, Mumbai', 'No'],
      ['Emergency Contact', 'Emergency Contact Name', 'Name of emergency contact person', 'Jane Doe', 'No'],
      ['Emergency Contact', 'Emergency Contact Phone', 'Emergency contact number', '9876543211', 'No'],
      ['Emergency Contact', 'Blood Group', 'Blood group (A+, B+, O+, AB+, etc)', 'O+', 'No'],
      ['Job Info', 'Department', 'Department name', 'Software Development', 'Yes'],
      ['Job Info', 'Designation', 'Job title/position', 'Senior Developer', 'Yes'],
      ['Job Info', 'Date of Joining', 'Format: YYYY-MM-DD', '2024-01-15', 'Yes'],
      ['Job Info', 'Work Location', 'Office location', 'Mumbai Office', 'No'],
      ['Bank Info', 'Bank Name', 'Name of the bank (Optional - can be added later)', 'HDFC Bank', 'No'],
      ['Bank Info', 'Account Number', 'Bank account number (Optional)', '50100123456789', 'No'],
      ['Bank Info', 'IFSC Code', 'Bank IFSC code (Optional)', 'HDFC0001234', 'No'],
      ['Bank Info', 'Branch', 'Bank branch name (Optional)', 'Andheri East', 'No'],
      ['', '', '', '', ''],
      ['NOTE', 'Salary details can be configured later from the Edit Employee page', '', '', ''],
      ['NOTE', 'This simplified template focuses on basic employee information only', '', '', ''],
      ['Earnings', 'Other Benefits', 'Any other benefits/allowances', '1000', 'No'],
      ['Deductions', 'PF Employee', 'Employee PF contribution', '1800', 'No'],
      [''],
      ['IMPORTANT NOTES:'],
      ['1. All date fields must be in YYYY-MM-DD format (e.g., 2024-01-15)'],
      ['2. Employee ID must be unique and follow the format: ET-LOCATION-XXXXX'],
      ['3. Leave blank for optional fields if not applicable'],
      ['4. Gender must be one of: male, female, other'],
      ['5. Marital Status must be one of: single, married, divorced, widowed'],
      ['6. After import, you can configure salary details for each employee from Edit Employee page'],
      ['7. Bank details are optional and can be added during or after import'],
      ['8. If importing multiple employees, add new rows below the sample data'],
      ['9. Do not change column headers - they must match exactly']
    ];
    
    const ws2 = XLSX.utils.aoa_to_sheet(instructions);
    ws2['!cols'] = [{ wch: 20 }, { wch: 30 }, { wch: 50 }, { wch: 25 }, { wch: 10 }];
    XLSX.utils.book_append_sheet(wb, ws2, 'Instructions');
    
    XLSX.writeFile(wb, 'Employee_Import_Template.xlsx');
    toast.success('Simplified template downloaded! Salary details can be configured after import.');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Employee Import</h1>
        <p className="text-gray-500">Import employees from Excel file with validation and conflict resolution</p>
      </div>

      {/* Upload Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Upload className="h-5 w-5" />
            <span>Upload Excel File</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-center w-full">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <label 
                    htmlFor={canBulkImport ? "file-upload" : undefined} 
                    className={`flex flex-col items-center justify-center w-full h-64 border-2 border-gray-300 dark:border-gray-600 border-dashed rounded-lg ${
                      canBulkImport ? 'cursor-pointer bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800' : 'cursor-not-allowed bg-gray-100 dark:bg-gray-900 opacity-60'
                    }`}
                  >
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      {!canBulkImport && (
                        <Lock className="w-10 h-10 mb-3 text-gray-400" />
                      )}
                      {canBulkImport && (
                        <FileText className="w-10 h-10 mb-3 text-gray-400" />
                      )}
                      <p className="mb-2 text-sm text-gray-500 flex items-center gap-2">
                        {canBulkImport ? (
                          <>
                            <span className="font-semibold">Click to upload</span> employee Excel file
                          </>
                        ) : (
                          <>
                            <Lock className="w-4 h-4" />
                            <span className="font-semibold">Bulk Import Locked</span>
                          </>
                        )}
                      </p>
                      <p className="text-xs text-gray-500">
                        {canBulkImport ? 'Excel files only (.xlsx, .xls)' : `Available in Professional Plan`}
                      </p>
                      {!canBulkImport && (
                        <div className="mt-3">
                          <Badge className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
                            <Sparkles className="w-3 h-3 mr-1" />
                            Upgrade to Unlock
                          </Badge>
                        </div>
                      )}
                    </div>
                    {canBulkImport && (
                      <input
                        id="file-upload"
                        ref={fileInputRef}
                        type="file"
                        className="hidden"
                        accept=".xlsx,.xls"
                        onChange={handleFileUpload}
                        disabled={importing}
                      />
                    )}
                  </label>
                </TooltipTrigger>
                {!canBulkImport && (
                  <TooltipContent>
                    <p className="font-semibold">Bulk Import is a Professional feature</p>
                    <p className="text-xs">Upgrade to Professional or Enterprise plan to import multiple employees at once</p>
                  </TooltipContent>
                )}
              </Tooltip>
            </TooltipProvider>
          </div>

          {importing && (
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Processing import...</span>
                <span className="text-sm text-gray-600">{progress}%</span>
              </div>
              <Progress value={progress} className="w-full" />
            </div>
          )}

          <div className="flex justify-between items-center">
            <Button variant="outline" onClick={downloadSampleTemplate}>
              <Download className="w-4 h-4 mr-2" />
              Download Template
            </Button>
            <p className="text-sm text-gray-500">
              Use the template to ensure correct format
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Confirmation Dialog */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <AlertTriangle className="h-5 w-5 text-yellow-600" />
              <span>Existing Employees Found</span>
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                {conflictData?.length} employee(s) already exist in the system. 
                Do you want to overwrite their information with the Excel data?
              </AlertDescription>
            </Alert>

            {conflictData && (
              <div className="max-h-60 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow className="border-b border-gray-200 dark:border-gray-700">
                      <TableHead className="text-gray-700 dark:text-gray-300">Employee ID</TableHead>
                      <TableHead className="text-gray-700 dark:text-gray-300">Name</TableHead>
                      <TableHead className="text-gray-700 dark:text-gray-300">Department</TableHead>
                      <TableHead className="text-gray-700 dark:text-gray-300">Designation</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {conflictData.map((employee, index) => (
                      <TableRow key={index} className="border-b border-gray-200 dark:border-gray-700">
                        <TableCell className="font-medium text-gray-900 dark:text-gray-200">{employee.employee_id}</TableCell>
                        <TableCell className="text-gray-800 dark:text-gray-300">{employee.name}</TableCell>
                        <TableCell className="text-gray-800 dark:text-gray-300">{employee.department}</TableCell>
                        <TableCell className="text-gray-800 dark:text-gray-300">{employee.designation}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}

            <div className="flex space-x-2">
              <Button
                variant="outline"
                onClick={() => {
                  setShowConfirmDialog(false);
                  setImportData(null);
                  setConflictData(null);
                }}
                className="flex-1"
              >
                Cancel Import
              </Button>
              <Button
                onClick={() => processImport(importData)}
                disabled={importing}
                className="flex-1"
              >
                {importing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  'Confirm & Overwrite'
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Results Dialog */}
      <Dialog open={showResults} onOpenChange={setShowResults}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              {importResults?.success && importResults?.errors?.length === 0 ? (
                <CheckCircle className="h-5 w-5 text-green-600" />
              ) : (
                <XCircle className="h-5 w-5 text-red-600" />
              )}
              <span>Import Results</span>
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {importResults && (
              <>
                {/* Summary */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-3 bg-blue-50 rounded-lg">
                    <p className="text-2xl font-bold text-blue-600">{importResults.total}</p>
                    <p className="text-sm text-blue-600">Total Records</p>
                  </div>
                  <div className="text-center p-3 bg-green-50 rounded-lg">
                    <p className="text-2xl font-bold text-green-600">{importResults.created}</p>
                    <p className="text-sm text-green-600">Created</p>
                  </div>
                  <div className="text-center p-3 bg-yellow-50 rounded-lg">
                    <p className="text-2xl font-bold text-yellow-600">{importResults.updated}</p>
                    <p className="text-sm text-yellow-600">Updated</p>
                  </div>
                  <div className="text-center p-3 bg-red-50 rounded-lg">
                    <p className="text-2xl font-bold text-red-600">{importResults.errors?.length || 0}</p>
                    <p className="text-sm text-red-600">Errors</p>
                  </div>
                </div>

                {/* Errors */}
                {importResults.errors && importResults.errors.length > 0 && (
                  <div>
                    <h3 className="font-semibold text-red-600 mb-2">Errors Encountered:</h3>
                    <div className="max-h-60 overflow-y-auto bg-red-50 p-3 rounded-lg">
                      <ul className="space-y-1">
                        {importResults.errors.map((error, index) => (
                          <li key={index} className="text-sm text-red-700">
                            • {error}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}

                {/* Success Message */}
                {importResults.success && importResults.errors.length === 0 && (
                  <Alert>
                    <CheckCircle className="h-4 w-4" />
                    <AlertDescription>
                      Import completed successfully! All employee records have been processed.
                    </AlertDescription>
                  </Alert>
                )}
              </>
            )}

            <div className="flex justify-end">
              <Button onClick={() => setShowResults(false)}>
                Close
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>Import Instructions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold mb-3 text-green-600">✅ Required Fields</h3>
              <ul className="space-y-1 text-sm">
                <li>• Employee ID (unique identifier)</li>
                <li>• Name</li>
                <li>• Email</li>
                <li>• Department</li>
                <li>• Designation</li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold mb-3 text-blue-600">📋 Import Features</h3>
              <ul className="space-y-1 text-sm">
                <li>• Automatic validation and error reporting</li>
                <li>• Conflict detection for existing employees</li>
                <li>• Confirmation before overwriting data</li>
                <li>• Detailed import results and error logs</li>
                <li>• Support for all employee fields including salary structure</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default EmployeeImport;