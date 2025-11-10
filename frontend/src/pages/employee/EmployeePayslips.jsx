import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  FileText,
  Download,
  Eye,
  Calendar,
  DollarSign,
  TrendingUp,
  Search
} from 'lucide-react';
import { toast } from 'sonner';
import axios from 'axios';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Helper function to convert month number to name
const getMonthName = (monthNumber) => {
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  return months[monthNumber - 1] || monthNumber;
};

// Helper function to get days in month
const getDaysInMonth = (month, year) => {
  return new Date(year, month, 0).getDate();
};

const EmployeePayslips = () => {
  const { user } = useAuth();
  const [payslips, setPayslips] = useState([]);
  const [filteredPayslips, setFilteredPayslips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [yearFilter, setYearFilter] = useState('all');
  const [previewPayslip, setPreviewPayslip] = useState(null);
  const [companySettings, setCompanySettings] = useState(null);
  const [employeeData, setEmployeeData] = useState(null);

  useEffect(() => {
    fetchPayslips();
    fetchCompanySettings();
    fetchEmployeeData();
  }, []);

  useEffect(() => {
    filterPayslips();
  }, [payslips, searchTerm, yearFilter]);

  const fetchCompanySettings = async () => {
    try {
      const response = await axios.get(`${API}/settings`);
      setCompanySettings(response.data.company_settings);
    } catch (error) {
      console.error('Error fetching company settings:', error);
    }
  };

  const fetchEmployeeData = async () => {
    try {
      const response = await axios.get(`${API}/employees/${user.employee_id}`);
      setEmployeeData(response.data);
    } catch (error) {
      console.error('Error fetching employee data:', error);
    }
  };

  const fetchPayslips = async () => {
    try {
      // Fetch real payslips from backend API
      const response = await axios.get(`${API}/payslips`, {
        params: {
          employee_id: user.employee_id
        }
      });
      
      // Backend returns array directly, not nested in 'payslips' property
      const payslipsData = Array.isArray(response.data) ? response.data : [];
      
      // Transform payslips to include proper structure for employee view
      const transformedPayslips = payslipsData.map(payslip => {
        const employee = payslip.employee || {};
        const bankInfo = employee.bank_info || {};
        
        return {
          id: payslip.id,
          month: getMonthName(payslip.month), // Convert month number to name
          monthNumber: payslip.month, // Keep original number for filtering
          year: payslip.year,
          gross_salary: payslip.gross_salary || 0,
          net_salary: payslip.net_salary || 0,
          total_deductions: payslip.total_deductions || 0,
          status: 'generated',
          generated_date: payslip.generated_date,
          days_in_month: getDaysInMonth(payslip.month, payslip.year),
          days_worked: getDaysInMonth(payslip.month, payslip.year), // Assuming full month worked
          employee_details: {
            name: employee.name || user.name,
            employee_id: employee.employee_id || user.employee_id,
            designation: employee.designation || 'N/A',
            department: employee.department || 'N/A',
            date_of_joining: employee.date_of_joining,
            pan: bankInfo.pan || employee.pan_number || 'N/A',
            bank_account: bankInfo.account_number || 'N/A',
            ifsc: bankInfo.ifsc_code || 'N/A'
          },
          earnings: payslip.earnings || {},
          deductions: payslip.deductions || {}
        };
      });
      
      // Sort payslips by year and month descending (latest first)
      transformedPayslips.sort((a, b) => {
        if (a.year !== b.year) {
          return b.year - a.year; // Sort by year descending
        }
        return b.monthNumber - a.monthNumber; // Sort by month descending
      });
      
      setPayslips(transformedPayslips);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching payslips:', error);
      toast.error('Failed to load payslips');
      setPayslips([]);
    } finally {
      setLoading(false);
    }
  };

  const filterPayslips = () => {
    let filtered = payslips;

    if (searchTerm) {
      filtered = filtered.filter(payslip =>
        payslip.month.toLowerCase().includes(searchTerm.toLowerCase()) ||
        payslip.year.toString().includes(searchTerm)
      );
    }

    if (yearFilter !== 'all') {
      filtered = filtered.filter(payslip => payslip.year.toString() === yearFilter);
    }

    setFilteredPayslips(filtered);
  };

  const generatePayslipPDF = async (payslip) => {
    const formatCurrency = (amount) => {
      return `₹${Number(amount || 0).toLocaleString('en-IN')}`;
    };

    const formatDate = (date) => {
      if (!date) return 'N/A';
      return new Date(date).toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    };

    // Get employee details
    const employeeDetails = payslip.employee_details || {};
    
    // Create a temporary div with the exact same design as admin portal
    const tempDiv = document.createElement('div');
    tempDiv.style.position = 'absolute';
    tempDiv.style.left = '-9999px';
    tempDiv.style.width = '800px';
    tempDiv.style.padding = '20px';
    tempDiv.style.backgroundColor = 'white';
    tempDiv.style.fontFamily = 'Arial, sans-serif';
    
    tempDiv.innerHTML = `
      <div style="padding: 20px; background: white;">
        <!-- Company Header -->
        <div style="border-bottom: 2px solid #e5e7eb; padding-bottom: 20px; margin-bottom: 20px;">
          <div style="display: flex; justify-content: space-between; align-items: start;">
            <div style="display: flex; align-items: start;">
              ${companySettings?.logo_url ? 
                `<img src="${companySettings.logo_url}" alt="Company Logo" style="width: 60px; height: 60px; object-fit: contain; margin-right: 15px;" />` 
                : ''
              }
              <div>
                <h1 style="font-size: 24px; font-weight: bold; color: #10b981; margin: 0 0 5px 0;">${companySettings?.company_name || 'Element Tree'}</h1>
                <p style="font-size: 12px; color: #6b7280; margin: 0;">${companySettings?.address || 'D-601, Raikar Chambers, off K.D. Marg, opp Neelkanth Gardens, Govandi (East), Mumbai - 400088, India'}</p>
                <p style="font-size: 12px; color: #6b7280; margin: 0;">Phone: ${companySettings?.phone || '+91 22 1234 5678'} | Email: ${companySettings?.email || 'hr@elementtree.co.in'}</p>
              </div>
            </div>
            <div style="text-align: right;">
              <h2 style="font-size: 20px; font-weight: 600; margin: 0;">SALARY SLIP</h2>
              <p style="font-size: 12px; color: #6b7280; margin: 5px 0 0 0;">For the month of ${payslip.month} ${payslip.year}</p>
            </div>
          </div>
        </div>

        <!-- Employee Details -->
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px;">
          <div>
            <h3 style="font-size: 14px; font-weight: 600; margin-bottom: 10px;">Employee Details</h3>
            <table style="width: 100%; font-size: 12px;">
              <tr><td style="padding: 2px 0; color: #6b7280;">Name:</td><td style="padding: 2px 0; font-weight: 500;">${employeeDetails.name || user.name}</td></tr>
              <tr><td style="padding: 2px 0; color: #6b7280;">Employee ID:</td><td style="padding: 2px 0; font-weight: 500;">${user.employee_id}</td></tr>
              <tr><td style="padding: 2px 0; color: #6b7280;">Designation:</td><td style="padding: 2px 0; font-weight: 500;">${employeeDetails.designation || 'N/A'}</td></tr>
              <tr><td style="padding: 2px 0; color: #6b7280;">Department:</td><td style="padding: 2px 0; font-weight: 500;">${employeeDetails.department || 'N/A'}</td></tr>
              <tr><td style="padding: 2px 0; color: #6b7280;">Date of Joining:</td><td style="padding: 2px 0; font-weight: 500;">${formatDate(employeeDetails.date_of_joining)}</td></tr>
            </table>
          </div>
          <div>
            <h3 style="font-size: 14px; font-weight: 600; margin-bottom: 10px;">Bank Details</h3>
            <table style="width: 100%; font-size: 12px;">
              <tr><td style="padding: 2px 0; color: #6b7280;">PAN:</td><td style="padding: 2px 0; font-weight: 500;">${employeeDetails.pan || 'N/A'}</td></tr>
              <tr><td style="padding: 2px 0; color: #6b7280;">Bank Account:</td><td style="padding: 2px 0; font-weight: 500;">${employeeDetails.bank_account && employeeDetails.bank_account !== 'N/A' ? '***' + String(employeeDetails.bank_account).slice(-4) : 'N/A'}</td></tr>
              <tr><td style="padding: 2px 0; color: #6b7280;">IFSC Code:</td><td style="padding: 2px 0; font-weight: 500;">${employeeDetails.ifsc || 'N/A'}</td></tr>
              <tr><td style="padding: 2px 0; color: #6b7280;">Days Worked:</td><td style="padding: 2px 0; font-weight: 500;">${payslip.days_worked || 30} of 30</td></tr>
            </table>
          </div>
        </div>

        <!-- Salary Breakdown -->
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
          <div style="background-color: #ecfdf5; padding: 15px; border-radius: 8px; border-left: 4px solid #10b981;">
            <h3 style="font-size: 14px; font-weight: 600; margin-bottom: 10px; color: #065f46;">💰 Earnings</h3>
            <table style="width: 100%; font-size: 12px;">
              <tr><td style="padding: 3px 0;">Basic Salary:</td><td style="padding: 3px 0; text-align: right;">${formatCurrency(payslip.earnings?.basic_salary)}</td></tr>
              <tr><td style="padding: 3px 0;">House Rent Allowance:</td><td style="padding: 3px 0; text-align: right;">${formatCurrency(payslip.earnings?.house_rent_allowance)}</td></tr>
              <tr><td style="padding: 3px 0;">Medical Allowance:</td><td style="padding: 3px 0; text-align: right;">${formatCurrency(payslip.earnings?.medical_allowance)}</td></tr>
              <tr><td style="padding: 3px 0;">Leave Travel Allowance:</td><td style="padding: 3px 0; text-align: right;">${formatCurrency(payslip.earnings?.leave_travel_allowance)}</td></tr>
              <tr><td style="padding: 3px 0;">Bonus:</td><td style="padding: 3px 0; text-align: right;">${formatCurrency(payslip.earnings?.conveyance_allowance)}</td></tr>
              <tr><td style="padding: 3px 0;">Performance Incentive:</td><td style="padding: 3px 0; text-align: right;">${formatCurrency(payslip.earnings?.performance_incentive)}</td></tr>
              <tr><td style="padding: 3px 0;">Other Benefits:</td><td style="padding: 3px 0; text-align: right;">${formatCurrency(payslip.earnings?.other_benefits)}</td></tr>
              <tr style="border-top: 1px solid #e5e7eb;"><td style="padding: 8px 0; font-weight: 600;">Gross Earnings:</td><td style="padding: 8px 0; text-align: right; font-weight: 600;">${formatCurrency(payslip.gross_salary)}</td></tr>
            </table>
          </div>
          <div style="background-color: #fef2f2; padding: 15px; border-radius: 8px; border-left: 4px solid #dc2626;">
            <h3 style="font-size: 14px; font-weight: 600; margin-bottom: 10px; color: #991b1b;">💸 Deductions</h3>
            <table style="width: 100%; font-size: 12px;">
              <tr><td style="padding: 3px 0;">PF (Employee):</td><td style="padding: 3px 0; text-align: right;">${formatCurrency(payslip.deductions?.pf_employee)}</td></tr>
              <tr><td style="padding: 3px 0;">ESI (Employee):</td><td style="padding: 3px 0; text-align: right;">${formatCurrency(payslip.deductions?.esi_employee)}</td></tr>
              <tr><td style="padding: 3px 0;">Professional Tax:</td><td style="padding: 3px 0; text-align: right;">${formatCurrency(payslip.deductions?.professional_tax)}</td></tr>
              <tr><td style="padding: 3px 0;">TDS:</td><td style="padding: 3px 0; text-align: right;">${formatCurrency(payslip.deductions?.tds)}</td></tr>
              <tr><td style="padding: 3px 0;">Loan Deductions:</td><td style="padding: 3px 0; text-align: right;">${formatCurrency(payslip.deductions?.loan_deductions)}</td></tr>
              <tr><td style="padding: 3px 0;">Others:</td><td style="padding: 3px 0; text-align: right;">${formatCurrency(payslip.deductions?.others)}</td></tr>
              <tr style="border-top: 1px solid #e5e7eb;"><td style="padding: 8px 0; font-weight: 600;">Total Deductions:</td><td style="padding: 8px 0; text-align: right; font-weight: 600;">${formatCurrency(payslip.total_deductions)}</td></tr>
            </table>
          </div>
        </div>

        <!-- Net Salary -->
        <div style="border-top: 2px solid #e5e7eb; margin-top: 20px; padding-top: 20px;">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <span style="font-size: 16px; font-weight: 600;">Net Salary:</span>
            <span style="font-size: 24px; font-weight: bold; color: #10b981;">${formatCurrency(payslip.net_salary)}</span>
          </div>
          <p style="font-size: 12px; color: #6b7280; margin-top: 10px;">Generated on: ${formatDate(payslip.generated_date)}</p>
        </div>
      </div>
    `;
    
    document.body.appendChild(tempDiv);
    
    const canvas = await html2canvas(tempDiv, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff'
    });
    
    document.body.removeChild(tempDiv);
    
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');
    const imgWidth = 210;
    const pageHeight = 295;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    let heightLeft = imgHeight;
    
    let position = 0;
    
    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;
    
    while (heightLeft >= 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
    }
    
    pdf.save(`Payslip_${payslip.month}_${payslip.year}.pdf`);
  };

  const handleDownload = (payslip) => {
    generatePayslipPDF(payslip);
    toast.success(`Payslip for ${payslip.month} ${payslip.year} downloaded`);
  };

  const handlePreview = (payslip) => {
    setPreviewPayslip(payslip);
  };

  const availableYears = [...new Set(payslips.map(p => p.year))].sort((a, b) => b - a);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-64"></div>
          <div className="h-96 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">My Payslips</h1>
          <p className="text-gray-500">View and download your salary statements</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <FileText className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Total Payslips</p>
                <p className="text-2xl font-bold text-blue-600">{payslips.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <DollarSign className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Latest Salary</p>
                <p className="text-2xl font-bold text-green-600">
                  ₹{payslips[0]?.net_salary?.toLocaleString() || '0'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">YTD Earnings</p>
                <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                  ₹{(payslips
                    .filter(p => p.year === new Date().getFullYear())
                    .reduce((sum, p) => sum + (p.net_salary || 0), 0)
                  ).toLocaleString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Current Salary Breakdown */}
      {employeeData?.salary_structure && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <DollarSign className="h-5 w-5 text-primary" />
              <span>Current Salary Structure</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid lg:grid-cols-2 gap-6">
              <div className="bg-emerald-50 dark:bg-emerald-900/20 p-4 rounded-lg border border-emerald-200 dark:border-emerald-500/30">
                <h3 className="font-semibold mb-4 text-emerald-700 dark:text-emerald-400 flex items-center space-x-2">
                  <TrendingUp className="h-4 w-4" />
                  <span>Earnings</span>
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Basic Salary</span>
                    <span className="font-semibold">₹{(employeeData.salary_structure.basic_salary || 0).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">House Rent Allowance</span>
                    <span className="font-semibold">₹{(employeeData.salary_structure.house_rent_allowance || employeeData.salary_structure.hra || 0).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Medical Allowance</span>
                    <span className="font-semibold">₹{(employeeData.salary_structure.medical_allowance || 0).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Leave Travel Allowance</span>
                    <span className="font-semibold">₹{(employeeData.salary_structure.leave_travel_allowance || employeeData.salary_structure.travel_allowance || 0).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Bonus</span>
                    <span className="font-semibold">₹{(employeeData.salary_structure.conveyance_allowance || employeeData.salary_structure.food_allowance || 0).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Performance Incentive</span>
                    <span className="font-semibold">₹{(employeeData.salary_structure.performance_incentive || employeeData.salary_structure.internet_allowance || 0).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Other Benefits</span>
                    <span className="font-semibold">₹{(employeeData.salary_structure.other_benefits || employeeData.salary_structure.special_allowance || 0).toLocaleString()}</span>
                  </div>
                  <div className="border-t pt-3 mt-3">
                    <div className="flex justify-between items-center">
                      <span className="font-semibold text-primary">Gross Salary</span>
                      <span className="font-bold text-primary">
                        ₹{((employeeData.salary_structure.basic_salary || 0) + 
                        (employeeData.salary_structure.house_rent_allowance || employeeData.salary_structure.hra || 0) + 
                        (employeeData.salary_structure.medical_allowance || 0) + 
                        (employeeData.salary_structure.leave_travel_allowance || employeeData.salary_structure.travel_allowance || 0) + 
                        (employeeData.salary_structure.conveyance_allowance || employeeData.salary_structure.food_allowance || 0) + 
                        (employeeData.salary_structure.performance_incentive || employeeData.salary_structure.internet_allowance || 0) + 
                        (employeeData.salary_structure.other_benefits || employeeData.salary_structure.special_allowance || 0)).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg border border-red-200 dark:border-red-500/30">
                <h3 className="font-semibold mb-4 text-red-700 dark:text-red-400 flex items-center space-x-2">
                  <DollarSign className="h-4 w-4" />
                  <span>Deductions</span>
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">PF (Employee)</span>
                    <span className="font-semibold">₹{(employeeData.salary_structure.pf_employee || 0).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">ESI (Employee)</span>
                    <span className="font-semibold">₹{(employeeData.salary_structure.esi_employee || 0).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Professional Tax</span>
                    <span className="font-semibold">₹{(employeeData.salary_structure.professional_tax || 0).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">TDS</span>
                    <span className="font-semibold">₹{(employeeData.salary_structure.tds || 0).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Loan Deductions</span>
                    <span className="font-semibold">₹{(employeeData.salary_structure.loan_deductions || 0).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Others</span>
                    <span className="font-semibold">₹{(employeeData.salary_structure.others || 0).toLocaleString()}</span>
                  </div>
                  <div className="border-t pt-3 mt-3">
                    <div className="flex justify-between items-center">
                      <span className="font-semibold text-destructive">Total Deductions</span>
                      <span className="font-semibold text-destructive">
                        ₹{((employeeData.salary_structure.pf_employee || 0) + 
                        (employeeData.salary_structure.esi_employee || 0) + 
                        (employeeData.salary_structure.professional_tax || 0) + 
                        (employeeData.salary_structure.tds || 0) + 
                        (employeeData.salary_structure.loan_deductions || 0) + 
                        (employeeData.salary_structure.others || 0)).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Net Salary - Full Width Box */}
            <div className="mt-6">
              <div className="bg-gradient-to-r from-primary/10 to-primary/5 dark:from-primary/20 dark:to-primary/10 p-6 rounded-lg border-2 border-primary/20">
                <div className="flex justify-between items-center">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center">
                      <DollarSign className="h-6 w-6 text-primary-foreground" />
                    </div>
                    <div>
                      <span className="text-xl font-bold text-primary">Net Salary</span>
                      <p className="text-sm text-muted-foreground">Monthly Take-home Amount</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-bold text-primary">
                      ₹{(((employeeData.salary_structure.basic_salary || 0) + 
                      (employeeData.salary_structure.house_rent_allowance || employeeData.salary_structure.hra || 0) + 
                      (employeeData.salary_structure.medical_allowance || 0) + 
                      (employeeData.salary_structure.leave_travel_allowance || employeeData.salary_structure.travel_allowance || 0) + 
                      (employeeData.salary_structure.conveyance_allowance || employeeData.salary_structure.food_allowance || 0) + 
                      (employeeData.salary_structure.performance_incentive || employeeData.salary_structure.internet_allowance || 0) + 
                      (employeeData.salary_structure.other_benefits || employeeData.salary_structure.special_allowance || 0)) - 
                      ((employeeData.salary_structure.pf_employee || 0) + 
                      (employeeData.salary_structure.esi_employee || 0) + 
                      (employeeData.salary_structure.professional_tax || 0) + 
                      (employeeData.salary_structure.tds || 0) + 
                      (employeeData.salary_structure.loan_deductions || 0) + 
                      (employeeData.salary_structure.others || 0))).toLocaleString()}
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      Gross: ₹{((employeeData.salary_structure.basic_salary || 0) + 
                      (employeeData.salary_structure.house_rent_allowance || employeeData.salary_structure.hra || 0) + 
                      (employeeData.salary_structure.medical_allowance || 0) + 
                      (employeeData.salary_structure.leave_travel_allowance || employeeData.salary_structure.travel_allowance || 0) + 
                      (employeeData.salary_structure.conveyance_allowance || employeeData.salary_structure.food_allowance || 0) + 
                      (employeeData.salary_structure.performance_incentive || employeeData.salary_structure.internet_allowance || 0) + 
                      (employeeData.salary_structure.other_benefits || employeeData.salary_structure.special_allowance || 0)).toLocaleString()} 
                      - Deductions: ₹{((employeeData.salary_structure.pf_employee || 0) + 
                      (employeeData.salary_structure.esi_employee || 0) + 
                      (employeeData.salary_structure.professional_tax || 0) + 
                      (employeeData.salary_structure.tds || 0) + 
                      (employeeData.salary_structure.loan_deductions || 0) + 
                      (employeeData.salary_structure.others || 0)).toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex space-x-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search by month or year..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={yearFilter} onValueChange={setYearFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by year" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Years</SelectItem>
                {availableYears.map(year => (
                  <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Payslips List */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredPayslips.map((payslip) => (
          <Card key={payslip.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex justify-between items-center">
                <span>{payslip.month} {payslip.year}</span>
                <Badge variant="secondary">
                  {payslip.status}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Gross Salary</p>
                  <p className="font-semibold text-gray-900 dark:text-gray-100">₹{payslip.gross_salary.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Deductions</p>
                  <p className="font-semibold text-red-600 dark:text-red-400">₹{payslip.total_deductions.toLocaleString()}</p>
                </div>
              </div>
              
              <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg border border-green-200 dark:border-green-500/30">
                <p className="text-sm text-green-600 dark:text-green-400">Net Salary</p>
                <p className="text-xl font-bold text-green-700 dark:text-green-400">₹{payslip.net_salary.toLocaleString()}</p>
              </div>
              
              <div className="flex space-x-2">
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm" className="flex-1" onClick={() => handlePreview(payslip)}>
                      <Eye className="w-4 h-4 mr-2" />
                      Preview
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>Payslip Preview - {previewPayslip?.employee_details?.name || user.name}</DialogTitle>
                    </DialogHeader>
                    {previewPayslip && (
                      <div className="bg-white dark:bg-gray-900 p-8 rounded-lg shadow-sm border dark:border-gray-700">
                        {/* Company Header */}
                        <div className="border-b dark:border-gray-700 pb-6 mb-6">
                          <div className="flex justify-between items-start">
                            <div className="flex items-start space-x-4">
                              {companySettings?.logo_url && (
                                <img 
                                  src={companySettings.logo_url} 
                                  alt="Company Logo" 
                                  className="w-16 h-16 object-contain"
                                  onError={(e) => { e.target.style.display = 'none' }}
                                />
                              )}
                              <div>
                                <h1 className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                                  {companySettings?.company_name || 'Element Tree'}
                                </h1>
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                  {companySettings?.address || 'D-601, Raikar Chambers, off K.D. Marg, opp Neelkanth Gardens, Govandi (East), Mumbai - 400088, India'}
                                </p>
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                  Phone: {companySettings?.phone || '+91 22 1234 5678'} | Email: {companySettings?.email || 'hr@elementtree.co.in'}
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">SALARY SLIP</h2>
                              <p className="text-sm text-gray-600 dark:text-gray-400">For the month of {previewPayslip.month} {previewPayslip.year}</p>
                            </div>
                          </div>
                        </div>

                        {/* Employee Details */}
                        <div className="grid grid-cols-2 gap-6 mb-6">
                          <div>
                            <h3 className="font-semibold mb-3 text-gray-900 dark:text-gray-100">Employee Details</h3>
                            <div className="space-y-2 text-sm">
                              <div className="flex justify-between">
                                <span className="text-gray-600 dark:text-gray-400">Name:</span>
                                <span className="font-medium text-gray-900 dark:text-gray-200">{previewPayslip.employee_details?.name || user.name}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-600 dark:text-gray-400">Employee ID:</span>
                                <span className="font-medium text-gray-900 dark:text-gray-200">{user.employee_id}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-600 dark:text-gray-400">Designation:</span>
                                <span className="font-medium text-gray-900 dark:text-gray-200">{previewPayslip.employee_details?.designation || 'N/A'}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-600 dark:text-gray-400">Department:</span>
                                <span className="font-medium text-gray-900 dark:text-gray-200">{previewPayslip.employee_details?.department || 'N/A'}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-600 dark:text-gray-400">Date of Joining:</span>
                                <span className="font-medium text-gray-900 dark:text-gray-200">{previewPayslip.employee_details?.date_of_joining ? new Date(previewPayslip.employee_details.date_of_joining).toLocaleDateString() : 'N/A'}</span>
                              </div>
                            </div>
                          </div>
                          <div>
                            <h3 className="font-semibold mb-3 text-gray-900 dark:text-gray-100">Bank Details</h3>
                            <div className="space-y-2 text-sm">
                              <div className="flex justify-between">
                                <span className="text-gray-600 dark:text-gray-400">PAN:</span>
                                <span className="font-medium text-gray-900 dark:text-gray-200">{previewPayslip.employee_details?.pan || 'N/A'}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-600 dark:text-gray-400">Bank Account:</span>
                                <span className="font-medium text-gray-900 dark:text-gray-200">{previewPayslip.employee_details?.bank_account && previewPayslip.employee_details.bank_account !== 'N/A' ? '***' + String(previewPayslip.employee_details.bank_account).slice(-4) : 'N/A'}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-600 dark:text-gray-400">IFSC Code:</span>
                                <span className="font-medium text-gray-900 dark:text-gray-200">{previewPayslip.employee_details?.ifsc || 'N/A'}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-600 dark:text-gray-400">Days Worked:</span>
                                <span className="font-medium text-gray-900 dark:text-gray-200">{previewPayslip.days_worked || 30} of 30</span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Salary Breakdown */}
                        <div className="grid grid-cols-2 gap-6">
                          <div className="bg-emerald-50 dark:bg-emerald-900/20 p-4 rounded-lg border-l-4 border-emerald-500 dark:border-emerald-500/50">
                            <h3 className="font-semibold mb-3 text-emerald-700 dark:text-emerald-400">💰 Earnings</h3>
                            <div className="space-y-2 text-sm">
                              <div className="flex justify-between text-gray-700 dark:text-gray-300">
                                <span>Basic Salary:</span>
                                <span>₹{(previewPayslip.earnings?.basic_salary || 0).toLocaleString()}</span>
                              </div>
                              <div className="flex justify-between text-gray-700 dark:text-gray-300">
                                <span>House Rent Allowance:</span>
                                <span>₹{(previewPayslip.earnings?.house_rent_allowance || 0).toLocaleString()}</span>
                              </div>
                              <div className="flex justify-between text-gray-700 dark:text-gray-300">
                                <span>Medical Allowance:</span>
                                <span>₹{(previewPayslip.earnings?.medical_allowance || 0).toLocaleString()}</span>
                              </div>
                              <div className="flex justify-between text-gray-700 dark:text-gray-300">
                                <span>Leave Travel Allowance:</span>
                                <span>₹{(previewPayslip.earnings?.leave_travel_allowance || 0).toLocaleString()}</span>
                              </div>
                              <div className="flex justify-between text-gray-700 dark:text-gray-300">
                                <span>Conveyance Allowance:</span>
                                <span>₹{(previewPayslip.earnings?.conveyance_allowance || 0).toLocaleString()}</span>
                              </div>
                              <div className="flex justify-between text-gray-700 dark:text-gray-300">
                                <span>Performance Incentive:</span>
                                <span>₹{(previewPayslip.earnings?.performance_incentive || 0).toLocaleString()}</span>
                              </div>
                              <div className="flex justify-between text-gray-700 dark:text-gray-300">
                                <span>Other Benefits:</span>
                                <span>₹{(previewPayslip.earnings?.other_benefits || 0).toLocaleString()}</span>
                              </div>
                              <div className="flex justify-between border-t dark:border-gray-600 pt-2 font-semibold text-gray-900 dark:text-gray-100">
                                <span>Gross Earnings:</span>
                                <span>₹{(previewPayslip.gross_salary || 0).toLocaleString()}</span>
                              </div>
                            </div>
                          </div>
                          <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg border-l-4 border-red-500 dark:border-red-500/50">
                            <h3 className="font-semibold mb-3 text-red-700 dark:text-red-400">💸 Deductions</h3>
                            <div className="space-y-2 text-sm">
                              <div className="flex justify-between text-gray-700 dark:text-gray-300">
                                <span>PF (Employee):</span>
                                <span>₹{(previewPayslip.deductions?.pf_employee || 0).toLocaleString()}</span>
                              </div>
                              <div className="flex justify-between text-gray-700 dark:text-gray-300">
                                <span>ESI (Employee):</span>
                                <span>₹{(previewPayslip.deductions?.esi_employee || 0).toLocaleString()}</span>
                              </div>
                              <div className="flex justify-between text-gray-700 dark:text-gray-300">
                                <span>Professional Tax:</span>
                                <span>₹{(previewPayslip.deductions?.professional_tax || 0).toLocaleString()}</span>
                              </div>
                              <div className="flex justify-between text-gray-700 dark:text-gray-300">
                                <span>TDS:</span>
                                <span>₹{(previewPayslip.deductions?.tds || 0).toLocaleString()}</span>
                              </div>
                              <div className="flex justify-between text-gray-700 dark:text-gray-300">
                                <span>Loan Deductions:</span>
                                <span>₹{(previewPayslip.deductions?.loan_deductions || 0).toLocaleString()}</span>
                              </div>
                              <div className="flex justify-between text-gray-700 dark:text-gray-300">
                                <span>Others:</span>
                                <span>₹{(previewPayslip.deductions?.others || 0).toLocaleString()}</span>
                              </div>
                              <div className="flex justify-between border-t dark:border-gray-600 pt-2 font-semibold text-gray-900 dark:text-gray-100">
                                <span>Total Deductions:</span>
                                <span>₹{(previewPayslip.total_deductions || 0).toLocaleString()}</span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Net Salary */}
                        <div className="border-t dark:border-gray-700 mt-6 pt-6">
                          <div className="flex justify-between items-center">
                            <span className="text-lg font-semibold text-gray-900 dark:text-gray-100">Net Salary:</span>
                            <span className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                              ₹{(previewPayslip.net_salary || 0).toLocaleString()}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                            Generated on: {new Date(previewPayslip.generated_date).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    )}
                  </DialogContent>
                </Dialog>
                
                <Button size="sm" className="flex-1" onClick={() => handleDownload(payslip)}>
                  <Download className="w-4 h-4 mr-2" />
                  Download
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredPayslips.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No payslips found</h3>
            <p className="text-gray-500">
              {searchTerm || yearFilter !== 'all' 
                ? 'Try adjusting your search filters' 
                : 'Your payslips will appear here once they are generated'}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default EmployeePayslips;