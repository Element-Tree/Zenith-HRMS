import React, { useState, useEffect } from "react";
import axios from "axios";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  FileText,
  Download,
  Search,
  Filter,
  Eye,
  Mail,
  Printer,
  Calendar,
  Trash2,
  RefreshCw,
  Plus,
  X,
  Lock,
  Sparkles
} from "lucide-react";
import { formatCurrency, formatDate, calculateGrossSalary, calculateTotalDeductions, calculateNetSalary } from "@/lib/utils";
import { toast } from "sonner";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { useSubscription } from "@/contexts/SubscriptionContext";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const Payslips = () => {
  const { hasFeature, planName, planSlug } = useSubscription();
  const monthNames = ['', 'January', 'February', 'March', 'April', 'May', 'June',
                     'July', 'August', 'September', 'October', 'November', 'December'];
  
  const [employees, setEmployees] = useState([]);
  const [payslips, setPayslips] = useState([]);
  const [companySettings, setCompanySettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedMonth, setSelectedMonth] = useState('');
  const [selectedYear, setSelectedYear] = useState('');
  const [previewPayslip, setPreviewPayslip] = useState(null);
  const [showPreview, setShowPreview] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  
  // Email states
  const [showEmailDialog, setShowEmailDialog] = useState(false);
  const [emailSending, setEmailSending] = useState(false);
  const [emailResults, setEmailResults] = useState([]);
  const [emailProgress, setEmailProgress] = useState({ sent: 0, failed: 0, total: 0 });
  const [selectedForEmail, setSelectedForEmail] = useState([]);
  
  // Check if email payslips feature is available (Professional+ only)
  const canEmailPayslips = planSlug === 'professional' || planSlug === 'enterprise';

  useEffect(() => {
    fetchEmployees();
    fetchCompanySettings();
    // Set current month and year
    const now = new Date();
    setSelectedMonth(String(now.getMonth() + 1).padStart(2, '0'));
    setSelectedYear(String(now.getFullYear()));
  }, []);

  useEffect(() => {
    if (selectedMonth && selectedYear) {
      fetchPayslips();
    }
  }, [selectedMonth, selectedYear]);

  const fetchEmployees = async () => {
    try {
      const response = await axios.get(`${API}/employees`);
      setEmployees(response.data);
    } catch (error) {
      console.error('Error fetching employees:', error);
      toast.error('Failed to load employees');
    } finally {
      setLoading(false);
    }
  };

  const fetchCompanySettings = async () => {
    try {
      const response = await axios.get(`${API}/settings`);
      setCompanySettings(response.data.company_settings);
    } catch (error) {
      console.error('Error fetching company settings:', error);
      // Use fallback settings if API fails
      setCompanySettings({
        company_name: "PayrollPro Company",
        address: "123 Business District, Mumbai, Maharashtra - 400001",
        phone: "+91 22 1234 5678",
        email: "hr@payrollpro.com"
      });
    }
  };

  const fetchPayslips = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API}/payslips`, {
        params: {
          month: parseInt(selectedMonth),
          year: parseInt(selectedYear)
        }
      });
      setPayslips(response.data);
    } catch (error) {
      console.error('Error fetching payslips:', error);
      // If no payslips exist for the period, show empty list
      setPayslips([]);
    } finally {
      setLoading(false);
    }
  };

  const generatePayslips = async () => {
    setRegenerating(true);
    try {
      const response = await axios.post(`${API}/payslips/generate`, {
        month: parseInt(selectedMonth),
        year: parseInt(selectedYear)
      });
      
      toast.success(response.data.message);
      await fetchPayslips(); // Refresh payslips after generation
    } catch (error) {
      console.error('Error generating payslips:', error);
      toast.error('Failed to generate payslips');
    } finally {
      setRegenerating(false);
    }
  };

  const clearAllPayslips = async () => {
    try {
      const response = await axios.delete(`${API}/payslips`);
      toast.success(response.data.message);
      setPayslips([]);
    } catch (error) {
      console.error('Error clearing payslips:', error);
      toast.error('Failed to clear payslips');
    }
  };

  const deletePayslip = async (payslipId) => {
    try {
      await axios.delete(`${API}/payslips/${payslipId}`);
      toast.success('Payslip deleted successfully');
      await fetchPayslips(); // Refresh payslips
    } catch (error) {
      console.error('Error deleting payslip:', error);
      toast.error('Failed to delete payslip');
    }
  };

  const regeneratePayslip = async (payslipId) => {
    try {
      await axios.put(`${API}/payslips/${payslipId}/regenerate`);
      toast.success('Payslip regenerated successfully');
      await fetchPayslips(); // Refresh payslips
    } catch (error) {
      console.error('Error regenerating payslip:', error);
      toast.error('Failed to regenerate payslip');
    }
  };

  const handleEmailAllPayslips = async (selectedEmployeeIds = null) => {
    if (!selectedMonth || !selectedYear) {
      toast.error('Please select month and year');
      return;
    }

    // Filter payslips based on selection
    let payslipsToEmail = payslips;
    if (selectedEmployeeIds && selectedEmployeeIds.length > 0) {
      payslipsToEmail = payslips.filter(p => selectedEmployeeIds.includes(p.employee_id));
    }

    if (payslipsToEmail.length === 0) {
      toast.error('No payslips selected to email');
      return;
    }

    // Prevent duplicate sends
    if (emailSending) {
      console.log('Email sending already in progress, blocking duplicate call');
      return;
    }

    setShowEmailDialog(true);
    setEmailSending(true);
    setEmailResults([]);
    setEmailProgress({ sent: 0, failed: 0, total: payslipsToEmail.length });

    try {
      // Send all PDFs to backend
      const formData = new FormData();
      
      // Build company object once
      const company = companySettings ? {
        name: companySettings.company_name || 'Element Tree',
        address: companySettings.address || 'D-601, Raikar Chambers, off K.D. Marg, opp Neelkanth Gardens, Govandi (East), Mumbai - 400088, India',
        phone: companySettings.phone || '+91 22 1234 5678',
        email: companySettings.email || 'hr@elementtree.co.in',
        logo_url: companySettings.logo_url || null
      } : {
        name: 'Element Tree',
        address: 'D-601, Raikar Chambers, off K.D. Marg, opp Neelkanth Gardens, Govandi (East), Mumbai - 400088, India',
        phone: '+91 22 1234 5678',
        email: 'hr@elementtree.co.in',
        logo_url: null
      };
      
      // Generate PDFs in parallel for faster processing
      const pdfPromises = payslipsToEmail.map(async (payslip, i) => {
        // Get employee details
        const employee = employees.find(e => e.employee_id === payslip.employee_id);
        
        if (!employee || !employee.email) {
          return null; // Skip if no email
        }
        
        // Enrich payslip EXACTLY like the working download function
        const enrichedPayslip = {
          ...payslip,
          company: company,
          period: `${monthNames[payslip.month]} ${payslip.year}`
        };
        
        // Generate PDF using existing function
        try {
          const pdfBlob = await generatePDFBlob(enrichedPayslip);
          
          // Update progress
          setEmailProgress(prev => ({ ...prev, sent: prev.sent + 1 }));
          
          return {
            pdfBlob,
            filename: `${employee.name.replace(/ /g, '_')}_${monthNames[payslip.month]}_${payslip.year}.pdf`,
            employee_id: employee.employee_id,
            employee_name: employee.name,
            employee_email: employee.email
          };
        } catch (pdfError) {
          console.error('PDF generation error:', pdfError);
          return null;
        }
      });
      
      // Wait for all PDFs to be generated
      const pdfResults = await Promise.all(pdfPromises);
      
      // Add PDFs to form data
      pdfResults.forEach(result => {
        if (result) {
          formData.append('pdfs', result.pdfBlob, result.filename);
          formData.append('employee_ids', result.employee_id);
          formData.append('employee_names', result.employee_name);
          formData.append('employee_emails', result.employee_email);
        }
      });
      
      formData.append('month', parseInt(selectedMonth));
      formData.append('year', parseInt(selectedYear));
      
      // Add unique request ID to prevent duplicate processing
      const requestId = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      formData.append('request_id', requestId);

      console.log(`Sending email request with ID: ${requestId}`);
      const response = await axios.post(`${API}/payslips/email-with-pdfs`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      setEmailResults(response.data.results);
      setEmailProgress({
        sent: response.data.successful,
        failed: response.data.failed,
        total: response.data.total
      });

      if (response.data.successful > 0) {
        toast.success(`Successfully sent ${response.data.successful} emails!`);
        await fetchPayslips(); // Refresh to show email_sent status
      }
      if (response.data.failed > 0) {
        toast.warning(`${response.data.failed} emails failed to send`);
      }
    } catch (error) {
      console.error('Error sending emails:', error);
      toast.error(error.response?.data?.detail || 'Failed to send emails');
      setEmailResults([]);
    } finally {
      setEmailSending(false);
    }
  };

  const toggleSelectForEmail = (employeeId) => {
    setSelectedForEmail(prev => {
      if (prev.includes(employeeId)) {
        return prev.filter(id => id !== employeeId);
      } else {
        return [...prev, employeeId];
      }
    });
  };

  const toggleSelectAllForEmail = () => {
    if (selectedForEmail.length === payslips.length) {
      setSelectedForEmail([]);
    } else {
      setSelectedForEmail(payslips.map(p => p.employee_id));
    }
  };

  const handleRetryFailedEmails = async () => {
    const failedEmployeeIds = emailResults
      .filter(r => r.status === 'failed')
      .map(r => r.employee_id);

    if (failedEmployeeIds.length === 0) {
      toast.info('No failed emails to retry');
      return;
    }

    setEmailSending(true);
    try {
      const response = await axios.post(`${API}/payslips/email`, {
        month: parseInt(selectedMonth),
        year: parseInt(selectedYear),
        employee_ids: failedEmployeeIds
      });

      // Update results
      const updatedResults = emailResults.map(result => {
        const newResult = response.data.results.find(r => r.employee_id === result.employee_id);
        return newResult || result;
      });
      setEmailResults(updatedResults);

      setEmailProgress({
        sent: emailProgress.sent + response.data.successful,
        failed: updatedResults.filter(r => r.status === 'failed').length,
        total: emailProgress.total
      });

      toast.success(`Retried ${response.data.successful} emails successfully`);
      await fetchPayslips();
    } catch (error) {
      console.error('Error retrying emails:', error);
      toast.error('Failed to retry emails');
    } finally {
      setEmailSending(false);
    }
  };

  const getMonthName = (month) => {
    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    return months[parseInt(month) - 1];
  };

  const generatePayslipPreview = (payslip) => {
    // Find the full employee details
    const employee = employees.find(emp => emp.employee_id === payslip.employee_id);
    
    if (!employee) {
      console.error('Employee not found for payslip:', payslip.employee_id);
      return null;
    }

    // Use real company settings, fallback to defaults
    const company = {
      name: companySettings?.company_name || 'Payroll by Element Tree',
      address: companySettings?.address || '123 Business District, Mumbai, Maharashtra - 400001',
      phone: companySettings?.phone || '+91 22 1234 5678',
      email: companySettings?.email || 'hr@elementtree.co.in',
      logo_url: companySettings?.logo_url
    };

    // Use employee's salary structure and apply proper field mapping
    const salaryStructure = employee.salary_structure || {};
    
    const earnings = {
      basic_salary: salaryStructure.basic_salary || 0,
      house_rent_allowance: salaryStructure.house_rent_allowance || salaryStructure.hra || 0,
      medical_allowance: salaryStructure.medical_allowance || 0,
      leave_travel_allowance: salaryStructure.leave_travel_allowance || salaryStructure.travel_allowance || 0,
      conveyance_allowance: salaryStructure.conveyance_allowance || salaryStructure.food_allowance || 0,
      performance_incentive: salaryStructure.performance_incentive || salaryStructure.internet_allowance || 0,
      other_benefits: salaryStructure.other_benefits || salaryStructure.special_allowance || 0
    };

    const deductions = {
      pf_employee: salaryStructure.pf_employee || 0,
      esi_employee: salaryStructure.esi_employee || 0,
      professional_tax: salaryStructure.professional_tax || 0,
      tds: salaryStructure.tds || 0,
      loan_deductions: salaryStructure.loan_deductions || 0,
      others: salaryStructure.others || 0
    };

    const gross_salary = calculateGrossSalary(salaryStructure);
    const total_deductions = calculateTotalDeductions(salaryStructure);
    const net_salary = gross_salary - total_deductions;

    // Helper function to get month name
    const getMonthName = (monthNum) => {
      const months = ['January', 'February', 'March', 'April', 'May', 'June',
                      'July', 'August', 'September', 'October', 'November', 'December'];
      return months[monthNum - 1] || monthNum;
    };

    // Helper function to get days in month
    const getDaysInMonth = (month, year) => {
      return new Date(year, month, 0).getDate();
    };

    const daysInMonth = getDaysInMonth(payslip.month, payslip.year);

    return {
      id: payslip.id,
      employee_details: {
        name: employee.name,
        employee_id: employee.employee_id,
        designation: employee.designation,
        department: employee.department,
        date_of_joining: employee.date_of_joining,
        pan: employee.bank_info?.pan || employee.pan_number || 'N/A',
        bank_account: employee.bank_info?.account_number || 'N/A',
        ifsc: employee.bank_info?.ifsc_code || 'N/A'
      },
      company: company,
      month: payslip.month,
      year: payslip.year,
      period: `${getMonthName(payslip.month)} ${payslip.year}`,
      days_in_month: daysInMonth,
      days_worked: daysInMonth, // Should come from attendance data
      earnings: earnings,
      deductions: deductions,
      gross_salary: gross_salary,
      total_deductions: total_deductions,
      net_salary: net_salary,
      generated_date: new Date().toISOString()
    };
  };

  const handlePreviewPayslip = (payslip) => {
    // Ensure company settings are available
    const company = companySettings ? {
      name: companySettings.company_name || 'Element Tree',
      address: companySettings.address || 'D-601, Raikar Chambers, off K.D. Marg, opp Neelkanth Gardens, Govandi (East), Mumbai - 400088, India',
      phone: companySettings.phone || '+91 22 1234 5678',
      email: companySettings.email || 'hr@elementtree.co.in',
      logo_url: companySettings.logo_url || null
    } : {
      name: 'Element Tree',
      address: 'D-601, Raikar Chambers, off K.D. Marg, opp Neelkanth Gardens, Govandi (East), Mumbai - 400088, India',
      phone: '+91 22 1234 5678',
      email: 'hr@elementtree.co.in',
      logo_url: null
    };
    
    // Enrich stored payslip with company data and period for display
    const enrichedPayslip = {
      ...payslip,
      company: company,
      period: `${getMonthName(payslip.month)} ${payslip.year}`
    };
    
    setPreviewPayslip(enrichedPayslip);
    setShowPreview(true);
  };

  const handleDownloadPayslip = async (payslip) => {
    try {
      // Ensure company settings are available
      const company = companySettings ? {
        name: companySettings.company_name || 'Element Tree',
        address: companySettings.address || 'D-601, Raikar Chambers, off K.D. Marg, opp Neelkanth Gardens, Govandi (East), Mumbai - 400088, India',
        phone: companySettings.phone || '+91 22 1234 5678',
        email: companySettings.email || 'hr@elementtree.co.in',
        logo_url: companySettings.logo_url || null
      } : {
        name: 'Element Tree',
        address: 'D-601, Raikar Chambers, off K.D. Marg, opp Neelkanth Gardens, Govandi (East), Mumbai - 400088, India',
        phone: '+91 22 1234 5678',
        email: 'hr@elementtree.co.in',
        logo_url: null
      };
      
      // Enrich payslip with company data for PDF generation
      const enrichedPayslip = {
        ...payslip,
        company: company,
        period: `${getMonthName(payslip.month)} ${payslip.year}`
      };
      
      await generatePDF(enrichedPayslip);
      toast.success(`Payslip downloaded for ${payslip.employee_details?.name || payslip.employee?.name}`);
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error('Failed to generate PDF');
    }
  };

  const generatePDFBlob = async (payslipData) => {
    // Same as generatePDF but returns blob instead of downloading
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
              ${payslipData.company.logo_url ? 
                `<img src="${payslipData.company.logo_url}" alt="Company Logo" style="width: 60px; height: 60px; object-fit: contain; margin-right: 15px;" />` 
                : ''
              }
              <div>
                <h1 style="font-size: 24px; font-weight: bold; color: #10b981; margin: 0 0 5px 0;">${payslipData.company.name}</h1>
                <p style="font-size: 12px; color: #6b7280; margin: 0;">${payslipData.company.address}</p>
                <p style="font-size: 12px; color: #6b7280; margin: 0;">Phone: ${payslipData.company.phone} | Email: ${payslipData.company.email}</p>
              </div>
            </div>
            <div style="text-align: right;">
              <h2 style="font-size: 20px; font-weight: 600; margin: 0;">SALARY SLIP</h2>
              <p style="font-size: 12px; color: #6b7280; margin: 5px 0 0 0;">For the month of ${payslipData.period}</p>
            </div>
          </div>
        </div>

        <!-- Employee Details -->
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px;">
          <div>
            <h3 style="font-size: 14px; font-weight: 600; margin-bottom: 10px;">Employee Details</h3>
            <table style="width: 100%; font-size: 12px;">
              <tr><td style="padding: 2px 0; color: #6b7280;">Name:</td><td style="padding: 2px 0; font-weight: 500;">${payslipData.employee_details.name}</td></tr>
              <tr><td style="padding: 2px 0; color: #6b7280;">Employee ID:</td><td style="padding: 2px 0; font-weight: 500;">${payslipData.employee_details.employee_id}</td></tr>
              <tr><td style="padding: 2px 0; color: #6b7280;">Designation:</td><td style="padding: 2px 0; font-weight: 500;">${payslipData.employee_details.designation}</td></tr>
              <tr><td style="padding: 2px 0; color: #6b7280;">Department:</td><td style="padding: 2px 0; font-weight: 500;">${payslipData.employee_details.department}</td></tr>
              <tr><td style="padding: 2px 0; color: #6b7280;">Date of Joining:</td><td style="padding: 2px 0; font-weight: 500;">${formatDate(payslipData.employee_details.date_of_joining)}</td></tr>
            </table>
          </div>
          <div>
            <h3 style="font-size: 14px; font-weight: 600; margin-bottom: 10px;">Bank Details</h3>
            <table style="width: 100%; font-size: 12px;">
              <tr><td style="padding: 2px 0; color: #6b7280;">PAN:</td><td style="padding: 2px 0; font-weight: 500;">${payslipData.employee_details.pan}</td></tr>
              <tr><td style="padding: 2px 0; color: #6b7280;">Bank Account:</td><td style="padding: 2px 0; font-weight: 500;">***${payslipData.employee_details.bank_account.slice(-4)}</td></tr>
              <tr><td style="padding: 2px 0; color: #6b7280;">IFSC Code:</td><td style="padding: 2px 0; font-weight: 500;">${payslipData.employee_details.ifsc}</td></tr>
              <tr><td style="padding: 2px 0; color: #6b7280;">Days Worked:</td><td style="padding: 2px 0; font-weight: 500;">${payslipData.days_worked || 30} of ${payslipData.days_in_month || 30}</td></tr>
            </table>
          </div>
        </div>

        <!-- Salary Breakdown -->
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
          <div style="background-color: #ecfdf5; padding: 15px; border-radius: 8px; border-left: 4px solid #10b981;">
            <h3 style="font-size: 14px; font-weight: 600; margin-bottom: 10px; color: #065f46;">💰 Earnings</h3>
            <table style="width: 100%; font-size: 12px;">
              <tr><td style="padding: 3px 0;">Basic Salary:</td><td style="padding: 3px 0; text-align: right;">${formatCurrency(payslipData.earnings.basic_salary || 0)}</td></tr>
              <tr><td style="padding: 3px 0;">House Rent Allowance:</td><td style="padding: 3px 0; text-align: right;">${formatCurrency(payslipData.earnings.house_rent_allowance || 0)}</td></tr>
              <tr><td style="padding: 3px 0;">Medical Allowance:</td><td style="padding: 3px 0; text-align: right;">${formatCurrency(payslipData.earnings.medical_allowance || 0)}</td></tr>
              <tr><td style="padding: 3px 0;">Leave Travel Allowance:</td><td style="padding: 3px 0; text-align: right;">${formatCurrency(payslipData.earnings.leave_travel_allowance || 0)}</td></tr>
              <tr><td style="padding: 3px 0;">Bonus:</td><td style="padding: 3px 0; text-align: right;">${formatCurrency(payslipData.earnings.conveyance_allowance || 0)}</td></tr>
              <tr><td style="padding: 3px 0;">Performance Incentive:</td><td style="padding: 3px 0; text-align: right;">${formatCurrency(payslipData.earnings.performance_incentive || 0)}</td></tr>
              <tr><td style="padding: 3px 0;">Other Benefits:</td><td style="padding: 3px 0; text-align: right;">${formatCurrency(payslipData.earnings.other_benefits || 0)}</td></tr>
              <tr style="border-top: 1px solid #e5e7eb;"><td style="padding: 8px 0; font-weight: 600;">Gross Earnings:</td><td style="padding: 8px 0; text-align: right; font-weight: 600;">${formatCurrency(payslipData.gross_salary)}</td></tr>
            </table>
          </div>
          <div style="background-color: #fef2f2; padding: 15px; border-radius: 8px; border-left: 4px solid #dc2626;">
            <h3 style="font-size: 14px; font-weight: 600; margin-bottom: 10px; color: #991b1b;">💸 Deductions</h3>
            <table style="width: 100%; font-size: 12px;">
              <tr><td style="padding: 3px 0;">PF (Employee):</td><td style="padding: 3px 0; text-align: right;">${formatCurrency(payslipData.deductions.pf_employee || 0)}</td></tr>
              <tr><td style="padding: 3px 0;">ESI (Employee):</td><td style="padding: 3px 0; text-align: right;">${formatCurrency(payslipData.deductions.esi_employee || 0)}</td></tr>
              <tr><td style="padding: 3px 0;">Professional Tax:</td><td style="padding: 3px 0; text-align: right;">${formatCurrency(payslipData.deductions.professional_tax || 0)}</td></tr>
              <tr><td style="padding: 3px 0;">TDS:</td><td style="padding: 3px 0; text-align: right;">${formatCurrency(payslipData.deductions.tds || 0)}</td></tr>
              <tr><td style="padding: 3px 0;">Loan Deductions:</td><td style="padding: 3px 0; text-align: right;">${formatCurrency(payslipData.deductions.loan_deductions || 0)}</td></tr>
              <tr><td style="padding: 3px 0;">Others:</td><td style="padding: 3px 0; text-align: right;">${formatCurrency(payslipData.deductions.others || 0)}</td></tr>
              <tr style="border-top: 1px solid #e5e7eb;"><td style="padding: 8px 0; font-weight: 600;">Total Deductions:</td><td style="padding: 8px 0; text-align: right; font-weight: 600;">${formatCurrency(payslipData.total_deductions)}</td></tr>
            </table>
          </div>
        </div>

        <!-- Net Salary -->
        <div style="border-top: 2px solid #e5e7eb; margin-top: 20px; padding-top: 20px;">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <span style="font-size: 16px; font-weight: 600;">Net Salary:</span>
            <span style="font-size: 24px; font-weight: bold; color: #10b981;">${formatCurrency(payslipData.net_salary)}</span>
          </div>
          <p style="font-size: 12px; color: #6b7280; margin-top: 10px;">Generated on: ${formatDate(new Date())}</p>
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
    
    pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
    
    // Return blob instead of downloading
    return pdf.output('blob');
  };

  const generatePDF = async (payslipData) => {
    // Create a temporary div with the payslip content
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
              ${payslipData.company.logo_url ? 
                `<img src="${payslipData.company.logo_url}" alt="Company Logo" style="width: 60px; height: 60px; object-fit: contain; margin-right: 15px;" />` 
                : ''
              }
              <div>
                <h1 style="font-size: 24px; font-weight: bold; color: #10b981; margin: 0 0 5px 0;">${payslipData.company.name}</h1>
                <p style="font-size: 12px; color: #6b7280; margin: 0;">${payslipData.company.address}</p>
                <p style="font-size: 12px; color: #6b7280; margin: 0;">Phone: ${payslipData.company.phone} | Email: ${payslipData.company.email}</p>
              </div>
            </div>
            <div style="text-align: right;">
              <h2 style="font-size: 20px; font-weight: 600; margin: 0;">SALARY SLIP</h2>
              <p style="font-size: 12px; color: #6b7280; margin: 5px 0 0 0;">For the month of ${payslipData.period}</p>
            </div>
          </div>
        </div>

        <!-- Employee Details -->
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px;">
          <div>
            <h3 style="font-size: 14px; font-weight: 600; margin-bottom: 10px;">Employee Details</h3>
            <table style="width: 100%; font-size: 12px;">
              <tr><td style="padding: 2px 0; color: #6b7280;">Name:</td><td style="padding: 2px 0; font-weight: 500;">${payslipData.employee_details.name}</td></tr>
              <tr><td style="padding: 2px 0; color: #6b7280;">Employee ID:</td><td style="padding: 2px 0; font-weight: 500;">${payslipData.employee_details.employee_id}</td></tr>
              <tr><td style="padding: 2px 0; color: #6b7280;">Designation:</td><td style="padding: 2px 0; font-weight: 500;">${payslipData.employee_details.designation}</td></tr>
              <tr><td style="padding: 2px 0; color: #6b7280;">Department:</td><td style="padding: 2px 0; font-weight: 500;">${payslipData.employee_details.department}</td></tr>
              <tr><td style="padding: 2px 0; color: #6b7280;">Date of Joining:</td><td style="padding: 2px 0; font-weight: 500;">${formatDate(payslipData.employee_details.date_of_joining)}</td></tr>
            </table>
          </div>
          <div>
            <h3 style="font-size: 14px; font-weight: 600; margin-bottom: 10px;">Bank Details</h3>
            <table style="width: 100%; font-size: 12px;">
              <tr><td style="padding: 2px 0; color: #6b7280;">PAN:</td><td style="padding: 2px 0; font-weight: 500;">${payslipData.employee_details.pan}</td></tr>
              <tr><td style="padding: 2px 0; color: #6b7280;">Bank Account:</td><td style="padding: 2px 0; font-weight: 500;">***${payslipData.employee_details.bank_account.slice(-4)}</td></tr>
              <tr><td style="padding: 2px 0; color: #6b7280;">IFSC Code:</td><td style="padding: 2px 0; font-weight: 500;">${payslipData.employee_details.ifsc}</td></tr>
              <tr><td style="padding: 2px 0; color: #6b7280;">Days Worked:</td><td style="padding: 2px 0; font-weight: 500;">${payslipData.days_worked || 30} of ${payslipData.days_in_month || 30}</td></tr>
            </table>
          </div>
        </div>

        <!-- Salary Breakdown -->
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
          <div style="background-color: #ecfdf5; padding: 15px; border-radius: 8px; border-left: 4px solid #10b981;">
            <h3 style="font-size: 14px; font-weight: 600; margin-bottom: 10px; color: #065f46;">💰 Earnings</h3>
            <table style="width: 100%; font-size: 12px;">
              <tr><td style="padding: 3px 0;">Basic Salary:</td><td style="padding: 3px 0; text-align: right;">${formatCurrency(payslipData.earnings.basic_salary || 0)}</td></tr>
              <tr><td style="padding: 3px 0;">House Rent Allowance:</td><td style="padding: 3px 0; text-align: right;">${formatCurrency(payslipData.earnings.house_rent_allowance || 0)}</td></tr>
              <tr><td style="padding: 3px 0;">Medical Allowance:</td><td style="padding: 3px 0; text-align: right;">${formatCurrency(payslipData.earnings.medical_allowance || 0)}</td></tr>
              <tr><td style="padding: 3px 0;">Leave Travel Allowance:</td><td style="padding: 3px 0; text-align: right;">${formatCurrency(payslipData.earnings.leave_travel_allowance || 0)}</td></tr>
              <tr><td style="padding: 3px 0;">Bonus:</td><td style="padding: 3px 0; text-align: right;">${formatCurrency(payslipData.earnings.conveyance_allowance || 0)}</td></tr>
              <tr><td style="padding: 3px 0;">Performance Incentive:</td><td style="padding: 3px 0; text-align: right;">${formatCurrency(payslipData.earnings.performance_incentive || 0)}</td></tr>
              <tr><td style="padding: 3px 0;">Other Benefits:</td><td style="padding: 3px 0; text-align: right;">${formatCurrency(payslipData.earnings.other_benefits || 0)}</td></tr>
              <tr style="border-top: 1px solid #e5e7eb;"><td style="padding: 8px 0; font-weight: 600;">Gross Earnings:</td><td style="padding: 8px 0; text-align: right; font-weight: 600;">${formatCurrency(payslipData.gross_salary)}</td></tr>
            </table>
          </div>
          <div style="background-color: #fef2f2; padding: 15px; border-radius: 8px; border-left: 4px solid #dc2626;">
            <h3 style="font-size: 14px; font-weight: 600; margin-bottom: 10px; color: #991b1b;">💸 Deductions</h3>
            <table style="width: 100%; font-size: 12px;">
              <tr><td style="padding: 3px 0;">PF (Employee):</td><td style="padding: 3px 0; text-align: right;">${formatCurrency(payslipData.deductions.pf_employee || 0)}</td></tr>
              <tr><td style="padding: 3px 0;">ESI (Employee):</td><td style="padding: 3px 0; text-align: right;">${formatCurrency(payslipData.deductions.esi_employee || 0)}</td></tr>
              <tr><td style="padding: 3px 0;">Professional Tax:</td><td style="padding: 3px 0; text-align: right;">${formatCurrency(payslipData.deductions.professional_tax || 0)}</td></tr>
              <tr><td style="padding: 3px 0;">TDS:</td><td style="padding: 3px 0; text-align: right;">${formatCurrency(payslipData.deductions.tds || 0)}</td></tr>
              <tr><td style="padding: 3px 0;">Loan Deductions:</td><td style="padding: 3px 0; text-align: right;">${formatCurrency(payslipData.deductions.loan_deductions || 0)}</td></tr>
              <tr><td style="padding: 3px 0;">Others:</td><td style="padding: 3px 0; text-align: right;">${formatCurrency(payslipData.deductions.others || 0)}</td></tr>
              <tr style="border-top: 1px solid #e5e7eb;"><td style="padding: 8px 0; font-weight: 600;">Total Deductions:</td><td style="padding: 8px 0; text-align: right; font-weight: 600;">${formatCurrency(payslipData.total_deductions)}</td></tr>
            </table>
          </div>
        </div>

        <!-- Net Salary -->
        <div style="border-top: 2px solid #e5e7eb; margin-top: 20px; padding-top: 20px;">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <span style="font-size: 16px; font-weight: 600;">Net Salary:</span>
            <span style="font-size: 24px; font-weight: bold; color: #10b981;">${formatCurrency(payslipData.net_salary)}</span>
          </div>
          <p style="font-size: 12px; color: #6b7280; margin-top: 10px;">Generated on: ${formatDate(new Date())}</p>
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
    
    pdf.save(`Payslip_${payslipData.employee_details.name}_${payslipData.period}.pdf`);
  };

  const handleEmailPayslip = (payslip) => {
    toast.success(`Payslip emailed to ${payslip.employee_details?.email || payslip.employee?.email}`);
    // In a real app, this would send an email with the payslip
  };

  const handleBulkDownload = () => {
    const generatedPayslips = payslips.filter(p => p.status === 'generated');
    toast.success(`Downloading ${generatedPayslips.length} payslips`);
  };

  const handleBulkEmail = () => {
    const generatedPayslips = payslips.filter(p => p.status === 'generated');
    toast.success(`Emailing payslips to ${generatedPayslips.length} employees`);
  };

  const handleRegeneratePayslips = async () => {
    await generatePayslips();
  };

  const filteredPayslips = payslips.filter(payslip => {
    const employeeName = payslip.employee_details?.name || payslip.employee?.name || '';
    const employeeId = payslip.employee_id || payslip.employee?.employee_id || '';
    return employeeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
           employeeId.toLowerCase().includes(searchTerm.toLowerCase());
  });

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-10 bg-gray-200 rounded-lg w-64"></div>
        <div className="h-96 bg-gray-200 rounded-lg"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="payslips">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
            Payslips
          </h1>
          <p className="text-gray-500 dark:text-gray-400">
            Generate and manage employee payslips
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="bg-amber-50 border border-amber-200 px-4 py-2 rounded-lg">
            <p className="text-sm text-amber-700">
              💡 Generate payslips from <strong>Run Payroll</strong> page after processing payroll
            </p>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <FileText className="h-8 w-8 text-blue-600" />
              <div>
                <p className="text-2xl font-bold">{payslips.length}</p>
                <p className="text-xs text-gray-500">Total Payslips</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center">
                <div className="w-4 h-4 bg-emerald-600 rounded-full"></div>
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {payslips.filter(p => p.status === 'generated').length}
                </p>
                <p className="text-xs text-gray-500">Generated</p>
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
                  {payslips.filter(p => p.status === 'pending').length}
                </p>
                <p className="text-xs text-gray-500">Pending</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Calendar className="h-8 w-8 text-purple-600" />
              <div>
                <p className="text-2xl font-bold">{getMonthName(selectedMonth)}</p>
                <p className="text-xs text-gray-500">{selectedYear}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Payslip Management</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search by employee name or ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Month" />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 12 }, (_, i) => (
                    <SelectItem key={i + 1} value={String(i + 1).padStart(2, '0')}>
                      {getMonthName(String(i + 1).padStart(2, '0'))}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={selectedYear} onValueChange={setSelectedYear}>
                <SelectTrigger className="w-24">
                  <SelectValue placeholder="Year" />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 5 }, (_, i) => (
                    <SelectItem key={2024 + i} value={String(2024 + i)}>
                      {2024 + i}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span>
                      <Button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          if (!emailSending && canEmailPayslips) {
                            handleEmailAllPayslips();
                          }
                        }}
                        disabled={payslips.length === 0 || emailSending || !canEmailPayslips}
                        className={`${
                          !canEmailPayslips 
                            ? 'bg-gray-400 cursor-not-allowed opacity-60' 
                            : 'bg-green-600 hover:bg-green-700'
                        } disabled:opacity-50`}
                      >
                        {!canEmailPayslips && <Lock className="w-4 h-4 mr-2" />}
                        {canEmailPayslips && <Mail className="w-4 h-4 mr-2" />}
                        {emailSending ? 'Sending...' : 'Email All Payslips'}
                        {!canEmailPayslips && <Sparkles className="w-4 h-4 ml-2" />}
                      </Button>
                    </span>
                  </TooltipTrigger>
                  {!canEmailPayslips && (
                    <TooltipContent>
                      <p className="font-semibold">Email Payslips - Professional Feature</p>
                      <p className="text-xs">Upgrade to Professional or Enterprise to email payslips</p>
                    </TooltipContent>
                  )}
                </Tooltip>
              </TooltipProvider>
              
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span>
                      <Button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          if (!emailSending && canEmailPayslips) {
                            handleEmailAllPayslips(selectedForEmail);
                          }
                        }}
                        disabled={selectedForEmail.length === 0 || emailSending || !canEmailPayslips}
                        variant="outline"
                        className={`${
                          !canEmailPayslips 
                            ? 'border-gray-400 text-gray-400 cursor-not-allowed opacity-60' 
                            : 'border-green-600 text-green-600 hover:bg-green-50'
                        } disabled:opacity-50`}
                      >
                        {!canEmailPayslips && <Lock className="w-4 h-4 mr-2" />}
                        {canEmailPayslips && <Mail className="w-4 h-4 mr-2" />}
                        Email Selected ({selectedForEmail.length})
                        {!canEmailPayslips && <Sparkles className="w-4 h-4 ml-2" />}
                      </Button>
                    </span>
                  </TooltipTrigger>
                  {!canEmailPayslips && (
                    <TooltipContent>
                      <p className="font-semibold">Email Payslips - Professional Feature</p>
                      <p className="text-xs">Upgrade to Professional or Enterprise to email payslips</p>
                    </TooltipContent>
                  )}
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>

          {/* Payslip Table */}
          <div className="border border-gray-200 dark:border-gray-700 rounded-lg">
            <Table>
              <TableHeader>
                <TableRow className="border-b border-gray-200 dark:border-gray-700">
                  <TableHead className="w-12 text-gray-700 dark:text-gray-300">
                    <Checkbox
                      checked={selectedForEmail.length === payslips.length && payslips.length > 0}
                      onCheckedChange={toggleSelectAllForEmail}
                    />
                  </TableHead>
                  <TableHead className="text-gray-700 dark:text-gray-300">Employee Details</TableHead>
                  <TableHead className="text-gray-700 dark:text-gray-300">Gross Salary</TableHead>
                  <TableHead className="text-gray-700 dark:text-gray-300">Net Salary</TableHead>
                  <TableHead className="text-gray-700 dark:text-gray-300">Status</TableHead>
                  <TableHead className="text-right text-gray-700 dark:text-gray-300">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPayslips.map((payslip) => (
                  <TableRow key={payslip.id} className="border-b border-gray-200 dark:border-gray-700">
                    <TableCell>
                      <Checkbox
                        checked={selectedForEmail.includes(payslip.employee_id)}
                        onCheckedChange={() => toggleSelectForEmail(payslip.employee_id)}
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-3">
                        <Avatar>
                          <AvatarFallback className="bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400">
                            {(payslip.employee_details?.name || payslip.employee?.name || 'N/A').split(' ').map(n => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium text-gray-900 dark:text-gray-200">
                            {payslip.employee_details?.name || payslip.employee?.name} ({payslip.employee_id || payslip.employee?.employee_id})
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {payslip.employee_details?.department || payslip.employee?.department} • {payslip.employee_details?.designation || payslip.employee?.designation}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-gray-800 dark:text-gray-300">{formatCurrency(payslip.gross_salary)}</TableCell>
                    <TableCell className="font-medium text-emerald-600 dark:text-emerald-400">
                      {formatCurrency(payslip.net_salary)}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        <Badge variant={payslip.status === 'generated' ? 'default' : 'secondary'}>
                          {payslip.status}
                        </Badge>
                        {payslip.email_sent && (
                          <Badge className="bg-green-100 text-green-700 text-xs">
                            <Mail className="w-3 h-3 mr-1" />
                            Emailed
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end space-x-1">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          className="h-8 w-8 p-0 hover:bg-blue-100 hover:text-blue-600"
                          onClick={() => handlePreviewPayslip(payslip)}
                          title="View Payslip"
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          className="h-8 w-8 p-0 hover:bg-green-100 hover:text-green-600"
                          onClick={() => handleDownloadPayslip(payslip)}
                          title="Download PDF"
                        >
                          <Download className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          className="h-8 w-8 p-0 hover:bg-orange-100 hover:text-orange-600"
                          onClick={() => regeneratePayslip(payslip.id)}
                          title="Regenerate Payslip"
                        >
                          <RefreshCw className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          className="h-8 w-8 p-0 hover:bg-red-100 hover:text-red-600"
                          onClick={() => deletePayslip(payslip.id)}
                          title="Delete Payslip"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Payslip Preview Dialog */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Payslip Preview - {previewPayslip?.employee_details?.name}</DialogTitle>
          </DialogHeader>
          {previewPayslip && (
            <div className="bg-white dark:bg-gray-900 p-8 rounded-lg shadow-sm border dark:border-gray-700" id="payslip-preview">
              {/* Company Header */}
              <div className="border-b dark:border-gray-700 pb-6 mb-6">
                <div className="flex justify-between items-start">
                  <div className="flex items-start space-x-4">
                    {previewPayslip.company.logo_url && (
                      <img 
                        src={previewPayslip.company.logo_url} 
                        alt="Company Logo" 
                        className="w-16 h-16 object-contain"
                      />
                    )}
                    <div>
                      <h1 className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{previewPayslip.company.name}</h1>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{previewPayslip.company.address}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Phone: {previewPayslip.company.phone} | Email: {previewPayslip.company.email}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">SALARY SLIP</h2>
                    <p className="text-sm text-gray-600 dark:text-gray-400">For the month of {previewPayslip.period}</p>
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
                      <span className="font-medium text-gray-900 dark:text-gray-100">{previewPayslip.employee_details.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Employee ID:</span>
                      <span className="font-medium text-gray-900 dark:text-gray-100">{previewPayslip.employee_details.employee_id}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Designation:</span>
                      <span className="font-medium text-gray-900 dark:text-gray-100">{previewPayslip.employee_details.designation}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Department:</span>
                      <span className="font-medium text-gray-900 dark:text-gray-100">{previewPayslip.employee_details.department}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Date of Joining:</span>
                      <span className="font-medium text-gray-900 dark:text-gray-100">{formatDate(previewPayslip.employee_details.date_of_joining)}</span>
                    </div>
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold mb-3 text-gray-900 dark:text-gray-100">Bank Details</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">PAN:</span>
                      <span className="font-medium text-gray-900 dark:text-gray-100">{previewPayslip.employee_details.pan}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Bank Account:</span>
                      <span className="font-medium text-gray-900 dark:text-gray-100">***{previewPayslip.employee_details.bank_account.slice(-4)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">IFSC Code:</span>
                      <span className="font-medium text-gray-900 dark:text-gray-100">{previewPayslip.employee_details.ifsc}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Days Worked:</span>
                      <span className="font-medium text-gray-900 dark:text-gray-100">{previewPayslip.days_worked || 30} of {previewPayslip.days_in_month || 30}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Salary Breakdown */}
              <div className="grid grid-cols-2 gap-6">
                <div className="bg-emerald-50 dark:bg-emerald-900/20 p-4 rounded-lg border-l-4 border-emerald-500 dark:border-emerald-600">
                  <h3 className="font-semibold mb-3 text-emerald-700 dark:text-emerald-400">💰 Earnings</h3>
                  <div className="space-y-2 text-sm text-gray-900 dark:text-gray-100">
                    <div className="flex justify-between">
                      <span>Basic Salary:</span>
                      <span>{formatCurrency(previewPayslip.earnings.basic_salary)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>House Rent Allowance:</span>
                      <span>{formatCurrency(previewPayslip.earnings.house_rent_allowance)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Medical Allowance:</span>
                      <span>{formatCurrency(previewPayslip.earnings.medical_allowance)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Leave Travel Allowance:</span>
                      <span>{formatCurrency(previewPayslip.earnings.leave_travel_allowance)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Bonus:</span>
                      <span>{formatCurrency(previewPayslip.earnings.conveyance_allowance)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Performance Incentive:</span>
                      <span>{formatCurrency(previewPayslip.earnings.performance_incentive)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Other Benefits:</span>
                      <span>{formatCurrency(previewPayslip.earnings.other_benefits)}</span>
                    </div>
                    <div className="flex justify-between border-t dark:border-gray-600 pt-2 font-semibold">
                      <span>Gross Earnings:</span>
                      <span>{formatCurrency(previewPayslip.gross_salary)}</span>
                    </div>
                  </div>
                </div>
                <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg border-l-4 border-red-500 dark:border-red-600">
                  <h3 className="font-semibold mb-3 text-red-700 dark:text-red-400">💸 Deductions</h3>
                  <div className="space-y-2 text-sm text-gray-900 dark:text-gray-100">
                    <div className="flex justify-between">
                      <span>PF (Employee):</span>
                      <span>{formatCurrency(previewPayslip.deductions.pf_employee)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>ESI (Employee):</span>
                      <span>{formatCurrency(previewPayslip.deductions.esi_employee)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Professional Tax:</span>
                      <span>{formatCurrency(previewPayslip.deductions.professional_tax)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>TDS:</span>
                      <span>{formatCurrency(previewPayslip.deductions.tds)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Loan Deductions:</span>
                      <span>{formatCurrency(previewPayslip.deductions.loan_deductions)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Others:</span>
                      <span>{formatCurrency(previewPayslip.deductions.others)}</span>
                    </div>
                    <div className="flex justify-between border-t dark:border-gray-600 pt-2 font-semibold">
                      <span>Total Deductions:</span>
                      <span>{formatCurrency(previewPayslip.total_deductions)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Net Salary */}
              <div className="border-t dark:border-gray-700 mt-6 pt-6">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-semibold text-gray-900 dark:text-gray-100">Net Salary:</span>
                  <span className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                    {formatCurrency(previewPayslip.net_salary)}
                  </span>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                  Generated on: {formatDate(new Date())}
                </p>
              </div>

              {/* Actions */}
              <div className="flex justify-center space-x-4 mt-8 no-print">
                <Button onClick={() => window.print()}>
                  <Printer className="w-4 h-4 mr-2" />
                  Print
                </Button>
                <Button variant="outline" onClick={() => handleDownloadPayslip(previewPayslip)}>
                  <Download className="w-4 h-4 mr-2" />
                  Download PDF
                </Button>
                <Button variant="outline" onClick={() => handleEmailPayslip(previewPayslip)}>
                  <Mail className="w-4 h-4 mr-2" />
                  Email
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Email Status Dialog */}
      <Dialog open={showEmailDialog} onOpenChange={setShowEmailDialog}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Email Payslips Status</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {/* Progress Summary */}
            <div className="grid grid-cols-3 gap-4">
              <Card className="border-gray-200 dark:border-gray-700">
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{emailProgress.total}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Total</div>
                </CardContent>
              </Card>
              <Card className="border-gray-200 dark:border-gray-700">
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-green-600 dark:text-green-400">{emailProgress.sent}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Sent</div>
                </CardContent>
              </Card>
              <Card className="border-gray-200 dark:border-gray-700">
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-red-600 dark:text-red-400">{emailProgress.failed}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Failed</div>
                </CardContent>
              </Card>
            </div>

            {/* Progress Bar */}
            {emailSending && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm text-gray-700 dark:text-gray-300">
                  <span>Sending emails...</span>
                  <span>{emailProgress.sent} / {emailProgress.total}</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div 
                    className="bg-green-600 dark:bg-green-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${(emailProgress.sent / emailProgress.total) * 100}%` }}
                  ></div>
                </div>
              </div>
            )}

            {/* Email Results List */}
            {emailResults.length > 0 && (
              <div className="border border-gray-200 dark:border-gray-700 rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow className="border-b border-gray-200 dark:border-gray-700">
                      <TableHead className="text-gray-700 dark:text-gray-300">Employee</TableHead>
                      <TableHead className="text-gray-700 dark:text-gray-300">Email</TableHead>
                      <TableHead className="text-gray-700 dark:text-gray-300">Status</TableHead>
                      <TableHead className="text-gray-700 dark:text-gray-300">Details</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {emailResults.map((result, index) => (
                      <TableRow key={index} className="border-b border-gray-200 dark:border-gray-700">
                        <TableCell>
                          <div>
                            <div className="font-medium text-gray-900 dark:text-gray-200">{result.employee_name}</div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">{result.employee_id}</div>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm text-gray-800 dark:text-gray-300">{result.email || 'N/A'}</TableCell>
                        <TableCell>
                          {result.status === 'sent' ? (
                            <Badge className="bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400 border-green-200 dark:border-green-800">
                              ✓ Sent
                            </Badge>
                          ) : (
                            <Badge variant="destructive">
                              ✗ Failed
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-xs text-gray-500 dark:text-gray-400">
                          {result.error || 'Success'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex justify-between pt-4">
              <Button
                variant="outline"
                onClick={() => setShowEmailDialog(false)}
                disabled={emailSending}
              >
                Close
              </Button>
              {emailProgress.failed > 0 && !emailSending && (
                <Button
                  onClick={handleRetryFailedEmails}
                  className="bg-orange-600 hover:bg-orange-700"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Retry Failed ({emailProgress.failed})
                </Button>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Payslips;