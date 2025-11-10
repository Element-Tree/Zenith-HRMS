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
  Calendar,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  Filter,
  Search,
  Users
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const LeaveManagement = () => {
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [filteredRequests, setFilteredRequests] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [leaveStats, setLeaveStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [approvalComment, setApprovalComment] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [showApprovalDialog, setShowApprovalDialog] = useState(false);
  const [showRejectionDialog, setShowRejectionDialog] = useState(false);

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    filterRequests();
  }, [leaveRequests, searchTerm, statusFilter]);

  const fetchInitialData = async () => {
    try {
      // Fetch leave requests and employees in parallel
      const [leavesResponse, employeesResponse] = await Promise.all([
        axios.get(`${API}/leaves`),
        axios.get(`${API}/employees`)
      ]);
      
      setLeaveRequests(leavesResponse.data);
      setEmployees(employeesResponse.data);
      
      // Fetch leave statistics for each employee with leave requests
      const uniqueEmployeeIds = [...new Set(leavesResponse.data.map(req => req.employee_id))];
      const statsPromises = uniqueEmployeeIds.map(async (empId) => {
        try {
          const statsResponse = await axios.get(`${API}/leaves/entitlement/${empId}`);
          return { [empId]: statsResponse.data };
        } catch (error) {
          console.error(`Error fetching stats for ${empId}:`, error);
          return { [empId]: null };
        }
      });
      
      const statsResults = await Promise.all(statsPromises);
      const combinedStats = statsResults.reduce((acc, curr) => ({ ...acc, ...curr }), {});
      setLeaveStats(combinedStats);
      
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load leave management data');
    } finally {
      setLoading(false);
    }
  };

  const fetchLeaveRequests = async () => {
    try {
      const response = await axios.get(`${API}/leaves`);
      // Sort by created_at descending (newest first)
      const sortedLeaves = response.data.sort((a, b) => {
        const dateA = new Date(a.created_at || a.applied_date || 0);
        const dateB = new Date(b.created_at || b.applied_date || 0);
        return dateB - dateA; // Newest first
      });
      setLeaveRequests(sortedLeaves);
    } catch (error) {
      console.error('Error fetching leave requests:', error);
      toast.error('Failed to load leave requests');
    }
  };

  const getEmployeeName = (employeeId) => {
    const employee = employees.find(emp => emp.employee_id === employeeId);
    return employee ? employee.name : employeeId;
  };

  const getEmployeeLeaveStats = (employeeId) => {
    return leaveStats[employeeId] || null;
  };

  const filterRequests = () => {
    let filtered = leaveRequests;

    if (searchTerm) {
      filtered = filtered.filter(request => {
        const employeeName = getEmployeeName(request.employee_id);
        return (
          request.employee_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
          employeeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          request.reason.toLowerCase().includes(searchTerm.toLowerCase()) ||
          request.leave_type.toLowerCase().includes(searchTerm.toLowerCase())
        );
      });
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(request => request.status === statusFilter);
    }

    // Sort by applied_date descending (newest first)
    filtered = filtered.sort((a, b) => {
      const dateA = new Date(a.applied_date || a.created_at || 0);
      const dateB = new Date(b.applied_date || b.created_at || 0);
      return dateB - dateA; // Newest first
    });

    setFilteredRequests(filtered);
  };

  const handleApproveReject = async (leaveId, status, comment = '') => {
    setActionLoading(true);
    try {
      const data = { 
        status,
        admin_comment: comment
      };
      
      const response = await axios.put(`${API}/leaves/${leaveId}/approve`, data);
      
      toast.success(`Leave request ${status} successfully`);
      
      // Refresh leave requests
      fetchInitialData();
      
      // Refresh sidebar notification badges
      if (window.refreshSidebarNotifications) {
        window.refreshSidebarNotifications();
      }
      
      // Reset forms and close dialogs
      setApprovalComment('');
      setRejectionReason('');
      setShowApprovalDialog(false);
      setShowRejectionDialog(false);
      setSelectedRequest(null);
    } catch (error) {
      console.error(`Error ${status} leave:`, error);
      toast.error(`Failed to ${status} leave request`);
    } finally {
      setActionLoading(false);
    }
  };

  const openApprovalDialog = (request) => {
    setSelectedRequest(request);
    setShowApprovalDialog(true);
  };

  const openRejectionDialog = (request) => {
    setSelectedRequest(request);
    setShowRejectionDialog(true);
  };

  const viewMedicalCertificate = async (leaveId) => {
    try {
      const response = await axios.get(`${API}/leaves/${leaveId}/medical-certificate`);
      const { filename, content_type, file_data } = response.data;
      
      // Create a blob from the base64 data
      const byteCharacters = atob(file_data.split(',')[1]); // Remove data:mime;base64, prefix
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: content_type });
      
      // Create a URL for the blob and open it in a new tab
      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.target = '_blank';
      link.download = filename;
      
      // For PDFs, open in new tab; for images, also open in new tab
      if (content_type === 'application/pdf') {
        window.open(blobUrl, '_blank');
      } else {
        // For images, open in new tab
        window.open(blobUrl, '_blank');
      }
      
      // Clean up the blob URL after a delay
      setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
      
    } catch (error) {
      console.error('Error viewing medical certificate:', error);
      if (error.response?.status === 404) {
        toast.error('Medical certificate not found');
      } else if (error.response?.status === 403) {
        toast.error('You do not have permission to view this medical certificate');
      } else {
        toast.error('Failed to load medical certificate');
      }
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
    const total = leaveRequests.length;
    const pending = leaveRequests.filter(r => r.status === 'pending').length;
    const approved = leaveRequests.filter(r => r.status === 'approved').length;
    const rejected = leaveRequests.filter(r => r.status === 'rejected').length;
    
    return { total, pending, approved, rejected };
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
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Leave Management</h1>
        <p className="text-gray-500">Review and approve employee leave requests</p>
      </div>

      {/* Stats Cards */}
      <div className="grid md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Total Requests</p>
                <p className="text-2xl font-bold text-blue-600">{stats.total}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Calendar className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Pending</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
              </div>
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                <Clock className="h-6 w-6 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Approved</p>
                <p className="text-2xl font-bold text-green-600">{stats.approved}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Rejected</p>
                <p className="text-2xl font-bold text-red-600">{stats.rejected}</p>
              </div>
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                <XCircle className="h-6 w-6 text-red-600" />
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
                placeholder="Search by employee name, ID, reason, or leave type..."
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

      {/* Leave Requests Table */}
      <Card>
        <CardHeader>
          <CardTitle>Leave Requests</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto border border-gray-200 dark:border-gray-700 rounded-lg">
            <Table>
              <TableHeader>
                <TableRow className="border-b border-gray-200 dark:border-gray-700">
                  <TableHead className="text-gray-700 dark:text-gray-300">Employee</TableHead>
                  <TableHead className="min-w-48 text-gray-700 dark:text-gray-300">Leave Balance (YTD)</TableHead>
                  <TableHead className="text-gray-700 dark:text-gray-300">Leave Type</TableHead>
                  <TableHead className="text-gray-700 dark:text-gray-300">Date Range</TableHead>
                  <TableHead className="text-gray-700 dark:text-gray-300">Days</TableHead>
                  <TableHead className="text-gray-700 dark:text-gray-300">Reason</TableHead>
                  <TableHead className="text-gray-700 dark:text-gray-300">Attachments</TableHead>
                  <TableHead className="text-gray-700 dark:text-gray-300">Applied On</TableHead>
                  <TableHead className="text-gray-700 dark:text-gray-300">Status</TableHead>
                  <TableHead className="text-gray-700 dark:text-gray-300">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRequests.map((request) => {
                  const employeeName = getEmployeeName(request.employee_id);
                  const leaveStatsData = getEmployeeLeaveStats(request.employee_id);
                  
                  return (
                    <TableRow key={request.id} className="border-b border-gray-200 dark:border-gray-700">
                      <TableCell className="font-medium">
                        <div>
                          <div className="font-semibold text-gray-900 dark:text-gray-200">{employeeName}</div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">{request.employee_id}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {leaveStatsData ? (
                          <div className="text-xs space-y-1">
                            <div className="bg-green-50 p-2 rounded border">
                              <div className="font-medium text-green-800">Casual Leave</div>
                              <div className="text-green-600">
                                <span className="font-semibold">{Math.round((leaveStatsData.casual_leave_balance || 0) * 10) / 10}</span> remaining
                              </div>
                              <div className="text-gray-500">
                                ({Math.round((leaveStatsData.casual_leave_used || 0) * 10) / 10} used this year)
                              </div>
                            </div>
                            <div className="bg-blue-50 p-2 rounded border">
                              <div className="font-medium text-blue-800">Sick Leave</div>
                              <div className="text-blue-600">
                                <span className="font-semibold">{Math.round((leaveStatsData.sick_leave_balance || 0) * 10) / 10}</span> remaining
                              </div>
                              <div className="text-gray-500">
                                ({Math.round((leaveStatsData.sick_leave_used || 0) * 10) / 10} used this year)
                              </div>
                            </div>
                            {leaveStatsData.annual_leave_balance > 0 && (
                              <div className="bg-purple-50 p-2 rounded border">
                                <div className="font-medium text-purple-800">Annual Leave</div>
                                <div className="text-purple-600">
                                  <span className="font-semibold">{Math.round((leaveStatsData.annual_leave_balance || 0) * 10) / 10}</span> available
                                </div>
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="text-xs text-gray-400 p-2 border rounded">
                            <div>Leave stats</div>
                            <div>Loading...</div>
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="text-gray-800 dark:text-gray-300">{request.leave_type}</TableCell>
                    <TableCell className="text-gray-800 dark:text-gray-300">
                      {format(new Date(request.start_date), 'dd MMM')}
                      {request.start_date !== request.end_date && 
                        ` - ${format(new Date(request.end_date), 'dd MMM yyyy')}`
                      }
                    </TableCell>
                    <TableCell className="text-gray-800 dark:text-gray-300">{request.days}</TableCell>
                    <TableCell className="max-w-xs text-gray-800 dark:text-gray-300">
                      <div className="truncate" title={request.reason}>
                        {request.reason}
                      </div>
                    </TableCell>
                    <TableCell>
                      {request.medical_certificate ? (
                        <button
                          onClick={() => viewMedicalCertificate(request.id)}
                          className="flex items-center space-x-1 hover:bg-green-50 dark:hover:bg-green-900/20 px-2 py-1 rounded cursor-pointer"
                        >
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          <span className="text-xs text-green-600 dark:text-green-400 underline">View Medical Cert</span>
                        </button>
                      ) : (
                        <span className="text-xs text-gray-400 dark:text-gray-500">None</span>
                      )}
                    </TableCell>
                    <TableCell className="text-gray-800 dark:text-gray-300">{format(new Date(request.applied_date), 'dd MMM yyyy')}</TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        {getStatusIcon(request.status)}
                        {getStatusBadge(request.status)}
                      </div>
                    </TableCell>
                    <TableCell>
                      {request.status === 'pending' ? (
                        <div className="flex space-x-2">
                          <Button
                            size="sm"
                            onClick={() => openApprovalDialog(request)}
                            disabled={actionLoading}
                          >
                            Approve
                          </Button>
                          <Button 
                            size="sm" 
                            variant="destructive"
                            onClick={() => openRejectionDialog(request)}
                            disabled={actionLoading}
                          >
                            Reject
                          </Button>
                        </div>
                      ) : (
                        <div className="flex items-center space-x-2">
                          {getStatusIcon(request.status)}
                          {getStatusBadge(request.status)}
                          {request.admin_comment && (
                            <div className="text-xs text-gray-600 ml-2">
                              <span className="font-medium">Admin:</span> {request.admin_comment}
                            </div>
                          )}
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          {filteredRequests.length === 0 && (
            <div className="text-center py-8">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No leave requests found</h3>
              <p className="text-gray-500">
                {searchTerm || statusFilter !== 'all'
                  ? 'Try adjusting your search or filter criteria'
                  : 'Leave requests from employees will appear here'}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Approval Dialog */}
      <Dialog open={showApprovalDialog} onOpenChange={setShowApprovalDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Approve Leave Request</DialogTitle>
          </DialogHeader>
          {selectedRequest && (
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">
                  Employee: <strong className="text-gray-900 dark:text-gray-100">{getEmployeeName(selectedRequest.employee_id)}</strong> ({selectedRequest.employee_id})
                </p>
                <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">
                  Leave: <strong className="text-gray-900 dark:text-gray-100">{selectedRequest.leave_type}</strong> ({selectedRequest.days} days)
                </p>
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  Reason: <strong className="text-gray-900 dark:text-gray-100">{selectedRequest.reason}</strong>
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-900 dark:text-gray-100">Approval Comment (Optional)</label>
                <Textarea
                  value={approvalComment}
                  onChange={(e) => setApprovalComment(e.target.value)}
                  placeholder="Add any comments for the approval"
                  rows={3}
                  className="dark:bg-gray-800 dark:text-gray-100 dark:border-gray-700"
                />
              </div>
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowApprovalDialog(false);
                    setSelectedRequest(null);
                    setApprovalComment('');
                  }}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => handleApproveReject(selectedRequest.id, 'approved', approvalComment)}
                  disabled={actionLoading}
                  className="flex-1"
                >
                  Approve Leave
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Rejection Dialog */}
      <Dialog open={showRejectionDialog} onOpenChange={setShowRejectionDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Leave Request</DialogTitle>
          </DialogHeader>
          {selectedRequest && (
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">
                  Employee: <strong className="text-gray-900 dark:text-gray-100">{getEmployeeName(selectedRequest.employee_id)}</strong> ({selectedRequest.employee_id})
                </p>
                <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">
                  Leave: <strong className="text-gray-900 dark:text-gray-100">{selectedRequest.leave_type}</strong> ({selectedRequest.days} days)
                </p>
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  Reason: <strong className="text-gray-900 dark:text-gray-100">{selectedRequest.reason}</strong>
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-900 dark:text-gray-100">Rejection Reason *</label>
                <Textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="Please provide a reason for rejection"
                  rows={3}
                  className="dark:bg-gray-800 dark:text-gray-100 dark:border-gray-700"
                />
              </div>
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowRejectionDialog(false);
                    setSelectedRequest(null);
                    setRejectionReason('');
                  }}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => handleApproveReject(selectedRequest.id, 'rejected', rejectionReason)}
                  disabled={actionLoading || !rejectionReason.trim()}
                  className="flex-1"
                >
                  Reject Leave
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default LeaveManagement;