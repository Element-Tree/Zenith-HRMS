import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Calendar,
  Plus,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  TrendingDown,
  TrendingUp,
  Upload,
  FileText,
  X
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const EmployeeLeave = () => {
  const { user } = useAuth();
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [employeeData, setEmployeeData] = useState(null);
  const [leaveEntitlement, setLeaveEntitlement] = useState(null);
  const [isOnProbation, setIsOnProbation] = useState(false);
  const [leaveBalance, setLeaveBalance] = useState({
    annual: 15,
    sick: 10,
    casual: 8,
    used: {
      annual: 3,
      sick: 2,
      casual: 1
    }
  });
  const [showApplyDialog, setShowApplyDialog] = useState(false);
  const [applying, setApplying] = useState(false);
  const [formData, setFormData] = useState({
    leave_type: '',
    start_date: '',
    end_date: '',
    reason: '',
    half_day: false
  });
  const [medicalCertificate, setMedicalCertificate] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [workingDaysConfig, setWorkingDaysConfig] = useState(null);
  const [holidays, setHolidays] = useState([]);
  const [calculatedDays, setCalculatedDays] = useState(0);
  const [dateValidationError, setDateValidationError] = useState('');
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [cancellingLeave, setCancellingLeave] = useState(null);
  const [cancellationReason, setCancellationReason] = useState('');
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    fetchEmployeeData();
    fetchLeaveRequests();
    fetchWorkingDaysConfig();
    fetchHolidays();
  }, []);

  const fetchEmployeeData = async () => {
    try {
      const response = await axios.get(`${API}/employees/${user.employee_id}`);
      setEmployeeData(response.data);
      
      // Check probation status
      const isProbation = response.data.is_on_probation || 
        (response.data.probation_end_date && new Date(response.data.probation_end_date) > new Date());
      setIsOnProbation(isProbation);
      
      // Fetch leave entitlement
      const entitlementResponse = await axios.get(`${API}/leaves/entitlement/${user.employee_id}`);
      setLeaveEntitlement(entitlementResponse.data);
    } catch (error) {
      console.error('Error fetching employee data:', error);
    }
  };

  const fetchLeaveRequests = async () => {
    try {
      const response = await axios.get(`${API}/leaves`);
      setLeaveRequests(response.data);
    } catch (error) {
      console.error('Error fetching leave requests:', error);
      toast.error('Failed to load leave requests');
    }
  };

  const fetchWorkingDaysConfig = async () => {
    try {
      const response = await axios.get(`${API}/settings`);
      if (response.data.working_days_config) {
        setWorkingDaysConfig(response.data.working_days_config);
      }
    } catch (error) {
      console.error('Error fetching working days config:', error);
    }
  };

  const fetchHolidays = async () => {
    try {
      const response = await axios.get(`${API}/holidays`);
      setHolidays(response.data || []);
    } catch (error) {
      console.error('Error fetching holidays:', error);
    }
  };

  const isWorkingDay = (checkDate) => {
    if (!workingDaysConfig) return true; // Default to true if config not loaded
    
    const dateObj = new Date(checkDate);
    const dayOfWeek = dateObj.getDay(); // 0 = Sunday, 6 = Saturday
    const dateStr = format(dateObj, 'yyyy-MM-dd');
    
    // Check if it's a holiday
    const isHoliday = holidays.some(h => h.date === dateStr);
    if (isHoliday) {
      return false;
    }
    
    // Check Sunday
    if (dayOfWeek === 0) {
      if (workingDaysConfig.sunday_off !== false) {
        return false;
      }
    }
    
    // Check Saturday
    if (dayOfWeek === 6) {
      const saturdayPolicy = workingDaysConfig.saturday_policy || 'alternate';
      if (saturdayPolicy === 'all_off') {
        return false;
      } else if (saturdayPolicy === 'alternate' || saturdayPolicy === 'custom') {
        // Calculate which Saturday of the month
        const firstDay = new Date(dateObj.getFullYear(), dateObj.getMonth(), 1);
        let firstSaturday = new Date(firstDay);
        while (firstSaturday.getDay() !== 6) {
          firstSaturday.setDate(firstSaturday.getDate() + 1);
        }
        const saturdayNumber = Math.floor((dateObj.getDate() - firstSaturday.getDate()) / 7) + 1;
        const offSaturdays = workingDaysConfig.off_saturdays || [1, 3];
        if (offSaturdays.includes(saturdayNumber)) {
          return false;
        }
      }
    }
    
    return true;
  };

  const getHolidayName = (dateStr) => {
    const holiday = holidays.find(h => h.date === dateStr);
    return holiday ? holiday.name : '';
  };

  const calculateWorkingDays = (startDate, endDate) => {
    if (!startDate || !endDate) return 0;
    
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    if (start > end) return 0;
    
    let workingDaysCount = 0;
    let current = new Date(start);
    
    while (current <= end) {
      if (isWorkingDay(current)) {
        workingDaysCount++;
      }
      current.setDate(current.getDate() + 1);
    }
    
    return workingDaysCount;
  };

  const validateLeaveDates = (startDate, endDate) => {
    if (!startDate) return '';
    
    const start = new Date(startDate);
    const startDateStr = format(start, 'yyyy-MM-dd');
    
    // Check if start date is a non-working day
    if (!isWorkingDay(start)) {
      const holidayName = getHolidayName(startDateStr);
      if (holidayName) {
        return `Start date (${format(start, 'dd MMM yyyy')}) falls on a holiday: ${holidayName}. Please select a working day.`;
      }
      const dayOfWeek = start.getDay();
      if (dayOfWeek === 0) {
        return `Start date (${format(start, 'dd MMM yyyy')}) falls on a Sunday (non-working day). Please select a working day.`;
      }
      if (dayOfWeek === 6) {
        return `Start date (${format(start, 'dd MMM yyyy')}) falls on a non-working Saturday. Please select a working day.`;
      }
    }
    
    // End date can be a non-working day - the calculation will ignore it
    // No validation needed for end date being a non-working day
    
    return '';
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear medical certificate if leave type changes from sick leave
    if (field === 'leave_type' && value !== 'Sick Leave') {
      setMedicalCertificate(null);
    }
    
    // Auto-calculate days and validate when dates are selected
    if (field === 'start_date' || field === 'end_date') {
      const updatedData = { ...formData, [field]: value };
      
      // Validate dates
      const validationError = validateLeaveDates(
        field === 'start_date' ? value : formData.start_date,
        field === 'end_date' ? value : formData.end_date
      );
      setDateValidationError(validationError);
      
      // Calculate working days
      if (updatedData.start_date && updatedData.end_date) {
        if (updatedData.half_day) {
          setCalculatedDays(0.5);
        } else {
          const workingDays = calculateWorkingDays(updatedData.start_date, updatedData.end_date);
          setCalculatedDays(workingDays);
        }
      } else {
        setCalculatedDays(0);
      }
    }
    
    // Recalculate if half_day changes
    if (field === 'half_day') {
      if (value) {
        setCalculatedDays(0.5);
      } else if (formData.start_date && formData.end_date) {
        const workingDays = calculateWorkingDays(formData.start_date, formData.end_date);
        setCalculatedDays(workingDays);
      }
    }
  };

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Validate file type (PDF, JPG, PNG)
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Please upload only PDF, JPG, or PNG files');
      return;
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      toast.error('File size must be less than 5MB');
      return;
    }

    setMedicalCertificate(file);
    toast.success('Medical certificate uploaded successfully');
  };

  const removeMedicalCertificate = () => {
    setMedicalCertificate(null);
    // Clear the file input
    const fileInput = document.getElementById('medical-certificate');
    if (fileInput) fileInput.value = '';
  };

  const handleSubmitLeave = async () => {
    if (!formData.leave_type || !formData.start_date || !formData.end_date || !formData.reason.trim()) {
      toast.error('Please fill in all required fields');
      return;
    }

    // Check for date validation errors
    if (dateValidationError) {
      toast.error(dateValidationError);
      return;
    }

    // Check if calculated days is 0
    if (calculatedDays === 0 && !formData.half_day) {
      toast.error('The selected date range contains no working days. Please select dates that include at least one working day.');
      return;
    }

    // Validate medical certificate for sick leave
    if (formData.leave_type === 'Sick Leave' && !medicalCertificate) {
      toast.error('Medical certificate is mandatory for sick leave applications');
      return;
    }

    setApplying(true);
    try {
      let response;
      
      if (formData.leave_type === 'Sick Leave' && medicalCertificate) {
        // Create FormData for file upload
        const formDataWithFile = new FormData();
        formDataWithFile.append('leave_type', formData.leave_type);
        formDataWithFile.append('start_date', formData.start_date);
        formDataWithFile.append('end_date', formData.end_date);
        formDataWithFile.append('reason', formData.reason);
        formDataWithFile.append('half_day', formData.half_day);
        formDataWithFile.append('medical_certificate', medicalCertificate);
        
        response = await axios.post(`${API}/leaves/with-document`, formDataWithFile, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        });
      } else {
        // Regular leave application without file
        response = await axios.post(`${API}/leaves`, formData);
      }
      
      toast.success('Leave request submitted successfully');
      setShowApplyDialog(false);
      setFormData({
        leave_type: '',
        start_date: '',
        end_date: '',
        reason: '',
        half_day: false
      });
      setMedicalCertificate(null);
      
      // Refresh the leave requests list
      await fetchLeaveRequests();
    } catch (error) {
      console.error('Error submitting leave request:', error);
      toast.error(error.response?.data?.detail || 'Failed to submit leave request');
    } finally {
      setApplying(false);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'rejected':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'cancelled':
        return <XCircle className="h-4 w-4 text-gray-600" />;
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
      cancelled: 'outline',
      pending: 'secondary'
    };
    return <Badge variant={variants[status] || 'outline'}>{status}</Badge>;
  };

  const canCancelLeave = (request) => {
    // Can cancel if status is pending or approved
    if (request.status !== 'pending' && request.status !== 'approved') {
      return false;
    }
    
    // Cannot cancel if leave has already started or is in the past
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const startDate = new Date(request.start_date);
    startDate.setHours(0, 0, 0, 0);
    
    return startDate >= today;
  };

  const openCancelDialog = (request) => {
    setCancellingLeave(request);
    setCancellationReason('');
    setShowCancelDialog(true);
  };

  const handleCancelLeave = async () => {
    if (!cancellationReason.trim()) {
      toast.error('Please provide a reason for cancellation');
      return;
    }

    setCancelling(true);
    try {
      await axios.put(`${API}/leaves/${cancellingLeave.id}/cancel`, {
        cancellation_reason: cancellationReason
      });

      toast.success('Leave request cancelled successfully');
      setShowCancelDialog(false);
      setCancellingLeave(null);
      setCancellationReason('');
      fetchLeaveRequests(); // Refresh the list
    } catch (error) {
      console.error('Error cancelling leave:', error);
      toast.error(error.response?.data?.detail || 'Failed to cancel leave request');
    } finally {
      setCancelling(false);
    }
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
      
      // Open in new tab for viewing
      window.open(blobUrl, '_blank');
      
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Leave Management</h1>
          <p className="text-gray-500">Apply for leave and track your requests</p>
        </div>
        <Dialog open={showApplyDialog} onOpenChange={(open) => {
          setShowApplyDialog(open);
          if (!open) {
            // Reset validation states when dialog closes
            setDateValidationError('');
            setCalculatedDays(0);
          }
        }}>
          <DialogTrigger asChild>
            <Button className="flex items-center space-x-2">
              <Plus className="h-4 w-4" />
              <span>Apply Leave</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Apply for Leave</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              {isOnProbation && (
                <div className="bg-orange-100 dark:bg-orange-900/20 border border-orange-300 dark:border-orange-700 rounded-lg p-4">
                  <div className="flex items-start space-x-2">
                    <AlertCircle className="h-5 w-5 text-orange-600 dark:text-orange-400 mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold text-orange-900 dark:text-orange-300">Probation Period Notice</p>
                      <p className="text-xs text-orange-700 dark:text-orange-400 mt-1">
                        This will be <strong>unpaid leave</strong>, subject to approval and will be deducted from your salary.
                      </p>
                    </div>
                  </div>
                </div>
              )}
              <div>
                <Label htmlFor="leave_type" className="text-gray-900 dark:text-gray-300">Leave Type</Label>
                <Select value={formData.leave_type} onValueChange={(value) => handleInputChange('leave_type', value)}>
                  <SelectTrigger className="text-gray-900 dark:text-gray-200">
                    <SelectValue placeholder="Select leave type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Annual Leave">Annual Leave</SelectItem>
                    <SelectItem value="Sick Leave">Sick Leave</SelectItem>
                    <SelectItem value="Casual Leave">Casual Leave</SelectItem>
                    <SelectItem value="Maternity Leave">Maternity Leave</SelectItem>
                    <SelectItem value="Paternity Leave">Paternity Leave</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="start_date" className="text-gray-900 dark:text-gray-300">Start Date</Label>
                  <Input
                    id="start_date"
                    type="date"
                    value={formData.start_date}
                    onChange={(e) => handleInputChange('start_date', e.target.value)}
                    className="text-gray-900 dark:text-gray-200"
                  />
                </div>
                <div>
                  <Label htmlFor="end_date" className="text-gray-900 dark:text-gray-300">End Date</Label>
                  <Input
                    id="end_date"
                    type="date"
                    value={formData.end_date}
                    onChange={(e) => handleInputChange('end_date', e.target.value)}
                    className="text-gray-900 dark:text-gray-200"
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="half_day"
                  checked={formData.half_day}
                  onChange={(e) => handleInputChange('half_day', e.target.checked)}
                  className="rounded border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:checked:bg-blue-600"
                />
                <Label htmlFor="half_day" className="text-gray-900 dark:text-gray-300 cursor-pointer">Half Day</Label>
              </div>

              {/* Validation Error Message */}
              {dateValidationError && (
                <div className="bg-red-100 dark:bg-red-900/20 border border-red-300 dark:border-red-700 rounded-lg p-3">
                  <div className="flex items-start space-x-2">
                    <XCircle className="h-5 w-5 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-red-700 dark:text-red-300">{dateValidationError}</p>
                  </div>
                </div>
              )}

              {/* Working Days Calculation Display */}
              {formData.start_date && formData.end_date && !dateValidationError && (
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-blue-900 dark:text-blue-300">
                      Working Days:
                    </span>
                    <span className="text-lg font-bold text-blue-600 dark:text-blue-400">
                      {calculatedDays} {calculatedDays === 1 ? 'day' : 'days'}
                    </span>
                  </div>
                  <p className="text-xs text-blue-700 dark:text-blue-400 mt-1">
                    (Weekends and holidays excluded)
                  </p>
                </div>
              )}

              <div>
                <Label htmlFor="reason" className="text-gray-900 dark:text-gray-300">Reason</Label>
                <Textarea
                  id="reason"
                  value={formData.reason}
                  onChange={(e) => handleInputChange('reason', e.target.value)}
                  placeholder="Please provide a reason for leave"
                  rows={3}
                  className="text-gray-900 dark:text-gray-200 placeholder:text-gray-500 dark:placeholder:text-gray-500"
                />
              </div>

              {/* Medical Certificate Upload for Sick Leave */}
              {formData.leave_type === 'Sick Leave' && (
                <div className="space-y-4">
                  <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-500/30 rounded-lg p-4">
                    <div className="flex items-start space-x-2">
                      <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 mt-0.5" />
                      <div>
                        <p className="text-sm font-semibold text-red-900 dark:text-red-300">Medical Certificate Required</p>
                        <p className="text-xs text-red-700 dark:text-red-400 mt-1">
                          You must upload a valid medical certificate from a doctor to apply for sick leave.
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="medical-certificate" className="text-gray-900 dark:text-gray-300">Medical Certificate *</Label>
                    <div className="mt-2">
                      {!medicalCertificate ? (
                        <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center hover:border-gray-400 dark:hover:border-gray-500 transition-colors bg-gray-50 dark:bg-gray-800/50">
                          <input
                            id="medical-certificate"
                            type="file"
                            accept=".pdf,.jpg,.jpeg,.png"
                            onChange={handleFileUpload}
                            className="hidden"
                          />
                          <label htmlFor="medical-certificate" className="cursor-pointer">
                            <Upload className="h-8 w-8 text-gray-400 dark:text-gray-500 mx-auto mb-2" />
                            <p className="text-sm text-gray-600 dark:text-gray-300">
                              Click to upload medical certificate
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                              PDF, JPG, PNG (max 5MB)
                            </p>
                          </label>
                        </div>
                      ) : (
                        <div className="border border-green-300 dark:border-green-500/30 rounded-lg p-4 bg-green-50 dark:bg-green-900/20">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <FileText className="h-6 w-6 text-green-600 dark:text-green-400" />
                              <div>
                                <p className="text-sm font-medium text-green-900 dark:text-green-300">
                                  {medicalCertificate.name}
                                </p>
                                <p className="text-xs text-green-700 dark:text-green-400">
                                  {(medicalCertificate.size / 1024 / 1024).toFixed(2)} MB
                                </p>
                              </div>
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={removeMedicalCertificate}
                              className="text-red-600 hover:text-red-700"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              <div className="flex space-x-2 pt-4">
                <Button variant="outline" onClick={() => {
                  setShowApplyDialog(false);
                  setMedicalCertificate(null);
                  setFormData({
                    leave_type: '',
                    start_date: '',
                    end_date: '',
                    reason: '',
                    half_day: false
                  });
                }} className="flex-1">
                  Cancel
                </Button>
                <Button 
                  onClick={handleSubmitLeave} 
                  disabled={applying || (formData.leave_type === 'Sick Leave' && !medicalCertificate)} 
                  className="flex-1"
                >
                  {applying ? 'Submitting...' : 
                   (formData.leave_type === 'Sick Leave' && !medicalCertificate) ? 'Upload Medical Certificate Required' : 
                   'Submit'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Probation Warning */}
      {isOnProbation && (
        <Card className="border-orange-300 bg-orange-50">
          <CardContent className="p-6">
            <div className="flex items-start space-x-3">
              <AlertCircle className="h-6 w-6 text-orange-600 mt-1" />
              <div>
                <h3 className="font-semibold text-orange-900">You are currently on Probation</h3>
                <p className="text-sm text-orange-700 mt-1">
                  You have <strong>no paid leave entitlements</strong> during probation period.
                </p>
                <p className="text-sm text-orange-600 mt-2">
                  ⚠️ Any leave you apply for will be <strong>unpaid leave</strong>, subject to approval, and will be deducted from your salary.
                </p>
                {employeeData?.probation_end_date && (
                  <p className="text-xs text-orange-600 mt-2">
                    Probation ends on: <strong>{new Date(employeeData.probation_end_date).toLocaleDateString()}</strong>
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Leave Balance Cards */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className={isOnProbation ? 'opacity-50' : ''}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Casual Leave</p>
                <div className="flex items-center space-x-2">
                  <p className="text-2xl font-bold text-blue-600">
                    {isOnProbation ? 0 : leaveEntitlement?.casual_leave_balance.toFixed(1) || 0}
                  </p>
                  <span className="text-sm text-gray-500">
                    / {isOnProbation ? 0 : leaveEntitlement?.casual_leave_accrued.toFixed(1) || 0}
                  </span>
                </div>
                <p className="text-xs text-gray-400">
                  {isOnProbation ? 'Not available (Probation)' : 'Available'}
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-500/20 rounded-lg flex items-center justify-center">
                <Calendar className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
            <div className="mt-4 bg-blue-50 dark:bg-blue-900/30 rounded-full h-2">
              <div 
                className="bg-blue-600 dark:bg-blue-500 h-2 rounded-full" 
                style={{ 
                  width: isOnProbation ? '0%' : 
                    `${leaveEntitlement ? (leaveEntitlement.casual_leave_balance / leaveEntitlement.casual_leave_accrued) * 100 : 0}%` 
                }}
              ></div>
            </div>
          </CardContent>
        </Card>

        <Card className={isOnProbation ? 'opacity-50' : ''}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Sick Leave</p>
                <div className="flex items-center space-x-2">
                  <p className="text-2xl font-bold text-green-600">
                    {isOnProbation ? 0 : leaveEntitlement?.sick_leave_balance.toFixed(1) || 0}
                  </p>
                  <span className="text-sm text-gray-500">
                    / {isOnProbation ? 0 : leaveEntitlement?.sick_leave_total || 0}
                  </span>
                </div>
                <p className="text-xs text-gray-400">
                  {isOnProbation ? 'Not available (Probation)' : 'Available'}
                </p>
              </div>
              <div className="w-12 h-12 bg-green-100 dark:bg-green-500/20 rounded-lg flex items-center justify-center">
                <TrendingDown className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
            <div className="mt-4 bg-green-50 dark:bg-green-900/30 rounded-full h-2">
              <div 
                className="bg-green-600 dark:bg-green-500 h-2 rounded-full" 
                style={{ 
                  width: isOnProbation ? '0%' : 
                    `${leaveEntitlement ? (leaveEntitlement.sick_leave_balance / leaveEntitlement.sick_leave_total) * 100 : 0}%` 
                }}
              ></div>
            </div>
          </CardContent>
        </Card>

        <Card className={isOnProbation ? 'opacity-50' : ''}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Annual Leave</p>
                <div className="flex items-center space-x-2">
                  <p className="text-2xl font-bold text-orange-600">
                    {isOnProbation ? 0 : leaveEntitlement?.annual_leave_balance.toFixed(1) || 0}
                  </p>
                  <span className="text-sm text-gray-500">
                    / {isOnProbation ? 0 : ((leaveEntitlement?.annual_leave_total || 0) + (leaveEntitlement?.carried_forward_leaves || 0)).toFixed(1)}
                  </span>
                </div>
                <p className="text-xs text-gray-400">
                  {isOnProbation ? 'Not available (Probation)' : leaveEntitlement?.carried_forward_leaves > 0 ? `Incl. ${leaveEntitlement.carried_forward_leaves.toFixed(1)} CF` : 'Available'}
                </p>
              </div>
              <div className="w-12 h-12 bg-orange-100 dark:bg-orange-500/20 rounded-lg flex items-center justify-center">
                <TrendingDown className="h-6 w-6 text-orange-600 dark:text-orange-400" />
              </div>
            </div>
            <div className="mt-4 bg-orange-50 dark:bg-orange-900/30 rounded-full h-2">
              <div 
                className="bg-orange-600 dark:bg-orange-500 h-2 rounded-full" 
                style={{ 
                  width: isOnProbation ? '0%' : 
                    `${leaveEntitlement ? (leaveEntitlement.annual_leave_balance / ((leaveEntitlement.annual_leave_total || 0) + (leaveEntitlement.carried_forward_leaves || 0))) * 100 : 0}%` 
                }}
              ></div>
            </div>
          </CardContent>
        </Card>

        <Card className={isOnProbation ? 'opacity-50' : ''}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Total Available</p>
                <div className="flex items-center space-x-2">
                  <p className="text-2xl font-bold text-purple-600">
                    {isOnProbation ? 0 : leaveEntitlement?.total_available_leaves.toFixed(1) || 0}
                  </p>
                  <span className="text-sm text-gray-500">days</span>
                </div>
                <p className="text-xs text-gray-400">
                  {isOnProbation ? 'Not available (Probation)' : 'All leave types'}
                </p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-purple-600" />
              </div>
            </div>
            <div className="mt-4 bg-purple-50 rounded-full h-2">
              <div 
                className="bg-purple-600 h-2 rounded-full" 
                style={{ width: isOnProbation ? '0%' : '100%' }}
              ></div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Leave Requests History */}
      <Card>
        <CardHeader>
          <CardTitle>Leave History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto border border-gray-200 dark:border-gray-700 rounded-lg">
            <Table>
              <TableHeader>
                <TableRow className="border-b border-gray-200 dark:border-gray-700">
                  <TableHead className="text-gray-700 dark:text-gray-300">Type</TableHead>
                  <TableHead className="text-gray-700 dark:text-gray-300">Date Range</TableHead>
                  <TableHead className="text-gray-700 dark:text-gray-300">Days</TableHead>
                  <TableHead className="text-gray-700 dark:text-gray-300">Reason</TableHead>
                  <TableHead className="text-gray-700 dark:text-gray-300">Attachments</TableHead>
                  <TableHead className="text-gray-700 dark:text-gray-300">Status</TableHead>
                  <TableHead className="text-gray-700 dark:text-gray-300">Admin Comments</TableHead>
                  <TableHead className="text-gray-700 dark:text-gray-300">Applied On</TableHead>
                  <TableHead className="text-gray-700 dark:text-gray-300">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {leaveRequests.map((request) => (
                  <TableRow key={request.id} className="border-b border-gray-200 dark:border-gray-700">
                    <TableCell className="font-medium text-gray-900 dark:text-gray-200">{request.leave_type}</TableCell>
                    <TableCell className="text-gray-800 dark:text-gray-300">
                      {format(new Date(request.start_date), 'dd MMM yyyy')}
                      {request.start_date !== request.end_date && 
                        ` - ${format(new Date(request.end_date), 'dd MMM yyyy')}`
                      }
                    </TableCell>
                    <TableCell className="text-gray-800 dark:text-gray-300">{request.days}</TableCell>
                    <TableCell className="max-w-xs truncate text-gray-800 dark:text-gray-300">{request.reason}</TableCell>
                    <TableCell>
                      {request.medical_certificate ? (
                        <button
                          onClick={() => viewMedicalCertificate(request.id)}
                          className="flex items-center space-x-1 hover:bg-green-50 dark:hover:bg-green-900/20 px-2 py-1 rounded cursor-pointer"
                        >
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          <span className="text-xs text-green-600 dark:text-green-400 underline">View Cert</span>
                        </button>
                      ) : (
                        <span className="text-xs text-gray-400 dark:text-gray-500">None</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        {getStatusIcon(request.status)}
                        {getStatusBadge(request.status)}
                      </div>
                    </TableCell>
                    <TableCell>
                      {request.admin_comment ? (
                        <div className="text-sm text-gray-700 dark:text-gray-300 max-w-xs">
                          <p className="truncate" title={request.admin_comment}>
                            {request.admin_comment}
                          </p>
                        </div>
                      ) : (
                        <span className="text-xs text-gray-400 dark:text-gray-500">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-gray-800 dark:text-gray-300">{format(new Date(request.applied_date), 'dd MMM yyyy')}</TableCell>
                    <TableCell>
                      {canCancelLeave(request) && (
                        <Button
                          onClick={() => openCancelDialog(request)}
                          variant="outline"
                          size="sm"
                          className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                        >
                          Cancel
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {leaveRequests.length === 0 && (
            <div className="text-center py-8">
              <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No leave requests</h3>
              <p className="text-gray-500">Your leave applications will appear here</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Cancel Leave Dialog */}
      <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Cancel Leave Request</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {cancellingLeave && (
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-3">
                <p className="text-sm text-blue-900 dark:text-blue-300">
                  <strong>{cancellingLeave.leave_type}</strong>
                  <br />
                  {format(new Date(cancellingLeave.start_date), 'dd MMM yyyy')}
                  {cancellingLeave.start_date !== cancellingLeave.end_date && 
                    ` - ${format(new Date(cancellingLeave.end_date), 'dd MMM yyyy')}`
                  }
                  <br />
                  <span className="text-xs">Status: {cancellingLeave.status}</span>
                </p>
              </div>
            )}
            
            {cancellingLeave?.status === 'approved' && (
              <div className="bg-orange-100 dark:bg-orange-900/20 border border-orange-300 dark:border-orange-700 rounded-lg p-3">
                <div className="flex items-start space-x-2">
                  <AlertCircle className="h-5 w-5 text-orange-600 dark:text-orange-400 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-orange-700 dark:text-orange-300">
                    This is an <strong>approved leave</strong>. Cancelling will notify the admin.
                  </p>
                </div>
              </div>
            )}

            <div>
              <Label htmlFor="cancellation_reason" className="text-gray-700 dark:text-gray-300">
                Cancellation Reason *
              </Label>
              <Textarea
                id="cancellation_reason"
                value={cancellationReason}
                onChange={(e) => setCancellationReason(e.target.value)}
                placeholder="Please provide a reason for cancelling this leave request"
                rows={4}
                className="dark:text-gray-200 dark:placeholder:text-gray-500"
              />
            </div>

            <div className="flex space-x-2">
              <Button
                onClick={handleCancelLeave}
                disabled={cancelling || !cancellationReason.trim()}
                className="flex-1 bg-red-600 hover:bg-red-700"
              >
                {cancelling ? 'Cancelling...' : 'Cancel Leave'}
              </Button>
              <Button
                onClick={() => setShowCancelDialog(false)}
                variant="outline"
                disabled={cancelling}
                className="flex-1"
              >
                Go Back
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default EmployeeLeave;