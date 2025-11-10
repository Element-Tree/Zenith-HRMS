import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  CreditCard,
  Plus,
  DollarSign,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  AlertTriangle,
  Calculator,
  TrendingDown,
  Wallet,
  Trash2,
  TrendingUp,
  IndianRupee,
  Calendar,
  BarChart3
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import axios from 'axios';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const EmployeeLoans = () => {
  const { user } = useAuth();
  const [loanRequests, setLoanRequests] = useState([]);
  const [showApplyDialog, setShowApplyDialog] = useState(false);
  const [applying, setApplying] = useState(false);
  const [earningsData, setEarningsData] = useState(null);
  const [loadingEarnings, setLoadingEarnings] = useState(false);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString()); // Changed to string to support "all"
  const [loanEligibility, setLoanEligibility] = useState({
    maxEligible: 0,
    maxEMI: 0,
    grossSalary: 0,
    existingEMI: 0,
    dtiRatio: 50 // Default 50% DTI ratio
  });
  const [formData, setFormData] = useState({
    loan_type: '',
    amount: '',
    tenure_months: '',
    purpose: '',
    monthly_income: '',
    existing_loans: ''
  });

  useEffect(() => {
    fetchLoanRequests();
    fetchEmployeeData();
    fetchEarningsOverview();
  }, [selectedYear]);  // Re-fetch when year changes

  const fetchEarningsOverview = async () => {
    try {
      setLoadingEarnings(true);
      if (user?.employee_id) {
        const url = selectedYear === 'all' 
          ? `${API}/employees/${user.employee_id}/earnings-overview?all_years=true`
          : `${API}/employees/${user.employee_id}/earnings-overview?year=${selectedYear}`;
        const response = await axios.get(url);
        setEarningsData(response.data);
      }
    } catch (error) {
      console.error('Error fetching earnings overview:', error);
      toast.error('Failed to fetch earnings data');
    } finally {
      setLoadingEarnings(false);
    }
  };

  const fetchEmployeeData = async () => {
    try {
      if (user?.employee_id) {
        // Fetch employee salary data
        const empResponse = await axios.get(`${API}/employees/${user.employee_id}`);
        const employee = empResponse.data;
        
        // Fetch existing loan EMIs
        const emiResponse = await axios.get(`${API}/employees/${user.employee_id}/pending-emi`);
        const existingEMI = emiResponse.data.pending_emi || 0;
        
        // Calculate gross salary from all earning components
        const salary = employee.salary_structure || {};
        const grossSalary = (
          (salary.basic_salary || 0) +
          (salary.house_rent_allowance || salary.hra || 0) +
          (salary.medical_allowance || 0) +
          (salary.leave_travel_allowance || salary.travel_allowance || 0) +
          (salary.conveyance_allowance || salary.food_allowance || 0) +
          (salary.performance_incentive || salary.internet_allowance || 0) +
          (salary.other_benefits || salary.special_allowance || 0)
        );
        
        setFormData(prev => ({
          ...prev,
          monthly_income: grossSalary.toString(),
          existing_loans: existingEMI.toString()
        }));
        
        // Calculate loan eligibility
        calculateLoanEligibility(grossSalary, existingEMI);
      }
    } catch (error) {
      console.error('Error fetching employee data:', error);
    }
  };

  const calculateLoanEligibility = (grossSalary, existingEMI, dtiRatio = 50) => {
    // DTI Ratio Approach:
    // Maximum EMI = (Gross Salary × DTI%) - Existing EMIs
    const maxEMICapacity = (grossSalary * (dtiRatio / 100)) - existingEMI;
    
    // Default tenure: 24 months (2 years)
    // Default interest rate: 10% per annum (approximate average)
    const defaultTenure = 24;
    const annualRate = 10;
    const monthlyRate = annualRate / 100 / 12;
    
    // Calculate maximum loan eligibility using EMI formula
    // EMI = P × r × (1 + r)^n / ((1 + r)^n - 1)
    // Rearranged: P = EMI × ((1 + r)^n - 1) / (r × (1 + r)^n)
    
    let maxLoanAmount = 0;
    if (maxEMICapacity > 0 && monthlyRate > 0) {
      const factor = Math.pow(1 + monthlyRate, defaultTenure);
      maxLoanAmount = maxEMICapacity * ((factor - 1) / (monthlyRate * factor));
    }
    
    // Round to nearest thousand
    maxLoanAmount = Math.floor(maxLoanAmount / 1000) * 1000;
    
    setLoanEligibility({
      maxEligible: Math.max(0, maxLoanAmount),
      maxEMI: Math.max(0, maxEMICapacity),
      grossSalary: grossSalary,
      existingEMI: existingEMI,
      dtiRatio: dtiRatio
    });
  };

  const fetchLoanRequests = async () => {
    try {
      const response = await axios.get(`${API}/loans`);
      setLoanRequests(response.data);
    } catch (error) {
      console.error('Error fetching loan requests:', error);
      toast.error('Failed to load loan requests');
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const calculateEMI = (principal, rate, tenure) => {
    if (!principal || !rate || !tenure) return 0;
    const P = parseFloat(principal);
    const R = parseFloat(rate) / 100 / 12;
    const N = parseFloat(tenure);
    
    if (R === 0) return P / N;
    
    const emi = P * R * Math.pow(1 + R, N) / (Math.pow(1 + R, N) - 1);
    return Math.round(emi);
  };

  const getEstimatedEMI = () => {
    const rates = {
      'Personal Loan': 12,
      'Emergency Loan': 10,
      'Advance Salary': 0,
      'Education Loan': 8
    };
    
    const rate = rates[formData.loan_type] || 12;
    return calculateEMI(formData.amount, rate, formData.tenure_months);
  };

  const getAvailableIncome = () => {
    const monthlyIncome = parseFloat(formData.monthly_income) || 0;
    const existingEMI = parseFloat(formData.existing_loans) || 0;
    return monthlyIncome - existingEMI;
  };

  const isEMIAffordable = () => {
    const estimatedEMI = getEstimatedEMI();
    const availableIncome = getAvailableIncome();
    return estimatedEMI <= availableIncome;
  };

  const getMaximumLoanAmount = () => {
    if (!formData.loan_type || !formData.tenure_months) return 0;
    
    const availableIncome = getAvailableIncome();
    const rates = {
      'Personal Loan': 12,
      'Emergency Loan': 10,
      'Advance Salary': 0,
      'Education Loan': 8
    };
    
    const rate = rates[formData.loan_type] || 12;
    const R = rate / 100 / 12;
    const N = parseFloat(formData.tenure_months);
    
    if (R === 0) {
      // For 0% interest (Advance Salary)
      return Math.floor(availableIncome * N);
    }
    
    // Calculate maximum principal for given EMI limit
    const maxPrincipal = (availableIncome * (Math.pow(1 + R, N) - 1)) / (R * Math.pow(1 + R, N));
    return Math.floor(maxPrincipal);
  };

  const handleSubmitLoan = async () => {
    if (!formData.loan_type || !formData.amount || !formData.tenure_months || !formData.purpose.trim()) {
      toast.error('Please fill in all required fields');
      return;
    }

    const amount = parseFloat(formData.amount);
    if (amount <= 0 || amount > 1000000) {
      toast.error('Loan amount must be between ₹1 and ₹10,00,000');
      return;
    }

    // Check EMI affordability
    if (!isEMIAffordable()) {
      const maxAmount = getMaximumLoanAmount();
      toast.error(`EMI exceeds available income. Maximum loan amount you can apply for: ₹${maxAmount.toLocaleString()}`);
      return;
    }

    setApplying(true);
    try {
      const loanData = {
        loan_type: formData.loan_type,
        amount: parseFloat(formData.amount),
        tenure_months: parseInt(formData.tenure_months),
        purpose: formData.purpose,
        monthly_income: formData.monthly_income ? parseFloat(formData.monthly_income) : null,
        existing_loans: formData.existing_loans ? parseFloat(formData.existing_loans) : null
      };

      const response = await axios.post(`${API}/loans`, loanData);
      toast.success('Loan request submitted successfully');
      setShowApplyDialog(false);
      setFormData({
        loan_type: '',
        amount: '',
        tenure_months: '',
        purpose: '',
        monthly_income: '',
        existing_loans: ''
      });
      // Refresh the loan requests list
      await fetchLoanRequests();
    } catch (error) {
      console.error('Error submitting loan request:', error);
      toast.error(error.response?.data?.detail || 'Failed to submit loan request');
    } finally {
      setApplying(false);
    }
  };

  const handleDeleteLoan = async (loanId) => {
    if (!confirm('Are you sure you want to delete this loan request? This action cannot be undone.')) {
      return;
    }
    
    try {
      await axios.delete(`${API}/loans/${loanId}`);
      
      // Refresh the loan requests list
      await fetchLoanRequests();
      
      toast.success('Loan request deleted successfully');
    } catch (error) {
      console.error('Error deleting loan request:', error);
      toast.error(error.response?.data?.detail || 'Failed to delete loan request. You can only delete pending loan requests.');
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'rejected':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-600" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusBadge = (status) => {
    const variants = {
      approved: 'default',
      rejected: 'destructive',
      pending: 'secondary'
    };
    return <Badge variant={variants[status] || 'outline'}>{status}</Badge>;
  };

  const activeLoans = loanRequests.filter(loan => loan.status === 'approved' && loan.outstanding_amount > 0);
  const totalOutstanding = loanRequests
    .filter(loan => loan.status === 'approved')
    .reduce((sum, loan) => sum + (loan.outstanding_amount || 0), 0);
  const totalMonthlyEMI = activeLoans.reduce((sum, loan) => sum + (loan.monthly_emi || 0), 0);
  
  // Get the primary active loan for detailed view (highest outstanding)
  const primaryLoan = activeLoans.length > 0 
    ? activeLoans.reduce((max, loan) => loan.outstanding_amount > max.outstanding_amount ? loan : max, activeLoans[0])
    : null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Financial Information</h1>
        <p className="text-gray-500">Manage your loans, advances, and financial applications</p>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="earnings" className="w-full">
        <div className="border-b border-gray-200 dark:border-gray-700 mb-6">
          <TabsList className="flex justify-start space-x-8 bg-transparent h-auto p-0">
            <TabsTrigger 
              value="earnings"
              className="relative pb-3 text-sm font-medium transition-all duration-500 ease-in-out data-[state=active]:text-blue-600 data-[state=inactive]:text-gray-600 dark:data-[state=active]:text-blue-400 dark:data-[state=inactive]:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 border-b-2 border-transparent data-[state=active]:border-blue-600 dark:data-[state=active]:border-blue-400 rounded-none bg-transparent"
            >
              Earnings Overview
            </TabsTrigger>
            <TabsTrigger 
              value="loans"
              className="relative pb-3 text-sm font-medium transition-all duration-500 ease-in-out data-[state=active]:text-blue-600 data-[state=inactive]:text-gray-600 dark:data-[state=active]:text-blue-400 dark:data-[state=inactive]:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 border-b-2 border-transparent data-[state=active]:border-blue-600 dark:data-[state=active]:border-blue-400 rounded-none bg-transparent"
            >
              Loans & Advances
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Loans & Advances Tab */}
        <TabsContent value="loans" className="space-y-6 mt-6">
          <div className="flex justify-end items-center">
        <Dialog open={showApplyDialog} onOpenChange={setShowApplyDialog}>
          <DialogTrigger asChild>
            <Button className="flex items-center space-x-2">
              <Plus className="h-4 w-4" />
              <span>Apply for Loan</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Apply for Loan</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="loan_type">Loan Type</Label>
                <Select value={formData.loan_type} onValueChange={(value) => handleInputChange('loan_type', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select loan type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Personal Loan">Personal Loan (12% p.a.)</SelectItem>
                    <SelectItem value="Emergency Loan">Emergency Loan (10% p.a.)</SelectItem>
                    <SelectItem value="Advance Salary">Advance Salary (0% interest)</SelectItem>
                    <SelectItem value="Education Loan">Education Loan (8% p.a.)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="amount">Loan Amount (₹)</Label>
                  <Input
                    id="amount"
                    type="number"
                    value={formData.amount}
                    onChange={(e) => handleInputChange('amount', e.target.value)}
                    placeholder="100000"
                    min="1"
                    max="1000000"
                  />
                </div>
                <div>
                  <Label htmlFor="tenure_months">Tenure (Months)</Label>
                  <Select value={formData.tenure_months} onValueChange={(value) => handleInputChange('tenure_months', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="6">6 months</SelectItem>
                      <SelectItem value="12">12 months</SelectItem>
                      <SelectItem value="18">18 months</SelectItem>
                      <SelectItem value="24">24 months</SelectItem>
                      <SelectItem value="36">36 months</SelectItem>
                      <SelectItem value="48">48 months</SelectItem>
                      <SelectItem value="60">60 months</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {formData.amount && formData.tenure_months && formData.loan_type && (
                <>
                  <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg border border-blue-200 dark:border-blue-500/30">
                    <div className="flex items-center space-x-2">
                      <Calculator className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                      <span className="text-sm font-medium text-blue-700 dark:text-blue-300">Estimated EMI</span>
                    </div>
                    <p className="text-lg font-bold text-blue-700 dark:text-blue-300">₹{getEstimatedEMI().toLocaleString()}/month</p>
                  </div>
                  
                  {!isEMIAffordable() && formData.monthly_income && (
                    <div className="bg-red-50 dark:bg-red-900/20 p-3 rounded-lg border-l-4 border-red-500 dark:border-red-500/50">
                      <div className="flex items-center space-x-2">
                        <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400" />
                        <span className="text-sm font-medium text-red-700 dark:text-red-300">EMI Exceeds Available Income</span>
                      </div>
                      <p className="text-sm text-red-600 dark:text-red-400 mt-1">
                        Available Income: ₹{getAvailableIncome().toLocaleString()}/month
                      </p>
                      <p className="text-sm font-semibold text-red-700 mt-1">
                        Maximum Loan Amount: ₹{getMaximumLoanAmount().toLocaleString()}
                      </p>
                    </div>
                  )}
                </>
              )}

              <div>
                <Label htmlFor="purpose">Purpose</Label>
                <Textarea
                  id="purpose"
                  value={formData.purpose}
                  onChange={(e) => handleInputChange('purpose', e.target.value)}
                  placeholder="Please specify the purpose of loan"
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="monthly_income">Monthly Income (₹)</Label>
                <Input
                  id="monthly_income"
                  type="number"
                  value={formData.monthly_income}
                  readOnly
                  className="bg-gray-100 cursor-not-allowed"
                />
                <p className="text-xs text-gray-600 mt-1">Auto-populated from salary data</p>
              </div>

              <div>
                <Label htmlFor="existing_loans">Existing Loan EMIs (₹/month)</Label>
                <Input
                  id="existing_loans"
                  type="number"
                  value={formData.existing_loans}
                  readOnly
                  className="bg-gray-100 cursor-not-allowed"
                />
                <p className="text-xs text-gray-600 mt-1">Auto-populated from current loans</p>
              </div>

              <div className="flex space-x-2 pt-4">
                <Button variant="outline" onClick={() => setShowApplyDialog(false)} className="flex-1">
                  Cancel
                </Button>
                <Button onClick={handleSubmitLoan} disabled={applying} className="flex-1">
                  {applying ? 'Submitting...' : 'Submit'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Loan Summary Cards */}
      <div className="grid md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Total Outstanding</p>
                <p className="text-2xl font-bold text-red-600">₹{totalOutstanding.toLocaleString()}</p>
                <p className="text-xs text-gray-400">Across all loans</p>
              </div>
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                <TrendingDown className="h-6 w-6 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Monthly EMI</p>
                <p className="text-2xl font-bold text-orange-600 dark:text-orange-500">
                  ₹{totalMonthlyEMI.toLocaleString()}
                </p>
                <p className="text-xs text-gray-400 dark:text-gray-500">
                  {activeLoans.length > 0 ? `Combined (${activeLoans.length} ${activeLoans.length === 1 ? 'loan' : 'loans'})` : 'No active loans'}
                </p>
              </div>
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <DollarSign className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-gray-500">Loan Eligibility</p>
                  <div className="group relative">
                    <AlertCircle className="h-4 w-4 text-gray-400 cursor-help" />
                    <div className="absolute left-0 bottom-full mb-2 hidden group-hover:block w-64 p-3 bg-gray-900 text-white text-xs rounded-lg shadow-lg z-10">
                      <p className="font-semibold mb-2">Calculation Breakdown:</p>
                      <p>• Gross Salary: ₹{loanEligibility.grossSalary.toLocaleString('en-IN')}</p>
                      <p>• Max EMI Capacity (50%): ₹{(loanEligibility.grossSalary * 0.5).toLocaleString('en-IN')}</p>
                      <p>• Existing EMIs: -₹{loanEligibility.existingEMI.toLocaleString('en-IN')}</p>
                      <p className="border-t border-gray-600 mt-1 pt-1">• Available for EMI: ₹{loanEligibility.maxEMI.toLocaleString('en-IN')}</p>
                      <p className="mt-2 text-gray-300">Based on 24 months @ 10% interest</p>
                    </div>
                  </div>
                </div>
                <p className="text-2xl font-bold text-green-600">
                  ₹{loanEligibility.maxEligible.toLocaleString('en-IN')}
                </p>
                <p className="text-xs text-gray-400">
                  {loanEligibility.maxEligible > 0 
                    ? `Max EMI: ₹${loanEligibility.maxEMI.toLocaleString('en-IN')}/month` 
                    : 'No eligibility available'}
                </p>
              </div>
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                <Wallet className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Active Loan Details */}
      {primaryLoan && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Calculator className="h-5 w-5" />
              <span>Active Loan Details</span>
              {activeLoans.length > 1 && (
                <Badge variant="secondary">{activeLoans.length} Active Loans</Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Loan Type</p>
                    <p className="font-semibold">{primaryLoan.loan_type}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Loan Amount</p>
                    <p className="font-semibold">₹{primaryLoan.amount.toLocaleString()}</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Interest Rate</p>
                    <p className="font-semibold">{primaryLoan.interest_rate}% p.a.</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Monthly EMI</p>
                    <p className="font-semibold text-orange-600">₹{primaryLoan.monthly_emi.toLocaleString()}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Outstanding</p>
                    <p className="font-semibold text-red-600">₹{primaryLoan.outstanding_amount.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Paid EMIs</p>
                    <p className="font-semibold text-green-600">{primaryLoan.paid_emis} / {primaryLoan.paid_emis + primaryLoan.remaining_emis}</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Repayment Progress</span>
                    <span>{Math.round((primaryLoan.paid_emis / (primaryLoan.paid_emis + primaryLoan.remaining_emis)) * 100)}%</span>
                  </div>
                  <div className="bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-green-600 h-2 rounded-full" 
                      style={{ width: `${(primaryLoan.paid_emis / (primaryLoan.paid_emis + primaryLoan.remaining_emis)) * 100}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Loan Requests History */}
      <Card>
        <CardHeader>
          <CardTitle>Loan History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto border border-gray-200 dark:border-gray-700 rounded-lg">
            <Table>
              <TableHeader>
                <TableRow className="border-b border-gray-200 dark:border-gray-700">
                  <TableHead className="text-gray-700 dark:text-gray-300">Type</TableHead>
                  <TableHead className="text-gray-700 dark:text-gray-300">Amount</TableHead>
                  <TableHead className="text-gray-700 dark:text-gray-300">Tenure</TableHead>
                  <TableHead className="text-gray-700 dark:text-gray-300">EMI</TableHead>
                  <TableHead className="text-gray-700 dark:text-gray-300">Purpose</TableHead>
                  <TableHead className="text-gray-700 dark:text-gray-300">Status</TableHead>
                  <TableHead className="text-gray-700 dark:text-gray-300">Applied On</TableHead>
                  <TableHead className="text-gray-700 dark:text-gray-300">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loanRequests.map((request) => (
                  <TableRow key={request.id} className="border-b border-gray-200 dark:border-gray-700">
                    <TableCell className="font-medium text-gray-900 dark:text-gray-200">{request.loan_type}</TableCell>
                    <TableCell className="text-gray-800 dark:text-gray-300">₹{request.amount.toLocaleString()}</TableCell>
                    <TableCell className="text-gray-800 dark:text-gray-300">{request.tenure_months} months</TableCell>
                    <TableCell className="text-gray-800 dark:text-gray-300">₹{request.monthly_emi.toLocaleString()}</TableCell>
                    <TableCell className="max-w-xs truncate text-gray-800 dark:text-gray-300">{request.purpose}</TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        {getStatusIcon(request.status)}
                        {getStatusBadge(request.status)}
                      </div>
                    </TableCell>
                    <TableCell className="text-gray-800 dark:text-gray-300">{format(new Date(request.applied_date), 'dd MMM yyyy')}</TableCell>
                    <TableCell>
                      {request.status === 'pending' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteLoan(request.id)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {loanRequests.length === 0 && (
            <div className="text-center py-8">
              <CreditCard className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No loan requests</h3>
              <p className="text-gray-500">Your loan applications will appear here</p>
            </div>
          )}
        </CardContent>
      </Card>
        </TabsContent>

        {/* Earnings Overview Tab */}
        <TabsContent value="earnings" className="space-y-6 mt-6">
          {loadingEarnings ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-gray-500 mt-4">Loading earnings data...</p>
            </div>
          ) : !earningsData || !earningsData.has_data ? (
            <Card>
              <CardContent className="py-12 text-center">
                <IndianRupee className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">No Earnings Data</h3>
                <p className="text-gray-500">Your payslip records will appear here once generated</p>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Year Selector */}
              <div className="flex justify-end items-center">
                <div className="flex items-center gap-2">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Year:</label>
                  <Select value={selectedYear} onValueChange={(val) => setSelectedYear(val)}>
                    <SelectTrigger className="w-[140px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Years</SelectItem>
                      {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map(year => (
                        <SelectItem key={year} value={year.toString()}>
                          {year}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Yearly Earnings Summary Cards */}
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">{selectedYear === 'all' ? 'Total Earnings' : 'YTD Earnings'}</CardTitle>
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">₹{earningsData.ytd_earnings.toLocaleString('en-IN')}</div>
                    <p className="text-xs text-muted-foreground">
                      {selectedYear === 'all' 
                        ? 'All time earnings' 
                        : `January to ${new Date().toLocaleString('default', { month: 'long' })}`}
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">FY Earnings</CardTitle>
                    <TrendingUp className="h-4 w-4 text-green-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">₹{earningsData.fy_earnings.toLocaleString('en-IN')}</div>
                    <p className="text-xs text-muted-foreground">
                      {selectedYear === 'all' ? 'All financial years' : 'Financial Year (Apr-Mar)'}
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Current Month</CardTitle>
                    <IndianRupee className="h-4 w-4 text-blue-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">₹{earningsData.current_month_earnings.toLocaleString('en-IN')}</div>
                    <p className="text-xs text-muted-foreground">{new Date().toLocaleString('default', { month: 'long', year: 'numeric' })}</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Previous Month</CardTitle>
                    <Clock className="h-4 w-4 text-gray-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">₹{earningsData.previous_month_earnings.toLocaleString('en-IN')}</div>
                    <p className="text-xs text-muted-foreground">
                      {new Date(new Date().setMonth(new Date().getMonth() - 1)).toLocaleString('default', { month: 'long' })}
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">6-Month Avg</CardTitle>
                    <BarChart3 className="h-4 w-4 text-purple-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">₹{earningsData.average_monthly_salary.toLocaleString('en-IN')}</div>
                    <p className="text-xs text-muted-foreground">
                      {selectedYear === 'all' ? 'Average across all data' : 'Average monthly salary'}
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Earnings Breakdown Chart */}
              <Card>
                <CardHeader>
                  <CardTitle>
                    {selectedYear === 'all' ? 'Monthly Earnings Trend (All Years)' : 'Monthly Earnings Trend (Last 12 Months)'}
                  </CardTitle>
                  <p className="text-sm text-gray-500">Gross Salary vs Net Salary breakdown</p>
                </CardHeader>
                <CardContent>
                  {earningsData.monthly_trend && earningsData.monthly_trend.length > 0 ? (
                    <ResponsiveContainer width="100%" height={350}>
                      <LineChart data={earningsData.monthly_trend}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-700" />
                        <XAxis 
                          dataKey="month_name" 
                          className="text-xs"
                          tick={{ fill: 'currentColor' }}
                        />
                        <YAxis 
                          className="text-xs"
                          tick={{ fill: 'currentColor' }}
                          tickFormatter={(value) => `₹${(value / 1000).toFixed(0)}K`}
                        />
                        <Tooltip 
                          formatter={(value) => `₹${value.toLocaleString('en-IN')}`}
                          contentStyle={{
                            backgroundColor: 'var(--background)',
                            border: '1px solid var(--border)',
                            borderRadius: '6px'
                          }}
                        />
                        <Legend />
                        <Line 
                          type="monotone" 
                          dataKey="gross_salary" 
                          stroke="#3b82f6" 
                          strokeWidth={2}
                          name="Gross Salary"
                          dot={{ r: 4 }}
                          activeDot={{ r: 6 }}
                        />
                        <Line 
                          type="monotone" 
                          dataKey="net_salary" 
                          stroke="#10b981" 
                          strokeWidth={2}
                          name="Net Salary"
                          dot={{ r: 4 }}
                          activeDot={{ r: 6 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      No trend data available
                    </div>
                  )}
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default EmployeeLoans;