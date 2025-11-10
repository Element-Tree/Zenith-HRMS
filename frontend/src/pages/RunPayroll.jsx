import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Calendar,
  Users,
  IndianRupee,
  TrendingUp,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Play,
  FileText,
  History,
  Copy,
  Divide,
  Download,
  Search,
  Filter,
  RefreshCw,
  Info
} from "lucide-react";
import { formatCurrency, calculateGrossSalary, calculateTotalDeductions, formatDateTime } from "@/lib/utils";
import { toast } from "sonner";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const RunPayroll = () => {
  const [employees, setEmployees] = useState([]);
  const [selectedEmployees, setSelectedEmployees] = useState([]);
  const [payrollData, setPayrollData] = useState([]);
  const loadedPayrollRef = useRef(null); // Track which month/year we've loaded
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [payrollMonth, setPayrollMonth] = useState('');
  const [payrollYear, setPayrollYear] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('all');
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [payrollHistory, setPayrollHistory] = useState([]);
  const [showDuplicateDialog, setShowDuplicateDialog] = useState(false);
  const [existingPayrollId, setExistingPayrollId] = useState(null);
  const [payrollRunId, setPayrollRunId] = useState(null);
  const [activeTab, setActiveTab] = useState('employees');
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [importFile, setImportFile] = useState(null);
  const [importing, setImporting] = useState(false);
  const [importResults, setImportResults] = useState(null);

  useEffect(() => {
    const now = new Date();
    setPayrollMonth(String(now.getMonth() + 1).padStart(2, '0'));
    setPayrollYear(String(now.getFullYear()));
    fetchEmployees();
  }, []);

  // Load existing payroll data when month/year changes OR when employees load
  useEffect(() => {
    const currentKey = `${payrollMonth}-${payrollYear}`;
    
    if (payrollMonth && payrollYear && employees.length > 0) {
      // Only load if we haven't loaded this month/year yet
      if (loadedPayrollRef.current !== currentKey) {
        console.log('🔄 useEffect triggered - Loading payroll data for:', currentKey);
        loadedPayrollRef.current = currentKey;
        loadExistingPayrollData();
      } else {
        console.log('⏭️ Skipping - Already loaded:', currentKey);
      }
    }
  }, [payrollMonth, payrollYear, employees.length]);

  const fetchEmployees = async () => {
    try {
      const response = await axios.get(`${API}/employees`);
      const activeEmployees = response.data.filter(emp => emp.status === 'active');
      
      // Fetch EMI data for each employee
      const employeesWithEMI = await Promise.all(
        activeEmployees.map(async (emp) => {
          try {
            const emiResponse = await axios.get(`${API}/employees/${emp.employee_id}/pending-emi`);
            return {
              ...emp,
              pending_emi: emiResponse.data.pending_emi || 0,
              loan_details: emiResponse.data.loan_details || null
            };
          } catch (error) {
            // If no EMI data found, default to 0
            return {
              ...emp,
              pending_emi: 0,
              loan_details: null
            };
          }
        })
      );
      
      setEmployees(employeesWithEMI);
      setSelectedEmployees(employeesWithEMI.map(emp => emp.id));
      // Don't call preparePayrollDataWithLeaves here - let the useEffect handle it
    } catch (error) {
      console.error('Error fetching employees:', error);
      toast.error('Failed to load employees');
    } finally {
      setLoading(false);
    }
  };

  const loadExistingPayrollData = async () => {
    if (!payrollMonth || !payrollYear || employees.length === 0) {
      console.log('Skipping payroll load - missing prerequisites:', {
        payrollMonth,
        payrollYear,
        employeesCount: employees.length
      });
      return;
    }

    try {
      console.log('Attempting to load payroll for:', { month: payrollMonth, year: payrollYear });
      
      const response = await axios.get(`${API}/payroll-runs`, {
        params: {
          month: parseInt(payrollMonth),
          year: parseInt(payrollYear)
        }
      });

      console.log('Payroll API Response:', response.data);

      if (response.data && response.data.length > 0) {
        // Payroll run exists for this month/year
        const existingPayroll = response.data[0];
        console.log('✅ Existing payroll found:', existingPayroll);
        console.log('Number of employees in payroll:', existingPayroll.employees?.length);
        
        // Log the first employee's data structure to debug
        if (existingPayroll.employees && existingPayroll.employees.length > 0) {
          console.log('First employee data structure:', JSON.stringify(existingPayroll.employees[0], null, 2));
        }

        // Map the saved payroll data back to the form
        const restoredPayrollData = employees.map(employee => {
          // Find this employee in the saved payroll
          const savedEmpData = existingPayroll.employees?.find(
            emp => emp.employee_id === employee.employee_id
          );

          console.log(`Employee ${employee.employee_id}:`, savedEmpData ? '✅ Found in payroll' : '❌ Not found');

          if (savedEmpData) {
            // Use saved data - parse all numeric fields carefully
            const bonus = Number(savedEmpData.bonus) || 0;
            const adjustments = Number(savedEmpData.adjustments) || 0;
            const tds = Number(savedEmpData.tds) || 0;
            const loan_deductions = Number(savedEmpData.loan_deductions) || 0;
            const overtime_hours = Number(savedEmpData.overtime_hours) || 0;
            const days_worked = Number(savedEmpData.days_worked) || 0;
            const days_in_month = Number(savedEmpData.days_in_month) || 30;
            const gross_salary = Number(savedEmpData.gross_salary) || 0;
            const total_deductions = Number(savedEmpData.total_deductions) || 0;
            const net_salary = Number(savedEmpData.net_salary) || 0;
            
            // Get salary components
            const basic_salary = Number(savedEmpData.earnings?.basic_salary || savedEmpData.basic_salary || employee.salary_structure?.basic_salary) || 0;
            const hra = Number(savedEmpData.earnings?.house_rent_allowance || savedEmpData.hra || employee.salary_structure?.hra) || 0;
            const medical_allowance = Number(savedEmpData.earnings?.medical_allowance || savedEmpData.medical_allowance || employee.salary_structure?.medical_allowance) || 0;
            const travel_allowance = Number(savedEmpData.earnings?.leave_travel_allowance || savedEmpData.travel_allowance || employee.salary_structure?.travel_allowance) || 0;
            const food_allowance = Number(savedEmpData.earnings?.conveyance_allowance || savedEmpData.food_allowance || employee.salary_structure?.food_allowance) || 0;
            const internet_allowance = Number(savedEmpData.earnings?.performance_incentive || savedEmpData.internet_allowance || employee.salary_structure?.internet_allowance) || 0;
            const special_allowance = Number(savedEmpData.earnings?.other_benefits || savedEmpData.special_allowance || employee.salary_structure?.special_allowance) || 0;
            const pf_employee = Number(savedEmpData.deductions?.pf_employee || savedEmpData.pf_employee || employee.salary_structure?.pf_employee) || 0;
            const esi_employee = Number(savedEmpData.deductions?.esi_employee || savedEmpData.esi_employee || employee.salary_structure?.esi_employee) || 0;
            const professional_tax = Number(savedEmpData.deductions?.professional_tax || savedEmpData.professional_tax || employee.salary_structure?.professional_tax) || 0;
            
            const restored = {
              employee_id: employee.employee_id,
              name: employee.name,
              employee_code: employee.employee_id,
              designation: employee.designation,
              department: employee.department,
              // Salary components
              basic_salary,
              hra,
              medical_allowance,
              travel_allowance,
              food_allowance,
              internet_allowance,
              special_allowance,
              pf_employee,
              esi_employee,
              professional_tax,
              // Dynamic fields - THESE ARE THE IMPORTANT ONES
              bonus,
              adjustments,
              tds,
              loan_deductions,
              overtime_hours,
              days_worked,
              days_in_month,
              // Calculated values
              gross_salary,
              total_deductions,
              net_salary,
              // Fields for summary cards
              payroll_gross: gross_salary,
              payroll_deductions: total_deductions,
              payroll_net: net_salary,
              // Salary structure for reference
              salary_structure: {
                basic_salary,
                hra,
                medical_allowance,
                travel_allowance,
                food_allowance,
                internet_allowance,
                special_allowance,
                pf_employee,
                esi_employee,
                professional_tax
              }
            };
            
            console.log(`✅ Restored ${employee.employee_id} - Bonus: ${bonus}, TDS: ${tds}, Adjustments: ${adjustments}`);
            return restored;
          } else {
            // Employee not in saved payroll - use fresh calculation
            const gross = calculateGrossSalary(employee.salary_structure);
            const deductions = calculateTotalDeductions(employee.salary_structure);
            const loanDeductions = employee.pending_emi || 0;
            const tds = 0;
            
            return {
              employee_id: employee.employee_id,
              name: employee.name,
              employee_code: employee.employee_id,
              designation: employee.designation,
              department: employee.department,
              gross_salary: gross,
              total_deductions: deductions + loanDeductions + tds,
              loan_deductions: loanDeductions,
              net_salary: gross - deductions - loanDeductions - tds,
              days_worked: 0,
              days_in_month: 0,
              tds: tds,
              bonus: 0,
              adjustments: 0,
              overtime_hours: 0,
              payroll_gross: gross,
              payroll_deductions: deductions + loanDeductions + tds,
              payroll_net: gross - deductions - loanDeductions - tds,
              ...employee.salary_structure
            };
          }
        });

        console.log('📊 Final restored payroll data count:', restoredPayrollData.length);
        console.log('📊 Sample restored entry:', restoredPayrollData[0]);
        setPayrollData(restoredPayrollData);
        
        // Auto-select all employees after loading data
        const allEmployeeIds = restoredPayrollData.map(emp => emp.employee_id);
        setSelectedEmployees(allEmployeeIds);
        console.log('✅ Auto-selected all employees:', allEmployeeIds.length);
        
        toast.success(`✅ Loaded existing payroll for ${getMonthName(parseInt(payrollMonth))} ${payrollYear}`);
      } else {
        // No existing payroll - prepare fresh data
        console.log('❌ No existing payroll found, preparing fresh data');
        await preparePayrollDataWithLeaves(employees);
      }
    } catch (error) {
      console.error('❌ Error loading existing payroll:', error);
      console.error('Error details:', error.response?.data);
      // If error, fall back to preparing fresh data
      await preparePayrollDataWithLeaves(employees);
    }
  };

  const getMonthName = (monthNum) => {
    const months = ['January', 'February', 'March', 'April', 'May', 'June',
                   'July', 'August', 'September', 'October', 'November', 'December'];
    return months[monthNum - 1];
  };

  const getDaysInMonth = (month, year) => {
    return new Date(year, month, 0).getDate();
  };

  const fetchApprovedLeaves = async (month, year) => {
    try {
      const response = await axios.get(`${API}/leaves/approved-by-month`, {
        params: { month: parseInt(month), year: parseInt(year) }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching approved leaves:', error);
      return {};
    }
  };

  const preparePayrollDataWithLeaves = async (employeeList) => {
    // Calculate actual days in the selected month
    const daysInMonth = getDaysInMonth(parseInt(payrollMonth), parseInt(payrollYear));
    
    // Fetch approved leaves for this month
    const approvedLeaves = await fetchApprovedLeaves(payrollMonth, payrollYear);
    
    console.log(`Auto-filling days worked for ${payrollMonth}/${payrollYear}:`, approvedLeaves);
    
    const payroll = employeeList.map(employee => {
      const gross = calculateGrossSalary(employee.salary_structure);
      const deductions = calculateTotalDeductions(employee.salary_structure);
      const loanDeductions = employee.pending_emi || 0;
      
      // Calculate net pay INCLUDING loan deductions and TDS
      const netPay = gross - deductions + 0 + 0 - loanDeductions - 0; // bonus=0, adjustments=0, tds=0 initially
      
      // Calculate days worked: Total days - Excess leaves (beyond entitlement)
      const leaveData = approvedLeaves[employee.employee_id] || { total_excess_days: 0 };
      const excessLeaveDays = leaveData.total_excess_days || 0;
      const daysWorked = Math.max(0, daysInMonth - excessLeaveDays);
      
      return {
        ...employee,
        payroll_gross: gross,
        payroll_deductions: deductions,
        payroll_net: netPay, // Use calculated net pay with loan deductions
        days_worked: daysWorked, // Auto-filled: Total days - Excess leaves
        days_in_month: daysInMonth,
        excess_leave_days: excessLeaveDays,
        leave_breakdown: leaveData,
        overtime_hours: 0,
        bonus: 0,
        loan_deductions: loanDeductions,
        tds: 0,
        adjustments: 0,
        status: 'pending'
      };
    });
    setPayrollData(payroll);
    
    const employeesWithLeaves = Object.keys(approvedLeaves).length;
    if (employeesWithLeaves > 0) {
      toast.success(`Days worked auto-filled with leave adjustments for ${employeesWithLeaves} employees`);
    } else {
      toast.success(`Days worked auto-filled: ${daysInMonth} days for all employees`);
    }
  };

  const preparePayrollData = (employeeList) => {
    // This is called when month/year changes - use the async version
    preparePayrollDataWithLeaves(employeeList);
  };

  const handleViewHistory = async () => {
    try {
      const response = await axios.get(`${API}/payroll/history`);
      setPayrollHistory(response.data);
      setShowHistoryModal(true);
    } catch (error) {
      console.error('Error fetching history:', error);
      toast.error('Failed to load payroll history');
    }
  };

  const checkDuplicatePayroll = async () => {
    try {
      const response = await axios.get(`${API}/payroll/check-exists`, {
        params: {
          month: parseInt(payrollMonth),
          year: parseInt(payrollYear)
        }
      });
      
      if (response.data.exists) {
        setExistingPayrollId(response.data.payroll_run_id);
        setShowDuplicateDialog(true);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error checking duplicate:', error);
      return false;
    }
  };

  const handleRunPayrollClick = async () => {
    const hasDuplicate = await checkDuplicatePayroll();
    if (!hasDuplicate) {
      setShowConfirmDialog(true);
    }
  };

  const handleOverwritePayroll = async () => {
    setShowDuplicateDialog(false);
    setShowConfirmDialog(true);
  };

  const processPayroll = async () => {
    setProcessing(true);
    
    try {
      const selectedPayrollData = payrollData.filter(emp => selectedEmployees.includes(emp.id));
      
      const employeesData = selectedPayrollData.map(emp => ({
        employee_id: emp.employee_id,
        days_worked: emp.days_worked,
        overtime_hours: emp.overtime_hours || 0,
        bonus: emp.bonus || 0,
        adjustments: emp.adjustments || 0,
        loan_deductions: emp.loan_deductions || 0,
        tds: emp.tds || 0
      }));
      
      const response = await axios.post(`${API}/payroll/run`, {
        month: parseInt(payrollMonth),
        year: parseInt(payrollYear),
        employees: employeesData
      });
      
      setPayrollData(prev => prev.map(emp => {
        if (selectedEmployees.includes(emp.id)) {
          return { ...emp, status: 'processed', payroll_run_id: response.data.payroll_run_id };
        }
        return emp;
      }));
      
      setPayrollRunId(response.data.payroll_run_id);
      setActiveTab('summary');
      toast.success(`Payroll processed successfully for ${selectedPayrollData.length} employees`);
    } catch (error) {
      console.error('Error processing payroll:', error);
      toast.error(error.response?.data?.detail || 'Failed to process payroll');
    } finally {
      setProcessing(false);
      setShowConfirmDialog(false);
    }
  };

  const handleGeneratePayslips = async () => {
    try {
      const processedEmployee = payrollData.find(emp => emp.status === 'processed');
      if (!processedEmployee || !processedEmployee.payroll_run_id) {
        toast.error('Please run payroll first before generating payslips');
        return;
      }

      const response = await axios.post(`${API}/payroll/${processedEmployee.payroll_run_id}/generate-payslips`);
      toast.success(response.data.message);
      
      setTimeout(() => {
        window.location.href = '/payslips';
      }, 1500);
    } catch (error) {
      console.error('Error generating payslips:', error);
      toast.error(error.response?.data?.detail || 'Failed to generate payslips');
    }
  };


  const handleDownloadTemplate = async () => {
    try {
      const response = await axios.get(`${API}/payroll/download-template`, {
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'Payroll_Import_Template.xlsx');
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      toast.success('Template downloaded successfully');
    } catch (error) {
      console.error('Error downloading template:', error);
      toast.error('Failed to download template');
    }
  };

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
        toast.error('Please select an Excel file (.xlsx or .xls)');
        return;
      }
      setImportFile(file);
    }
  };

  const handleImportExcel = async () => {
    if (!importFile) {
      toast.error('Please select a file to import');
      return;
    }

    try {
      setImporting(true);
      const formData = new FormData();
      formData.append('file', importFile);

      const response = await axios.post(`${API}/payroll/import-excel`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      setImportResults(response.data);
      
      if (response.data.error_count === 0) {
        toast.success(`Successfully imported ${response.data.imported_count} payslips`);
        // Refresh data
        await fetchEmployees();
      } else {
        toast.warning(`Imported ${response.data.imported_count} payslips with ${response.data.error_count} errors`);
      }
    } catch (error) {
      console.error('Error importing Excel:', error);
      toast.error(error.response?.data?.detail || 'Failed to import payroll data');
    } finally {
      setImporting(false);
    }
  };

  const resetImportDialog = () => {
    setShowImportDialog(false);
    setImportFile(null);
    setImportResults(null);
  };


  const updatePayrollData = (employeeId, field, value) => {
    setPayrollData(prev => prev.map(emp => {
      if (emp.id === employeeId) {
        const updated = { ...emp, [field]: parseFloat(value) || 0 };
        
        let gross = calculateGrossSalary(updated.salary_structure);
        let deductions = calculateTotalDeductions(updated.salary_structure);
        let net = gross - deductions + updated.bonus + updated.adjustments - (updated.loan_deductions || 0) - (updated.tds || 0);
        
        return {
          ...updated,
          payroll_net: net
        };
      }
      return emp;
    }));
  };

  const setQuickBonus = (employeeId, multiplier) => {
    setPayrollData(prev => prev.map(emp => {
      if (emp.id === employeeId) {
        const bonusAmount = emp.payroll_gross * multiplier;
        const updated = { ...emp, bonus: bonusAmount };
        
        let gross = calculateGrossSalary(updated.salary_structure);
        let deductions = calculateTotalDeductions(updated.salary_structure);
        let net = gross - deductions + updated.bonus + updated.adjustments - (updated.loan_deductions || 0) - (updated.tds || 0);
        
        return {
          ...updated,
          payroll_net: net
        };
      }
      return emp;
    }));
  };

  const handleSelectAll = () => {
    if (selectedEmployees.length === payrollData.length) {
      setSelectedEmployees([]);
    } else {
      setSelectedEmployees(payrollData.map(emp => emp.id));
    }
  };

  const handleSelectEmployee = (employeeId) => {
    setSelectedEmployees(prev => {
      if (prev.includes(employeeId)) {
        return prev.filter(id => id !== employeeId);
      } else {
        return [...prev, employeeId];
      }
    });
  };

  const calculateTotals = () => {
    const selectedData = payrollData.filter(emp => selectedEmployees.includes(emp.id));
    return {
      totalEmployees: selectedData.length,
      totalGross: selectedData.reduce((sum, emp) => sum + emp.payroll_gross, 0),
      totalBonus: selectedData.reduce((sum, emp) => sum + (emp.bonus || 0), 0),
      totalDeductions: selectedData.reduce((sum, emp) => sum + emp.payroll_deductions, 0),
      totalNet: selectedData.reduce((sum, emp) => sum + emp.payroll_net, 0)
    };
  };

  const filteredEmployees = payrollData.filter(emp => {
    const matchesSearch = emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         emp.employee_id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDepartment = departmentFilter === 'all' || emp.department === departmentFilter;
    return matchesSearch && matchesDepartment;
  });

  const totals = calculateTotals();
  const departments = [...new Set(employees.map(emp => emp.department))].filter(Boolean);
  const monthName = new Date(payrollYear, payrollMonth - 1).toLocaleString('default', { month: 'long' });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-2" />
          <p>Loading employees...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 bg-gray-50 dark:bg-gray-900 min-h-screen">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Run Payroll</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Process monthly payroll for all employees</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleDownloadTemplate} className="dark:text-gray-200 dark:border-gray-600 dark:hover:bg-gray-800">
            <Download className="w-4 h-4 mr-2" />
            Download Template
          </Button>
          <Button variant="outline" onClick={() => setShowImportDialog(true)} className="dark:text-gray-200 dark:border-gray-600 dark:hover:bg-gray-800">
            <FileText className="w-4 h-4 mr-2" />
            Import from Excel
          </Button>
          <Button variant="outline" onClick={handleViewHistory} className="dark:text-gray-200 dark:border-gray-600 dark:hover:bg-gray-800">
            <History className="w-4 h-4 mr-2" />
            View History
          </Button>
        </div>
      </div>

      {/* Period Selection */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-2 flex items-center space-x-4">
              <Calendar className="w-10 h-10 text-emerald-600" />
              <div>
                <Label className="text-sm font-medium">Payroll Period</Label>
                <p className="text-2xl font-bold">{monthName} {payrollYear}</p>
              </div>
            </div>
            <div>
              <Label>Month</Label>
              <Select value={payrollMonth} onValueChange={setPayrollMonth}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 12 }, (_, i) => i + 1).map(month => (
                    <SelectItem key={month} value={String(month).padStart(2, '0')}>
                      {new Date(2024, month - 1).toLocaleString('default', { month: 'long' })}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Year</Label>
              <Select value={payrollYear} onValueChange={setPayrollYear}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i).map(year => (
                    <SelectItem key={year} value={String(year)}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Employees</p>
                <p className="text-2xl font-bold">{totals.totalEmployees}</p>
              </div>
              <Users className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Gross Salary</p>
                <p className="text-2xl font-bold text-emerald-600">{formatCurrency(totals.totalGross)}</p>
              </div>
              <TrendingUp className="w-8 h-8 text-emerald-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Bonus</p>
                <p className="text-2xl font-bold text-amber-600">{formatCurrency(totals.totalBonus)}</p>
              </div>
              <IndianRupee className="w-8 h-8 text-amber-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Deductions</p>
                <p className="text-2xl font-bold text-red-600">{formatCurrency(totals.totalDeductions)}</p>
              </div>
              <IndianRupee className="w-8 h-8 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-emerald-700 dark:text-emerald-400 font-medium">Net Payable</p>
                <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-300">{formatCurrency(totals.totalNet)}</p>
              </div>
              <CheckCircle2 className="w-8 h-8 text-emerald-700 dark:text-emerald-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content with Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="border-b border-gray-200 dark:border-gray-700 mb-6">
          <TabsList className="flex justify-start space-x-8 bg-transparent h-auto p-0">
            <TabsTrigger 
              value="employees"
              className="relative pb-3 text-sm font-medium transition-all duration-500 ease-in-out data-[state=active]:text-blue-600 data-[state=inactive]:text-gray-600 dark:data-[state=active]:text-blue-400 dark:data-[state=inactive]:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 border-b-2 border-transparent data-[state=active]:border-blue-600 dark:data-[state=active]:border-blue-400 rounded-none bg-transparent"
            >
              <Users className="w-4 h-4 inline mr-2" />
              Employee Details
            </TabsTrigger>
            <TabsTrigger 
              value="summary" 
              disabled={!payrollRunId}
              className="relative pb-3 text-sm font-medium transition-all duration-500 ease-in-out data-[state=active]:text-blue-600 data-[state=inactive]:text-gray-600 dark:data-[state=active]:text-blue-400 dark:data-[state=inactive]:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 border-b-2 border-transparent data-[state=active]:border-blue-600 dark:data-[state=active]:border-blue-400 disabled:opacity-50 disabled:cursor-not-allowed rounded-none bg-transparent"
            >
              <FileText className="w-4 h-4 inline mr-2" />
              Payroll Summary
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="employees" className="space-y-4">
          {/* Search and Filters */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    placeholder="Search by name or employee ID..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <div className="w-full md:w-64">
                  <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
                    <SelectTrigger>
                      <Filter className="w-4 h-4 mr-2" />
                      <SelectValue placeholder="All Departments" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Departments</SelectItem>
                      {departments.map(dept => (
                        <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button variant="outline" onClick={handleSelectAll}>
                  {selectedEmployees.length === payrollData.length ? 'Deselect All' : 'Select All'}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Employee Table */}
          <Card>
            <CardContent className="pt-6">
              <div className="overflow-x-auto border border-gray-200 dark:border-gray-700 rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow className="border-b border-gray-200 dark:border-gray-700">
                      <TableHead className="w-12 text-gray-700 dark:text-gray-300">
                        <Checkbox
                          checked={selectedEmployees.length === payrollData.length}
                          onCheckedChange={handleSelectAll}
                        />
                      </TableHead>
                      <TableHead className="text-gray-700 dark:text-gray-300">Employee</TableHead>
                      <TableHead className="text-gray-700 dark:text-gray-300">Gross Salary</TableHead>
                      <TableHead className="text-gray-700 dark:text-gray-300">Days Worked</TableHead>
                      <TableHead className="text-gray-700 dark:text-gray-300">Bonus</TableHead>
                      <TableHead className="text-gray-700 dark:text-gray-300">Loan Deductions</TableHead>
                      <TableHead className="text-gray-700 dark:text-gray-300">TDS</TableHead>
                      <TableHead className="text-gray-700 dark:text-gray-300">Adjustments</TableHead>
                      <TableHead className="text-right text-gray-700 dark:text-gray-300">Net Pay</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredEmployees.map((employee) => (
                      <TableRow key={employee.id} className="border-b border-gray-200 dark:border-gray-700">
                        <TableCell>
                          <Checkbox
                            checked={selectedEmployees.includes(employee.id)}
                            onCheckedChange={() => handleSelectEmployee(employee.id)}
                          />
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium text-gray-900 dark:text-gray-200">{employee.name}</p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">{employee.employee_id} • {employee.department}</p>
                          </div>
                        </TableCell>
                        <TableCell className="font-medium text-gray-900 dark:text-gray-200">
                          {formatCurrency(employee.payroll_gross)}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Input
                              type="number"
                              value={employee.days_worked}
                              onChange={(e) => updatePayrollData(employee.id, 'days_worked', e.target.value)}
                              className="w-20"
                              min="0"
                              max={getDaysInMonth(parseInt(payrollMonth), parseInt(payrollYear))}
                            />
                            {employee.excess_leave_days > 0 && (
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Info className="h-4 w-4 text-blue-500 cursor-help" />
                                  </TooltipTrigger>
                                  <TooltipContent className="max-w-xs bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                                    <div className="text-sm text-gray-900 dark:text-gray-200">
                                      <p className="font-semibold mb-1">Leave Adjustment</p>
                                      <p>{employee.days_in_month} days in month</p>
                                      <p className="text-red-600 dark:text-red-400">- {employee.excess_leave_days} excess leave days</p>
                                      <p className="border-t border-gray-200 dark:border-gray-700 pt-1 mt-1 font-medium">= {employee.days_worked} days worked</p>
                                      {employee.leave_breakdown && (
                                        <div className="mt-2 text-xs text-gray-600 dark:text-gray-400">
                                          {employee.leave_breakdown.casual_excess > 0 && (
                                            <p>Casual: {employee.leave_breakdown.casual_excess} excess</p>
                                          )}
                                          {employee.leave_breakdown.sick_excess > 0 && (
                                            <p>Sick: {employee.leave_breakdown.sick_excess} excess</p>
                                          )}
                                          {employee.leave_breakdown.other_days > 0 && (
                                            <p>Other: {employee.leave_breakdown.other_days} days</p>
                                          )}
                                        </div>
                                      )}
                                    </div>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-1">
                            <Input
                              type="number"
                              value={employee.bonus}
                              onChange={(e) => updatePayrollData(employee.id, 'bonus', e.target.value)}
                              className="w-28"
                              min="0"
                            />
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0"
                              onClick={() => setQuickBonus(employee.id, 1)}
                              title="Set bonus equal to full gross pay"
                            >
                              <Copy className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0"
                              onClick={() => setQuickBonus(employee.id, 0.5)}
                              title="Set bonus equal to half of gross pay"
                            >
                              <Divide className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-1">
                            <Input
                              type="number"
                              value={employee.loan_deductions || ''}
                              onChange={(e) => updatePayrollData(employee.id, 'loan_deductions', e.target.value)}
                              className="w-24"
                              min="0"
                              placeholder="0"
                            />
                            {employee.pending_emi > 0 && (
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Info className="h-4 w-4 text-blue-500 cursor-help" />
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <div className="text-sm">
                                      <p className="font-semibold">Active Loan Deduction</p>
                                      <p>Monthly Amount: ₹{employee.pending_emi.toLocaleString()}</p>
                                      {employee.loan_details && (
                                        <div className="mt-1">
                                          <p className="text-xs text-white font-medium">
                                            Loan Amount: ₹{employee.loan_details.amount?.toLocaleString()}
                                          </p>
                                          <p className="text-xs text-white font-medium">
                                            Remaining: {employee.loan_details.remaining_months} months
                                          </p>
                                        </div>
                                      )}
                                    </div>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            value={employee.tds || ''}
                            onChange={(e) => updatePayrollData(employee.id, 'tds', e.target.value)}
                            className="w-24"
                            min="0"
                            placeholder="0"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            value={employee.adjustments}
                            onChange={(e) => updatePayrollData(employee.id, 'adjustments', e.target.value)}
                            className="w-24"
                          />
                        </TableCell>
                        <TableCell className="text-right font-bold text-emerald-600 dark:text-emerald-400">
                          {formatCurrency(employee.payroll_net)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <div className="flex justify-between items-center mt-6 pt-6 border-t dark:border-gray-700">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {selectedEmployees.length} of {payrollData.length} employees selected
                </p>
                <Button
                  onClick={handleRunPayrollClick}
                  disabled={processing || selectedEmployees.length === 0}
                  className="bg-emerald-600 hover:bg-emerald-700"
                  size="lg"
                >
                  <Play className="w-4 h-4 mr-2" />
                  {processing ? 'Processing...' : `Process Payroll (${totals.totalEmployees})`}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="summary" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <CheckCircle2 className="w-6 h-6 text-emerald-600 mr-2" />
                Payroll Processed Successfully!
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                    <p className="text-sm text-blue-700 dark:text-blue-400">Employees Processed</p>
                    <p className="text-2xl font-bold text-blue-900 dark:text-blue-300">{totals.totalEmployees}</p>
                  </div>
                  <div className="p-4 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-lg">
                    <p className="text-sm text-emerald-700 dark:text-emerald-400">Total Gross</p>
                    <p className="text-2xl font-bold text-emerald-900 dark:text-emerald-300">{formatCurrency(totals.totalGross)}</p>
                  </div>
                  <div className="p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                    <p className="text-sm text-amber-700 dark:text-amber-400">Total Bonus</p>
                    <p className="text-2xl font-bold text-amber-900 dark:text-amber-300">{formatCurrency(totals.totalBonus)}</p>
                  </div>
                  <div className="p-4 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg">
                    <p className="text-sm text-purple-700 dark:text-purple-400">Net Payable</p>
                    <p className="text-2xl font-bold text-purple-900 dark:text-purple-300">{formatCurrency(totals.totalNet)}</p>
                  </div>
                </div>

                <div className="flex justify-center space-x-4">
                  <Button onClick={handleGeneratePayslips} size="lg" className="bg-emerald-600 hover:bg-emerald-700">
                    <FileText className="w-4 h-4 mr-2" />
                    Generate Payslips
                  </Button>
                  <Button variant="outline" size="lg" onClick={() => window.location.href = '/payslips'}>
                    <Download className="w-4 h-4 mr-2" />
                    View Payslips
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      <AlertDialog open={showDuplicateDialog} onOpenChange={setShowDuplicateDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center space-x-2">
              <AlertTriangle className="w-5 h-5 text-red-600" />
              <span>Payroll Already Exists</span>
            </AlertDialogTitle>
            <AlertDialogDescription>
              Payroll for <strong>{monthName} {payrollYear}</strong> already exists.
              <br /><br />
              Do you want to <strong>overwrite</strong> the existing payroll?
              <br /><br />
              <span className="text-red-600">Warning: This will delete the previous payroll run and all associated payslips for this month.</span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleOverwritePayroll} className="bg-red-600 hover:bg-red-700">
              Overwrite
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center space-x-2">
              <AlertTriangle className="w-5 h-5 text-yellow-600" />
              <span>Confirm Payroll Processing</span>
            </AlertDialogTitle>
            <AlertDialogDescription>
              You are about to process payroll for <strong>{totals.totalEmployees} employees</strong> for <strong>{monthName} {payrollYear}</strong>.
              <br /><br />
              Total net amount to be disbursed: <strong>{formatCurrency(totals.totalNet)}</strong>
              <br /><br />
              This action cannot be undone. Are you sure you want to continue?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={processPayroll}>
              Process Payroll
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={showHistoryModal} onOpenChange={setShowHistoryModal}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Payroll History</DialogTitle>
          </DialogHeader>
          <div className="mt-4">
            {payrollHistory.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <FileText className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <p>No payroll history found</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="border-b border-gray-200 dark:border-gray-700">
                    <TableHead className="text-gray-700 dark:text-gray-300">Month & Year</TableHead>
                    <TableHead className="text-gray-700 dark:text-gray-300">Total Employees</TableHead>
                    <TableHead className="text-gray-700 dark:text-gray-300">Total Payout</TableHead>
                    <TableHead className="text-gray-700 dark:text-gray-300">Date/Time</TableHead>
                    <TableHead className="text-gray-700 dark:text-gray-300">Processed By</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payrollHistory.map((run) => (
                    <TableRow key={run.id} className="border-b border-gray-200 dark:border-gray-700">
                      <TableCell className="font-medium text-gray-900 dark:text-gray-200">
                        {new Date(run.year, run.month - 1).toLocaleString('default', { month: 'long', year: 'numeric' })}
                      </TableCell>
                      <TableCell className="text-gray-800 dark:text-gray-300">{run.total_employees}</TableCell>
                      <TableCell className="font-semibold text-emerald-600 dark:text-emerald-400">
                        {formatCurrency(run.total_net)}
                      </TableCell>
                      <TableCell className="text-gray-800 dark:text-gray-300">
                        {formatDateTime(run.processed_date)}
                      </TableCell>
                      <TableCell className="text-gray-800 dark:text-gray-300">{run.processed_by}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Import Excel Dialog */}
      <Dialog open={showImportDialog} onOpenChange={resetImportDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Import Payroll from Excel</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {!importResults ? (
              <>
                <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center">
                  <FileText className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                    Upload your payroll Excel file (.xlsx or .xls)
                  </p>
                  <Input
                    type="file"
                    accept=".xlsx,.xls"
                    onChange={handleFileSelect}
                    className="max-w-md mx-auto"
                  />
                  {importFile && (
                    <p className="text-sm text-green-600 mt-2">
                      Selected: {importFile.name}
                    </p>
                  )}
                </div>

                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-500/30 rounded-lg p-4">
                  <h4 className="font-semibold text-blue-900 dark:text-blue-300 mb-2">Instructions:</h4>
                  <ul className="text-sm text-blue-800 dark:text-blue-400 space-y-1">
                    <li>• Download the template first if you haven't already</li>
                    <li>• Ensure Employee IDs match existing employees in the system</li>
                    <li>• Month/Year format should be MM/YYYY (e.g., 10/2025)</li>
                    <li>• All amounts should be numeric values</li>
                    <li>• Importing will create or update payslips for the specified month</li>
                  </ul>
                </div>

                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={resetImportDialog}>
                    Cancel
                  </Button>
                  <Button onClick={handleImportExcel} disabled={!importFile || importing}>
                    {importing ? (
                      <>
                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                        Importing...
                      </>
                    ) : (
                      <>
                        <FileText className="w-4 h-4 mr-2" />
                        Import Payroll
                      </>
                    )}
                  </Button>
                </div>
              </>
            ) : (
              <>
                <div className="space-y-4">
                  <div className={`p-4 rounded-lg ${
                    importResults.error_count === 0 
                      ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-500/30' 
                      : 'bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-500/30'
                  }`}>
                    <h4 className="font-semibold mb-2">Import Results</h4>
                    <div className="space-y-1 text-sm">
                      <p className="text-green-700 dark:text-green-400">
                        ✓ Successfully imported: {importResults.imported_count} payslips
                      </p>
                      {importResults.error_count > 0 && (
                        <p className="text-red-700 dark:text-red-400">
                          ✗ Errors: {importResults.error_count}
                        </p>
                      )}
                    </div>
                  </div>

                  {importResults.errors && importResults.errors.length > 0 && (
                    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-500/30 rounded-lg p-4 max-h-60 overflow-y-auto">
                      <h4 className="font-semibold text-red-900 dark:text-red-300 mb-2">Errors:</h4>
                      <ul className="text-sm text-red-800 dark:text-red-400 space-y-1">
                        {importResults.errors.map((error, index) => (
                          <li key={index}>• {error}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                <div className="flex justify-end">
                  <Button onClick={resetImportDialog}>
                    Close
                  </Button>
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default RunPayroll;