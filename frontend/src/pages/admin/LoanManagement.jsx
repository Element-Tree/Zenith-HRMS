import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
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
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  Filter,
  Search,
  DollarSign,
  TrendingUp,
  Trash2,
  Eye,
  Plus,
  Calculator
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import axios from 'axios';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const LoanManagement = () => {
  const [loanRequests, setLoanRequests] = useState([]);
  const [filteredRequests, setFilteredRequests] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [disbursedAmount, setDisbursedAmount] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [showLoanDetailsDialog, setShowLoanDetailsDialog] = useState(false);
  const [showNewLoanDialog, setShowNewLoanDialog] = useState(false);
  const [newLoan, setNewLoan] = useState({
    employee_id: '',
    type: '',
    amount: '',
    interest_rate: 0,
    tenure_months: '',
    purpose: '',
    guarantor_name: '',
    guarantor_employee_id: ''
  });

  const loanTypes = [
    { value: 'personal', label: 'Personal Loan', max_amount: 500000, interest_rate: 12 },
    { value: 'home', label: 'Home Loan', max_amount: 5000000, interest_rate: 8.5 },
    { value: 'vehicle', label: 'Vehicle Loan', max_amount: 1000000, interest_rate: 10 },
    { value: 'education', label: 'Education Loan', max_amount: 1500000, interest_rate: 9 },
    { value: 'emergency', label: 'Emergency Advance', max_amount: 50000, interest_rate: 6 },
    { value: 'festival', label: 'Festival Advance', max_amount: 25000, interest_rate: 0 },
    { value: 'others', label: 'Others', max_amount: 1000000, interest_rate: 12 }
  ];

  useEffect(() => {
    fetchLoanRequests();
  }, []);

  useEffect(() => {
    filterRequests();
  }, [loanRequests, searchTerm, statusFilter]);

  const fetchLoanRequests = async () => {
    try {
      const [loansResponse, employeesResponse] = await Promise.all([
        axios.get(`${API}/loans`),
        axios.get(`${API}/employees`)
      ]);
      
      const loans = loansResponse.data;
      const employeesData = employeesResponse.data;
      
      // Store employees for use in new loan form
      setEmployees(employeesData);
      
      // Create employee map for quick lookup
      const employeeMap = {};
      employeesData.forEach(emp => {
        employeeMap[emp.employee_id] = emp.name;
      });
      
      // Add employee names to loan requests
      const loansWithNames = loans.map(loan => ({
        ...loan,
        employee_name: employeeMap[loan.employee_id] || `Employee (${loan.employee_id})`
      }));
      
      // Sort by application_date or created_at descending (newest first)
      const sortedLoans = loansWithNames.sort((a, b) => {
        const dateA = new Date(a.application_date || a.created_at || 0);
        const dateB = new Date(b.application_date || b.created_at || 0);
        return dateB - dateA; // Newest first
      });
      
      setLoanRequests(sortedLoans);
    } catch (error) {
      console.error('Error fetching loan requests:', error);
      toast.error('Failed to load loan requests');
    } finally {
      setLoading(false);
    }
  };

  const calculateEMI = (principal, rate, tenure) => {
    if (!principal || !tenure) return 0;
    
    // For 0% interest, EMI is simply principal divided by tenure
    if (rate === 0 || rate === '0') {
      return Math.round(principal / tenure);
    }
    
    // For interest-bearing loans, use compound interest formula
    const monthlyRate = rate / 100 / 12;
    const emi = (principal * monthlyRate * Math.pow(1 + monthlyRate, tenure)) / 
                (Math.pow(1 + monthlyRate, tenure) - 1);
    return Math.round(emi);
  };

  const handleLoanTypeChange = (type) => {
    const loanType = loanTypes.find(t => t.value === type);
    if (loanType) {
      setNewLoan(prev => ({
        ...prev,
        type,
        interest_rate: loanType.interest_rate
      }));
    }
  };

  const handleCreateLoan = async () => {
    try {
      const emi = calculateEMI(
        parseFloat(newLoan.amount),
        parseFloat(newLoan.interest_rate),
        parseInt(newLoan.tenure_months)
      );

      const loanData = {
        employee_id: newLoan.employee_id,
        loan_type: newLoan.type,
        amount: parseFloat(newLoan.amount),
        tenure_months: parseInt(newLoan.tenure_months),
        interest_rate: parseFloat(newLoan.interest_rate),
        monthly_emi: emi,
        purpose: newLoan.purpose,
        guarantor_name: newLoan.guarantor_name,
        guarantor_employee_id: newLoan.guarantor_employee_id || null
      };

      await axios.post(`${API}/loans`, loanData);
      
      setNewLoan({
        employee_id: '',
        type: '',
        amount: '',
        interest_rate: 0,
        tenure_months: '',
        purpose: '',
        guarantor_name: '',
        guarantor_employee_id: ''
      });
      setShowNewLoanDialog(false);
      toast.success('Loan application created successfully');
      fetchLoanRequests(); // Refresh the list
    } catch (error) {
      console.error('Error creating loan:', error);
      toast.error('Failed to create loan application');
    }
  };

  const formatCurrency = (amount) => {
    return `₹${amount?.toLocaleString() || 0}`;
  };

  const formatDate = (date) => {
    if (!date) return 'N/A';
    return format(new Date(date), 'dd MMM yyyy');
  };

  const filterRequests = () => {
    let filtered = loanRequests;

    if (searchTerm) {
      filtered = filtered.filter(request =>
        request.employee_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (request.employee_name && request.employee_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        request.purpose.toLowerCase().includes(searchTerm.toLowerCase()) ||
        request.loan_type.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(request => request.status === statusFilter);
    }

    setFilteredRequests(filtered);
  };

  const handleApproveReject = async (loanId, status, reason = '', disbursed = null) => {
    setActionLoading(true);
    try {
      const data = { status };
      if (status === 'rejected' && reason) {
        data.rejection_reason = reason;
      }
      if (status === 'approved' && disbursed) {
        data.disbursed_amount = parseFloat(disbursed);
      }

      await axios.put(`${API}/loans/${loanId}/approve`, data);
      
      // Refresh the loan requests list
      fetchLoanRequests();
      
      // Refresh sidebar notification badges
      if (window.refreshSidebarNotifications) {
        window.refreshSidebarNotifications();
      }
      
      // Reset state
      setSelectedRequest(null);
      setDisbursedAmount('');
      setRejectionReason('');
      
      toast.success(`Loan request ${status} successfully`);
    } catch (error) {
      console.error('Error updating loan request:', error);
      toast.error(error.response?.data?.detail || 'Failed to update loan request');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteLoan = async (loanId) => {
    if (!confirm('Are you sure you want to delete this loan request? This action cannot be undone.')) {
      return;
    }
    
    try {
      await axios.delete(`${API}/loans/${loanId}`);
      
      // Refresh the loan requests list
      fetchLoanRequests();
      
      toast.success('Loan request deleted successfully');
    } catch (error) {
      console.error('Error deleting loan request:', error);
      toast.error(error.response?.data?.detail || 'Failed to delete loan request');
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
        return <AlertTriangle className="h-4 w-4 text-gray-600" />;
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

  const getStats = () => {
    const total = loanRequests.length;
    const pending = loanRequests.filter(r => r.status === 'pending').length;
    const approved = loanRequests.filter(r => r.status === 'approved').length;
    const rejected = loanRequests.filter(r => r.status === 'rejected').length;
    const totalAmount = loanRequests
      .filter(r => r.status === 'approved')
      .reduce((sum, r) => sum + (r.disbursed_amount || r.amount), 0);
    const totalOutstanding = loanRequests
      .filter(r => r.status === 'approved')
      .reduce((sum, r) => sum + (r.outstanding_amount || r.amount || 0), 0);
    
    return { total, pending, approved, rejected, totalAmount, totalOutstanding };
  };

  const stats = getStats();

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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Loan Management</h1>
          <p className="text-gray-500">Review and approve employee loan requests</p>
        </div>
        <Button onClick={() => setShowNewLoanDialog(true)}>
          <Plus className="w-4 h-4 mr-2" />
          New Loan Application
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid md:grid-cols-3 lg:grid-cols-6 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Applications</p>
                <p className="text-2xl font-bold text-primary">{stats.total}</p>
              </div>
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                <CreditCard className="h-6 w-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Pending</p>
                <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-500">{stats.pending}</p>
              </div>
              <div className="w-12 h-12 bg-yellow-100 dark:bg-yellow-900/20 rounded-lg flex items-center justify-center">
                <Clock className="h-6 w-6 text-yellow-600 dark:text-yellow-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Approved</p>
                <p className="text-2xl font-bold text-green-600 dark:text-green-500">{stats.approved}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-lg flex items-center justify-center">
                <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Rejected</p>
                <p className="text-2xl font-bold text-red-600 dark:text-red-500">{stats.rejected}</p>
              </div>
              <div className="w-12 h-12 bg-red-100 dark:bg-red-900/20 rounded-lg flex items-center justify-center">
                <XCircle className="h-6 w-6 text-red-600 dark:text-red-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Disbursed</p>
                <p className="text-2xl font-bold text-primary">₹{stats.totalAmount.toLocaleString()}</p>
              </div>
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Outstanding</p>
                <p className="text-2xl font-bold text-red-600 dark:text-red-500">₹{stats.totalOutstanding.toLocaleString()}</p>
              </div>
              <div className="w-12 h-12 bg-red-100 dark:bg-red-900/20 rounded-lg flex items-center justify-center">
                <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-500" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search by employee name, ID, purpose, or loan type..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex items-center space-x-2">
              <Filter className="h-4 w-4 text-gray-500" />
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Loan Requests Table */}
      <Card>
        <CardHeader>
          <CardTitle>Loan Requests</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto border border-gray-200 dark:border-gray-700 rounded-lg">
            <Table>
              <TableHeader>
                <TableRow className="border-b border-gray-200 dark:border-gray-700">
                  <TableHead className="text-gray-700 dark:text-gray-300">Employee</TableHead>
                  <TableHead className="text-gray-700 dark:text-gray-300">Loan Type</TableHead>
                  <TableHead className="text-gray-700 dark:text-gray-300">Amount</TableHead>
                  <TableHead className="text-gray-700 dark:text-gray-300">Tenure</TableHead>
                  <TableHead className="text-gray-700 dark:text-gray-300">EMI</TableHead>
                  <TableHead className="text-gray-700 dark:text-gray-300">Purpose</TableHead>
                  <TableHead className="text-gray-700 dark:text-gray-300">Applied On</TableHead>
                  <TableHead className="text-gray-700 dark:text-gray-300">Status</TableHead>
                  <TableHead className="text-gray-700 dark:text-gray-300">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRequests.map((request) => (
                  <TableRow key={request.id} className="border-b border-gray-200 dark:border-gray-700">
                    <TableCell className="font-medium">
                      <div>
                        <p className="font-medium text-gray-900 dark:text-gray-200">{request.employee_name}</p>
                        <p className="text-sm text-muted-foreground dark:text-gray-400">{request.employee_id}</p>
                      </div>
                    </TableCell>
                    <TableCell className="text-gray-800 dark:text-gray-300">{request.loan_type}</TableCell>
                    <TableCell className="text-gray-800 dark:text-gray-300">₹{request.amount.toLocaleString()}</TableCell>
                    <TableCell className="text-gray-800 dark:text-gray-300">{request.tenure_months} months</TableCell>
                    <TableCell className="text-gray-800 dark:text-gray-300">₹{request.monthly_emi.toLocaleString()}</TableCell>
                    <TableCell className="max-w-xs text-gray-800 dark:text-gray-300">
                      <div className="truncate" title={request.purpose}>
                        {request.purpose}
                      </div>
                    </TableCell>
                    <TableCell className="text-gray-800 dark:text-gray-300">{format(new Date(request.applied_date), 'dd MMM yyyy')}</TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        {getStatusIcon(request.status)}
                        {getStatusBadge(request.status)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedRequest(request);
                            setShowLoanDetailsDialog(true);
                          }}
                        >
                          <Eye className="w-3 h-3" />
                        </Button>
                        {request.status === 'pending' && (
                          <>
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button
                                size="sm"
                                onClick={() => {
                                  setSelectedRequest(request);
                                  setDisbursedAmount(request.amount.toString());
                                }}
                              >
                                Approve
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Approve Loan Request</DialogTitle>
                              </DialogHeader>
                              <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <p className="text-sm text-gray-600">Employee</p>
                                    <div>
                                      <p className="font-medium">{request.employee_name}</p>
                                      <p className="text-xs text-muted-foreground">{request.employee_id}</p>
                                    </div>
                                  </div>
                                  <div>
                                    <p className="text-sm text-gray-600">Loan Type</p>
                                    <p className="font-medium">{request.loan_type}</p>
                                  </div>
                                  <div>
                                    <p className="text-sm text-gray-600">Requested Amount</p>
                                    <p className="font-medium">₹{request.amount.toLocaleString()}</p>
                                  </div>
                                  <div>
                                    <p className="text-sm text-gray-600">Interest Rate</p>
                                    <p className="font-medium">{request.interest_rate}% p.a.</p>
                                  </div>
                                </div>
                                
                                <div>
                                  <p className="text-sm text-gray-600">Purpose</p>
                                  <p className="font-medium">{request.purpose}</p>
                                </div>

                                <div>
                                  <label className="text-sm font-medium">Disbursed Amount (₹)</label>
                                  <Input
                                    type="number"
                                    value={disbursedAmount}
                                    onChange={(e) => setDisbursedAmount(e.target.value)}
                                    placeholder="Enter disbursed amount"
                                  />
                                </div>

                                <div className="flex space-x-2">
                                  <Button
                                    variant="outline"
                                    onClick={() => {
                                      setSelectedRequest(null);
                                      setDisbursedAmount('');
                                    }}
                                    className="flex-1"
                                  >
                                    Cancel
                                  </Button>
                                  <Button
                                    onClick={() => handleApproveReject(request.id, 'approved', '', disbursedAmount)}
                                    disabled={actionLoading || !disbursedAmount.trim()}
                                    className="flex-1"
                                  >
                                    Approve Loan
                                  </Button>
                                </div>
                              </div>
                            </DialogContent>
                          </Dialog>
                          
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => setSelectedRequest(request)}
                              >
                                Reject
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Reject Loan Request</DialogTitle>
                              </DialogHeader>
                              <div className="space-y-4">
                                <div>
                                  <p className="text-sm text-gray-600 mb-2">
                                    Employee: <strong>{request.employee_name}</strong> ({request.employee_id})
                                  </p>
                                  <p className="text-sm text-gray-600 mb-2">
                                    Loan: <strong>{request.loan_type}</strong> (₹{request.amount.toLocaleString()})
                                  </p>
                                  <p className="text-sm text-gray-600">
                                    Purpose: <strong>{request.purpose}</strong>
                                  </p>
                                </div>
                                <div>
                                  <label className="text-sm font-medium">Rejection Reason</label>
                                  <Textarea
                                    value={rejectionReason}
                                    onChange={(e) => setRejectionReason(e.target.value)}
                                    placeholder="Please provide a reason for rejection"
                                    rows={3}
                                  />
                                </div>
                                <div className="flex space-x-2">
                                  <Button
                                    variant="outline"
                                    onClick={() => {
                                      setSelectedRequest(null);
                                      setRejectionReason('');
                                    }}
                                    className="flex-1"
                                  >
                                    Cancel
                                  </Button>
                                  <Button
                                    variant="destructive"
                                    onClick={() => handleApproveReject(request.id, 'rejected', rejectionReason)}
                                    disabled={actionLoading || !rejectionReason.trim()}
                                    className="flex-1"
                                  >
                                    Reject Loan
                                  </Button>
                                </div>
                              </div>
                            </DialogContent>
                          </Dialog>
                          
                          </>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteLoan(request.id)}
                          className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {filteredRequests.length === 0 && (
            <div className="text-center py-8">
              <CreditCard className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No loan requests found</h3>
              <p className="text-gray-500">
                {searchTerm || statusFilter !== 'all'
                  ? 'Try adjusting your search or filter criteria'
                  : 'Loan requests from employees will appear here'}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* New Loan Application Dialog */}
      <Dialog open={showNewLoanDialog} onOpenChange={setShowNewLoanDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>New Loan Application</DialogTitle>
          </DialogHeader>
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-4">
              <div>
                <Label className="text-gray-700 dark:text-gray-300">Employee</Label>
                <Select value={newLoan.employee_id} onValueChange={(value) => setNewLoan(prev => ({ ...prev, employee_id: value }))}>
                  <SelectTrigger className="dark:text-gray-200">
                    <SelectValue placeholder="Select employee" className="dark:text-gray-400" />
                  </SelectTrigger>
                  <SelectContent>
                    {employees.filter(emp => emp.status === 'active').map(emp => (
                      <SelectItem key={emp.employee_id} value={emp.employee_id}>{emp.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label className="text-gray-700 dark:text-gray-300">Loan Type</Label>
                <Select value={newLoan.type} onValueChange={handleLoanTypeChange}>
                  <SelectTrigger className="dark:text-gray-200">
                    <SelectValue placeholder="Select loan type" />
                  </SelectTrigger>
                  <SelectContent>
                    {loanTypes.map(type => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label} (Max: {formatCurrency(type.max_amount)})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label className="text-gray-700 dark:text-gray-300">Loan Amount</Label>
                <Input
                  type="number"
                  value={newLoan.amount}
                  onChange={(e) => setNewLoan(prev => ({ ...prev, amount: e.target.value }))}
                  placeholder="Enter amount"
                  className="dark:text-gray-200 dark:placeholder:text-gray-500"
                />
              </div>
              
              <div>
                <Label className="text-gray-700 dark:text-gray-300">Interest Rate (%)</Label>
                <Input
                  type="number"
                  value={newLoan.interest_rate}
                  onChange={(e) => setNewLoan(prev => ({ ...prev, interest_rate: parseFloat(e.target.value) }))}
                  step="0.1"
                  className="dark:text-gray-200 dark:placeholder:text-gray-500"
                />
              </div>

              <div>
                <Label className="text-gray-700 dark:text-gray-300">Guarantor Name</Label>
                <Input
                  value={newLoan.guarantor_name}
                  onChange={(e) => setNewLoan(prev => ({ ...prev, guarantor_name: e.target.value }))}
                  placeholder="Enter guarantor name (optional)"
                  className="dark:text-gray-200 dark:placeholder:text-gray-500"
                />
              </div>
            </div>
            
            <div className="space-y-4">
              <div>
                <Label className="text-gray-700 dark:text-gray-300">Tenure (Months)</Label>
                <Input
                  type="number"
                  value={newLoan.tenure_months}
                  onChange={(e) => setNewLoan(prev => ({ ...prev, tenure_months: e.target.value }))}
                  placeholder="Enter tenure in months"
                  className="dark:text-gray-200 dark:placeholder:text-gray-500"
                />
              </div>
              
              <div>
                <Label className="text-gray-700 dark:text-gray-300">
                  Purpose {newLoan.type === 'others' && <span className="text-red-500 dark:text-red-400">*</span>}
                </Label>
                <Textarea
                  value={newLoan.purpose}
                  onChange={(e) => setNewLoan(prev => ({ ...prev, purpose: e.target.value }))}
                  placeholder={newLoan.type === 'others' ? 'Purpose is required for Others loan type' : 'Purpose of the loan (optional)'}
                  rows={3}
                  className={`dark:text-gray-200 dark:placeholder:text-gray-500 ${newLoan.type === 'others' && !newLoan.purpose ? 'border-red-300 dark:border-red-700' : ''}`}
                />
                {newLoan.type === 'others' && !newLoan.purpose && (
                  <p className="text-xs text-red-500 dark:text-red-400 mt-1">Purpose is required when loan type is "Others"</p>
                )}
              </div>
              
              {newLoan.amount && newLoan.interest_rate !== '' && newLoan.tenure_months && (
                <div className="p-4 bg-primary/10 dark:bg-primary/20 border border-primary/30 dark:border-primary/40 rounded-lg">
                  <div className="flex items-center space-x-2 mb-2">
                    <Calculator className="h-4 w-4 text-primary" />
                    <span className="font-medium text-primary">EMI Calculation</span>
                  </div>
                  <div className="text-2xl font-bold text-primary">
                    {formatCurrency(calculateEMI(
                      parseFloat(newLoan.amount) || 0,
                      parseFloat(newLoan.interest_rate) || 0,
                      parseInt(newLoan.tenure_months) || 0
                    ))}
                  </div>
                  <div className="text-sm text-primary">Monthly EMI</div>
                </div>
              )}
            </div>
          </div>
          
          <div className="flex justify-end space-x-2 mt-6">
            <Button variant="outline" onClick={() => setShowNewLoanDialog(false)} className="dark:text-gray-300">Cancel</Button>
            <Button 
              onClick={handleCreateLoan}
              disabled={
                !newLoan.employee_id || 
                !newLoan.type || 
                !newLoan.amount || 
                !newLoan.tenure_months ||
                (newLoan.type === 'others' && !newLoan.purpose)
              }
            >
              Submit Application
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Loan Details Dialog */}
      <Dialog open={showLoanDetailsDialog} onOpenChange={setShowLoanDetailsDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Loan Details - {selectedRequest?.employee_name}</DialogTitle>
          </DialogHeader>
          {selectedRequest && (
            <div className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <h3 className="font-semibold mb-3 text-gray-900 dark:text-gray-100">Loan Information</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Loan Type:</span>
                      <span className="text-gray-900 dark:text-gray-200">{selectedRequest.loan_type}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Amount:</span>
                      <span className="text-gray-900 dark:text-gray-200">{formatCurrency(selectedRequest.amount)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Interest Rate:</span>
                      <span className="text-gray-900 dark:text-gray-200">{selectedRequest.interest_rate}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Tenure:</span>
                      <span className="text-gray-900 dark:text-gray-200">{selectedRequest.tenure_months} months</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Monthly EMI:</span>
                      <span className="font-semibold text-gray-900 dark:text-gray-200">{formatCurrency(selectedRequest.monthly_emi)}</span>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h3 className="font-semibold mb-3 text-gray-900 dark:text-gray-100">Repayment Status</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Disbursed Amount:</span>
                      <span className="text-primary">{formatCurrency(selectedRequest.disbursed_amount || selectedRequest.amount)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Outstanding:</span>
                      <span className="text-red-600 dark:text-red-400">{formatCurrency(selectedRequest.outstanding_amount || selectedRequest.amount)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Paid EMIs:</span>
                      <span className="text-gray-900 dark:text-gray-200">{selectedRequest.paid_emis || 0} / {selectedRequest.tenure_months}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Progress:</span>
                      <span className="text-gray-900 dark:text-gray-200">
                        {(((selectedRequest.disbursed_amount || selectedRequest.amount) - (selectedRequest.outstanding_amount || selectedRequest.amount)) / (selectedRequest.disbursed_amount || selectedRequest.amount) * 100).toFixed(1)}%
                      </span>
                    </div>
                  </div>
                  
                  <div className="mt-4">
                    <Progress 
                      value={(((selectedRequest.disbursed_amount || selectedRequest.amount) - (selectedRequest.outstanding_amount || selectedRequest.amount)) / (selectedRequest.disbursed_amount || selectedRequest.amount)) * 100} 
                      className="h-3"
                    />
                  </div>
                </div>
              </div>
              
              <div>
                <h3 className="font-semibold mb-3 text-gray-900 dark:text-gray-100">Additional Details</h3>
                <div className="grid gap-4 md:grid-cols-2 text-sm">
                  <div>
                    <span className="font-medium text-gray-900 dark:text-gray-200">Purpose:</span>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">{selectedRequest.purpose}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-900 dark:text-gray-200">Status:</span>
                    <p className="text-gray-600 dark:text-gray-400 mt-1 capitalize">{selectedRequest.status}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-900 dark:text-gray-200">Applied Date:</span>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">{formatDate(selectedRequest.applied_date)}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-900 dark:text-gray-200">
                      {selectedRequest.status === 'approved' ? 'Approved Date:' : 
                       selectedRequest.status === 'rejected' ? 'Rejected Date:' : 'Status:'}
                    </span>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">
                      {selectedRequest.approved_date ? formatDate(selectedRequest.approved_date) :
                       selectedRequest.rejected_date ? formatDate(selectedRequest.rejected_date) : 'Pending'}
                    </p>
                  </div>
                  {selectedRequest.rejection_reason && (
                    <div className="md:col-span-2">
                      <span className="font-medium text-gray-900 dark:text-gray-200">Rejection Reason:</span>
                      <p className="text-red-600 dark:text-red-400 mt-1">{selectedRequest.rejection_reason}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default LoanManagement;
