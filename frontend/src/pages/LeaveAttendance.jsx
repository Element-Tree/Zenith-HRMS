import React, { useState, useEffect, useMemo } from "react";
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
import { Calendar } from "@/components/ui/calendar";
import { Textarea } from "@/components/ui/textarea";
import {
  Calendar as CalendarIcon,
  Users,
  Clock,
  CheckCircle,
  XCircle,
  Plus,
  Filter,
  Download,
  UserCheck,
  UserX,
  AlertCircle,
  Eye
} from "lucide-react";
import { formatDate } from "@/lib/utils";
import { toast } from "sonner";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const LeaveAttendance = () => {
  const [employees, setEmployees] = useState([]);
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [otLogs, setOTLogs] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [activeTab, setActiveTab] = useState('leave'); // 'leave' or 'ot'
  // Leave dialog removed - Leave application only available in Employee Portal
  const [showMarkAttendanceDialog, setShowMarkAttendanceDialog] = useState(false);
  const [showLateArrivalDialog, setShowLateArrivalDialog] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [loading, setLoading] = useState(true);
  const [lateArrivalForm, setLateArrivalForm] = useState({
    employee_id: '',
    date: new Date().toISOString().split('T')[0],
    actual_check_in: '',
    reason: ''
  });
  const [markAttendanceForm, setMarkAttendanceForm] = useState({
    employee_id: '',
    date: new Date().toISOString().split('T')[0],
    status: 'present',
    working_hours: 8
  });
  // OT Filters
  const [showOTFilters, setShowOTFilters] = useState(false);
  const [otFilters, setOTFilters] = useState({
    status: 'all',
    employee: 'all',
    project: 'all',
    sortBy: 'logged_at',
    sortOrder: 'desc'
  });
  
  const [workingDaysConfig, setWorkingDaysConfig] = useState({
    saturday_policy: "alternate",
    off_saturdays: [1, 3],
    sunday_off: true
  });
  const [holidays, setHolidays] = useState([]);
  const [showAdminOTDialog, setShowAdminOTDialog] = useState(false);
  const [adminOTForm, setAdminOTForm] = useState({
    employee_id: '',
    date: new Date().toISOString().split('T')[0],
    from_time: '',
    to_time: '',
    project: '',
    notes: ''
  });

  const leaveTypes = [
    { value: 'casual', label: 'Casual Leave', balance: 12 },
    { value: 'sick', label: 'Sick Leave', balance: 12 },
    { value: 'earned', label: 'Earned Leave', balance: 21 },
    { value: 'maternity', label: 'Maternity Leave', balance: 180 },
    { value: 'paternity', label: 'Paternity Leave', balance: 15 }
  ];

  const [lateArrivals, setLateArrivals] = useState([]);

  useEffect(() => {
    fetchWorkingDaysConfig();
    fetchHolidays();
    fetchEmployees();
    fetchLeaveRequests();
    fetchOTLogs();
    fetchLateArrivals();
    fetchAttendanceRecords();
  }, []);

  useEffect(() => {
    // Refetch data when month/year changes
    fetchLateArrivals();
    fetchAttendanceRecords();
  }, [selectedMonth, selectedYear]);

  const fetchWorkingDaysConfig = async () => {
    try {
      const response = await axios.get(`${API}/settings`);
      if (response.data.working_days_config) {
        setWorkingDaysConfig(response.data.working_days_config);
      }
    } catch (error) {
      console.error("Error fetching working days config:", error);
    }
  };

  const fetchHolidays = async () => {
    try {
      const response = await axios.get(`${API}/holidays`);
      setHolidays(response.data);
    } catch (error) {
      console.error("Error fetching holidays:", error);
    }
  };

  const fetchEmployees = async () => {
    try {
      const response = await axios.get(`${API}/employees`);
      // Filter to show only active employees
      const activeEmployees = response.data.filter(emp => emp.status === 'active');
      setEmployees(activeEmployees);
    } catch (error) {
      console.error('Error fetching employees:', error);
      toast.error('Failed to load employees');
    } finally {
      setLoading(false);
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

  const fetchOTLogs = async () => {
    try {
      const response = await axios.get(`${API}/ot/all`);
      // Sort by date descending (newest first)
      const sortedOT = response.data.sort((a, b) => {
        const dateA = new Date(a.date || a.created_at || 0);
        const dateB = new Date(b.date || b.created_at || 0);
        return dateB - dateA; // Newest first
      });
      setOTLogs(sortedOT);
    } catch (error) {
      console.error('Error fetching OT logs:', error);
      toast.error('Failed to load OT logs');
    }
  };

  const fetchLateArrivals = async () => {
    try {
      const response = await axios.get(`${API}/late-arrivals`, {
        params: { month: selectedMonth, year: selectedYear }
      });
      console.log('Late arrivals fetched:', response.data);
      console.log('First record ID:', response.data[0]?.id);
      setLateArrivals(response.data);
    } catch (error) {
      console.error('Error fetching late arrivals:', error);
    }
  };

  const fetchAttendanceRecords = async () => {
    try {
      const response = await axios.get(`${API}/attendance/all`);
      setAttendanceRecords(response.data);
    } catch (error) {
      console.error('Error fetching attendance records:', error);
      toast.error('Failed to load attendance records');
    }
  };

  const handleLateArrivalSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post(`${API}/late-arrivals`, lateArrivalForm);
      toast.success(response.data.message || 'Late arrival recorded successfully');
      setShowLateArrivalDialog(false);
      setLateArrivalForm({
        employee_id: '',
        date: new Date().toISOString().split('T')[0],
        actual_check_in: '',
        reason: ''
      });
      fetchLateArrivals();
    } catch (error) {
      console.error('Error recording late arrival:', error);
      const errorMessage = error.response?.data?.detail 
        || error.response?.data?.message 
        || error.message 
        || 'Failed to record late arrival';
      toast.error(typeof errorMessage === 'string' ? errorMessage : JSON.stringify(errorMessage));
    }
  };

  const handleDeleteLateArrival = async (lateId) => {
    if (!lateId) {
      toast.error('Invalid late arrival record - missing ID');
      console.error('Late arrival record missing ID');
      return;
    }
    
    if (!window.confirm('Are you sure you want to delete this late arrival record?')) {
      return;
    }
    
    try {
      await axios.delete(`${API}/late-arrivals/${lateId}`);
      toast.success('Late arrival record deleted');
      fetchLateArrivals();
    } catch (error) {
      console.error('Error deleting late arrival:', error);
      const errorMessage = error.response?.data?.detail || 'Failed to delete late arrival record';
      toast.error(errorMessage);
    }
  };

  // Work timing configuration
  const WORK_START_TIME = '08:30';
  const WORK_END_TIME = '17:30';
  
  // Check if a date is a holiday
  const isHoliday = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;
    return holidays.some(holiday => holiday.date === dateStr);
  };
  
  // Check if a Saturday is working day based on dynamic config
  const isWorkingSaturday = (date) => {
    if (date.getDay() !== 6) return false; // Not a Saturday
    
    // If Saturday policy is "all_working", all Saturdays are working days
    if (workingDaysConfig.saturday_policy === "all_working") {
      return true;
    }
    
    // If Saturday policy is "all_off", no Saturdays are working days
    if (workingDaysConfig.saturday_policy === "all_off") {
      return false;
    }
    
    // For "alternate" or "custom" policies, check the specific Saturday number
    const dayOfMonth = date.getDate();
    const firstSaturday = new Date(date.getFullYear(), date.getMonth(), 1);
    while (firstSaturday.getDay() !== 6) {
      firstSaturday.setDate(firstSaturday.getDate() + 1);
    }
    
    const saturdayNumber = Math.ceil((dayOfMonth - firstSaturday.getDate() + 1) / 7);
    
    // If this Saturday number is in the off_saturdays list, it's NOT a working day
    return !workingDaysConfig.off_saturdays.includes(saturdayNumber);
  };

  // Check if employee is late (after 08:30 AM)
  const isEmployeeLate = (checkInTime) => {
    if (!checkInTime) return false;
    const [hours, minutes] = checkInTime.split(':').map(Number);
    const checkInMinutes = hours * 60 + minutes;
    const workStartMinutes = 8 * 60 + 30; // 08:30 = 510 minutes
    return checkInMinutes > workStartMinutes;
  };

  // generateMockData function removed

  const getTodayEmployeeStatus = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = today.toISOString().split('T')[0];
    
    // Get active employees - consider employees as active if status is undefined, null, or explicitly 'active'
    // Only exclude employees explicitly marked as 'resigned' or 'terminated'
    const activeEmployees = employees.filter(e => 
      !e.status || e.status === 'active' || (e.status !== 'resigned' && e.status !== 'terminated')
    );
    
    console.log('📊 Today Status Debug:', {
      todayStr,
      totalEmployees: employees.length,
      activeEmployees: activeEmployees.length,
      totalLeaveRequests: leaveRequests.length,
      employeeStatuses: employees.map(e => ({ name: e.name, status: e.status || 'undefined' }))
    });
    
    // Check which employees are on approved leave today
    const employeesOnLeave = activeEmployees.filter(emp => {
      return leaveRequests.some(leave => {
        if (leave.status !== 'approved' || leave.employee_id !== emp.employee_id) {
          return false;
        }
        const leaveStart = new Date(leave.start_date);
        leaveStart.setHours(0, 0, 0, 0);
        const leaveEnd = new Date(leave.end_date);
        leaveEnd.setHours(0, 0, 0, 0);
        return today >= leaveStart && today <= leaveEnd;
      });
    });
    
    // Employees present = active employees not on leave
    const employeesPresent = activeEmployees.filter(emp => 
      !employeesOnLeave.some(absent => absent.employee_id === emp.employee_id)
    );
    
    console.log('📊 Calculated Status:', {
      present: employeesPresent.length,
      absent: employeesOnLeave.length,
      presentNames: employeesPresent.map(e => e.name),
      absentNames: employeesOnLeave.map(e => e.name)
    });
    
    return {
      present: employeesPresent,
      absent: employeesOnLeave,
      total: activeEmployees.length
    };
  };

  const getAttendanceStats = () => {
    // Get today's date
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = today.toISOString().split('T')[0];
    
    // Filter attendance records for today only
    const todayRecords = attendanceRecords.filter(record => {
      const recordDate = new Date(record.date);
      recordDate.setHours(0, 0, 0, 0);
      return recordDate.toISOString().split('T')[0] === todayStr;
    });

    // Get today's employee status based on leaves
    const todayStatus = getTodayEmployeeStatus();
    
    // ALWAYS use calculated status based on active employees and approved leaves
    // This ensures all active employees (not on leave) are shown as present by default
    const presentToday = todayStatus.present.length;
    const absentToday = todayStatus.absent.length;
    
    // Calculate average hours for today (from attendance records if they exist)
    const avgHoursToday = todayRecords.length > 0 
      ? todayRecords.reduce((sum, r) => sum + (r.hours_worked || 0), 0) / todayRecords.length 
      : 0;

    return { 
      presentDays: presentToday, 
      absentDays: absentToday, 
      avgHours: avgHoursToday 
    };
  };

  const getEmployeeAttendanceSummary = () => {
    return employees.map(employee => {
      // Fix: Use employee_id instead of id to match attendance records
      const employeeRecords = attendanceRecords.filter(r => r.employee_id === employee.employee_id);
      const presentCount = employeeRecords.filter(r => r.status === 'present').length;
      const absentCount = employeeRecords.filter(r => r.status === 'absent').length;
      const totalWorkingDays = employeeRecords.length;
      const attendancePercentage = totalWorkingDays > 0 ? (presentCount / totalWorkingDays) * 100 : 0;
      
      const employeeLeaves = leaveRequests.filter(l => l.employee_id === employee.employee_id);
      const approvedLeaves = employeeLeaves.filter(l => l.status === 'approved');
      
      // Calculate total working hours (excluding leaves/weekends)
      let totalWorkingHours = 0;
      employeeRecords.forEach(record => {
        if (record.status === 'present' || record.status === 'half-day') {
          totalWorkingHours += record.working_hours || 0;
        }
      });
      
      // Calculate approved OT hours for current month
      const monthStr = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}`;
      const employeeOT = otLogs.filter(log => 
        log.employee_id === employee.employee_id && 
        log.status === 'approved' &&
        log.date && log.date.startsWith(monthStr)
      );
      const totalOTHours = employeeOT.reduce((sum, log) => sum + (log.ot_hours || 0), 0);
      
      return {
        ...employee,
        present_days: presentCount,
        absent_days: absentCount,
        total_working_days: totalWorkingDays,
        attendance_percentage: attendancePercentage,
        leaves_taken: approvedLeaves.length,
        pending_leaves: employeeLeaves.filter(l => l.status === 'pending').length,
        total_working_hours: totalWorkingHours,
        ot_hours: totalOTHours,
        total_hours: totalWorkingHours + totalOTHours
      };
    });
  };

  const handleMarkAttendanceSubmit = async (e) => {
    e.preventDefault();
    
    if (!markAttendanceForm.employee_id) {
      toast.error('Please select an employee');
      return;
    }
    
    try {
      setLoading(true);
      
      // Call backend API to mark/update attendance
      await axios.post(`${API}/attendance/mark`, {
        employee_id: markAttendanceForm.employee_id,
        date: markAttendanceForm.date,
        status: markAttendanceForm.status,
        working_hours: parseFloat(markAttendanceForm.working_hours)
      });
      
      toast.success(`Attendance marked as ${markAttendanceForm.status}`);
      setShowMarkAttendanceDialog(false);
      setMarkAttendanceForm({
        employee_id: '',
        date: new Date().toISOString().split('T')[0],
        status: 'present',
        working_hours: 8
      });
      
      // Refresh attendance records
      await fetchAttendanceRecords();
      
    } catch (error) {
      console.error('Error marking attendance:', error);
      const errorMessage = error.response?.data?.detail 
        || error.response?.data?.message 
        || error.message 
        || 'Failed to mark attendance';
      toast.error(typeof errorMessage === 'string' ? errorMessage : JSON.stringify(errorMessage));
    } finally {
      setLoading(false);
    }
  };

  const handleLeaveAction = async (leaveId, action) => {
    try {
      await axios.put(`${API}/leaves/${leaveId}/approve`, {
        status: action,
        admin_comment: action === 'rejected' ? rejectionReason : null
      });
      toast.success(`Leave request ${action} successfully`);
      fetchLeaveRequests();
      setShowRejectDialog(false);
      setRejectionReason('');
      setSelectedItem(null);
    } catch (error) {
      toast.error(error.response?.data?.detail || `Failed to ${action} leave request`);
    }
  };

  const handleOTAction = async (otId, action) => {
    try {
      await axios.put(`${API}/ot/${otId}/approve`, {
        status: action,
        rejection_reason: action === 'rejected' ? rejectionReason : null
      });
      toast.success(`OT log ${action} successfully`);
      fetchOTLogs();
      setShowRejectDialog(false);
      setRejectionReason('');
      setSelectedItem(null);
    } catch (error) {
      toast.error(error.response?.data?.detail || `Failed to ${action} OT log`);
    }
  };

  const openRejectDialog = (item, type) => {
    setSelectedItem({ ...item, type });
    setShowRejectDialog(true);
  };

  const handleReject = () => {
    if (!rejectionReason.trim()) {
      toast.error('Please provide a reason for rejection');
      return;
    }
    if (selectedItem.type === 'leave') {
      handleLeaveAction(selectedItem.id, 'rejected');
    } else if (selectedItem.type === 'ot') {
      handleOTAction(selectedItem.id, 'rejected');
    }
  };

  const handleAdminOTSubmit = async (e) => {
    e.preventDefault();
    
    if (!adminOTForm.employee_id) {
      toast.error('Please select an employee');
      return;
    }
    
    // Validate time format (minutes must be 00 or 30)
    const fromMinutes = adminOTForm.from_time.split(':')[1];
    const toMinutes = adminOTForm.to_time.split(':')[1];
    
    if (fromMinutes !== '00' && fromMinutes !== '30') {
      toast.error('From time minutes must be either 00 or 30');
      return;
    }
    
    if (toMinutes !== '00' && toMinutes !== '30') {
      toast.error('To time minutes must be either 00 or 30');
      return;
    }
    
    // Calculate total OT hours
    const [fromHour, fromMin] = adminOTForm.from_time.split(':').map(Number);
    const [toHour, toMin] = adminOTForm.to_time.split(':').map(Number);
    
    const fromTotalMinutes = fromHour * 60 + fromMin;
    const toTotalMinutes = toHour * 60 + toMin;
    const totalMinutes = toTotalMinutes - fromTotalMinutes;
    const totalHours = totalMinutes / 60;
    
    // Validate total OT is in multiples of 0.5 hour (30 minutes)
    if (totalHours % 0.5 !== 0) {
      toast.error(`Total OT hours must be in multiples of 30 minutes (0.5 hours). Current: ${totalHours.toFixed(1)} hours. Please adjust the times.`);
      return;
    }
    
    try {
      setLoading(true);
      await axios.post(`${API}/ot/admin-log`, adminOTForm);
      toast.success('OT logged successfully for employee');
      setShowAdminOTDialog(false);
      setAdminOTForm({
        employee_id: '',
        date: new Date().toISOString().split('T')[0],
        from_time: '',
        to_time: '',
        project: '',
        notes: ''
      });
      fetchOTLogs();
    } catch (error) {
      console.error('Error logging OT:', error);
      const errorMessage = error.response?.data?.detail 
        || error.response?.data?.message 
        || error.message 
        || 'Failed to log OT';
      toast.error(typeof errorMessage === 'string' ? errorMessage : JSON.stringify(errorMessage));
    } finally {
      setLoading(false);
    }
  };

  // handleSubmitLeave removed - Leave application only available in Employee Portal

  const stats = useMemo(() => {
    return getAttendanceStats();
  }, [employees, leaveRequests, attendanceRecords]);
  
  const employeeSummary = useMemo(() => {
    return getEmployeeAttendanceSummary();
  }, [employees, leaveRequests, attendanceRecords, otLogs, selectedMonth, selectedYear]);

  // Get unique projects for filter
  const uniqueProjects = useMemo(() => {
    const projects = otLogs.map(log => log.project).filter(Boolean);
    return [...new Set(projects)];
  }, [otLogs]);

  // Filter and sort OT logs
  const filteredAndSortedOTLogs = useMemo(() => {
    let filtered = [...otLogs];
    
    // Filter by status
    if (otFilters.status !== 'all') {
      filtered = filtered.filter(log => log.status === otFilters.status);
    }
    
    // Filter by employee
    if (otFilters.employee !== 'all') {
      filtered = filtered.filter(log => log.employee_id === otFilters.employee);
    }
    
    // Filter by project
    if (otFilters.project !== 'all') {
      filtered = filtered.filter(log => log.project === otFilters.project);
    }
    
    // Sort
    filtered.sort((a, b) => {
      let compareValue = 0;
      
      switch (otFilters.sortBy) {
        case 'date':
          compareValue = new Date(a.date) - new Date(b.date);
          break;
        case 'employee':
          const empA = employees.find(e => e.employee_id === a.employee_id)?.name || '';
          const empB = employees.find(e => e.employee_id === b.employee_id)?.name || '';
          compareValue = empA.localeCompare(empB);
          break;
        case 'hours':
          compareValue = (a.ot_hours || 0) - (b.ot_hours || 0);
          break;
        case 'status':
          compareValue = (a.status || '').localeCompare(b.status || '');
          break;
        case 'project':
          compareValue = (a.project || '').localeCompare(b.project || '');
          break;
        case 'logged_at':
          compareValue = new Date(a.created_at || a.date) - new Date(b.created_at || b.date);
          break;
        default:
          compareValue = 0;
      }
      
      return otFilters.sortOrder === 'asc' ? compareValue : -compareValue;
    });
    
    return filtered;
  }, [otLogs, otFilters, employees]);

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-10 bg-gray-200 rounded-lg w-64"></div>
        <div className="h-96 bg-gray-200 rounded-lg"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="leave-attendance">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
            Leave & Attendance
          </h1>
          <p className="text-gray-500 dark:text-gray-400">
            Manage employee attendance and leave requests
          </p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={() => setShowMarkAttendanceDialog(true)} className="dark:text-gray-200 dark:border-gray-600 dark:hover:bg-gray-800">
            <UserCheck className="w-4 h-4 mr-2" />
            Mark Attendance
          </Button>
          <Button variant="outline" onClick={() => setShowLateArrivalDialog(true)} className="dark:text-gray-200 dark:border-gray-600 dark:hover:bg-gray-800">
            <AlertCircle className="w-4 h-4 mr-2" />
            Record Late Arrival
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-5">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Users className="h-8 w-8 text-blue-600" />
              <div>
                <p className="text-2xl font-bold">{employees.length}</p>
                <p className="text-xs text-gray-500">Total Employees</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <UserCheck className="h-8 w-8 text-emerald-600" />
              <div>
                <p className="text-2xl font-bold">{stats.presentDays}</p>
                <p className="text-xs text-gray-500">Present Today</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <UserX className="h-8 w-8 text-red-600" />
              <div>
                <p className="text-2xl font-bold">{stats.absentDays}</p>
                <p className="text-xs text-gray-500">Absent Today</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Clock className="h-8 w-8 text-purple-600" />
              <div>
                <p className="text-2xl font-bold">{stats.avgHours.toFixed(1)}</p>
                <p className="text-xs text-gray-500">Avg Hours</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <AlertCircle className="h-8 w-8 text-red-600" />
              <div>
                <p className="text-2xl font-bold">{lateArrivals.length}</p>
                <p className="text-xs text-gray-500">Late Arrivals</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Today's Status Overview */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Present Today */}
        <Card className="bg-green-50 dark:bg-green-900/10 border-green-200 dark:border-green-800">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-green-700 dark:text-green-400">
              <UserCheck className="h-5 w-5" />
              <span>Present Today ({stats.presentDays})</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {stats.presentDays === 0 ? (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                No active employees present today (all on leave)
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {(() => {
                  const today = new Date();
                  today.setHours(0, 0, 0, 0);
                  const todayStr = today.toISOString().split('T')[0];
                  
                  // Check if we have attendance records for today
                  const todayRecords = attendanceRecords.filter(record => {
                    const recordDate = new Date(record.date);
                    recordDate.setHours(0, 0, 0, 0);
                    return recordDate.toISOString().split('T')[0] === todayStr && record.status === 'present';
                  });
                  
                  // If no attendance records, use calculated employee status
                  let presentEmployees = [];
                  if (todayRecords.length > 0) {
                    presentEmployees = todayRecords.map(record => 
                      employees.find(e => e.employee_id === record.employee_id)
                    ).filter(e => e);
                  } else {
                    // Use calculated status based on leaves
                    const todayStatus = getTodayEmployeeStatus();
                    presentEmployees = todayStatus.present;
                  }
                  
                  // Extract first and last name only
                  const getFirstLastName = (fullName) => {
                    if (!fullName) return 'Unknown';
                    const nameParts = fullName.trim().split(' ').filter(part => part.length > 0);
                    if (nameParts.length === 0) return 'Unknown';
                    if (nameParts.length === 1) return nameParts[0];
                    // Return first and last name only
                    return `${nameParts[0]} ${nameParts[nameParts.length - 1]}`;
                  };
                  
                  return presentEmployees.map((employee) => {
                    const displayName = getFirstLastName(employee?.name);
                    
                    return (
                      <div key={employee.employee_id} className="flex items-center space-x-2 bg-white dark:bg-gray-800 px-3 py-2 rounded-lg border border-green-300 dark:border-green-700">
                        <Avatar className="h-6 w-6 flex-shrink-0">
                          <AvatarFallback className="bg-green-100 text-green-600 text-xs">
                            {employee?.name ? employee.name.split(' ').map(n => n[0]).join('').substring(0, 2) : 'NA'}
                          </AvatarFallback>
                        </Avatar>
                        <div className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                          {displayName}
                        </div>
                      </div>
                    );
                  });
                })()}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Absent Today */}
        <Card className="bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-800">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-red-700 dark:text-red-400">
              <UserX className="h-5 w-5" />
              <span>Absent Today ({stats.absentDays})</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {stats.absentDays === 0 ? (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                All active employees are present today
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {(() => {
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    const todayStr = today.toISOString().split('T')[0];
                    
                    // Check if we have attendance records for today
                    const todayRecords = attendanceRecords.filter(record => {
                      const recordDate = new Date(record.date);
                      recordDate.setHours(0, 0, 0, 0);
                      return recordDate.toISOString().split('T')[0] === todayStr && record.status === 'absent';
                    });
                    
                    // If no attendance records, use calculated employee status
                    let absentEmployees = [];
                    if (todayRecords.length > 0) {
                      absentEmployees = todayRecords.map(record => 
                        employees.find(e => e.employee_id === record.employee_id)
                      ).filter(e => e);
                    } else {
                      // Use calculated status based on leaves
                      const todayStatus = getTodayEmployeeStatus();
                      absentEmployees = todayStatus.absent;
                    }
                    
                    // Extract first and last name only
                    const getFirstLastName = (fullName) => {
                      if (!fullName) return 'Unknown';
                      const nameParts = fullName.trim().split(' ').filter(part => part.length > 0);
                      if (nameParts.length === 0) return 'Unknown';
                      if (nameParts.length === 1) return nameParts[0];
                      // Return first and last name only
                      return `${nameParts[0]} ${nameParts[nameParts.length - 1]}`;
                    };
                    
                    return absentEmployees.map((employee) => {
                      const displayName = getFirstLastName(employee?.name);
                      
                      // Check if employee is on leave
                      const leaveReason = leaveRequests.find(leave => {
                        if (leave.status !== 'approved' || leave.employee_id !== employee.employee_id) {
                          return false;
                        }
                        const leaveStart = new Date(leave.start_date);
                        leaveStart.setHours(0, 0, 0, 0);
                        const leaveEnd = new Date(leave.end_date);
                        leaveEnd.setHours(0, 0, 0, 0);
                        return today >= leaveStart && today <= leaveEnd;
                      });
                      
                      return (
                        <div key={employee.employee_id} className="flex items-center space-x-2 bg-white dark:bg-gray-800 px-3 py-2 rounded-lg border border-red-300 dark:border-red-700">
                          <Avatar className="h-6 w-6 flex-shrink-0">
                            <AvatarFallback className="bg-red-100 text-red-600 text-xs">
                              {employee?.name ? employee.name.split(' ').map(n => n[0]).join('').substring(0, 2) : 'NA'}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-sm text-gray-900 dark:text-gray-100 truncate">
                              {displayName}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                              {leaveReason ? `On ${leaveReason.leave_type} Leave` : employee?.employee_id}
                            </div>
                          </div>
                        </div>
                      );
                    });
                  })()}
                </div>
                <div className="mt-3 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg">
                  <p className="text-xs text-yellow-800 dark:text-yellow-300">
                    <strong>Note:</strong> If this is incorrect, please use "Mark Attendance" button to update today's attendance records.
                  </p>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* OT Approval Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center space-x-2">
              <Clock className="h-5 w-5" />
              <span>Overtime (OT) Approval</span>
            </CardTitle>
            <div className="flex gap-2">
              <Button 
                variant="outline"
                onClick={() => setShowOTFilters(!showOTFilters)}
                className="flex items-center space-x-2"
              >
                <Filter className="h-4 w-4" />
                <span>Filter</span>
              </Button>
              <Button 
                onClick={() => setShowAdminOTDialog(true)}
                className="flex items-center space-x-2"
              >
                <Plus className="h-4 w-4" />
                <span>Log OT for Employee</span>
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Filters - Collapsible */}
          <div 
            className={`overflow-hidden transition-all duration-300 ease-in-out ${
              showOTFilters ? 'max-h-48 opacity-100 mb-4' : 'max-h-0 opacity-0'
            }`}
          >
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3 pb-4">
            <Select value={otFilters.status} onValueChange={(value) => setOTFilters({...otFilters, status: value})}>
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>

            <Select value={otFilters.employee} onValueChange={(value) => setOTFilters({...otFilters, employee: value})}>
              <SelectTrigger>
                <SelectValue placeholder="Employee" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Employees</SelectItem>
                {employees.map(emp => (
                  <SelectItem key={emp.employee_id} value={emp.employee_id}>
                    {emp.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={otFilters.project} onValueChange={(value) => setOTFilters({...otFilters, project: value})}>
              <SelectTrigger>
                <SelectValue placeholder="Project" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Projects</SelectItem>
                {uniqueProjects.map(project => (
                  <SelectItem key={project} value={project}>
                    {project}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={otFilters.sortBy} onValueChange={(value) => setOTFilters({...otFilters, sortBy: value})}>
              <SelectTrigger>
                <SelectValue placeholder="Sort By" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="date">Date</SelectItem>
                <SelectItem value="logged_at">Logged At (Latest First)</SelectItem>
                <SelectItem value="employee">Employee</SelectItem>
                <SelectItem value="hours">OT Hours</SelectItem>
                <SelectItem value="status">Status</SelectItem>
                <SelectItem value="project">Project</SelectItem>
              </SelectContent>
            </Select>

            <Select value={otFilters.sortOrder} onValueChange={(value) => setOTFilters({...otFilters, sortOrder: value})}>
              <SelectTrigger>
                <SelectValue placeholder="Order" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="desc">Descending</SelectItem>
                <SelectItem value="asc">Ascending</SelectItem>
              </SelectContent>
            </Select>
            </div>
          </div>

          <div className="max-h-[600px] overflow-y-auto">
            <Table>
              <TableHeader className="sticky top-0 bg-white dark:bg-gray-950 z-10">
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Project</TableHead>
                  <TableHead>Time Range</TableHead>
                  <TableHead>OT Hours</TableHead>
                  <TableHead>Logged At</TableHead>
                  <TableHead>Notes</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAndSortedOTLogs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center text-gray-500 py-8">
                      {otLogs.length === 0 ? 'No OT logs found' : 'No OT logs match the current filters'}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredAndSortedOTLogs.map((log) => (
                    <TableRow key={log.id}>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="bg-purple-100 text-purple-600 text-xs">
                            {log.employee_name ? log.employee_name.split(' ').map(n => n[0]).join('') : 'NA'}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium text-sm">{log.employee_name || log.employee_id}</div>
                          <div className="text-xs text-gray-500">{log.department || 'N/A'}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">{log.date ? formatDate(log.date) : 'N/A'}</TableCell>
                    <TableCell>
                      <span className="font-medium text-sm">{log.project}</span>
                    </TableCell>
                    <TableCell className="text-sm">
                      <div className="font-mono">
                        {log.from_time} - {log.to_time}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="font-semibold">
                        {log.ot_hours}h
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm">
                      <div className="text-gray-700 dark:text-gray-300">
                        {log.created_at ? new Date(log.created_at).toLocaleString('en-IN', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                          hour12: true
                        }) : 'N/A'}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {log.approved_by ? `By: ${log.approved_by === 'admin' ? 'Admin' : 'Employee'}` : 'By: Employee'}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-gray-600 dark:text-gray-400 max-w-xs truncate">
                      {log.notes || '-'}
                    </TableCell>
                    <TableCell>
                      <Badge variant={
                        log.status === 'approved' ? 'default' :
                        log.status === 'rejected' ? 'destructive' :
                        'secondary'
                      }>
                        {log.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {log.status === 'pending' && (
                        <div className="flex justify-end space-x-1">
                          <Button 
                            size="sm"
                            variant="default"
                            onClick={() => handleOTAction(log.id, 'approved')}
                          >
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Approve
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => openRejectDialog(log, 'ot')}
                          >
                            <XCircle className="w-3 h-3 mr-1" />
                            Reject
                          </Button>
                        </div>
                      )}
                      {log.status === 'rejected' && log.rejection_reason && (
                        <div className="text-xs text-red-600">
                          Reason: {log.rejection_reason}
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Rejection Dialog */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Reject {selectedItem?.type === 'leave' ? 'Leave Request' : 'OT Log'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Reason for Rejection *</Label>
              <Textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Please provide a reason for rejection"
                rows={4}
                required
              />
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => {
                setShowRejectDialog(false);
                setRejectionReason('');
                setSelectedItem(null);
              }}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={handleReject}>
                Confirm Rejection
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Late Arrival Dialog */}
      <Dialog open={showLateArrivalDialog} onOpenChange={setShowLateArrivalDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Record Late Arrival</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleLateArrivalSubmit} className="space-y-4">
            <div>
              <Label className="text-gray-700 dark:text-gray-300">Employee *</Label>
              <Select
                value={lateArrivalForm.employee_id}
                onValueChange={(value) => setLateArrivalForm({ ...lateArrivalForm, employee_id: value })}
                required
              >
                <SelectTrigger className="dark:bg-gray-800 dark:border-gray-600 dark:text-gray-200">
                  <SelectValue placeholder="Select employee" className="dark:text-gray-400" />
                </SelectTrigger>
                <SelectContent>
                  {employees.map((emp) => (
                    <SelectItem key={emp.employee_id} value={emp.employee_id}>
                      {emp.name} ({emp.employee_id})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-gray-700 dark:text-gray-300">Date *</Label>
              <Input
                type="date"
                value={lateArrivalForm.date}
                onChange={(e) => setLateArrivalForm({ ...lateArrivalForm, date: e.target.value })}
                required
                className="dark:bg-gray-800 dark:border-gray-600 dark:text-gray-200"
              />
            </div>
            <div>
              <Label className="text-gray-700 dark:text-gray-300">Actual Check-in Time *</Label>
              <Input
                type="time"
                value={lateArrivalForm.actual_check_in}
                onChange={(e) => setLateArrivalForm({ ...lateArrivalForm, actual_check_in: e.target.value })}
                required
                className="dark:bg-gray-800 dark:border-gray-600 dark:text-gray-200"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Expected check-in: 08:30 AM
              </p>
            </div>
            <div>
              <Label className="text-gray-700 dark:text-gray-300">Reason (Optional)</Label>
              <Textarea
                value={lateArrivalForm.reason}
                onChange={(e) => setLateArrivalForm({ ...lateArrivalForm, reason: e.target.value })}
                placeholder="e.g., Traffic, Personal emergency, etc."
                rows={3}
                className="dark:bg-gray-800 dark:border-gray-600 dark:text-gray-200 dark:placeholder:text-gray-500"
              />
            </div>
            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={() => {
                setShowLateArrivalDialog(false);
                setLateArrivalForm({
                  employee_id: '',
                  date: new Date().toISOString().split('T')[0],
                  actual_check_in: '',
                  reason: ''
                });
              }}>
                Cancel
              </Button>
              <Button type="submit">
                Record Late Arrival
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Mark Attendance Dialog */}
      <Dialog open={showMarkAttendanceDialog} onOpenChange={setShowMarkAttendanceDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Mark Attendance</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleMarkAttendanceSubmit} className="space-y-4">
            <div>
              <Label className="text-gray-700 dark:text-gray-300">Employee *</Label>
              <Select
                value={markAttendanceForm.employee_id}
                onValueChange={(value) => setMarkAttendanceForm({ ...markAttendanceForm, employee_id: value })}
                required
              >
                <SelectTrigger className="dark:bg-gray-800 dark:border-gray-600 dark:text-gray-200">
                  <SelectValue placeholder="Select employee" className="dark:text-gray-400" />
                </SelectTrigger>
                <SelectContent>
                  {employees.map((emp) => (
                    <SelectItem key={emp.employee_id} value={emp.employee_id}>
                      {emp.name} ({emp.employee_id})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label className="text-gray-700 dark:text-gray-300">Date *</Label>
              <Input
                type="date"
                value={markAttendanceForm.date}
                onChange={(e) => setMarkAttendanceForm({ ...markAttendanceForm, date: e.target.value })}
                required
                className="dark:bg-gray-800 dark:border-gray-600 dark:text-gray-200"
              />
            </div>
            
            <div>
              <Label className="text-gray-700 dark:text-gray-300">Status *</Label>
              <Select
                value={markAttendanceForm.status}
                onValueChange={(value) => {
                  // Automatically set working hours based on status
                  let hours = markAttendanceForm.working_hours;
                  if (value === 'absent') {
                    hours = 0;
                  } else if (value === 'half-day') {
                    hours = 4;
                  } else if (value === 'present') {
                    hours = 8;
                  }
                  setMarkAttendanceForm({ ...markAttendanceForm, status: value, working_hours: hours });
                }}
                required
              >
                <SelectTrigger className="dark:bg-gray-800 dark:border-gray-600 dark:text-gray-200">
                  <SelectValue placeholder="Select status" className="dark:text-gray-400" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="present">Present</SelectItem>
                  <SelectItem value="absent">Absent</SelectItem>
                  <SelectItem value="half-day">Half Day</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label className="text-gray-700 dark:text-gray-300">Working Hours *</Label>
              <Input
                type="number"
                step="0.5"
                min="0"
                max="24"
                value={markAttendanceForm.working_hours}
                onChange={(e) => setMarkAttendanceForm({ ...markAttendanceForm, working_hours: e.target.value })}
                disabled={markAttendanceForm.status === 'absent'}
                required
                className="dark:bg-gray-800 dark:border-gray-600 dark:text-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {markAttendanceForm.status === 'absent' 
                  ? 'Working hours automatically set to 0 for absent status'
                  : 'Typical: 8 hours for full day, 4 hours for half day'
                }
              </p>
            </div>
            
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-3">
              <p className="text-xs text-blue-800 dark:text-blue-300">
                <strong>Note:</strong> This will create or update the attendance record for the selected employee and date.
              </p>
            </div>
            
            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={() => {
                setShowMarkAttendanceDialog(false);
                setMarkAttendanceForm({
                  employee_id: '',
                  date: new Date().toISOString().split('T')[0],
                  status: 'present',
                  working_hours: 8
                });
              }}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? 'Marking...' : 'Mark Attendance'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Late Arrivals Tracking */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <AlertCircle className="h-5 w-5 text-red-600" />
            <span>Late Arrivals This Month</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {lateArrivals
              .sort((a, b) => new Date(b.date) - new Date(a.date))
              .map((record) => (
              <div key={record.id} className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-700 rounded-lg bg-red-50 dark:bg-red-900/10">
                <div className="flex items-center space-x-3">
                  <Avatar>
                    <AvatarFallback className="bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400">
                      {record.employee_name ? record.employee_name.split(' ').map(n => n[0]).join('') : 'NA'}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-medium text-gray-900 dark:text-gray-200">{record.employee_name || record.employee_id}</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">{formatDate(record.date)}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      Check-in: {record.actual_check_in} (Expected: 08:30)
                    </div>
                    {record.reason && (
                      <div className="text-xs text-gray-600 dark:text-gray-400 mt-1 italic">
                        Reason: {record.reason}
                      </div>
                    )}
                  </div>
                </div>
                <div className="text-right space-y-2">
                  <Badge variant="destructive" className="dark:bg-red-900/30 dark:text-red-400 dark:border-red-800">
                    Late by {Math.floor(record.late_minutes / 60)}h {record.late_minutes % 60}m
                  </Badge>
                  <div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDeleteLateArrival(record.id)}
                      className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300"
                    >
                      <XCircle className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
            {lateArrivals.length === 0 && (
              <div className="text-center text-gray-500 dark:text-gray-400 py-8">
                No late arrivals this month
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Admin Log OT Dialog */}
      <Dialog open={showAdminOTDialog} onOpenChange={setShowAdminOTDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Log OT for Employee</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAdminOTSubmit} className="space-y-4">
            <div>
              <Label className="text-gray-700 dark:text-gray-300">Employee *</Label>
              <Select 
                value={adminOTForm.employee_id} 
                onValueChange={(value) => setAdminOTForm({ ...adminOTForm, employee_id: value })}
                required
              >
                <SelectTrigger className="dark:bg-gray-800 dark:border-gray-600 dark:text-gray-200">
                  <SelectValue placeholder="Select employee" className="dark:text-gray-400" />
                </SelectTrigger>
                <SelectContent>
                  {employees.map((emp) => (
                    <SelectItem key={emp.employee_id} value={emp.employee_id}>
                      {emp.name} ({emp.employee_id})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label className="text-gray-700 dark:text-gray-300">Date *</Label>
              <Input
                type="date"
                value={adminOTForm.date}
                onChange={(e) => setAdminOTForm({ ...adminOTForm, date: e.target.value })}
                required
                className="dark:bg-gray-800 dark:border-gray-600 dark:text-gray-200"
              />
              <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                * Admin can log OT for any date
              </p>
            </div>
            
            <div>
              <Label className="text-gray-700 dark:text-gray-300">Project Name *</Label>
              <Input
                type="text"
                value={adminOTForm.project}
                onChange={(e) => setAdminOTForm({ ...adminOTForm, project: e.target.value })}
                placeholder="Enter project name"
                required
                className="dark:bg-gray-800 dark:border-gray-600 dark:text-gray-200 dark:placeholder:text-gray-500"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-gray-700 dark:text-gray-300">From Time *</Label>
                <div className="grid grid-cols-2 gap-2">
                  <Select 
                    value={adminOTForm.from_time.split(':')[0] || ''} 
                    onValueChange={(value) => {
                      const minutes = adminOTForm.from_time.split(':')[1] || '00';
                      setAdminOTForm({ ...adminOTForm, from_time: `${value}:${minutes}` });
                    }}
                  >
                    <SelectTrigger className="dark:bg-gray-800 dark:border-gray-600 dark:text-gray-200">
                      <SelectValue placeholder="Hour" />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 24 }, (_, i) => (
                        <SelectItem key={i} value={i.toString().padStart(2, '0')}>
                          {i.toString().padStart(2, '0')}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select 
                    value={adminOTForm.from_time.split(':')[1] || ''} 
                    onValueChange={(value) => {
                      const hour = adminOTForm.from_time.split(':')[0] || '00';
                      setAdminOTForm({ ...adminOTForm, from_time: `${hour}:${value}` });
                    }}
                  >
                    <SelectTrigger className="dark:bg-gray-800 dark:border-gray-600 dark:text-gray-200">
                      <SelectValue placeholder="Min" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="00">00</SelectItem>
                      <SelectItem value="30">30</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label className="text-gray-700 dark:text-gray-300">To Time *</Label>
                <div className="grid grid-cols-2 gap-2">
                  <Select 
                    value={adminOTForm.to_time.split(':')[0] || ''} 
                    onValueChange={(value) => {
                      const minutes = adminOTForm.to_time.split(':')[1] || '00';
                      setAdminOTForm({ ...adminOTForm, to_time: `${value}:${minutes}` });
                    }}
                  >
                    <SelectTrigger className="dark:bg-gray-800 dark:border-gray-600 dark:text-gray-200">
                      <SelectValue placeholder="Hour" />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 24 }, (_, i) => (
                        <SelectItem key={i} value={i.toString().padStart(2, '0')}>
                          {i.toString().padStart(2, '0')}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select 
                    value={adminOTForm.to_time.split(':')[1] || ''} 
                    onValueChange={(value) => {
                      const hour = adminOTForm.to_time.split(':')[0] || '00';
                      setAdminOTForm({ ...adminOTForm, to_time: `${hour}:${value}` });
                    }}
                  >
                    <SelectTrigger className="dark:bg-gray-800 dark:border-gray-600 dark:text-gray-200">
                      <SelectValue placeholder="Min" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="00">00</SelectItem>
                      <SelectItem value="30">30</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            
            <div>
              <Label className="text-gray-700 dark:text-gray-300">Notes (Optional)</Label>
              <Textarea
                value={adminOTForm.notes}
                onChange={(e) => setAdminOTForm({ ...adminOTForm, notes: e.target.value })}
                placeholder="Additional notes about the overtime work"
                rows={3}
                className="dark:bg-gray-800 dark:border-gray-600 dark:text-gray-200 dark:placeholder:text-gray-500"
              />
            </div>
            
            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-lg p-3">
              <p className="text-xs text-amber-800 dark:text-amber-300">
                <strong>Note:</strong> Minutes must be 00 or 30. Total OT must be in multiples of 30 minutes (0.5 hours). Admin-logged OT will be automatically approved. The employee will be notified.
              </p>
            </div>
            
            <div className="flex space-x-2">
              <Button type="submit" className="flex-1" disabled={loading}>
                Log OT
              </Button>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setShowAdminOTDialog(false)}
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

    </div>
  );
};

export default LeaveAttendance;