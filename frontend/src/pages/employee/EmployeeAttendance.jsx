import React, { useState, useEffect } from 'react';
import axios from 'axios';
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
  Calendar as CalendarIcon,
  Clock,
  CheckCircle,
  XCircle,
  Plus,
  FileText,
  AlertCircle,
  Info,
  Zap,
  Target,
  Award,
  MinusCircle,
  ChevronLeft,
  ChevronRight,
  Cake,
} from 'lucide-react';
import { toast } from 'sonner';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isToday, isSameMonth } from 'date-fns';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const EmployeeAttendanceNew = () => {
  const { user } = useAuth();
  const [attendanceData, setAttendanceData] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [loading, setLoading] = useState(false);
  
  // Leave balance state (for display only)
  const [leaveBalance, setLeaveBalance] = useState({
    casual: 12,
    sick: 12,
    earned: 12
  });
  
  // OT logging state
  const [showOTDialog, setShowOTDialog] = useState(false);
  const [otForm, setOTForm] = useState({
    date: format(new Date(), 'yyyy-MM-dd'),
    from_time: '',
    to_time: '',
    project: '',
    notes: ''
  });
  const [otLogs, setOTLogs] = useState([]);
  const [lateArrivals, setLateArrivals] = useState([]);
  
  const [workingDaysConfig, setWorkingDaysConfig] = useState({
    saturday_policy: "alternate",
    off_saturdays: [1, 3],
    sunday_off: true
  });
  const [holidays, setHolidays] = useState([]);
  const [employees, setEmployees] = useState([]);

  useEffect(() => {
    fetchWorkingDaysConfig();
    fetchHolidays();
    fetchEmployees();
  }, []);

  useEffect(() => {
    if (user) {
      fetchAttendanceData();
      fetchLeaveBalance();
      fetchOTLogs();
      fetchLateArrivals();
    }
  }, [selectedMonth, user]);

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
      setEmployees(response.data);
    } catch (error) {
      console.error("Error fetching employees:", error);
    }
  };

  const fetchAttendanceData = async () => {
    try {
      setLoading(true);
      const month = selectedMonth.getMonth() + 1;
      const year = selectedMonth.getFullYear();
      
      console.log('Fetching attendance for month:', month, 'year:', year);
      
      const response = await axios.get(`${API}/attendance/my-attendance`, {
        params: { month, year }
      });
      
      console.log('API response:', response.data);
      console.log('API response length:', response.data ? response.data.length : 'null');
      
      // If we have attendance records, use them
      if (response.data && Array.isArray(response.data) && response.data.length > 0) {
        console.log('Using API data:', response.data.length, 'records');
        setAttendanceData(response.data);
      } else {
        // No attendance records - auto-calculate based on working days
        console.log("No attendance data from API, starting auto-calculation...");
        const calculatedAttendance = await calculateAttendanceForMonth(month, year);
        console.log('Calculated attendance:', calculatedAttendance.length, 'records');
        setAttendanceData(calculatedAttendance);
      }
    } catch (error) {
      console.error("Error fetching attendance:", error);
      // Even on error, try to calculate attendance
      console.log("Attempting calculation after error...");
      const month = selectedMonth.getMonth() + 1;
      const year = selectedMonth.getFullYear();
      const calculatedAttendance = await calculateAttendanceForMonth(month, year);
      console.log('Calculated attendance after error:', calculatedAttendance.length, 'records');
      setAttendanceData(calculatedAttendance);
    } finally {
      setLoading(false);
    }
  };

  const calculateAttendanceForMonth = async (month, year) => {
    try {
      console.log('Calculating attendance for month:', month, year);
      
      // Fetch settings for working days
      const settingsResponse = await axios.get(`${API}/settings`);
      const workingDaysConfig = settingsResponse.data.working_days_config || {
        saturday_policy: 'alternate',
        off_saturdays: [1, 3],
        sunday_off: true
      };
      
      // Fetch holidays for this year
      const holidaysResponse = await axios.get(`${API}/holidays`);
      const holidaysList = holidaysResponse.data || [];
      
      // Fetch ALL leaves for the employee (approved, pending, rejected, cancelled)
      let allLeaves = [];
      try {
        const leavesResponse = await axios.get(`${API}/leaves`);
        const leaves = Array.isArray(leavesResponse.data) ? leavesResponse.data : [];
        
        // Filter for leaves that fall in the selected month (all statuses)
        allLeaves = leaves.filter(leave => {
          const leaveStart = new Date(leave.start_date || leave.from_date);
          const leaveEnd = new Date(leave.end_date || leave.to_date);
          const monthStart = new Date(year, month - 1, 1);
          const monthEnd = new Date(year, month, 0); // Last day of the month
          
          // Check if leave overlaps with the selected month
          return leaveStart <= monthEnd && leaveEnd >= monthStart;
        });
        
        console.log('Fetched leaves:', allLeaves.length, 'total records for this month');
      } catch (err) {
        console.log('No leaves found or error fetching leaves:', err);
        allLeaves = [];
      }
      
      // Use the passed month and year, not selectedMonth state
      const monthDate = new Date(year, month - 1, 1);
      const start = startOfMonth(monthDate);
      const end = endOfMonth(monthDate);
      const days = eachDayOfInterval({ start, end });
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      console.log('Calculating for', days.length, 'days');
      console.log('Working days config:', workingDaysConfig);
      console.log('Sunday off:', workingDaysConfig.sunday_off);
      console.log('Saturday policy:', workingDaysConfig.saturday_policy);
      
      console.log('Today:', today, 'Processing', days.length, 'days');
      
      const calculatedData = days.map((day) => {
        const dayDate = new Date(day);
        dayDate.setHours(0, 0, 0, 0);
        const dateStr = format(day, 'yyyy-MM-dd');
        const isFutureDate = dayDate > today;
        const dayOfWeek = dayDate.getDay(); // 0 = Sunday, 6 = Saturday
        
        // Check if it's a holiday FIRST
        const isHolidayDay = holidaysList.some(h => h.date === dateStr);
        if (isHolidayDay) {
          console.log(dateStr, 'is a holiday');
          return {
            date: dateStr,
            status: 'holiday',
            working_hours: 0
          };
        }
        
        // Check if employee has ANY leave application for this day (including future approved leaves)
        const leaveOnDay = allLeaves.find(leave => {
          const leaveStart = new Date(leave.start_date || leave.from_date);
          const leaveEnd = new Date(leave.end_date || leave.to_date);
          leaveStart.setHours(0, 0, 0, 0);
          leaveEnd.setHours(0, 0, 0, 0);
          return dayDate >= leaveStart && dayDate <= leaveEnd;
        });
        
        // If future date with approved leave, show it
        if (isFutureDate && leaveOnDay && leaveOnDay.status === 'approved') {
          console.log(dateStr, 'is a future date with approved leave');
          return {
            date: dateStr,
            status: leaveOnDay.half_day ? 'half-day' : 'leave',
            working_hours: leaveOnDay.half_day ? 4.0 : 0,
            leave_status: 'approved',
            leave_type: leaveOnDay.leave_type
          };
        }
        
        // Other future dates - skip
        if (isFutureDate) {
          return null;
        }
        
        // Check if it's Sunday
        if (dayOfWeek === 0) {
          console.log(dateStr, 'is Sunday, sunday_off=', workingDaysConfig.sunday_off);
          if (workingDaysConfig.sunday_off !== false) {
            return {
              date: dateStr,
              status: 'weekend',
              working_hours: 0
            };
          }
        }
        
        // Check if it's Saturday
        if (dayOfWeek === 6) {
          const saturdayPolicy = workingDaysConfig.saturday_policy || 'alternate';
          console.log(dateStr, 'is Saturday, policy=', saturdayPolicy);
          
          if (saturdayPolicy === 'all_off') {
            console.log(dateStr, 'Saturday - all_off policy, marking as weekend');
            return {
              date: dateStr,
              status: 'weekend',
              working_hours: 0
            };
          } else if (saturdayPolicy === 'alternate' || saturdayPolicy === 'custom') {
            // Calculate which Saturday of the month
            const firstDay = new Date(dayDate.getFullYear(), dayDate.getMonth(), 1);
            let firstSaturday = new Date(firstDay);
            while (firstSaturday.getDay() !== 6) {
              firstSaturday.setDate(firstSaturday.getDate() + 1);
            }
            const saturdayNumber = Math.floor((dayDate.getDate() - firstSaturday.getDate()) / 7) + 1;
            const offSaturdays = workingDaysConfig.off_saturdays || [1, 3];
            console.log(dateStr, 'Saturday #', saturdayNumber, 'off Saturdays:', offSaturdays);
            
            if (offSaturdays.includes(saturdayNumber)) {
              console.log(dateStr, 'Saturday is OFF - marking as weekend');
              return {
                date: dateStr,
                status: 'weekend',
                working_hours: 0
              };
            } else {
              console.log(dateStr, 'Saturday is WORKING');
            }
          }
        }
        
        // Re-use leaveOnDay from above (already checked)
        if (leaveOnDay) {
          console.log(dateStr, 'has leave application:', leaveOnDay.leave_type, 'status:', leaveOnDay.status);
          
          // Different status handling based on leave status
          if (leaveOnDay.status === 'approved') {
            return {
              date: dateStr,
              status: leaveOnDay.half_day ? 'half-day' : 'leave',
              working_hours: leaveOnDay.half_day ? 4.0 : 0,
              leave_status: 'approved',
              leave_type: leaveOnDay.leave_type
            };
          } else if (leaveOnDay.status === 'pending') {
            // Pending leave - still marked as working day but with indicator
            return {
              date: dateStr,
              status: 'present',
              working_hours: 8.0,
              leave_status: 'pending',
              leave_type: leaveOnDay.leave_type
            };
          } else if (leaveOnDay.status === 'rejected' || leaveOnDay.status === 'cancelled') {
            // Rejected/cancelled - marked as working day with indicator
            return {
              date: dateStr,
              status: 'present',
              working_hours: 8.0,
              leave_status: leaveOnDay.status,
              leave_type: leaveOnDay.leave_type
            };
          }
        }
        
        // Only after all checks - it's a working day, mark as present with 8 hours
        return {
          date: dateStr,
          status: 'present',
          working_hours: 8.0
        };
      }).filter(item => item !== null);
      
      console.log('Calculated attendance records:', calculatedData.length);
      return calculatedData;
    } catch (error) {
      console.error('Error calculating attendance:', error);
      return [];
    }
  };

  const fetchLeaveBalance = async () => {
    try {
      const response = await axios.get(`${API}/leaves/entitlement/${user?.username}`);
      setLeaveBalance({
        casual: response.data.casual_leave_balance || 12,
        sick: response.data.sick_leave_balance || 12,
        earned: response.data.total_available_leaves || 12
      });
    } catch (error) {
      console.error("Error fetching leave balance:", error);
    }
  };

  const fetchOTLogs = async () => {
    try {
      const response = await axios.get(`${API}/ot/my-ot`);
      setOTLogs(response.data);
    } catch (error) {
      console.error("Error fetching OT logs:", error);
    }
  };

  const fetchLateArrivals = async () => {
    try {
      const month = selectedMonth.getMonth() + 1;
      const year = selectedMonth.getFullYear();
      const response = await axios.get(`${API}/late-arrivals/my-late-arrivals`, {
        params: { month, year }
      });
      setLateArrivals(response.data);
    } catch (error) {
      console.error("Error fetching late arrivals:", error);
    }
  };

  // Helper function to format late arrival minutes to "0h15m" format
  const formatLateArrival = (minutes) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h${mins.toString().padStart(2, '0')}m`;
  };

  // Helper function to format hours to "0h00m" format
  const formatHours = (hours) => {
    const h = Math.floor(hours);
    const m = Math.round((hours - h) * 60);
    return `${h}h${m.toString().padStart(2, '0')}m`;
  };

  // Mock data generation removed - always use real API data

  const isHoliday = (date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return holidays.some(holiday => holiday.date === dateStr);
  };

  const getHolidayName = (date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    const holiday = holidays.find(h => h.date === dateStr);
    return holiday ? holiday.name : null;
  };

  const isActualWorkingDay = (date) => {
    const day_of_week = date.getDay();
    
    // Check Sunday
    if (day_of_week === 0 && workingDaysConfig.sunday_off) {
      return false;
    }
    
    // Check Saturday
    if (day_of_week === 6) {
      const saturday_policy = workingDaysConfig.saturday_policy;
      if (saturday_policy === "all_off") return false;
      if (saturday_policy === "all_working") return true;
      
      // For alternate/custom
      const firstSaturday = new Date(date.getFullYear(), date.getMonth(), 1);
      while (firstSaturday.getDay() !== 6) {
        firstSaturday.setDate(firstSaturday.getDate() + 1);
      }
      const saturdayNumber = Math.ceil((date.getDate() - firstSaturday.getDate() + 1) / 7);
      return !workingDaysConfig.off_saturdays.includes(saturdayNumber);
    }
    
    return true;
  };

  const handleOTSubmit = async (e) => {
    e.preventDefault();
    
    // Validate that date is today
    const today = format(new Date(), 'yyyy-MM-dd');
    if (otForm.date !== today) {
      toast.error('OT can only be logged for today\'s date');
      return;
    }
    
    // Validate that end time is not in the future
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    const [toHourCheck, toMinCheck] = otForm.to_time.split(':').map(Number);
    
    // Compare end time with current time (only for today's date)
    if (otForm.date === today) {
      const endTimeInMinutes = toHourCheck * 60 + toMinCheck;
      const currentTimeInMinutes = currentHour * 60 + currentMinute;
      
      if (endTimeInMinutes > currentTimeInMinutes) {
        toast.error(`You cannot log OT for future times. Current time is ${currentHour.toString().padStart(2, '0')}:${currentMinute.toString().padStart(2, '0')}, but you're trying to log until ${otForm.to_time}.`);
        return;
      }
    }
    
    // Check if employee is on approved leave for the selected date
    try {
      const leaveResponse = await axios.get(`${API}/leaves`);
      const dateToCheck = new Date(otForm.date);
      dateToCheck.setHours(0, 0, 0, 0);
      
      const hasLeaveOnDate = leaveResponse.data.some(leave => {
        const leaveStart = new Date(leave.start_date);
        const leaveEnd = new Date(leave.end_date);
        leaveStart.setHours(0, 0, 0, 0);
        leaveEnd.setHours(0, 0, 0, 0);
        
        return leave.status === 'approved' && dateToCheck >= leaveStart && dateToCheck <= leaveEnd;
      });
      
      if (hasLeaveOnDate) {
        toast.error('You cannot log OT on a day when you are on approved leave');
        return;
      }
    } catch (error) {
      console.error('Error checking leave status:', error);
      // Continue with OT logging if leave check fails (to avoid blocking legitimate OT)
    }
    
    // Validate time format (minutes must be 00 or 30)
    const fromMinutes = otForm.from_time.split(':')[1];
    const toMinutes = otForm.to_time.split(':')[1];
    
    if (fromMinutes !== '00' && fromMinutes !== '30') {
      toast.error('From time minutes must be either 00 or 30');
      return;
    }
    
    if (toMinutes !== '00' && toMinutes !== '30') {
      toast.error('To time minutes must be either 00 or 30');
      return;
    }
    
    // Calculate total OT hours
    const [fromHour, fromMin] = otForm.from_time.split(':').map(Number);
    const [toHour, toMin] = otForm.to_time.split(':').map(Number);
    
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
      await axios.post(`${API}/ot/log`, otForm);
      toast.success('OT hours logged successfully!');
      setShowOTDialog(false);
      setOTForm({
        date: format(new Date(), 'yyyy-MM-dd'),
        from_time: '',
        to_time: '',
        project: '',
        notes: ''
      });
      fetchOTLogs();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to log OT hours');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      present: 'bg-green-100 dark:bg-green-900/30 text-green-900 dark:text-green-300 border border-green-200 dark:border-green-500/30',
      leave: 'bg-red-100 dark:bg-red-900/30 text-red-900 dark:text-red-300 border border-red-200 dark:border-red-500/30',
      'half-day': 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-900 dark:text-yellow-300 border border-yellow-200 dark:border-yellow-500/30',
      holiday: 'bg-orange-50/50 dark:bg-orange-900/10 text-orange-700 dark:text-orange-300 border border-orange-300 dark:border-orange-500/30',
      weekend: 'bg-orange-50/50 dark:bg-orange-900/10 text-orange-700 dark:text-orange-300 border border-orange-300 dark:border-orange-500/30'
    };
    return colors[status] || 'bg-gray-100 dark:bg-gray-800/50 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-600/30';
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'present':
        return <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />;
      case 'leave':
      case 'half-day':
        return <XCircle className="h-4 w-4 text-red-600 dark:text-red-400" />;
      case 'weekend':
      case 'holiday':
        return <CalendarIcon className="h-4 w-4 text-gray-400 dark:text-gray-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-600 dark:text-gray-400" />;
    }
  };

  const getMonthStats = () => {
    const stats = {
      present: 0,
      leave: 0,
      halfDay: 0,
      totalHours: 0,
      otHours: 0
    };
    
    // Count regular working hours
    attendanceData.forEach(record => {
      if (record.status === 'present') stats.present++;
      if (record.status === 'leave') stats.leave++;
      if (record.status === 'half-day') stats.halfDay++;
      // Sum all working hours (backend sets 0 for leave/weekend/holiday)
      stats.totalHours += record.working_hours || 0;
    });
    
    // Add approved OT hours
    const month = selectedMonth.getMonth() + 1;
    const year = selectedMonth.getFullYear();
    const monthStr = `${year}-${String(month).padStart(2, '0')}`;
    
    otLogs.forEach(log => {
      // Only count approved OT and OT from current month
      if (log.status === 'approved' && log.date && log.date.startsWith(monthStr)) {
        stats.otHours += log.ot_hours || 0;
      }
    });
    
    // Total hours = regular hours + OT hours
    stats.totalHours += stats.otHours;
    
    console.log('Attendance Page Calculation:', {
      month: selectedMonth.getMonth() + 1,
      year: selectedMonth.getFullYear(),
      attendanceRecords: attendanceData.length,
      regularHours: stats.totalHours - stats.otHours,
      otHours: stats.otHours,
      totalHours: stats.totalHours
    });
    
    return stats;
  };

  const stats = getMonthStats();

  // Helper function to get birthdays for a specific date (for current and next year, active employees only)
  const getBirthdaysForDate = (date) => {
    const currentYear = new Date().getFullYear();
    const nextYear = currentYear + 1;
    const monthDay = format(date, 'MM-dd');
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    return employees.filter(emp => {
      if (!emp.date_of_birth) return false;
      
      // Check if employee is active (no resignation date or resignation date is in the future)
      const isActive = !emp.date_of_resignation || new Date(emp.date_of_resignation) > today;
      if (!isActive) return false;
      
      const empDOB = format(new Date(emp.date_of_birth), 'MM-dd');
      const dateYear = date.getFullYear();
      
      // Show birthday if:
      // 1. Employee is active
      // 2. It's the person's birthday (month-day matches)
      // 3. Date is in current or next year
      return empDOB === monthDay && (dateYear === currentYear || dateYear === nextYear);
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">My Attendance</h1>
          <p className="text-gray-500">View your attendance, apply for leave, and log overtime</p>
        </div>
        <div className="flex space-x-2">
          <Dialog open={showOTDialog} onOpenChange={(open) => {
            setShowOTDialog(open);
            if (open) {
              // Reset form with today's date when dialog opens
              setOTForm({
                date: format(new Date(), 'yyyy-MM-dd'),
                from_time: '',
                to_time: '',
                project: '',
                notes: ''
              });
            }
          }}>
            <DialogTrigger asChild>
              <Button className="bg-teal-600 hover:bg-teal-700 text-white dark:bg-teal-500 dark:hover:bg-teal-600">
                <Clock className="w-4 h-4 mr-2" />
                Log OT
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Log Overtime Hours</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleOTSubmit} className="space-y-4">
                <div>
                  <Label>Date</Label>
                  <Input
                    type="date"
                    value={otForm.date}
                    readOnly
                    disabled
                    className="bg-gray-100 dark:bg-gray-800 cursor-not-allowed"
                    title="OT can only be logged for today"
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    * OT can only be logged for today's date
                  </p>
                </div>
                <div>
                  <Label>Project Name *</Label>
                  <Input
                    type="text"
                    value={otForm.project}
                    onChange={(e) => setOTForm({ ...otForm, project: e.target.value })}
                    placeholder="Enter project name"
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>From Time</Label>
                    <div className="grid grid-cols-2 gap-2">
                      <Select 
                        value={otForm.from_time.split(':')[0] || ''} 
                        onValueChange={(value) => {
                          const minutes = otForm.from_time.split(':')[1] || '00';
                          setOTForm({ ...otForm, from_time: `${value}:${minutes}` });
                        }}
                      >
                        <SelectTrigger>
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
                        value={otForm.from_time.split(':')[1] || ''} 
                        onValueChange={(value) => {
                          const hour = otForm.from_time.split(':')[0] || '00';
                          setOTForm({ ...otForm, from_time: `${hour}:${value}` });
                        }}
                      >
                        <SelectTrigger>
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
                    <Label>To Time</Label>
                    <div className="grid grid-cols-2 gap-2">
                      <Select 
                        value={otForm.to_time.split(':')[0] || ''} 
                        onValueChange={(value) => {
                          const minutes = otForm.to_time.split(':')[1] || '00';
                          setOTForm({ ...otForm, to_time: `${value}:${minutes}` });
                        }}
                      >
                        <SelectTrigger>
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
                        value={otForm.to_time.split(':')[1] || ''} 
                        onValueChange={(value) => {
                          const hour = otForm.to_time.split(':')[0] || '00';
                          setOTForm({ ...otForm, to_time: `${hour}:${value}` });
                        }}
                      >
                        <SelectTrigger>
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
                <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-lg p-3">
                  <p className="text-xs text-amber-800 dark:text-amber-300">
                    <strong>Note:</strong> Minutes must be 00 or 30. Total OT must be in multiples of 30 minutes (0.5 hours). On working days, OT is only acceptable before 8:30 AM or after 5:30 PM. On weekends/holidays, OT can be logged for any time. Overlapping entries will be rejected.
                  </p>
                </div>
                <div>
                  <Label>Notes (Optional)</Label>
                  <Textarea
                    value={otForm.notes}
                    onChange={(e) => setOTForm({ ...otForm, notes: e.target.value })}
                    placeholder="Additional notes about the overtime work"
                  />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  Log OT Hours
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Monthly Stats */}
      <div className="grid md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Present Days</p>
                <p className="text-2xl font-bold text-green-600">{stats.present}</p>
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
                <p className="text-sm font-medium text-gray-500">Leave Days</p>
                <p className="text-2xl font-bold text-red-600">{stats.leave}</p>
              </div>
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                <XCircle className="h-6 w-6 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Total Hours</p>
                <p className="text-2xl font-bold text-blue-600">{Math.round(stats.totalHours)}h</p>
                {stats.otHours > 0 && (
                  <p className="text-xs text-gray-500 mt-1">
                    Includes {Math.round(stats.otHours)}h OT
                  </p>
                )}
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Clock className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Leave Balance</p>
                <p className="text-2xl font-bold text-purple-600">{leaveBalance.casual}</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <FileText className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Monthly Calendar */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Monthly Attendance Calendar</CardTitle>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={() => {
                  const newDate = new Date(selectedMonth);
                  newDate.setMonth(newDate.getMonth() - 1);
                  setSelectedMonth(newDate);
                }}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Select 
                value={format(selectedMonth, 'yyyy-MM')} 
                onValueChange={(value) => setSelectedMonth(new Date(value))}
              >
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {/* 2024 */}
                  <SelectItem value="2024-01">January 2024</SelectItem>
                  <SelectItem value="2024-02">February 2024</SelectItem>
                  <SelectItem value="2024-03">March 2024</SelectItem>
                  <SelectItem value="2024-04">April 2024</SelectItem>
                  <SelectItem value="2024-05">May 2024</SelectItem>
                  <SelectItem value="2024-06">June 2024</SelectItem>
                  <SelectItem value="2024-07">July 2024</SelectItem>
                  <SelectItem value="2024-08">August 2024</SelectItem>
                  <SelectItem value="2024-09">September 2024</SelectItem>
                  <SelectItem value="2024-10">October 2024</SelectItem>
                  <SelectItem value="2024-11">November 2024</SelectItem>
                  <SelectItem value="2024-12">December 2024</SelectItem>
                  {/* 2025 */}
                  <SelectItem value="2025-01">January 2025</SelectItem>
                  <SelectItem value="2025-02">February 2025</SelectItem>
                  <SelectItem value="2025-03">March 2025</SelectItem>
                  <SelectItem value="2025-04">April 2025</SelectItem>
                  <SelectItem value="2025-05">May 2025</SelectItem>
                  <SelectItem value="2025-06">June 2025</SelectItem>
                  <SelectItem value="2025-07">July 2025</SelectItem>
                  <SelectItem value="2025-08">August 2025</SelectItem>
                  <SelectItem value="2025-09">September 2025</SelectItem>
                  <SelectItem value="2025-10">October 2025</SelectItem>
                  <SelectItem value="2025-11">November 2025</SelectItem>
                  <SelectItem value="2025-12">December 2025</SelectItem>
                  {/* 2026 */}
                  <SelectItem value="2026-01">January 2026</SelectItem>
                  <SelectItem value="2026-02">February 2026</SelectItem>
                  <SelectItem value="2026-03">March 2026</SelectItem>
                  <SelectItem value="2026-04">April 2026</SelectItem>
                  <SelectItem value="2026-05">May 2026</SelectItem>
                  <SelectItem value="2026-06">June 2026</SelectItem>
                  <SelectItem value="2026-07">July 2026</SelectItem>
                  <SelectItem value="2026-08">August 2026</SelectItem>
                  <SelectItem value="2026-09">September 2026</SelectItem>
                  <SelectItem value="2026-10">October 2026</SelectItem>
                  <SelectItem value="2026-11">November 2026</SelectItem>
                  <SelectItem value="2026-12">December 2026</SelectItem>
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                size="icon"
                onClick={() => {
                  const newDate = new Date(selectedMonth);
                  newDate.setMonth(newDate.getMonth() + 1);
                  setSelectedMonth(newDate);
                }}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-7 gap-3 mb-4">
            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
              <div key={day} className="p-2 text-center font-semibold text-gray-600 dark:text-gray-400 text-sm">
                {day}
              </div>
            ))}
          </div>
          
          <div className="grid grid-cols-7 gap-3">
            {(() => {
              const start = startOfMonth(selectedMonth);
              const end = endOfMonth(selectedMonth);
              const days = eachDayOfInterval({ start, end });
              const firstDay = start.getDay();
              // Adjust for Monday start: 0=Sunday becomes 6, 1=Monday becomes 0, etc.
              const firstDayAdjusted = firstDay === 0 ? 6 : firstDay - 1;
              const paddingCells = [];
              
              // Add empty cells for days before the first day of the month
              for (let i = 0; i < firstDayAdjusted; i++) {
                paddingCells.push(
                  <div key={`padding-${i}`} className="p-2 h-24"></div>
                );
              }
              
              // Add the actual attendance data
              const attendanceCells = days.map((day) => {
                const dateStr = format(day, 'yyyy-MM-dd');
                let record = attendanceData.find(r => r.date === dateStr);
                
                // Check if there's OT logged for this day
                const dayOT = otLogs.find(log => log.date === dateStr);
                const hasOT = !!dayOT;
                
                // Check if there's a late arrival for this day
                const dayLateArrival = lateArrivals.find(late => late.date === dateStr);
                const hasLateArrival = !!dayLateArrival;
                
                // Check if this day is a holiday (even for future dates)
                const holidayName = getHolidayName(day);
                const isWeekendDay = !isActualWorkingDay(day) && !isHoliday(day);
                const isHolidayDay = !!holidayName;
                
                // Check for birthdays on this date
                const birthdaysOnDay = getBirthdaysForDate(day);
                const hasBirthdays = birthdaysOnDay.length > 0;
                
                // If no record, check if it's a future or past date
                if (!record) {
                  const dayDate = new Date(day);
                  const today = new Date();
                  dayDate.setHours(0, 0, 0, 0);
                  today.setHours(0, 0, 0, 0);
                  
                  // For any date (past or future) - check if it's a holiday or weekend
                  if (isHolidayDay) {
                    return (
                      <div key={dateStr} className="h-24 p-2 text-center rounded-lg bg-orange-50/50 dark:bg-orange-900/10 border border-orange-300 dark:border-orange-500/30 flex flex-col justify-center">
                        <div className="text-lg font-semibold mb-1 text-orange-700 dark:text-orange-300">{format(day, 'd')}</div>
                        <div className="text-xs text-orange-600 dark:text-orange-400 px-1 truncate">{holidayName}</div>
                        {hasBirthdays && (
                          <div className="flex items-center justify-center gap-1 mt-1">
                            <Cake className="h-3 w-3 text-pink-500" />
                            <span className="text-xs text-pink-600 dark:text-pink-400">{birthdaysOnDay[0].name.split(' ')[0]}</span>
                          </div>
                        )}
                      </div>
                    );
                  } else if (isWeekendDay) {
                    return (
                      <div key={dateStr} className="h-24 p-2 text-center rounded-lg bg-orange-50/50 dark:bg-orange-900/10 border border-orange-300 dark:border-orange-500/30 flex flex-col justify-center">
                        <div className="text-lg font-semibold mb-1 text-orange-700 dark:text-orange-300">{format(day, 'd')}</div>
                        {hasBirthdays && (
                          <div className="flex items-center justify-center gap-1 mt-1">
                            <Cake className="h-3 w-3 text-pink-500" />
                            <span className="text-xs text-pink-600 dark:text-pink-400">{birthdaysOnDay[0].name.split(' ')[0]}</span>
                          </div>
                        )}
                      </div>
                    );
                  }
                  
                  // For future dates without holiday/weekend - show empty
                  if (dayDate > today) {
                    return (
                      <div key={dateStr} className="h-24 p-2 text-center rounded-lg bg-gray-50 dark:bg-gray-900/30 border border-gray-200 dark:border-gray-700/30 flex flex-col justify-center">
                        <div className="text-lg font-semibold mb-1 text-gray-400 dark:text-gray-600">{format(day, 'd')}</div>
                        {hasBirthdays && (
                          <div className="flex items-center justify-center gap-1 mt-1">
                            <Cake className="h-3 w-3 text-pink-500" />
                            <span className="text-xs text-pink-600 dark:text-pink-400">{birthdaysOnDay[0].name.split(' ')[0]}</span>
                          </div>
                        )}
                      </div>
                    );
                  }
                  
                  // Past working day without record - treat as present (auto-attendance)
                  if (isActualWorkingDay(day) && !isHolidayDay && !isWeekendDay) {
                    record = {
                      date: dateStr,
                      status: 'present',
                      working_hours: 8.0
                    };
                  }
                }
                
                // If there's a late arrival but no attendance record, treat as present on working day
                const shouldShowAsPresent = (record && record.status === 'present') || 
                                           (!record && hasLateArrival && isActualWorkingDay(day));
                
                return (
                  <div
                    key={dateStr}
                    className={`
                      h-24 p-2 text-center rounded-lg transition-shadow relative flex flex-col justify-center
                      ${isToday(day) ? 'ring-2 ring-blue-500' : ''}
                      ${record ? getStatusColor(record.status) : (shouldShowAsPresent ? getStatusColor('present') : 'bg-gray-100 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-600/30')}
                    `}
                  >
                    <div className="text-lg font-semibold mb-1">{format(day, 'd')}</div>
                    <div className="flex flex-col items-center justify-center space-y-0.5">
                      {shouldShowAsPresent && (
                        <div className="flex items-center gap-1 w-full justify-center">
                          <CheckCircle className="h-3 w-3 text-green-600 dark:text-green-400 flex-shrink-0" />
                          <span className="text-xs font-medium text-green-600 dark:text-green-400 w-12 text-left">{formatHours(8)}</span>
                        </div>
                      )}
                      {record && record.status !== 'present' && !shouldShowAsPresent && (
                        <div className="flex items-center justify-center">
                          {getStatusIcon(record.status)}
                        </div>
                      )}
                      {/* Show leave status indicator */}
                      {record && record.leave_status && (
                        <div className={`text-xs px-1 py-0.5 rounded ${
                          record.leave_status === 'pending' ? 'bg-yellow-200 dark:bg-yellow-700/50 text-yellow-900 dark:text-yellow-200' :
                          record.leave_status === 'approved' ? 'bg-green-200 dark:bg-green-700/50 text-green-900 dark:text-green-200' :
                          record.leave_status === 'rejected' ? 'bg-red-200 dark:bg-red-700/50 text-red-900 dark:text-red-200' :
                          record.leave_status === 'cancelled' ? 'bg-gray-300 dark:bg-gray-600 text-gray-900 dark:text-gray-200' :
                          ''
                        }`}>
                          {record.leave_status === 'pending' ? 'P' : 
                           record.leave_status === 'approved' ? 'A' : 
                           record.leave_status === 'rejected' ? 'R' : 
                           record.leave_status === 'cancelled' ? 'C' : ''}
                        </div>
                      )}
                      {hasOT && (
                        <div className="flex items-center gap-1 w-full justify-center">
                          <Clock className="h-3 w-3 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                          <span className="text-xs font-medium text-blue-600 dark:text-blue-400 w-12 text-left">
                            {formatHours(dayOT.ot_hours || dayOT.hours || 0)}
                          </span>
                        </div>
                      )}
                      {hasLateArrival && (
                        <div className="flex items-center gap-1 w-full justify-center" title={`Late by ${dayLateArrival.late_minutes || 0} minutes`}>
                          <AlertCircle className="h-3 w-3 text-orange-600 dark:text-orange-400 flex-shrink-0" />
                          <span className="text-xs font-medium text-orange-600 dark:text-orange-400 w-12 text-left">
                            {formatLateArrival(dayLateArrival.late_minutes || 0)}
                          </span>
                        </div>
                      )}
                      {/* Show holiday name for holiday status */}
                      {record && (record.status === 'holiday' || record.status === 'weekend') && holidayName && (
                        <div className="text-xs text-orange-600 dark:text-orange-400 px-1 truncate w-full">
                          {holidayName}
                        </div>
                      )}
                      {/* Show birthday indicator */}
                      {hasBirthdays && (
                        <div className="flex items-center justify-center gap-1 w-full">
                          <Cake className="h-3 w-3 text-pink-500" />
                          <span className="text-xs text-pink-600 dark:text-pink-400 truncate">{birthdaysOnDay[0].name.split(' ')[0]}</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              });
              
              return [...paddingCells, ...attendanceCells];
            })()}
          </div>

          {/* Legend */}
          <div className="flex flex-wrap justify-center gap-6 mt-6 text-sm">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
              <span className="dark:text-gray-300">Present</span>
            </div>
            <div className="flex items-center space-x-2">
              <XCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
              <span className="dark:text-gray-300">Absent</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="h-5 w-5 bg-orange-50/50 dark:bg-orange-900/10 border border-orange-300 dark:border-orange-500/30 rounded flex items-center justify-center">
                <CalendarIcon className="h-4 w-4 text-orange-600 dark:text-orange-400" />
              </div>
              <span className="dark:text-gray-300">Holidays</span>
            </div>
            <div className="flex items-center space-x-2">
              <Clock className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              <span className="dark:text-gray-300">OT Logged</span>
            </div>
            <div className="flex items-center space-x-2">
              <AlertCircle className="h-5 w-5 text-orange-600 dark:text-orange-400" />
              <span className="dark:text-gray-300">Late Arrival</span>
            </div>
          </div>
          
          {/* Leave Status Legend */}
          <div className="flex flex-wrap justify-center gap-4 mt-4 text-xs border-t border-gray-200 dark:border-gray-700 pt-4">
            <div className="flex items-center space-x-2">
              <div className="px-2 py-1 rounded bg-yellow-200 dark:bg-yellow-700/50 text-yellow-900 dark:text-yellow-200 font-medium">P</div>
              <span className="dark:text-gray-300">Pending Leave</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="px-2 py-1 rounded bg-green-200 dark:bg-green-700/50 text-green-900 dark:text-green-200 font-medium">A</div>
              <span className="dark:text-gray-300">Approved Leave</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="px-2 py-1 rounded bg-red-200 dark:bg-red-700/50 text-red-900 dark:text-red-200 font-medium">R</div>
              <span className="dark:text-gray-300">Rejected Leave</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="px-2 py-1 rounded bg-gray-300 dark:bg-gray-600 text-gray-900 dark:text-gray-200 font-medium">C</div>
              <span className="dark:text-gray-300">Cancelled Leave</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* OT Logs Summary */}
      {otLogs.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recent OT Logs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {otLogs.slice(0, 5).map((log) => (
                <div key={log.id} className="flex justify-between items-center p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">{log.date}</p>
                    <p className="text-sm text-gray-500">
                      {log.from_time} - {log.to_time} ({log.ot_hours}h) • {log.project}
                    </p>
                    {log.notes && <p className="text-xs text-gray-400 mt-1">{log.notes}</p>}
                  </div>
                  <Badge variant={log.status === 'approved' ? 'default' : log.status === 'rejected' ? 'destructive' : 'secondary'}>
                    {log.status}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default EmployeeAttendanceNew;
