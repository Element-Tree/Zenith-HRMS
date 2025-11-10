import React, { useState, useEffect } from "react";
import axios from "axios";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import {
  IndianRupee,
  Plus,
  Eye,
  CheckCircle,
  XCircle,
  Calculator,
  TrendingUp,
  Users,
  Clock
} from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";
import { toast } from "sonner";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const LoansAdvances = () => {
  const [employees, setEmployees] = useState([]);
  const [loans, setLoans] = useState([]);
  const [showLoanDetailsDialog, setShowLoanDetailsDialog] = useState(false);
  const [selectedLoan, setSelectedLoan] = useState(null);
  const [loading, setLoading] = useState(true);

  const loanTypes = [
    { value: 'personal', label: 'Personal Loan', max_amount: 200000, interest_rate: 12 },
    { value: 'home', label: 'Home Loan', max_amount: 5000000, interest_rate: 8.5 },
    { value: 'vehicle', label: 'Vehicle Loan', max_amount: 1000000, interest_rate: 10 },
    { value: 'education', label: 'Education Loan', max_amount: 1500000, interest_rate: 9 },
    { value: 'emergency', label: 'Emergency Advance', max_amount: 50000, interest_rate: 6 },
    { value: 'festival', label: 'Festival Advance', max_amount: 25000, interest_rate: 0 }
  ];

  useEffect(() => {
    fetchEmployees();
    fetchLoans();
  }, []);

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

  const fetchLoans = async () => {
    try {
      const response = await axios.get(`${API}/loans`);
      // Filter only approved loans
      const approvedLoans = response.data.filter(loan => 
        loan.status === 'approved'
      );
      setLoans(approvedLoans);
    } catch (error) {
      console.error('Error fetching loans:', error);
      toast.error('Failed to load loans');
    }
  };

  // Helper function to get employee name
  const getEmployeeName = (employeeId) => {
    const employee = employees.find(emp => emp.employee_id === employeeId || emp.id === employeeId);
    return employee?.name || 'Unknown Employee';
  };

  const getLoanStats = () => {
    const totalLoans = loans.length;
    const activeLoans = loans.filter(l => l.status === 'approved').length;
    const pendingLoans = loans.filter(l => l.status === 'pending').length;
    const totalAmount = loans.filter(l => l.status === 'approved')
                           .reduce((sum, l) => sum + (l.amount || 0), 0);
    const totalOutstanding = loans.filter(l => l.status === 'approved')
                                 .reduce((sum, l) => sum + (l.outstanding_amount || l.amount || 0), 0);
    
    return { totalLoans, activeLoans, pendingLoans, totalAmount, totalOutstanding };
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'bg-emerald-100 text-emerald-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'approved': return 'bg-blue-100 text-blue-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      case 'completed': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const stats = getLoanStats();

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-10 bg-gray-200 rounded-lg w-64"></div>
        <div className="h-96 bg-gray-200 rounded-lg"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="loans-advances">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
          Loans & Advances
        </h1>
        <p className="text-gray-500 dark:text-gray-400">
          Manage employee loans, advances, and recovery tracking
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-5">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Users className="h-8 w-8 text-blue-600" />
              <div>
                <p className="text-2xl font-bold">{stats.totalLoans}</p>
                <p className="text-xs text-gray-500">Total Loans</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-8 w-8 text-emerald-600" />
              <div>
                <p className="text-2xl font-bold">{stats.activeLoans}</p>
                <p className="text-xs text-gray-500">Active Loans</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Clock className="h-8 w-8 text-yellow-600" />
              <div>
                <p className="text-2xl font-bold">{stats.pendingLoans}</p>
                <p className="text-xs text-gray-500">Pending</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-8 w-8 text-purple-600" />
              <div>
                <p className="text-2xl font-bold">{formatCurrency(stats.totalAmount)}</p>
                <p className="text-xs text-gray-500">Total Amount</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <IndianRupee className="h-8 w-8 text-red-600" />
              <div>
                <p className="text-2xl font-bold">{formatCurrency(stats.totalOutstanding)}</p>
                <p className="text-xs text-gray-500">Outstanding</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Loans Table */}
      <Card>
        <CardHeader>
          <CardTitle>Loan Applications</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="border border-gray-200 dark:border-gray-700 rounded-lg">
            <Table>
              <TableHeader>
                <TableRow className="border-b border-gray-200 dark:border-gray-700">
                  <TableHead className="text-gray-700 dark:text-gray-300">Employee</TableHead>
                  <TableHead className="text-gray-700 dark:text-gray-300">Loan Type</TableHead>
                  <TableHead className="text-gray-700 dark:text-gray-300">Amount</TableHead>
                  <TableHead className="text-gray-700 dark:text-gray-300">EMI</TableHead>
                  <TableHead className="text-gray-700 dark:text-gray-300">Outstanding</TableHead>
                  <TableHead className="text-gray-700 dark:text-gray-300">Progress</TableHead>
                  <TableHead className="text-gray-700 dark:text-gray-300">Status</TableHead>
                  <TableHead className="text-gray-700 dark:text-gray-300">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loans.map((loan) => {
                  const outstanding = loan.outstanding_amount || loan.amount;
                  const repaymentProgress = loan.amount > 0 ? ((loan.amount - outstanding) / loan.amount) * 100 : 0;
                  
                  return (
                    <TableRow key={loan.id} className="border-b border-gray-200 dark:border-gray-700">
                      <TableCell>
                        <div className="flex items-center space-x-3">
                          <Avatar>
                            <AvatarFallback className="bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400">
                              {getEmployeeName(loan.employee_id)?.split(' ').map(n => n[0]).join('') || 'NA'}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium text-gray-900 dark:text-gray-200">{getEmployeeName(loan.employee_id)}</div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">Applied: {formatDate(loan.applied_date)}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium text-gray-900 dark:text-gray-200">
                            {loanTypes.find(t => t.value === loan.loan_type)?.label || loan.loan_type}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {loan.interest_rate}% • {loan.tenure_months} months
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="font-medium text-gray-900 dark:text-gray-200">
                        {formatCurrency(loan.amount)}
                      </TableCell>
                      <TableCell className="text-gray-800 dark:text-gray-300">
                        {formatCurrency(loan.monthly_emi)}
                      </TableCell>
                      <TableCell className="text-red-600 dark:text-red-400">
                        {formatCurrency(loan.outstanding_amount || loan.amount)}
                      </TableCell>
                      <TableCell>
                        <div className="w-20">
                          <Progress value={repaymentProgress} className="h-2" />
                          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            {repaymentProgress.toFixed(0)}%
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(loan.status)}>
                          {loan.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-1">
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => {
                              setSelectedLoan(loan);
                              setShowLoanDetailsDialog(true);
                            }}
                          >
                            <Eye className="w-3 h-3" />
                          </Button>
                          {loan.status === 'pending' && (
                            <>
                              <Button 
                                size="sm"
                                onClick={() => handleLoanAction(loan.id, 'approved')}
                              >
                                <CheckCircle className="w-3 h-3" />
                              </Button>
                              <Button 
                                size="sm" 
                                variant="destructive"
                                onClick={() => handleLoanAction(loan.id, 'rejected')}
                              >
                                <XCircle className="w-3 h-3" />
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Loan Details Dialog */}
      <Dialog open={showLoanDetailsDialog} onOpenChange={setShowLoanDetailsDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Loan Details - {selectedLoan?.employee_name}</DialogTitle>
          </DialogHeader>
          {selectedLoan && (
            <div className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <h3 className="font-semibold mb-3">Loan Information</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Loan Type:</span>
                      <span>{loanTypes.find(t => t.value === selectedLoan.type)?.label}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Amount:</span>
                      <span>{formatCurrency(selectedLoan.amount)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Interest Rate:</span>
                      <span>{selectedLoan.interest_rate}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Tenure:</span>
                      <span>{selectedLoan.tenure_months} months</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Monthly EMI:</span>
                      <span className="font-semibold">{formatCurrency(selectedLoan.monthly_emi)}</span>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h3 className="font-semibold mb-3">Repayment Status</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Paid Amount:</span>
                      <span className="text-emerald-600">{formatCurrency(selectedLoan.paid_amount)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Outstanding:</span>
                      <span className="text-red-600">{formatCurrency(selectedLoan.outstanding_amount)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Next EMI Date:</span>
                      <span>{selectedLoan.next_emi_date ? formatDate(selectedLoan.next_emi_date) : 'Completed'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Progress:</span>
                      <span>{((selectedLoan.amount - selectedLoan.outstanding_amount) / selectedLoan.amount * 100).toFixed(1)}%</span>
                    </div>
                  </div>
                  
                  <div className="mt-4">
                    <Progress 
                      value={((selectedLoan.amount - selectedLoan.outstanding_amount) / selectedLoan.amount) * 100} 
                      className="h-3"
                    />
                  </div>
                </div>
              </div>
              
              <div>
                <h3 className="font-semibold mb-3">Additional Details</h3>
                <div className="grid gap-4 md:grid-cols-2 text-sm">
                  <div>
                    <span className="font-medium">Purpose:</span>
                    <p className="text-gray-600 mt-1">{selectedLoan.purpose}</p>
                  </div>
                  <div>
                    <span className="font-medium">Guarantor:</span>
                    <p className="text-gray-600 mt-1">{selectedLoan.guarantor_name || 'Not Required'}</p>
                  </div>
                  <div>
                    <span className="font-medium">Applied Date:</span>
                    <p className="text-gray-600 mt-1">{formatDate(selectedLoan.applied_date)}</p>
                  </div>
                  <div>
                    <span className="font-medium">Approved Date:</span>
                    <p className="text-gray-600 mt-1">{selectedLoan.approved_date ? formatDate(selectedLoan.approved_date) : 'Pending'}</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default LoansAdvances;