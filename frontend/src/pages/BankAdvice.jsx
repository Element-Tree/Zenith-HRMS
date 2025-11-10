import React, { useState, useEffect } from "react";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import {
  Building2,
  Download,
  FileText,
  Send,
  Check,
  Clock,
  IndianRupee,
  Users,
  Calendar,
  Plus,
  Edit,
  Trash2,
  Upload,
  Eye,
  EyeOff,
  Link as LinkIcon,
  AlertCircle
} from "lucide-react";
import { formatCurrency, formatDate, formatDateTime, formatTime } from "@/lib/utils";
import { toast } from "sonner";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const BankAdvice = () => {
  // Bank Advice Tab State
  const [employees, setEmployees] = useState([]);
  const [bankAdvices, setBankAdvices] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedCompanyAccount, setSelectedCompanyAccount] = useState(""); // Start blank
  const [selectedTemplate, setSelectedTemplate] = useState(""); // Start blank
  const [loading, setLoading] = useState(true);
  const [generatingAdvice, setGeneratingAdvice] = useState(false);
  const [payrollData, setPayrollData] = useState([]);
  const [actualPayrollData, setActualPayrollData] = useState(null);

  // Company Bank Accounts Tab State
  const [companyAccounts, setCompanyAccounts] = useState([]);
  const [showAccountDialog, setShowAccountDialog] = useState(false);
  const [editingAccount, setEditingAccount] = useState(null);
  const [showAccountNumber, setShowAccountNumber] = useState({});
  const [accountForm, setAccountForm] = useState({
    account_name: "",
    bank_name: "",
    account_number: "",
    ifsc_code: "",
    branch: "",
    is_active: true
  });

  // Employee Source Mapping Tab State
  const [employeeMappings, setEmployeeMappings] = useState([]);
  const [showMappingDialog, setShowMappingDialog] = useState(false);
  const [showBulkMappingDialog, setShowBulkMappingDialog] = useState(false);
  const [selectedEmployeeForMapping, setSelectedEmployeeForMapping] = useState("");
  const [selectedAccountForMapping, setSelectedAccountForMapping] = useState("");
  const [bulkSelectedEmployees, setBulkSelectedEmployees] = useState([]);
  const [bulkSelectedAccount, setBulkSelectedAccount] = useState("");

  // Bank Template Tab State
  const [bankTemplates, setBankTemplates] = useState([]);
  const [showTemplateDialog, setShowTemplateDialog] = useState(false);
  const [templateFile, setTemplateFile] = useState(null);
  const [templateBankName, setTemplateBankName] = useState("");

  // Active Tab
  const [activeTab, setActiveTab] = useState("bank-advice");

  useEffect(() => {
    fetchEmployees();
    fetchCompanyAccounts();
    fetchEmployeeMappings();
    fetchBankTemplates();
    fetchBankAdvices();
  }, []);

  // Fetch payroll data when month/year changes
  useEffect(() => {
    fetchPayrollData();
  }, [selectedMonth, selectedYear]);

  // Fetch employees and generate payroll data
  const fetchEmployees = async () => {
    try {
      const response = await axios.get(`${API}/employees`);
      setEmployees(response.data);
      generatePayrollData(response.data);
    } catch (error) {
      console.error('Error fetching employees:', error);
      toast.error('Failed to load employees');
    } finally {
      setLoading(false);
    }
  };

  // Fetch company bank accounts
  const fetchCompanyAccounts = async () => {
    try {
      const response = await axios.get(`${API}/company-bank-accounts`);
      setCompanyAccounts(response.data);
    } catch (error) {
      console.error('Error fetching company accounts:', error);
      // Only show error toast for non-auth errors
      if (error.response?.status !== 401 && error.response?.status !== 403) {
        toast.error('Failed to load company bank accounts');
      }
    }
  };

  // Fetch employee source mappings
  const fetchEmployeeMappings = async () => {
    try {
      const response = await axios.get(`${API}/employee-source-mapping`);
      setEmployeeMappings(response.data);
    } catch (error) {
      console.error('Error fetching employee mappings:', error);
      // Only show error toast for non-auth errors
      if (error.response?.status !== 401 && error.response?.status !== 403) {
        toast.error('Failed to load employee mappings');
      }
    }
  };

  // Fetch bank templates
  const fetchBankTemplates = async () => {
    try {
      const response = await axios.get(`${API}/bank-templates`);
      setBankTemplates(response.data);
    } catch (error) {
      console.error('Error fetching bank templates:', error);
      // Only show error toast for non-auth errors
      if (error.response?.status !== 401 && error.response?.status !== 403) {
        toast.error('Failed to load bank templates');
      }
    }
  };

  // Fetch bank advices
  const fetchBankAdvices = async () => {
    try {
      const response = await axios.get(`${API}/bank-advice`);
      setBankAdvices(response.data);
    } catch (error) {
      console.error('Error fetching bank advices:', error);
      // Only show error toast for non-auth errors
      if (error.response?.status !== 401 && error.response?.status !== 403) {
        toast.error('Failed to load bank advices');
      }
    }
  };

  // Fetch actual payroll data for selected month/year
  const fetchPayrollData = async () => {
    try {
      const response = await axios.get(
        `${API}/payroll-runs?month=${selectedMonth}&year=${selectedYear}`
      );
      
      if (response.data && response.data.length > 0) {
        // Found a payroll run for this month/year
        const payrollRun = response.data[0];
        setActualPayrollData(payrollRun);
        
        // Generate display data from actual payroll
        const displayData = payrollRun.employees.map(emp => ({
          employee_id: emp.employee_id,
          employee_code: emp.employee_id,
          employee_name: emp.employee_name,
          account_number: emp.account_number || '',
          ifsc_code: emp.ifsc_code || '',
          bank_name: emp.bank_name || '',
          branch: emp.branch || '',
          net_salary: emp.net_salary
        }));
        setPayrollData(displayData);
      } else {
        // No payroll run found, use salary structure calculation
        setActualPayrollData(null);
        generatePayrollData(employees);
      }
    } catch (error) {
      console.error('Error fetching payroll data:', error);
      // Fall back to salary structure calculation
      setActualPayrollData(null);
      generatePayrollData(employees);
    }
  };

  const generatePayrollData = (employeeList) => {
    // Filter only active employees
    const activeEmployees = employeeList.filter(emp => emp.status === 'active');
    
    const payroll = activeEmployees.map(employee => {
      const gross = calculateGrossSalary(employee.salary_structure);
      const deductions = calculateTotalDeductions(employee.salary_structure);
      const net = gross - deductions;
      
      return {
        employee_id: employee.id,
        employee_name: employee.name,
        employee_code: employee.employee_id,
        department: employee.department,
        designation: employee.designation,
        bank_name: employee.bank_info.bank_name,
        account_number: employee.bank_info.account_number,
        ifsc_code: employee.bank_info.ifsc_code,
        branch: employee.bank_info.branch || '',
        gross_salary: gross,
        total_deductions: deductions,
        net_salary: net
      };
    });
    setPayrollData(payroll);
  };

  const calculateGrossSalary = (salaryStructure) => {
    return (
      salaryStructure.basic_salary +
      salaryStructure.hra +
      salaryStructure.medical_allowance +
      salaryStructure.travel_allowance +
      salaryStructure.food_allowance +
      salaryStructure.internet_allowance +
      salaryStructure.special_allowance
    );
  };

  const calculateTotalDeductions = (salaryStructure) => {
    return (
      salaryStructure.pf_employee +
      salaryStructure.esi_employee +
      salaryStructure.professional_tax +
      salaryStructure.tds
    );
  };

  const generateMockBankAdvices = () => {
    const mockAdvices = [
      {
        id: 'ba-001',
        month: 10,
        year: 2024,
        total_amount: 2850000,
        employee_count: 45,
        status: 'generated',
        generated_date: '2024-10-28',
        bank_count: 5,
        reference_number: 'BA/OCT24/001'
      },
      {
        id: 'ba-002',
        month: 9,
        year: 2024,
        total_amount: 2750000,
        employee_count: 43,
        status: 'sent',
        generated_date: '2024-09-28',
        sent_date: '2024-09-30',
        bank_count: 5,
        reference_number: 'BA/SEP24/001'
      },
      {
        id: 'ba-003',
        month: 8,
        year: 2024,
        total_amount: 2680000,
        employee_count: 41,
        status: 'completed',
        generated_date: '2024-08-28',
        sent_date: '2024-08-30',
        completed_date: '2024-09-01',
        bank_count: 4,
        reference_number: 'BA/AUG24/001'
      }
    ];
    setBankAdvices(mockAdvices);
  };

  const generateBankAdvice = async () => {
    // Validation
    if (!selectedCompanyAccount) {
      toast.error('Please select a Company Account');
      return;
    }
    
    if (!selectedTemplate) {
      toast.error('Please select a Bank Template');
      return;
    }
    
    setGeneratingAdvice(true);
    
    try {
      const response = await axios.post(`${API}/bank-advice/generate`, {
        month: selectedMonth,
        year: selectedYear,
        company_account_id: selectedCompanyAccount === "all" ? null : selectedCompanyAccount,
        template_id: selectedTemplate === "standard" ? null : selectedTemplate
      });
      
      toast.success(response.data.message);
      
      // Show warning if there are unmapped employees
      if (response.data.unmapped_employees && response.data.unmapped_employees.length > 0) {
        toast.warning(`${response.data.unmapped_employees.length} employees are not mapped to any company account`);
      }
      
      // Refresh bank advices list
      fetchBankAdvices();
    } catch (error) {
      console.error('Error generating bank advice:', error);
      toast.error(error.response?.data?.detail || 'Failed to generate bank advice');
    } finally {
      setGeneratingAdvice(false);
    }
  };

  const handleSendToBank = (adviceId) => {
    setBankAdvices(prev => prev.map(advice => 
      advice.id === adviceId 
        ? { ...advice, status: 'sent', sent_date: new Date().toISOString().split('T')[0] }
        : advice
    ));
    toast.success('Bank advice sent to banks successfully');
  };

  const handleMarkCompleted = (adviceId) => {
    setBankAdvices(prev => prev.map(advice => 
      advice.id === adviceId 
        ? { ...advice, status: 'completed', completed_date: new Date().toISOString().split('T')[0] }
        : advice
    ));
    toast.success('Bank advice marked as completed');
  };

  // formatDateTime is now imported from utils

  // formatDateOnly is replaced with formatDate from utils

  // formatTimeOnly is replaced with formatTime from utils

  const downloadBankAdvice = async (advice) => {
    try {
      const response = await axios.get(
        `${API}/bank-advice/${advice.id}/download`,
        { responseType: 'blob' }
      );
      
      // Create blob and download
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Bank_Advice_${advice.reference_number.replace(/\//g, '_')}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      toast.success(`Downloaded bank advice ${advice.reference_number}`);
    } catch (error) {
      console.error('Error downloading bank advice:', error);
      toast.error('Failed to download bank advice');
    }
  };

  const downloadBankWiseReport = (bankName) => {
    toast.success(`Downloading report for ${bankName}`);
  };

  // ==================== Company Bank Account Handlers ====================

  const handleCreateOrUpdateAccount = async () => {
    try {
      if (editingAccount) {
        // Update existing account
        await axios.put(
          `${API}/company-bank-accounts/${editingAccount.id}`,
          accountForm
        );
        toast.success('Company bank account updated successfully');
      } else {
        // Create new account
        await axios.post(
          `${API}/company-bank-accounts`,
          accountForm
        );
        toast.success('Company bank account created successfully');
      }
      
      fetchCompanyAccounts();
      setShowAccountDialog(false);
      resetAccountForm();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to save company bank account');
    }
  };

  const handleEditAccount = (account) => {
    setEditingAccount(account);
    setAccountForm({
      account_name: account.account_name,
      bank_name: account.bank_name,
      account_number: account.account_number,
      ifsc_code: account.ifsc_code,
      branch: account.branch,
      is_active: account.is_active
    });
    setShowAccountDialog(true);
  };

  const handleDeleteAccount = async (accountId) => {
    if (!window.confirm('Are you sure you want to delete this company bank account?')) {
      return;
    }

    try {
      await axios.delete(`${API}/company-bank-accounts/${accountId}`);
      toast.success('Company bank account deleted successfully');
      fetchCompanyAccounts();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to delete company bank account');
    }
  };

  const resetAccountForm = () => {
    setAccountForm({
      account_name: "",
      bank_name: "",
      account_number: "",
      ifsc_code: "",
      branch: "",
      is_active: true
    });
    setEditingAccount(null);
  };

  const toggleAccountNumberVisibility = (accountId) => {
    setShowAccountNumber(prev => ({
      ...prev,
      [accountId]: !prev[accountId]
    }));
  };

  const maskAccountNumber = (accountNumber) => {
    if (!accountNumber || accountNumber.length < 4) return accountNumber;
    return '****' + accountNumber.slice(-4);
  };

  // ==================== Employee Source Mapping Handlers ====================

  const handleCreateMapping = async () => {
    try {
      await axios.post(
        `${API}/employee-source-mapping`,
        {
          employee_id: selectedEmployeeForMapping,
          company_account_id: selectedAccountForMapping
        }
      );
      toast.success('Employee source mapping saved successfully');
      fetchEmployeeMappings();
      setShowMappingDialog(false);
      setSelectedEmployeeForMapping("");
      setSelectedAccountForMapping("");
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to save employee mapping');
    }
  };

  const handleBulkMapping = async () => {
    if (bulkSelectedEmployees.length === 0) {
      toast.error('Please select at least one employee');
      return;
    }

    if (!bulkSelectedAccount) {
      toast.error('Please select a company account');
      return;
    }

    try {
      const response = await axios.post(
        `${API}/employee-source-mapping/bulk`,
        {
          employee_ids: bulkSelectedEmployees,
          company_account_id: bulkSelectedAccount
        }
      );
      
      toast.success(`Successfully mapped ${response.data.success_count} employees`);
      if (response.data.failed_count > 0) {
        toast.warning(`Failed to map ${response.data.failed_count} employees`);
      }
      
      fetchEmployeeMappings();
      setShowBulkMappingDialog(false);
      setBulkSelectedEmployees([]);
      setBulkSelectedAccount("");
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to bulk map employees');
    }
  };

  const handleDeleteMapping = async (mappingId) => {
    if (!window.confirm('Are you sure you want to delete this mapping?')) {
      return;
    }

    try {
      await axios.delete(`${API}/employee-source-mapping/${mappingId}`);
      toast.success('Employee mapping deleted successfully');
      fetchEmployeeMappings();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to delete employee mapping');
    }
  };

  const toggleBulkEmployeeSelection = (employeeId) => {
    setBulkSelectedEmployees(prev => {
      if (prev.includes(employeeId)) {
        return prev.filter(id => id !== employeeId);
      } else {
        return [...prev, employeeId];
      }
    });
  };

  const selectAllEmployees = () => {
    const activeEmployees = employees.filter(emp => emp.status === 'active');
    if (bulkSelectedEmployees.length === activeEmployees.length) {
      setBulkSelectedEmployees([]);
    } else {
      setBulkSelectedEmployees(activeEmployees.map(emp => emp.employee_id));
    }
  };

  // ==================== Bank Template Handlers ====================

  const handleTemplateUpload = async () => {
    if (!templateFile) {
      toast.error('Please select a file');
      return;
    }

    if (!templateBankName) {
      toast.error('Please enter bank name');
      return;
    }

    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const base64Data = e.target.result.split(',')[1];
        
        await axios.post(
          `${API}/bank-templates`,
          {
            bank_name: templateBankName,
            file_name: templateFile.name,
            template_data: base64Data
          }
        );
        
        toast.success('Bank template uploaded successfully');
        fetchBankTemplates();
        setShowTemplateDialog(false);
        setTemplateFile(null);
        setTemplateBankName("");
      };
      reader.readAsDataURL(templateFile);
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to upload template');
    }
  };

  const handleDeleteTemplate = async (templateId) => {
    if (!window.confirm('Are you sure you want to delete this template?')) {
      return;
    }

    try {
      await axios.delete(`${API}/bank-templates/${templateId}`);
      toast.success('Bank template deleted successfully');
      fetchBankTemplates();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to delete template');
    }
  };

  const handleDownloadTemplate = async (templateId, fileName) => {
    try {
      const response = await axios.get(`${API}/bank-templates/${templateId}`);
      
      // Convert base64 to blob and download
      const base64Data = response.data.template_data;
      const byteCharacters = atob(base64Data);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { 
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
      });
      
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      toast.success('Template downloaded successfully');
    } catch (error) {
      toast.error('Failed to download template');
    }
  };

  const getMonthName = (month) => {
    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    return months[month - 1];
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'generated': return 'bg-blue-100 text-blue-800';
      case 'sent': return 'bg-yellow-100 text-yellow-800';
      case 'completed': return 'bg-emerald-100 text-emerald-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'generated': return <FileText className="w-4 h-4" />;
      case 'sent': return <Send className="w-4 h-4" />;
      case 'completed': return <Check className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  const groupedByBank = payrollData.reduce((acc, emp) => {
    if (!acc[emp.bank_name]) {
      acc[emp.bank_name] = {
        employees: [],
        total_amount: 0,
        count: 0
      };
    }
    acc[emp.bank_name].employees.push(emp);
    acc[emp.bank_name].total_amount += emp.net_salary;
    acc[emp.bank_name].count += 1;
    return acc;
  }, {});

  const totalAmount = payrollData.reduce((sum, emp) => sum + emp.net_salary, 0);
  const totalEmployees = payrollData.length;
  const uniqueBanks = Object.keys(groupedByBank).length;

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-10 bg-gray-200 rounded-lg w-64"></div>
        <div className="h-96 bg-gray-200 rounded-lg"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="bank-advice">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
            Bank Advice Management
          </h1>
          <p className="text-gray-500 dark:text-gray-400">
            Manage bank advice, company accounts, employee mappings, and bank templates
          </p>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="border-b border-gray-200 dark:border-gray-700 mb-6">
          <TabsList className="flex justify-start space-x-8 bg-transparent h-auto p-0">
            <TabsTrigger 
              value="bank-advice"
              className="relative pb-3 text-sm font-medium transition-all duration-500 ease-in-out data-[state=active]:text-blue-600 data-[state=inactive]:text-gray-600 dark:data-[state=active]:text-blue-400 dark:data-[state=inactive]:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 border-b-2 border-transparent data-[state=active]:border-blue-600 dark:data-[state=active]:border-blue-400 rounded-none bg-transparent"
            >
              Bank Advice
            </TabsTrigger>
            <TabsTrigger 
              value="company-accounts"
              className="relative pb-3 text-sm font-medium transition-all duration-500 ease-in-out data-[state=active]:text-blue-600 data-[state=inactive]:text-gray-600 dark:data-[state=active]:text-blue-400 dark:data-[state=inactive]:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 border-b-2 border-transparent data-[state=active]:border-blue-600 dark:data-[state=active]:border-blue-400 rounded-none bg-transparent"
            >
              Company Bank Accounts
            </TabsTrigger>
            <TabsTrigger 
              value="employee-mapping"
              className="relative pb-3 text-sm font-medium transition-all duration-500 ease-in-out data-[state=active]:text-blue-600 data-[state=inactive]:text-gray-600 dark:data-[state=active]:text-blue-400 dark:data-[state=inactive]:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 border-b-2 border-transparent data-[state=active]:border-blue-600 dark:data-[state=active]:border-blue-400 rounded-none bg-transparent"
            >
              Employee Source Mapping
            </TabsTrigger>
            <TabsTrigger 
              value="templates"
              className="relative pb-3 text-sm font-medium transition-all duration-500 ease-in-out data-[state=active]:text-blue-600 data-[state=inactive]:text-gray-600 dark:data-[state=active]:text-blue-400 dark:data-[state=inactive]:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 border-b-2 border-transparent data-[state=active]:border-blue-600 dark:data-[state=active]:border-blue-400 rounded-none bg-transparent"
            >
              Template Upload
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Tab 1: Bank Advice */}
        <TabsContent value="bank-advice" className="space-y-6">
          {renderBankAdviceTab()}
        </TabsContent>

        {/* Tab 2: Company Bank Accounts */}
        <TabsContent value="company-accounts" className="space-y-6">
          {renderCompanyAccountsTab()}
        </TabsContent>

        {/* Tab 3: Employee Source Mapping */}
        <TabsContent value="employee-mapping" className="space-y-6">
          {renderEmployeeMappingTab()}
        </TabsContent>

        {/* Tab 4: Template Upload */}
        <TabsContent value="templates" className="space-y-6">
          {renderTemplatesTab()}
        </TabsContent>
      </Tabs>
    </div>
  );

  // ==================== Tab Render Functions ====================

  function renderBankAdviceTab() {
    return (
      <>
        {/* Info Banner */}
        {bankAdvices.length === 0 && (
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="text-sm font-semibold text-blue-800 dark:text-blue-300">
                  No Bank Advices Generated
                </h3>
                <p className="text-sm text-blue-700 dark:text-blue-400 mt-1">
                  Click "Generate Bank Advice" to create bank payment instructions based on processed payroll data.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <IndianRupee className="h-8 w-8 text-emerald-600" />
                <div>
                  <p className="text-2xl font-bold">{formatCurrency(totalAmount)}</p>
                  <p className="text-xs text-gray-500">Total Amount</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <Users className="h-8 w-8 text-blue-600" />
                <div>
                  <p className="text-2xl font-bold">{totalEmployees}</p>
                  <p className="text-xs text-gray-500">Employees</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <Building2 className="h-8 w-8 text-purple-600" />
                <div>
                  <p className="text-2xl font-bold">{uniqueBanks}</p>
                  <p className="text-xs text-gray-500">Banks</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <Calendar className="h-8 w-8 text-orange-600" />
                <div>
                  <p className="text-2xl font-bold">{getMonthName(selectedMonth)}</p>
                  <p className="text-xs text-gray-500">{selectedYear}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Generate New Bank Advice */}
          <Card>
            <CardHeader>
              <CardTitle>Generate New Bank Advice</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Month</Label>
                  <Select value={selectedMonth.toString()} onValueChange={(value) => setSelectedMonth(parseInt(value))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 12 }, (_, i) => (
                        <SelectItem key={i + 1} value={String(i + 1)}>
                          {getMonthName(i + 1)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Year</Label>
                  <Select value={selectedYear.toString()} onValueChange={(value) => setSelectedYear(parseInt(value))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 3 }, (_, i) => (
                        <SelectItem key={2024 + i} value={String(2024 + i)}>
                          {2024 + i}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label>Company Account <span className="text-red-500">*</span></Label>
                <Select value={selectedCompanyAccount} onValueChange={setSelectedCompanyAccount}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select company account..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Accounts</SelectItem>
                    {companyAccounts.filter(acc => acc.is_active).map((acc) => (
                      <SelectItem key={acc.id} value={acc.id}>
                        {acc.account_name} - {acc.bank_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-gray-500 mt-1">
                  Generate advice for all accounts or select a specific one
                </p>
              </div>

              <div>
                <Label>Bank Template <span className="text-red-500">*</span></Label>
                <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select bank template..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="standard">Standard Format</SelectItem>
                    {bankTemplates.map((template) => (
                      <SelectItem key={template.id} value={template.id}>
                        {template.bank_name} Template
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-gray-500 mt-1">
                  Select a bank-specific template or use standard format
                </p>
              </div>
              
              <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium">Summary</h4>
                  {actualPayrollData ? (
                    <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                      Actual Payroll
                    </Badge>
                  ) : (
                    <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                      Estimated
                    </Badge>
                  )}
                </div>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span>Total Employees:</span>
                    <span>{totalEmployees}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Total Amount:</span>
                    <span className="font-semibold">{formatCurrency(totalAmount)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Number of Banks:</span>
                    <span>{uniqueBanks}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Company Accounts:</span>
                    <span>{companyAccounts.filter(acc => acc.is_active).length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Templates Available:</span>
                    <span>{bankTemplates.length}</span>
                  </div>
                </div>
                {!actualPayrollData && (
                  <div className="mt-2 text-xs text-yellow-600 dark:text-yellow-400">
                    ⚠ No payroll run found for {getMonthName(selectedMonth)} {selectedYear}. Showing estimated amounts from salary structure.
                  </div>
                )}
              </div>

              <Button 
                onClick={generateBankAdvice}
                disabled={generatingAdvice || companyAccounts.length === 0 || !selectedCompanyAccount || !selectedTemplate}
                className="w-full bg-emerald-600 hover:bg-emerald-700"
              >
                {generatingAdvice ? (
                  <Clock className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <FileText className="w-4 h-4 mr-2" />
                )}
                Generate Bank Advice
              </Button>
              
              {companyAccounts.length === 0 && (
                <p className="text-xs text-yellow-600 dark:text-yellow-400">
                  Please create company bank accounts first
                </p>
              )}
              
              {(!selectedCompanyAccount || !selectedTemplate) && companyAccounts.length > 0 && (
                <p className="text-xs text-yellow-600 dark:text-yellow-400">
                  Please select Company Account and Bank Template
                </p>
              )}
            </CardContent>
          </Card>

          {/* Bank-wise Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Bank-wise Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 max-h-80 overflow-y-auto">
                {Object.entries(groupedByBank).map(([bankName, data]) => (
                  <div key={bankName} className="p-3 border rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium">{bankName}</h4>
                        <p className="text-sm text-gray-500">{data.count} employees</p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">{formatCurrency(data.total_amount)}</p>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => downloadBankWiseReport(bankName)}
                        >
                          <Download className="w-3 h-3 mr-1" />
                          Download
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Bank Advice History */}
        <Card>
          <CardHeader>
            <CardTitle>Bank Advice History</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="border border-gray-200 dark:border-gray-700 rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow className="border-b border-gray-200 dark:border-gray-700">
                    <TableHead className="text-gray-700 dark:text-gray-300">Reference</TableHead>
                    <TableHead className="text-gray-700 dark:text-gray-300">Period</TableHead>
                    <TableHead className="text-gray-700 dark:text-gray-300">Company Account</TableHead>
                    <TableHead className="text-gray-700 dark:text-gray-300">Employees</TableHead>
                    <TableHead className="text-gray-700 dark:text-gray-300">Amount</TableHead>
                    <TableHead className="text-gray-700 dark:text-gray-300">Status</TableHead>
                    <TableHead className="text-gray-700 dark:text-gray-300">Generated</TableHead>
                    <TableHead className="text-gray-700 dark:text-gray-300">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {bankAdvices.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                        No bank advices generated yet
                      </TableCell>
                    </TableRow>
                  ) : (
                    bankAdvices.map((advice) => (
                      <TableRow key={advice.id} className="border-b border-gray-200 dark:border-gray-700">
                        <TableCell className="font-mono text-gray-800 dark:text-gray-300">{advice.reference_number}</TableCell>
                        <TableCell className="text-gray-800 dark:text-gray-300">{getMonthName(advice.month)} {advice.year}</TableCell>
                        <TableCell className="text-gray-800 dark:text-gray-300">
                          <div>
                            <div className="font-medium">{advice.company_account_name || "N/A"}</div>
                            <div className="text-xs text-gray-500">{advice.company_bank_name || ""}</div>
                          </div>
                        </TableCell>
                        <TableCell className="text-gray-800 dark:text-gray-300">{advice.employee_count}</TableCell>
                        <TableCell className="font-medium text-gray-900 dark:text-gray-200">{formatCurrency(advice.total_amount)}</TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(advice.status)}>
                            <div className="flex items-center space-x-1">
                              {getStatusIcon(advice.status)}
                              <span>{advice.status}</span>
                            </div>
                          </Badge>
                        </TableCell>
                        <TableCell className="text-gray-800 dark:text-gray-300">
                          <div>
                            <div>{formatDate(advice.generated_date)}</div>
                            <div className="text-xs text-gray-500">{formatTime(advice.generated_date)}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-1">
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => downloadBankAdvice(advice)}
                            >
                              <Download className="w-3 h-3" />
                            </Button>
                            {advice.status === 'generated' && (
                              <Button 
                                size="sm"
                                onClick={() => handleSendToBank(advice.id)}
                              >
                                <Send className="w-3 h-3" />
                              </Button>
                            )}
                            {advice.status === 'sent' && (
                              <Button 
                                size="sm"
                                variant="outline"
                                onClick={() => handleMarkCompleted(advice.id)}
                              >
                                <Check className="w-3 h-3" />
                              </Button>
                            )}
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

        {/* Bank Transfer Details */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Employee Transfer Details</CardTitle>
              {actualPayrollData ? (
                <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                  Actual Payroll Data
                </Badge>
              ) : (
                <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                  Estimated from Salary Structure
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="border border-gray-200 dark:border-gray-700 rounded-lg max-h-96 overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-b border-gray-200 dark:border-gray-700">
                    <TableHead className="text-gray-700 dark:text-gray-300">Employee</TableHead>
                    <TableHead className="text-gray-700 dark:text-gray-300">Account Number</TableHead>
                    <TableHead className="text-gray-700 dark:text-gray-300">IFSC Code</TableHead>
                    <TableHead className="text-gray-700 dark:text-gray-300">Bank & Branch</TableHead>
                    <TableHead className="text-gray-700 dark:text-gray-300">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payrollData.map((employee) => (
                    <TableRow key={employee.employee_id} className="border-b border-gray-200 dark:border-gray-700">
                      <TableCell>
                        <div>
                          <div className="font-medium text-gray-900 dark:text-gray-200">{employee.employee_name}</div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">{employee.employee_code}</div>
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-gray-800 dark:text-gray-300">
                        ***{employee.account_number.slice(-4)}
                      </TableCell>
                      <TableCell className="font-mono text-gray-800 dark:text-gray-300">{employee.ifsc_code}</TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{employee.bank_name}</div>
                          <div className="text-sm text-gray-500">{employee.branch}</div>
                        </div>
                      </TableCell>
                      <TableCell className="font-medium text-emerald-600">
                        {formatCurrency(employee.net_salary)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </>
    );
  }

  function renderCompanyAccountsTab() {
    return (
      <>
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
              Company Bank Accounts
            </h2>
            <p className="text-gray-500 dark:text-gray-400">
              Manage company bank accounts for salary disbursements
            </p>
          </div>
          <Button 
            onClick={() => {
              resetAccountForm();
              setShowAccountDialog(true);
            }}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Account
          </Button>
        </div>

        {/* Company Accounts Table */}
        <Card>
          <CardHeader>
            <CardTitle>All Company Bank Accounts ({companyAccounts.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="border border-gray-200 dark:border-gray-700 rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow className="border-b border-gray-200 dark:border-gray-700">
                    <TableHead className="text-gray-700 dark:text-gray-300">Account Name</TableHead>
                    <TableHead className="text-gray-700 dark:text-gray-300">Bank Name</TableHead>
                    <TableHead className="text-gray-700 dark:text-gray-300">Account Number</TableHead>
                    <TableHead className="text-gray-700 dark:text-gray-300">IFSC Code</TableHead>
                    <TableHead className="text-gray-700 dark:text-gray-300">Branch</TableHead>
                    <TableHead className="text-gray-700 dark:text-gray-300">Status</TableHead>
                    <TableHead className="text-gray-700 dark:text-gray-300">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {companyAccounts.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                        No company bank accounts found. Click "Add Account" to create one.
                      </TableCell>
                    </TableRow>
                  ) : (
                    companyAccounts.map((account) => (
                      <TableRow key={account.id} className="border-b border-gray-200 dark:border-gray-700">
                        <TableCell className="font-medium text-gray-900 dark:text-gray-200">
                          {account.account_name}
                        </TableCell>
                        <TableCell className="text-gray-800 dark:text-gray-300">
                          {account.bank_name}
                        </TableCell>
                        <TableCell className="font-mono text-gray-800 dark:text-gray-300">
                          <div className="flex items-center space-x-2">
                            <span>
                              {showAccountNumber[account.id] 
                                ? account.account_number 
                                : maskAccountNumber(account.account_number)}
                            </span>
                            <button
                              onClick={() => toggleAccountNumberVisibility(account.id)}
                              className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                            >
                              {showAccountNumber[account.id] ? (
                                <EyeOff className="w-4 h-4" />
                              ) : (
                                <Eye className="w-4 h-4" />
                              )}
                            </button>
                          </div>
                        </TableCell>
                        <TableCell className="font-mono text-gray-800 dark:text-gray-300">
                          {account.ifsc_code}
                        </TableCell>
                        <TableCell className="text-gray-800 dark:text-gray-300">
                          {account.branch}
                        </TableCell>
                        <TableCell>
                          <Badge className={account.is_active ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}>
                            {account.is_active ? "Active" : "Inactive"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => handleEditAccount(account)}
                            >
                              <Edit className="w-3 h-3" />
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline"
                              className="text-red-600 hover:text-red-700"
                              onClick={() => handleDeleteAccount(account.id)}
                            >
                              <Trash2 className="w-3 h-3" />
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

        {/* Add/Edit Account Dialog */}
        <Dialog open={showAccountDialog} onOpenChange={setShowAccountDialog}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>
                {editingAccount ? "Edit Company Bank Account" : "Add Company Bank Account"}
              </DialogTitle>
              <DialogDescription>
                {editingAccount 
                  ? "Update the company bank account details below." 
                  : "Enter the details for the new company bank account."}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <Label htmlFor="account_name">Account Name</Label>
                <Input
                  id="account_name"
                  value={accountForm.account_name}
                  onChange={(e) => setAccountForm({...accountForm, account_name: e.target.value})}
                  placeholder="e.g., Primary Salary Account"
                />
              </div>
              <div>
                <Label htmlFor="bank_name">Bank Name</Label>
                <Input
                  id="bank_name"
                  value={accountForm.bank_name}
                  onChange={(e) => setAccountForm({...accountForm, bank_name: e.target.value})}
                  placeholder="e.g., HDFC Bank"
                />
              </div>
              <div>
                <Label htmlFor="account_number">Account Number</Label>
                <Input
                  id="account_number"
                  value={accountForm.account_number}
                  onChange={(e) => setAccountForm({...accountForm, account_number: e.target.value})}
                  placeholder="Enter account number"
                />
              </div>
              <div>
                <Label htmlFor="ifsc_code">IFSC Code</Label>
                <Input
                  id="ifsc_code"
                  value={accountForm.ifsc_code}
                  onChange={(e) => setAccountForm({...accountForm, ifsc_code: e.target.value})}
                  placeholder="e.g., HDFC0001234"
                />
              </div>
              <div>
                <Label htmlFor="branch">Branch</Label>
                <Input
                  id="branch"
                  value={accountForm.branch}
                  onChange={(e) => setAccountForm({...accountForm, branch: e.target.value})}
                  placeholder="e.g., Mumbai Main Branch"
                />
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="is_active"
                  checked={accountForm.is_active}
                  onCheckedChange={(checked) => setAccountForm({...accountForm, is_active: checked})}
                />
                <Label htmlFor="is_active" className="cursor-pointer">
                  Active Account
                </Label>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowAccountDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateOrUpdateAccount} className="bg-blue-600 hover:bg-blue-700">
                {editingAccount ? "Update" : "Create"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </>
    );
  }

  function renderEmployeeMappingTab() {
    return (
      <>
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
              Employee Source Mapping
            </h2>
            <p className="text-gray-500 dark:text-gray-400">
              Map employees to company bank accounts for salary transfers
            </p>
          </div>
          <div className="flex space-x-2">
            <Button 
              onClick={() => setShowMappingDialog(true)}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <LinkIcon className="w-4 h-4 mr-2" />
              Add Mapping
            </Button>
            <Button 
              onClick={() => setShowBulkMappingDialog(true)}
              className="bg-purple-600 hover:bg-purple-700"
            >
              <Users className="w-4 h-4 mr-2" />
              Bulk Mapping
            </Button>
          </div>
        </div>

        {/* Info Card */}
        {companyAccounts.length === 0 && (
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <AlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="text-sm font-semibold text-yellow-800 dark:text-yellow-300">
                  No Company Bank Accounts
                </h3>
                <p className="text-sm text-yellow-700 dark:text-yellow-400 mt-1">
                  Please create company bank accounts in the "Company Bank Accounts" tab before mapping employees.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Employee Mappings Table */}
        <Card>
          <CardHeader>
            <CardTitle>Employee Mappings ({employeeMappings.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="border border-gray-200 dark:border-gray-700 rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow className="border-b border-gray-200 dark:border-gray-700">
                    <TableHead className="text-gray-700 dark:text-gray-300">Employee ID</TableHead>
                    <TableHead className="text-gray-700 dark:text-gray-300">Employee Name</TableHead>
                    <TableHead className="text-gray-700 dark:text-gray-300">Department</TableHead>
                    <TableHead className="text-gray-700 dark:text-gray-300">Company Account</TableHead>
                    <TableHead className="text-gray-700 dark:text-gray-300">Bank Name</TableHead>
                    <TableHead className="text-gray-700 dark:text-gray-300">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {employeeMappings.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                        No employee mappings found. Click "Add Mapping" to create one.
                      </TableCell>
                    </TableRow>
                  ) : (
                    employeeMappings.map((mapping) => (
                      <TableRow key={mapping.id} className="border-b border-gray-200 dark:border-gray-700">
                        <TableCell className="font-mono text-gray-800 dark:text-gray-300">
                          {mapping.employee_id}
                        </TableCell>
                        <TableCell className="font-medium text-gray-900 dark:text-gray-200">
                          {mapping.employee_name}
                        </TableCell>
                        <TableCell className="text-gray-800 dark:text-gray-300">
                          {mapping.employee_department}
                        </TableCell>
                        <TableCell className="text-gray-800 dark:text-gray-300">
                          {mapping.company_account_name}
                        </TableCell>
                        <TableCell className="text-gray-800 dark:text-gray-300">
                          {mapping.company_bank_name}
                        </TableCell>
                        <TableCell>
                          <Button 
                            size="sm" 
                            variant="outline"
                            className="text-red-600 hover:text-red-700"
                            onClick={() => handleDeleteMapping(mapping.id)}
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Add Mapping Dialog */}
        <Dialog open={showMappingDialog} onOpenChange={setShowMappingDialog}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Add Employee Source Mapping</DialogTitle>
              <DialogDescription>
                Select an employee and a company bank account to create a mapping.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <Label htmlFor="employee">Employee</Label>
                <Select value={selectedEmployeeForMapping} onValueChange={setSelectedEmployeeForMapping}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select employee" />
                  </SelectTrigger>
                  <SelectContent>
                    {employees.filter(emp => emp.status === 'active').map((emp) => (
                      <SelectItem key={emp.employee_id} value={emp.employee_id}>
                        {emp.employee_id} - {emp.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="account">Company Bank Account</Label>
                <Select value={selectedAccountForMapping} onValueChange={setSelectedAccountForMapping}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select company account" />
                  </SelectTrigger>
                  <SelectContent>
                    {companyAccounts.filter(acc => acc.is_active).map((acc) => (
                      <SelectItem key={acc.id} value={acc.id}>
                        {acc.account_name} - {acc.bank_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowMappingDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateMapping} className="bg-blue-600 hover:bg-blue-700">
                Create Mapping
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Bulk Mapping Dialog */}
        <Dialog open={showBulkMappingDialog} onOpenChange={setShowBulkMappingDialog}>
          <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Bulk Employee Source Mapping</DialogTitle>
              <DialogDescription>
                Select multiple employees and assign them to a company bank account.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <Label htmlFor="bulk_account">Company Bank Account</Label>
                <Select value={bulkSelectedAccount} onValueChange={setBulkSelectedAccount}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select company account" />
                  </SelectTrigger>
                  <SelectContent>
                    {companyAccounts.filter(acc => acc.is_active).map((acc) => (
                      <SelectItem key={acc.id} value={acc.id}>
                        {acc.account_name} - {acc.bank_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <Separator />
              
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label>Select Employees ({bulkSelectedEmployees.length} selected)</Label>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={selectAllEmployees}
                  >
                    {bulkSelectedEmployees.length === employees.length ? "Deselect All" : "Select All"}
                  </Button>
                </div>
                <div className="border rounded-lg max-h-60 overflow-y-auto p-2">
                  {employees.filter(emp => emp.status === 'active').map((emp) => (
                    <div 
                      key={emp.employee_id} 
                      className="flex items-center space-x-2 p-2 hover:bg-gray-50 dark:hover:bg-gray-800 rounded"
                    >
                      <Checkbox
                        id={`emp-${emp.employee_id}`}
                        checked={bulkSelectedEmployees.includes(emp.employee_id)}
                        onCheckedChange={() => toggleBulkEmployeeSelection(emp.employee_id)}
                      />
                      <label 
                        htmlFor={`emp-${emp.employee_id}`}
                        className="flex-1 cursor-pointer text-sm"
                      >
                        <span className="font-mono text-gray-700 dark:text-gray-300">{emp.employee_id}</span>
                        {" - "}
                        <span className="text-gray-900 dark:text-gray-100">{emp.name}</span>
                        {" - "}
                        <span className="text-gray-500 dark:text-gray-400">{emp.department}</span>
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowBulkMappingDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleBulkMapping} className="bg-purple-600 hover:bg-purple-700">
                Map {bulkSelectedEmployees.length} Employees
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </>
    );
  }

  function renderTemplatesTab() {
    return (
      <>
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
              Bank Templates
            </h2>
            <p className="text-gray-500 dark:text-gray-400">
              Upload and manage bank-specific Excel templates for salary disbursement
            </p>
          </div>
          <Button 
            onClick={() => setShowTemplateDialog(true)}
            className="bg-green-600 hover:bg-green-700"
          >
            <Upload className="w-4 h-4 mr-2" />
            Upload Template
          </Button>
        </div>

        {/* Templates Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {bankTemplates.length === 0 ? (
            <Card className="md:col-span-2 lg:col-span-3">
              <CardContent className="p-12 text-center">
                <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">
                  No bank templates uploaded yet. Click "Upload Template" to add one.
                </p>
              </CardContent>
            </Card>
          ) : (
            bankTemplates.map((template) => (
              <Card key={template.id}>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center space-x-2">
                    <FileText className="w-5 h-5 text-blue-600" />
                    <span>{template.bank_name}</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    <p><span className="font-medium">File:</span> {template.file_name}</p>
                    <p><span className="font-medium">Size:</span> {(template.template_size / 1024).toFixed(2)} KB</p>
                    <p><span className="font-medium">Uploaded:</span> {formatDate(template.uploaded_at)}</p>
                    <p><span className="font-medium">By:</span> {template.uploaded_by}</p>
                  </div>
                  <div className="flex space-x-2">
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="flex-1"
                      onClick={() => handleDownloadTemplate(template.id, template.file_name)}
                    >
                      <Download className="w-3 h-3 mr-1" />
                      Download
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline"
                      className="text-red-600 hover:text-red-700"
                      onClick={() => handleDeleteTemplate(template.id)}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Upload Template Dialog */}
        <Dialog open={showTemplateDialog} onOpenChange={setShowTemplateDialog}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Upload Bank Template</DialogTitle>
              <DialogDescription>
                Upload an Excel template for a specific bank. This template will be used for generating bank-specific salary files.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <Label htmlFor="template_bank_name">Bank Name</Label>
                <Input
                  id="template_bank_name"
                  value={templateBankName}
                  onChange={(e) => setTemplateBankName(e.target.value)}
                  placeholder="e.g., Axis Bank"
                />
              </div>
              <div>
                <Label htmlFor="template_file">Template File (Excel)</Label>
                <Input
                  id="template_file"
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={(e) => setTemplateFile(e.target.files[0])}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Upload an Excel file (.xlsx or .xls format)
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowTemplateDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleTemplateUpload} className="bg-green-600 hover:bg-green-700">
                <Upload className="w-4 h-4 mr-2" />
                Upload
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </>
    );
  }
};

export default BankAdvice;