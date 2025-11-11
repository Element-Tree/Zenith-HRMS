import React, { useState, useEffect } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useWebSocket } from '@/contexts/WebSocketContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  User,
  DollarSign,
  Calendar,
  FileText,
  CreditCard,
  Clock,
  MapPin,
  Mail,
  Phone,
  Building2,
  FolderOpen,
  TrendingUp,
  Activity,
  CheckCircle,
  Bell,
  Gift,
  PartyPopper,
  Cake,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Star,
  Eye,
  EyeOff,
  Trash2,
  TrendingDown,
  Award,
  Target,
  Zap,
  AlertTriangle,
  Lightbulb,
  Info,
  Users
} from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';
import { format } from 'date-fns';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const EmployeeDashboard = () => {
  const { user } = useAuth();
  const { addNotificationListener } = useWebSocket();
  const navigate = useNavigate();
  const context = useOutletContext();
  const employeeData = context?.employeeData;
  const [loading, setLoading] = useState(false);
  const [leaveEntitlement, setLeaveEntitlement] = useState(null);
  const [attendanceData, setAttendanceData] = useState({
    todayStatus: 'checked-out',
    checkInTime: '08:30 AM',
    checkOutTime: '05:30 PM',
    totalHours: '0h 0m',
    thisMonthHours: '0h',
    regularHours: 0,
    otHours: 0
  });
  const [countdown, setCountdown] = useState({ hours: 0, minutes: 0, seconds: 0 });
  const [monthlySummary, setMonthlySummary] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [upcomingEvents, setUpcomingEvents] = useState([]);
  const [isBirthday, setIsBirthday] = useState(false);
  const [rating, setRating] = useState(null);
  const [showRatingDialog, setShowRatingDialog] = useState(false);

  useEffect(() => {
    // Listen for real-time notifications
    const unsubscribe = addNotificationListener((newNotification) => {
      setNotifications(prev => [newNotification, ...prev]);
      // Show toast for new notification
      toast.info(newNotification.title, {
        description: newNotification.message
      });
    });
    
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (employeeData?.employee_id) {
      fetchLeaveEntitlement();
      fetchMonthlySummary();
      fetchTodayAttendance();
      fetchNotifications();
      fetchUpcomingEvents();
      checkBirthday();
      fetchEmployeeRating();
    }
  }, [employeeData]);
  
  // Countdown timer for before/after work
  useEffect(() => {
    if (attendanceData.todayStatus === 'before-work' || attendanceData.todayStatus === 'after-work') {
      const interval = setInterval(() => {
        const now = new Date();
        const currentMinutes = now.getHours() * 60 + now.getMinutes();
        const workStartTime = 8 * 60 + 30; // 8:30 AM
        const workEndTime = 17 * 60 + 30; // 5:30 PM
        
        let targetTime;
        if (attendanceData.todayStatus === 'before-work') {
          targetTime = workStartTime;
        } else {
          // After work - countdown to next day's start (tomorrow 8:30 AM)
          targetTime = workStartTime + (24 * 60); // Add 24 hours
        }
        
        let diffMinutes = targetTime - currentMinutes;
        if (diffMinutes < 0) {
          diffMinutes += 24 * 60; // Add 24 hours if negative
        }
        
        const hours = Math.floor(diffMinutes / 60);
        const minutes = diffMinutes % 60;
        const seconds = 60 - now.getSeconds();
        
        setCountdown({ hours, minutes, seconds });
      }, 1000);
      
      return () => clearInterval(interval);
    }
  }, [attendanceData.todayStatus]);

  const checkBirthday = () => {
    if (!employeeData?.date_of_birth) return;
    
    const today = new Date();
    const dob = new Date(employeeData.date_of_birth);
    
    // Check if today is birthday (month and day match)
    const isBday = today.getMonth() === dob.getMonth() && today.getDate() === dob.getDate();
    setIsBirthday(isBday);
  };

  const fetchNotifications = async () => {
    try {
      const response = await axios.get(`${API}/notifications`);
      // Get all recent notifications (last 10) - backend already sorts by newest first
      const recentNotifications = response.data.slice(0, 10);
      setNotifications(recentNotifications);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  const toggleNotificationRead = async (notificationId, currentReadStatus) => {
    try {
      // Toggle the read status
      await axios.put(`${API}/notifications/${notificationId}/read`, {
        is_read: !currentReadStatus
      });
      toast.success(currentReadStatus ? 'Notification marked as unread' : 'Notification marked as read');
      // Refresh notifications
      fetchNotifications();
      // Refresh sidebar notification counts
      if (window.refreshSidebarNotifications) {
        window.refreshSidebarNotifications();
      }
    } catch (error) {
      console.error('Error toggling notification status:', error);
      toast.error('Failed to update notification');
    }
  };

  const clearReadNotifications = async () => {
    try {
      const response = await axios.delete(`${API}/notifications/clear-read`);
      toast.success(response.data.message);
      // Refresh notifications
      fetchNotifications();
      // Refresh sidebar notification counts
      if (window.refreshSidebarNotifications) {
        window.refreshSidebarNotifications();
      }
    } catch (error) {
      console.error('Error clearing read notifications:', error);
      toast.error('Failed to clear read notifications');
    }
  };

  const markAllAsRead = async () => {
    try {
      await axios.put(`${API}/notifications/mark-all-read`);
      toast.success('All notifications marked as read');
      // Refresh notifications
      fetchNotifications();
      // Refresh sidebar notification counts
      if (window.refreshSidebarNotifications) {
        window.refreshSidebarNotifications();
      }
    } catch (error) {
      console.error('Error marking all as read:', error);
      toast.error('Failed to mark all as read');
    }
  };

  const handleNotificationClick = (notification) => {
    // Mark as read if unread
    if (!notification.is_read) {
      toggleNotificationRead(notification.id, notification.is_read);
    }

    // Navigate based on notification type/category
    switch (notification.category) {
      case 'payslip':
        navigate('/employee/payslips');
        break;
      case 'leave':
        navigate('/employee/leave');
        break;
      case 'loan':
        navigate('/employee/finances');
        break;
      case 'attendance':
        navigate('/employee/attendance');
        break;
      case 'ot':
        navigate('/employee/attendance');
        break;
      case 'document':
        navigate('/employee/documents');
        break;
      default:
        // For general notifications, just mark as read
        break;
    }
  };


  const fetchUpcomingEvents = async () => {
    try {
      const events = [];
      const today = new Date();
      today.setHours(0, 0, 0, 0); // Normalize to start of day
      
      // Declare allEmployees outside try-catch so it's accessible later
      let allEmployees = [];
      
      // Fetch all employees for birthdays and anniversaries
      try {
        const employeesResponse = await axios.get(`${API}/employees`);
        allEmployees = employeesResponse.data;
        
        // Filter only active employees
        const activeEmployees = allEmployees.filter(emp => emp.status === 'active');
        
        // Process birthdays for active employees only
        activeEmployees.forEach(emp => {
          if (emp.date_of_birth) {
            const dob = new Date(emp.date_of_birth);
            const nextBirthday = new Date(today.getFullYear(), dob.getMonth(), dob.getDate());
            nextBirthday.setHours(0, 0, 0, 0);
            
            if (nextBirthday < today) {
              nextBirthday.setFullYear(today.getFullYear() + 1);
            }
            
            const daysUntilBirthday = Math.floor((nextBirthday - today) / (1000 * 60 * 60 * 24));
            
            // Show birthdays within next 30 days (including today)
            if (daysUntilBirthday <= 30 && daysUntilBirthday >= 0) {
              events.push({
                type: 'birthday',
                title: `${emp.name}'s Birthday`,
                subtitle: emp.employee_id === employeeData.employee_id ? '(You!)' : '',
                date: nextBirthday,
                daysUntil: daysUntilBirthday,
                icon: '🎂'
              });
            }
          }
          
          // Process work anniversaries
          if (emp.date_of_joining) {
            const joiningDate = new Date(emp.date_of_joining);
            const yearsWorked = today.getFullYear() - joiningDate.getFullYear();
            
            const nextAnniversary = new Date(today.getFullYear(), joiningDate.getMonth(), joiningDate.getDate());
            nextAnniversary.setHours(0, 0, 0, 0);
            
            if (nextAnniversary < today) {
              nextAnniversary.setFullYear(today.getFullYear() + 1);
            }
            
            const daysUntilAnniversary = Math.floor((nextAnniversary - today) / (1000 * 60 * 60 * 24));
            
            // Show anniversaries within next 30 days (including today)
            if (daysUntilAnniversary <= 30 && daysUntilAnniversary >= 0 && yearsWorked > 0) {
              events.push({
                type: 'anniversary',
                title: `${emp.name}${emp.employee_id === employeeData.employee_id ? ' (You)' : ''} - ${yearsWorked + 1} Year${yearsWorked + 1 > 1 ? 's' : ''}`,
                date: nextAnniversary,
                daysUntil: daysUntilAnniversary,
                icon: '🎉'
              });
            }
          }
        });
      } catch (error) {
        console.error('Error fetching employees for events:', error);
      }

      // Fetch holidays from holidays collection
      try {
        const holidaysResponse = await axios.get(`${API}/holidays`);
        const holidays = holidaysResponse.data || [];
        
        const upcomingHolidays = holidays
          .map(h => ({
            ...h,
            date: new Date(h.date)
          }))
          .filter(h => {
            h.date.setHours(0, 0, 0, 0);
            const daysUntil = Math.floor((h.date - today) / (1000 * 60 * 60 * 24));
            return daysUntil >= 0 && daysUntil <= 30; // Next 30 days including today
          })
          .sort((a, b) => a.date - b.date)
          .map(h => ({
            type: 'holiday',
            title: h.name,
            date: h.date,
            daysUntil: Math.floor((h.date - today) / (1000 * 60 * 60 * 24)),
            icon: '🎊'
          }));
        
        events.push(...upcomingHolidays);
      } catch (error) {
        console.error('Error fetching holidays:', error);
      }

      // Fetch admin-created events
      try {
        const adminEventsResponse = await axios.get(`${API}/events`);
        const adminEvents = adminEventsResponse.data || [];
        
        // Process admin events
        const processedAdminEvents = adminEvents.map(event => {
          const eventDate = new Date(event.date);
          eventDate.setHours(0, 0, 0, 0);
          const daysUntil = Math.floor((eventDate - today) / (1000 * 60 * 60 * 24));
          
          // Get icon based on event type
          const eventIcons = {
            'company': '🏢',
            'team': '👥',
            'milestone': '🎯',
            'other': '📅'
          };
          
          return {
            type: 'event',
            title: event.title,
            subtitle: event.description || '',
            date: eventDate,
            daysUntil: daysUntil,
            icon: eventIcons[event.event_type] || '📅'
          };
        }).filter(event => event.daysUntil >= 0 && event.daysUntil <= 30); // Only show events within 30 days including today
        
        events.push(...processedAdminEvents);
      } catch (error) {
        console.error('Error fetching admin events:', error);
      }

      // Fetch employees on leave (approved leaves for next 7 days)
      try {
        const leavesResponse = await axios.get(`${API}/leaves`);
        const allLeaves = leavesResponse.data || [];
        
        // Filter approved leaves that overlap with next 7 days
        const nextWeek = new Date(today);
        nextWeek.setDate(today.getDate() + 7);
        
        const upcomingLeaves = allLeaves
          .filter(leave => leave.status === 'approved')
          .map(leave => ({
            ...leave,
            start_date: new Date(leave.start_date),
            end_date: new Date(leave.end_date)
          }))
          .filter(leave => {
            leave.start_date.setHours(0, 0, 0, 0);
            leave.end_date.setHours(0, 0, 0, 0);
            // Check if leave overlaps with today to next 7 days
            return leave.start_date <= nextWeek && leave.end_date >= today;
          });
        
        // Group by employee
        const leavesByEmployee = {};
        upcomingLeaves.forEach(leave => {
          if (!leavesByEmployee[leave.employee_id]) {
            // Look up employee name from allEmployees array
            const employee = allEmployees.find(e => e.employee_id === leave.employee_id);
            const employeeName = employee ? employee.name : 'Unknown Employee';
            
            leavesByEmployee[leave.employee_id] = {
              employee_id: leave.employee_id,
              employee_name: employeeName,
              leaves: []
            };
          }
          leavesByEmployee[leave.employee_id].leaves.push(leave);
        });
        
        // Add leave events
        Object.values(leavesByEmployee).forEach(empLeave => {
          // Find the earliest leave start date
          const earliestLeave = empLeave.leaves.sort((a, b) => a.start_date - b.start_date)[0];
          const daysUntil = Math.floor((earliestLeave.start_date - today) / (1000 * 60 * 60 * 24));
          
          // Determine if on leave today or starting soon
          const isOnLeaveToday = earliestLeave.start_date <= today && earliestLeave.end_date >= today;
          
          events.push({
            type: 'leave',
            title: `${empLeave.employee_name}${empLeave.employee_id === employeeData.employee_id ? ' (You!)' : ''}`,
            subtitle: isOnLeaveToday ? 'On leave today' : `Leave starts ${format(earliestLeave.start_date, 'MMM dd')}`,
            date: earliestLeave.start_date,
            daysUntil: daysUntil,
            icon: '🏖️'
          });
        });
      } catch (error) {
        console.error('Error fetching leaves:', error);
      }

      // Sort by days until (closest first), then by type (leaves first if today)
      events.sort((a, b) => {
        if (a.daysUntil === b.daysUntil) {
          // If same day, prioritize leaves
          if (a.type === 'leave' && b.type !== 'leave') return -1;
          if (b.type === 'leave' && a.type !== 'leave') return 1;
          return 0;
        }
        return a.daysUntil - b.daysUntil;
      });
      
      // Show max 6 events
      setUpcomingEvents(events.slice(0, 6));
    } catch (error) {
      console.error('Error fetching upcoming events:', error);
    }
  };

  const fetchLeaveEntitlement = async () => {
    try {
      const response = await axios.get(`${API}/leaves/entitlement/${employeeData.employee_id}`);
      setLeaveEntitlement(response.data);
    } catch (error) {
      console.error('Error fetching leave entitlement:', error);
    }
  };

  const fetchEmployeeRating = async () => {
    try {
      const now = new Date();
      const params = {
        period: 'current_month',
        month: now.getMonth() + 1,
        year: now.getFullYear()
      };
      
      const response = await axios.get(`${API}/employees/${employeeData.employee_id}/rating`, {
        params
      });
      setRating(response.data);
    } catch (error) {
      console.error('Error fetching employee rating:', error);
      // Set default rating on error
      setRating({
        rating: 4.0,
        period: 'current_month',
        details: {
          attendance_days: 0
        }
      });
    }
  };


  const fetchMonthlySummary = async () => {
    try {
      const now = new Date();
      const month = now.getMonth() + 1;
      const year = now.getFullYear();
      
      // Fetch attendance records (same as Attendance page)
      const attendanceResponse = await axios.get(`${API}/attendance/my-attendance`, {
        params: { month, year }
      });
      
      // Fetch OT logs (same as Attendance page)
      const otResponse = await axios.get(`${API}/ot/my-ot`);
      
      let attendanceRecords = attendanceResponse.data || [];
      
      console.log('Dashboard: API returned', attendanceRecords.length, 'records');
      
      // If no attendance records, calculate them
      if (!attendanceRecords || attendanceRecords.length === 0) {
        console.log('Dashboard: No attendance records, calculating...');
        attendanceRecords = await calculateAttendanceForDashboard(month, year);
        console.log('Dashboard: After calculation, have', attendanceRecords.length, 'records');
      }
      
      // Calculate hours exactly like Attendance page
      let totalWorkingHours = 0;
      
      // Sum working hours from attendance records
      // Only count records that have valid status (exclude weekends/holidays with 0 hours)
      attendanceRecords.forEach(record => {
        // Only count actual working hours (present, half-day, etc.)
        // Records with status 'weekend', 'holiday', 'leave' should have working_hours = 0
        if (record.working_hours && record.working_hours > 0) {
          totalWorkingHours += record.working_hours;
        }
      });
      
      // Add approved OT hours for current month
      const monthStr = `${year}-${String(month).padStart(2, '0')}`;
      let totalOTHours = 0;
      otResponse.data.forEach(log => {
        if (log.status === 'approved' && log.date && log.date.startsWith(monthStr)) {
          totalOTHours += log.hours || log.ot_hours || 0;
        }
      });
      
      const totalHours = totalWorkingHours + totalOTHours;
      
      console.log('Dashboard Calculation:', {
        month,
        year,
        attendanceRecords: attendanceRecords.length,
        totalWorkingHours,
        totalOTHours,
        totalHours
      });
      
      // Count days
      const presentDays = attendanceRecords.filter(r => r.status === 'present').length;
      const leaveDays = attendanceRecords.filter(r => r.status === 'leave').length;
      const halfDays = attendanceRecords.filter(r => r.status === 'half-day').length;
      
      setMonthlySummary({
        present_days: presentDays,
        leave_days: leaveDays,
        half_days: halfDays,
        regular_working_hours: totalWorkingHours,
        ot_hours: totalOTHours,
        total_hours: totalHours
      });
      
      setAttendanceData(prev => ({
        ...prev,
        thisMonthHours: `${Math.round(totalHours)}h`,
        regularHours: totalWorkingHours,
        otHours: totalOTHours
      }));
    } catch (error) {
      console.error('Error fetching monthly summary:', error);
    }
  };

  const isWorkingDay = (date, workingDaysConfig, holidays) => {
    const dayOfWeek = date.getDay(); // 0 = Sunday, 6 = Saturday
    const dateStr = date.toISOString().split('T')[0];
    
    // Check if it's a holiday
    if (holidays.some(h => h.date === dateStr)) {
      return false;
    }
    
    // Check Sunday
    if (dayOfWeek === 0) {
      return !workingDaysConfig.sunday_off;
    }
    
    // Check Saturday
    if (dayOfWeek === 6) {
      const saturdayPolicy = workingDaysConfig.saturday_policy || 'alternate';
      if (saturdayPolicy === 'all_off') {
        return false;
      } else if (saturdayPolicy === 'alternate' || saturdayPolicy === 'custom') {
        // Calculate which Saturday of the month
        const firstDay = new Date(date.getFullYear(), date.getMonth(), 1);
        let firstSaturday = new Date(firstDay);
        while (firstSaturday.getDay() !== 6) {
          firstSaturday.setDate(firstSaturday.getDate() + 1);
        }
        const saturdayNumber = Math.floor((date.getDate() - firstSaturday.getDate()) / 7) + 1;
        const offSaturdays = workingDaysConfig.off_saturdays || [1, 3];
        return !offSaturdays.includes(saturdayNumber);
      }
      return true; // all_working
    }
    
    return true; // Monday-Friday
  };

  const calculateAttendanceForDashboard = async (month, year) => {
    try {
      console.log('Dashboard: Calculating attendance for month:', month, year);
      
      // Fetch settings
      const settingsResponse = await axios.get(`${API}/settings`);
      const workingDaysConfig = settingsResponse.data.working_days_config || {
        saturday_policy: 'alternate',
        off_saturdays: [1, 3],
        sunday_off: true
      };
      const holidays = settingsResponse.data.holidays || [];
      
      // Fetch approved leaves
      let approvedLeaves = [];
      try {
        const leavesResponse = await axios.get(`${API}/leaves/approved-by-month`, {
          params: { month, year }
        });
        approvedLeaves = Array.isArray(leavesResponse.data) ? leavesResponse.data : [];
        console.log('Dashboard: Fetched leaves:', approvedLeaves.length, 'records');
      } catch (err) {
        console.log('Dashboard: No leaves found or error fetching leaves:', err);
        approvedLeaves = [];
      }
      
      // Calculate for all days in the month
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const attendanceRecords = [];
      
      for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
        const currentDate = new Date(d);
        currentDate.setHours(0, 0, 0, 0);
        const dateStr = currentDate.toISOString().split('T')[0];
        const isFutureDate = currentDate > today;
        const dayOfWeek = currentDate.getDay();
        
        // Skip future dates
        if (isFutureDate) {
          continue;
        }
        
        // Check if it's a holiday FIRST
        const isHolidayDay = holidays.some(h => h.date === dateStr);
        if (isHolidayDay) {
          // Don't add holiday records to attendance calculation
          continue;
        }
        
        // Check if it's Sunday
        if (dayOfWeek === 0 && workingDaysConfig.sunday_off) {
          // Don't add Sunday weekend records
          continue;
        }
        
        // Check if it's Saturday
        if (dayOfWeek === 6) {
          const saturdayPolicy = workingDaysConfig.saturday_policy || 'alternate';
          if (saturdayPolicy === 'all_off') {
            continue;
          } else if (saturdayPolicy === 'alternate') {
            const firstDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
            let firstSaturday = new Date(firstDay);
            while (firstSaturday.getDay() !== 6) {
              firstSaturday.setDate(firstSaturday.getDate() + 1);
            }
            const saturdayNumber = Math.floor((currentDate.getDate() - firstSaturday.getDate()) / 7) + 1;
            const offSaturdays = workingDaysConfig.off_saturdays || [1, 3];
            if (offSaturdays.includes(saturdayNumber)) {
              continue;
            }
          }
        }
        
        // Check if employee is on leave
        const onLeave = approvedLeaves.find(leave => {
          const leaveStart = new Date(leave.from_date);
          const leaveEnd = new Date(leave.to_date);
          leaveStart.setHours(0, 0, 0, 0);
          leaveEnd.setHours(0, 0, 0, 0);
          return currentDate >= leaveStart && currentDate <= leaveEnd;
        });
        
        if (onLeave) {
          attendanceRecords.push({
            date: dateStr,
            status: onLeave.leave_type === 'half-day' ? 'half-day' : 'leave',
            working_hours: onLeave.leave_type === 'half-day' ? 4.0 : 0
          });
          continue;
        }
        
        // Only after ALL checks pass - it's a working day, mark as present
        attendanceRecords.push({
          date: dateStr,
          status: 'present',
          working_hours: 8.0
        });
      }
      
      console.log('Dashboard: Calculated', attendanceRecords.length, 'attendance records');
      return attendanceRecords;
    } catch (error) {
      console.error('Dashboard: Error calculating attendance:', error);
      return [];
    }
  };

  const fetchTodayAttendance = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const now = new Date();
      const month = now.getMonth() + 1;
      const year = now.getFullYear();
      
      // Fetch working days config and holidays
      const settingsResponse = await axios.get(`${API}/settings`);
      const workingDaysConfig = settingsResponse.data.working_days_config || {
        saturday_policy: 'alternate',
        off_saturdays: [1, 3],
        sunday_off: true
      };
      const holidays = settingsResponse.data.holidays || [];
      
      const response = await axios.get(`${API}/attendance/my-attendance`, {
        params: { month, year }
      });
      
      // Fetch today's OT logs
      const otResponse = await axios.get(`${API}/ot/my-ot`);
      const todayOT = otResponse.data.filter(log => log.date === today);
      
      const todayRecord = response.data.find(record => record.date === today);
      
      console.log('🔍 Today attendance check:', {
        today: today,
        todayRecord: todayRecord,
        recordStatus: todayRecord?.status,
        todayOTCount: todayOT.length
      });
      
      // Check if employee is on approved leave today
      let isOnLeaveToday = false;
      try {
        const leaveResponse = await axios.get(`${API}/leaves`);
        const todayLeave = leaveResponse.data.find(leave => {
          const leaveStart = new Date(leave.start_date);
          const leaveEnd = new Date(leave.end_date);
          const todayDate = new Date(today);
          leaveStart.setHours(0, 0, 0, 0);
          leaveEnd.setHours(0, 0, 0, 0);
          todayDate.setHours(0, 0, 0, 0);
          
          const isOnLeave = leave.status === 'approved' && todayDate >= leaveStart && todayDate <= leaveEnd;
          
          console.log('Checking leave:', {
            leave_id: leave.id,
            start: leave.start_date,
            end: leave.end_date,
            status: leave.status,
            today: today,
            isOnLeave: isOnLeave
          });
          
          return isOnLeave;
        });
        
        isOnLeaveToday = !!todayLeave;
        console.log('📋 Leave check result:', isOnLeaveToday ? 'ON LEAVE' : 'NOT ON LEAVE');
      } catch (leaveError) {
        console.error('Error checking leave status:', leaveError);
      }
      
      // If on leave, show leave status (even if attendance record shows absent)
      if (isOnLeaveToday) {
        console.log('✅ Employee is on approved leave - showing leave status');
        setAttendanceData(prev => ({
          ...prev,
          todayStatus: 'leave',
          checkInTime: '-',
          checkOutTime: '-',
          totalHours: '0h 0m',
          todayOT: 0,
          todayOTLogs: []
        }));
        return; // Exit early
      }
      
      if (todayRecord && todayRecord.status === 'present') {
        const workingHours = todayRecord.working_hours || 0;
        const hours = Math.floor(workingHours);
        const minutes = Math.round((workingHours - hours) * 60);
        
        // Calculate total OT hours for today
        const totalOTToday = todayOT.reduce((sum, log) => sum + (log.ot_hours || 0), 0);
        const totalHoursToday = workingHours + totalOTToday;
        const totalH = Math.floor(totalHoursToday);
        const totalM = Math.round((totalHoursToday - totalH) * 60);
        
        setAttendanceData(prev => ({
          ...prev,
          todayStatus: todayRecord.status,
          checkInTime: todayRecord.status === 'present' ? '08:30 AM' : '-',
          checkOutTime: todayRecord.status === 'present' ? '05:30 PM' : '-',
          totalHours: `${totalH}h ${totalM}m`,
          todayOT: totalOTToday,
          todayOTLogs: todayOT
        }));
      } else if (todayOT.length > 0) {
        // OT logged - check if it's a working day or weekend
        const todayDate = new Date();
        const isTodayWorkingDay = isWorkingDay(todayDate, workingDaysConfig, holidays);
        
        const totalOTToday = todayOT.reduce((sum, log) => sum + (log.ot_hours || 0), 0);
        const totalH = Math.floor(totalOTToday);
        const totalM = Math.round((totalOTToday - totalH) * 60);
        
        setAttendanceData(prev => ({
          ...prev,
          todayStatus: isTodayWorkingDay ? 'workday-ot' : 'weekend-ot',
          checkInTime: todayOT[0]?.from_time || '-',
          checkOutTime: todayOT[0]?.to_time || '-',
          totalHours: `${totalH}h ${totalM}m`,
          todayOT: totalOTToday,
          todayOTLogs: todayOT
        }));
      } else {
        // No attendance record - check if employee is on leave today
        try {
          const leaveResponse = await axios.get(`${API}/leave/my-leaves`);
          const todayLeave = leaveResponse.data.find(leave => {
            const leaveStart = new Date(leave.start_date);
            const leaveEnd = new Date(leave.end_date);
            const todayDate = new Date(today);
            leaveStart.setHours(0, 0, 0, 0);
            leaveEnd.setHours(0, 0, 0, 0);
            todayDate.setHours(0, 0, 0, 0);
            
            const isOnLeave = leave.status === 'approved' && todayDate >= leaveStart && todayDate <= leaveEnd;
            
            console.log('Checking leave:', {
              leave_id: leave.id,
              start: leave.start_date,
              end: leave.end_date,
              status: leave.status,
              today: today,
              isOnLeave: isOnLeave
            });
            
            return isOnLeave;
          });
          
          console.log('Today leave check result:', todayLeave ? 'ON LEAVE' : 'NOT ON LEAVE');
          
          if (todayLeave) {
            // Employee is on approved leave today
            console.log('Setting status to LEAVE');
            setAttendanceData(prev => ({
              ...prev,
              todayStatus: 'leave',
              checkInTime: '-',
              checkOutTime: '-',
              totalHours: '0h 0m',
              todayOT: 0,
              todayOTLogs: []
            }));
            return; // Exit early, don't check working day
          }
        } catch (leaveError) {
          console.error('Error checking leave status:', leaveError);
        }
        
        // Not on leave - check if it's actually a working day
        const todayDate = new Date();
        const isTodayWorkingDay = isWorkingDay(todayDate, workingDaysConfig, holidays);
        
        console.log('Working day check:', {
          isTodayWorkingDay,
          date: todayDate,
          workingDaysConfig,
          holidays
        });
        
        if (isTodayWorkingDay) {
          // It's a working day but no attendance generated yet
          // Check if work day has started (after 8:30 AM)
          const currentHour = todayDate.getHours();
          const currentMinute = todayDate.getMinutes();
          const currentTimeInMinutes = currentHour * 60 + currentMinute;
          const workStartTime = 8 * 60 + 30; // 8:30 AM = 510 minutes
          const workEndTime = 17 * 60 + 30; // 5:30 PM = 1050 minutes
          
          let displayStatus = 'checked-out';
          let displayCheckIn = '-';
          let displayCheckOut = '-';
          let displayHours = '0h 0m';
          
          if (currentTimeInMinutes < workStartTime) {
            // Before work starts
            displayStatus = 'before-work';
            displayCheckIn = '-';
            displayCheckOut = '-';
            displayHours = '0h 0m';
          } else if (currentTimeInMinutes >= workStartTime && currentTimeInMinutes < workEndTime) {
            // During work hours
            displayStatus = 'checked-in';
            displayCheckIn = '08:30 AM';
            displayCheckOut = '-';
            // Calculate hours so far
            const workedMinutes = currentTimeInMinutes - workStartTime;
            const workedHours = Math.floor(workedMinutes / 60);
            const workedMins = workedMinutes % 60;
            displayHours = `${workedHours}h ${workedMins}m`;
          } else {
            // After work ends
            displayStatus = 'after-work';
            displayCheckIn = '08:30 AM';
            displayCheckOut = '05:30 PM';
            displayHours = '8h 0m';
          }
          
          setAttendanceData(prev => ({
            ...prev,
            todayStatus: displayStatus,
            checkInTime: displayCheckIn,
            checkOutTime: displayCheckOut,
            totalHours: displayHours,
            todayOT: 0,
            todayOTLogs: []
          }));
        } else {
          // Weekend/Holiday with no OT
          console.log('Setting status to WEEKEND');
          setAttendanceData(prev => ({
            ...prev,
            todayStatus: 'weekend',
            checkInTime: '-',
            checkOutTime: '-',
            totalHours: '0h 0m',
            todayOT: 0,
            todayOTLogs: []
          }));
        }
      }
    } catch (error) {
      console.error('Error fetching today attendance:', error);
    }
  };

  const handleQuickAction = (action) => {
    switch (action) {
      case 'payslips':
        navigate('/employee/payslips');
        break;
      case 'leave':
        navigate('/employee/leave');
        break;
      case 'loans':
        navigate('/employee/finances');
        break;
      case 'profile':
        navigate('/employee/profile');
        break;
      case 'attendance':
        navigate('/employee/attendance');
        break;
      case 'documents':
        navigate('/employee/documents');
        break;
      default:
        break;
    }
  };

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

  const salary = employeeData?.salary_structure;
  const grossSalary = salary ? (
    (salary.basic_salary || 0) + 
    (salary.house_rent_allowance || salary.hra || 0) + 
    (salary.medical_allowance || 0) + 
    (salary.leave_travel_allowance || salary.travel_allowance || 0) + 
    (salary.conveyance_allowance || salary.food_allowance || 0) + 
    (salary.performance_incentive || salary.internet_allowance || 0) + 
    (salary.other_benefits || salary.special_allowance || 0)
  ) : 0;

  const totalDeductions = salary ? (
    (salary.pf_employee || 0) + 
    (salary.esi_employee || 0) + 
    (salary.professional_tax || 0) + 
    (salary.tds || 0) + 
    (salary.loan_deductions || 0) + 
    (salary.others || 0)
  ) : 0;

  const netSalary = grossSalary - totalDeductions;

  return (
    <div className="space-y-6">
      {/* Birthday Wishes Card */}
      {isBirthday && (
        <Card className="bg-gradient-to-r from-yellow-400 via-pink-500 to-purple-500 dark:from-yellow-500 dark:via-pink-600 dark:to-purple-600 border-0 overflow-hidden relative shadow-elevated">
          <div className="absolute inset-0 opacity-20">
            <div className="absolute top-2 left-4 text-4xl animate-bounce">🎈</div>
            <div className="absolute top-4 right-8 text-3xl animate-bounce delay-100">🎉</div>
            <div className="absolute bottom-4 left-12 text-3xl animate-bounce delay-200">🎊</div>
            <div className="absolute bottom-2 right-16 text-4xl animate-bounce delay-300">🎁</div>
          </div>
          <CardContent className="p-8 text-center relative z-10">
            <div className="flex items-center justify-center mb-4">
              <Cake className="h-12 w-12 text-white drop-shadow-lg mr-3" />
              <h2 className="text-4xl font-bold text-white drop-shadow-lg">Happy Birthday!</h2>
              <PartyPopper className="h-12 w-12 text-white drop-shadow-lg ml-3" />
            </div>
            <p className="text-2xl text-white font-semibold mb-2 drop-shadow-md">
              {employeeData?.name?.split(' ')[0]}, wishing you a fantastic day! 🎂
            </p>
            <p className="text-lg text-white drop-shadow-md">
              The entire team at Element Tree wishes you joy, success, and wonderful memories today!
            </p>
          </CardContent>
        </Card>
      )}

      {/* Welcome Header - Impressive Dark Mode */}
      <div className="relative overflow-hidden bg-gradient-to-r from-blue-600 to-purple-600 dark:from-primary dark:via-primary dark:to-primary rounded-xl p-8 text-white shadow-elevated dark:shadow-[0_8px_32px_hsl(var(--primary)_/_0.3)] dark:border dark:border-primary/30">
        {/* Animated Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 -left-4 w-72 h-72 bg-white rounded-full mix-blend-overlay filter blur-xl animate-blob"></div>
          <div className="absolute top-0 -right-4 w-72 h-72 bg-white rounded-full mix-blend-overlay filter blur-xl animate-blob animation-delay-2000"></div>
          <div className="absolute -bottom-8 left-20 w-72 h-72 bg-white rounded-full mix-blend-overlay filter blur-xl animate-blob animation-delay-4000"></div>
        </div>
        
        <div className="relative flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Avatar className="h-20 w-20 border-4 border-white dark:border-primary/40 shadow-lg">
              <AvatarImage src={employeeData?.photo_url} />
              <AvatarFallback className="text-xl bg-white text-blue-600 dark:bg-primary/20 dark:text-primary font-bold">
                {employeeData?.name?.split(' ').map(n => n[0]).join('') || user?.username?.slice(0,2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-4xl font-bold mb-2 dark:text-glow">Welcome back, {employeeData?.name?.split(' ')[0] || user?.username}! 👋</h1>
              <p className="text-blue-100 dark:text-primary/20 text-lg">{employeeData?.designation} • {employeeData?.department}</p>
              <p className="text-blue-100 dark:text-primary/20 text-sm">Employee ID: {employeeData?.employee_id}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm text-blue-100 dark:text-primary/20 mb-2">{new Date().toLocaleDateString('en-IN', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}</p>
            <div className="mt-2">
              <Badge variant="secondary" className="bg-white/20 hover:bg-white/30 dark:bg-white/10 dark:hover:bg-white/20 text-white border-white/30 dark:border-white/20 backdrop-blur-sm transition-all duration-300 hover:scale-105">
                {attendanceData.todayStatus === 'checked-in' ? 'Checked In' : 
                 attendanceData.todayStatus === 'checked-out' ? 'Checked Out' : 'Not Started'}
              </Badge>
            </div>
          </div>
        </div>
      </div>
      {/* Today's Attendance Card */}
      <Card className={`card-elevated bg-gradient-to-r ${
        attendanceData.todayStatus === 'present' ? 'from-green-50 to-emerald-50 dark:from-emerald-900/30 dark:to-green-900/30 border-emerald-200 dark:border-emerald-500/30' :
        attendanceData.todayStatus === 'workday-ot' ? 'from-green-50 to-emerald-50 dark:from-emerald-900/30 dark:to-green-900/30 border-emerald-200 dark:border-emerald-500/30' :
        attendanceData.todayStatus === 'weekend-ot' ? 'from-blue-50 to-indigo-50 dark:from-blue-900/30 dark:to-indigo-900/30 border-blue-200 dark:border-blue-500/30' :
        attendanceData.todayStatus === 'leave' ? 'from-red-50 to-pink-50 dark:from-red-900/30 dark:to-pink-900/30 border-red-200 dark:border-red-500/30' :
        'from-gray-50 to-slate-50 dark:from-gray-800/30 dark:to-slate-800/30 border-gray-200 dark:border-gray-500/30'
      }`}>
        <CardHeader>
          <CardTitle className={`flex items-center justify-between ${
            attendanceData.todayStatus === 'present' ? 'text-emerald-700' :
            attendanceData.todayStatus === 'workday-ot' ? 'text-emerald-700' :
            attendanceData.todayStatus === 'weekend-ot' ? 'text-blue-700' :
            attendanceData.todayStatus === 'leave' ? 'text-red-700' :
            'text-gray-700'
          }`}>
            <div className="flex items-center space-x-2">
              <Activity className="h-5 w-5" />
              <span>Today's Status</span>
            </div>
            <Badge variant={
              attendanceData.todayStatus === 'present' ? 'default' :
              attendanceData.todayStatus === 'checked-in' ? 'default' :
              attendanceData.todayStatus === 'workday-ot' ? 'default' :
              attendanceData.todayStatus === 'before-work' ? 'secondary' :
              attendanceData.todayStatus === 'after-work' ? 'secondary' :
              attendanceData.todayStatus === 'weekend-ot' ? 'secondary' :
              attendanceData.todayStatus === 'leave' ? 'destructive' :
              'outline'
            }>
              {attendanceData.todayStatus === 'present' ? 'Working Day' :
               attendanceData.todayStatus === 'checked-in' ? 'Working Day' :
               attendanceData.todayStatus === 'workday-ot' ? 'Working Day + OT' :
               attendanceData.todayStatus === 'before-work' ? 'Working Day' :
               attendanceData.todayStatus === 'after-work' ? 'Working Day' :
               attendanceData.todayStatus === 'weekend-ot' ? 'Weekend + OT' :
               attendanceData.todayStatus === 'leave' ? 'On Leave' :
               'Weekend/Holiday'}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {attendanceData.todayStatus === 'workday-ot' ? (
            <div className="space-y-4">
              <div className="bg-green-100 dark:bg-green-900/30 border border-green-300 dark:border-green-500/30 rounded-lg p-4">
                <p className="text-sm font-medium text-green-800 dark:text-green-300 mb-2">
                  🚀 Great dedication! You're logging OT on a working day
                </p>
                <div className="grid md:grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs text-green-600 dark:text-green-400">OT Hours Logged</p>
                    <p className="text-xl font-bold text-green-800 dark:text-green-300">{attendanceData.totalHours}</p>
                  </div>
                  {attendanceData.todayOTLogs && attendanceData.todayOTLogs.length > 0 && (
                    <div>
                      <p className="text-xs text-green-600 dark:text-green-400">Time Range</p>
                      <p className="text-sm font-semibold text-green-800 dark:text-green-300">
                        {attendanceData.todayOTLogs[0].from_time} - {attendanceData.todayOTLogs[0].to_time}
                      </p>
                    </div>
                  )}
                </div>
                {attendanceData.todayOTLogs && attendanceData.todayOTLogs.length > 0 && (
                  <div className="mt-2">
                    <p className="text-xs text-green-600 dark:text-green-400">Project</p>
                    <p className="text-sm font-medium text-green-800 dark:text-green-300">{attendanceData.todayOTLogs[0].project}</p>
                  </div>
                )}
              </div>
            </div>
          ) : attendanceData.todayStatus === 'weekend-ot' ? (
            <div className="space-y-4">
              <div className="bg-blue-100 dark:bg-blue-900/30 border border-blue-300 dark:border-blue-500/30 rounded-lg p-4">
                <p className="text-sm font-medium text-blue-800 dark:text-blue-300 mb-2">
                  🎯 You're working overtime today!
                </p>
                <div className="grid md:grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs text-blue-600 dark:text-blue-400">OT Hours Logged</p>
                    <p className="text-xl font-bold text-blue-800 dark:text-blue-300">{attendanceData.totalHours}</p>
                  </div>
                  {attendanceData.todayOTLogs && attendanceData.todayOTLogs.length > 0 && (
                    <div>
                      <p className="text-xs text-blue-600 dark:text-blue-400">Time Range</p>
                      <p className="text-sm font-semibold text-blue-800 dark:text-blue-300">
                        {attendanceData.todayOTLogs[0].from_time} - {attendanceData.todayOTLogs[0].to_time}
                      </p>
                    </div>
                  )}
                </div>
                {attendanceData.todayOTLogs && attendanceData.todayOTLogs.length > 0 && (
                  <div className="mt-2">
                    <p className="text-xs text-blue-600 dark:text-blue-400">Project</p>
                    <p className="text-sm font-medium text-blue-800 dark:text-blue-300">{attendanceData.todayOTLogs[0].project}</p>
                  </div>
                )}
              </div>
            </div>
          ) : attendanceData.todayStatus === 'present' ? (
            <div className="grid md:grid-cols-3 gap-4">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-emerald-600 dark:bg-emerald-500/30 rounded-full flex items-center justify-center">
                  <CheckCircle className="h-4 w-4 text-white dark:text-emerald-300" />
                </div>
                <div>
                  <p className="text-sm text-emerald-600 dark:text-emerald-400">Check In</p>
                  <p className="font-semibold dark:text-gray-200">{attendanceData.checkInTime}</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-orange-500 dark:bg-orange-500/30 rounded-full flex items-center justify-center">
                  <Clock className="h-4 w-4 text-white dark:text-orange-300" />
                </div>
                <div>
                  <p className="text-sm text-orange-600 dark:text-orange-400">Check Out</p>
                  <p className="font-semibold dark:text-gray-200">{attendanceData.checkOutTime}</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-blue-500 dark:bg-blue-500/30 rounded-full flex items-center justify-center">
                  <Clock className="h-4 w-4 text-white dark:text-blue-300" />
                </div>
                <div>
                  <p className="text-sm text-blue-600 dark:text-blue-400">Total Hours</p>
                  <p className="font-semibold dark:text-gray-200">{attendanceData.totalHours}</p>
                  {attendanceData.todayOT > 0 && (
                    <p className="text-xs text-blue-600 dark:text-blue-400">+{attendanceData.todayOT.toFixed(1)}h OT</p>
                  )}
                </div>
              </div>
            </div>
          ) : attendanceData.todayStatus === 'leave' ? (
            <div className="bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-500/30 rounded-lg p-4 text-center">
              <p className="text-red-800 dark:text-red-300 font-medium">You are on leave today</p>
            </div>
          ) : attendanceData.todayStatus === 'before-work' ? (
            <div className="bg-blue-100 dark:bg-blue-900/30 border border-blue-300 dark:border-blue-500/30 rounded-lg p-4">
              <div className="text-center">
                <p className="text-blue-800 dark:text-blue-300 font-medium mb-2">Working hours start in</p>
                <div className="flex justify-center items-center space-x-4 mb-2">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">{String(countdown.hours).padStart(2, '0')}</div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">hours</div>
                  </div>
                  <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">:</div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">{String(countdown.minutes).padStart(2, '0')}</div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">mins</div>
                  </div>
                  <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">:</div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">{String(countdown.seconds).padStart(2, '0')}</div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">secs</div>
                  </div>
                </div>
                <p className="text-sm text-blue-700 dark:text-blue-400">Work starts at 8:30 AM</p>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">You can log OT if you're working early</p>
              </div>
            </div>
          ) : attendanceData.todayStatus === 'after-work' ? (
            <div className="bg-purple-100 dark:bg-purple-900/30 border border-purple-300 dark:border-purple-500/30 rounded-lg p-4">
              <div className="text-center">
                <p className="text-purple-800 dark:text-purple-300 font-medium mb-2">Working hours ended - Great work today! 🎉</p>
                <p className="text-sm text-purple-700 dark:text-purple-400">Next work day starts in</p>
                <div className="flex justify-center items-center space-x-4 my-2">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">{String(countdown.hours).padStart(2, '0')}</div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">hours</div>
                  </div>
                  <div className="text-xl font-bold text-purple-600 dark:text-purple-400">:</div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">{String(countdown.minutes).padStart(2, '0')}</div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">mins</div>
                  </div>
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">You can still log OT if you're working late</p>
              </div>
            </div>
          ) : (
            <div className="bg-gray-100 dark:bg-gray-800/50 border border-gray-300 dark:border-gray-500/30 rounded-lg p-4 text-center">
              <p className="text-gray-700 dark:text-gray-300 font-medium">It's a weekend/holiday - Enjoy your day off! 🎉</p>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">You can log OT if you're working</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="card-elevated hover-glow cursor-pointer hover:shadow-xl transition-all duration-300" onClick={() => navigate('/employee/leave')}>
          <CardContent className="p-6">
            <div className="space-y-3">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-500/20 rounded-lg flex items-center justify-center dark:shadow-[0_0_15px_rgba(59,130,246,0.3)]">
                  <Calendar className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-500">Leave Balance</p>
                  {employeeData?.probation_end_date && new Date(employeeData.probation_end_date) > new Date() ? (
                    <>
                      <p className="text-lg font-bold text-orange-600">Probation</p>
                      <p className="text-xs text-gray-500">Until {new Date(employeeData.probation_end_date).toLocaleDateString()}</p>
                    </>
                  ) : leaveEntitlement ? (
                    <>
                      <p className="text-2xl font-bold text-blue-600">{leaveEntitlement.total_available_leaves.toFixed(1)}</p>
                      <p className="text-sm text-gray-500">
                        {leaveEntitlement.carried_forward_leaves > 0 
                          ? `Casual + Sick + CF (${leaveEntitlement.carried_forward_leaves.toFixed(1)})`
                          : `Casual + Sick leave`
                        }
                      </p>
                    </>
                  ) : (
                    <p className="text-2xl font-bold text-blue-600">-</p>
                  )}
                </div>
              </div>
              {leaveEntitlement && !(employeeData?.probation_end_date && new Date(employeeData.probation_end_date) > new Date()) && (
                <div className="space-y-1">
                  <Progress 
                    value={(leaveEntitlement.total_available_leaves / (leaveEntitlement.casual_leave_accrued + leaveEntitlement.sick_leave_total + (leaveEntitlement.carried_forward_leaves || 0))) * 100} 
                    className="h-2 dark:bg-blue-900/30 [&>div]:dark:progress-glow"
                  />
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>Used: {(leaveEntitlement.casual_leave_used + leaveEntitlement.sick_leave_used).toFixed(1)}</span>
                    <span>Available: {leaveEntitlement.total_available_leaves.toFixed(1)}</span>
                  </div>
                </div>
              )}
              <p className="text-xs text-blue-600 dark:text-blue-400 flex items-center gap-1 mt-2">
                <Info className="h-3 w-3" />
                Click to view leave details
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="card-elevated hover-glow cursor-pointer hover:shadow-xl transition-all duration-300" onClick={() => navigate('/employee/attendance')}>
          <CardContent className="p-6">
            <div className="space-y-3">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-purple-100 dark:bg-purple-500/20 rounded-lg flex items-center justify-center dark:shadow-[0_0_15px_rgba(168,85,247,0.3)]">
                  <Clock className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-500">Hours This Month</p>
                  <p className="text-2xl font-bold text-purple-600">{attendanceData.thisMonthHours}</p>
                  <p className="text-xs text-gray-500">Target: 176h</p>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-600 dark:text-gray-400">Regular</span>
                  <span className="font-semibold">{Math.round(attendanceData.regularHours)}h</span>
                </div>
                <Progress value={(attendanceData.regularHours / 176) * 100} className="h-2 bg-purple-100 dark:bg-purple-900/30 [&>div]:dark:progress-glow" />
                {attendanceData.otHours > 0 && (
                  <>
                    <div className="flex items-center justify-between text-xs mt-2">
                      <span className="text-blue-600">Overtime</span>
                      <span className="font-semibold text-blue-600">{Math.round(attendanceData.otHours)}h</span>
                    </div>
                    <div className="h-2 bg-blue-100 rounded-full overflow-hidden">
                      <div className="h-full bg-blue-600 rounded-full" style={{width: `${Math.min((attendanceData.otHours / 20) * 100, 100)}%`}}></div>
                    </div>
                  </>
                )}
              </div>
              <p className="text-xs text-blue-600 dark:text-blue-400 flex items-center gap-1 mt-2">
                <Info className="h-3 w-3" />
                Click to view attendance details
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="card-elevated hover-glow cursor-pointer hover:shadow-xl transition-all duration-300" onClick={() => setShowRatingDialog(true)}>
          <CardContent className="p-6">
            <div className="space-y-3">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <div className="w-12 h-12 bg-orange-100 dark:bg-orange-500/20 rounded-lg flex items-center justify-center dark:shadow-[0_0_15px_rgba(249,115,22,0.3)]">
                    <TrendingUp className="h-6 w-6 text-orange-600 dark:text-orange-400" />
                  </div>
                  <p className="text-sm font-medium text-gray-500">Performance</p>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <div className="flex-1">
                  {rating ? (
                    <>
                      <p className="text-2xl font-bold text-orange-600">
                        {rating.rating.toFixed(3)}
                      </p>
                      <div className="flex items-center space-x-1 mt-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            className={`h-3 w-3 ${
                              star <= Math.round(rating.rating)
                                ? 'fill-orange-500 text-orange-500'
                                : 'text-gray-300'
                            }`}
                          />
                        ))}
                      </div>
                    </>
                  ) : (
                    <>
                      <p className="text-2xl font-bold text-orange-600">-</p>
                      <p className="text-sm text-gray-500">Loading...</p>
                    </>
                  )}
                </div>
              </div>
              {rating && (
                <>
                  <p className="text-xs text-gray-500">
                    Based on {rating.details.attendance_days} days attendance this month
                  </p>
                  <p className="text-xs text-blue-600 dark:text-blue-400 flex items-center gap-1 mt-2">
                    <Info className="h-3 w-3" />
                    Click to view detailed breakdown
                  </p>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Notifications & Alerts + Upcoming Events Grid */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Notifications & Alerts Section */}
        <Card className="card-elevated border-blue-200 dark:border-blue-500/30 bg-gradient-to-br from-blue-50 to-white dark:from-blue-900/20 dark:to-transparent">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center space-x-2 text-blue-700 dark:text-blue-400">
                <Bell className="h-5 w-5" />
                <span>Recent Notifications</span>
                {notifications.filter(n => !n.is_read).length > 0 && (
                  <Badge variant="destructive" className="ml-2">{notifications.filter(n => !n.is_read).length}</Badge>
                )}
              </CardTitle>
              <div className="flex gap-2">
                {notifications.filter(n => !n.is_read).length > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={markAllAsRead}
                    className="text-xs text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400"
                  >
                    <CheckCircle2 className="h-4 w-4 mr-1" />
                    Mark all as Read
                  </Button>
                )}
                {notifications.some(n => n.is_read) && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearReadNotifications}
                    className="text-xs text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400"
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    Clear Read
                  </Button>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {notifications.length > 0 ? (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {notifications.map((notification, index) => (
                  <div
                    key={notification.id || index}
                    onClick={() => handleNotificationClick(notification)}
                    className={`p-3 rounded-lg border-l-4 relative cursor-pointer hover:shadow-md transition-shadow ${
                      notification.notification_type === 'success' || notification.category === 'payslip'
                        ? 'bg-green-50 dark:bg-green-900/20 border-green-500 hover:bg-green-100 dark:hover:bg-green-900/30'
                        : notification.notification_type === 'warning'
                        ? 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-500 hover:bg-yellow-100 dark:hover:bg-yellow-900/30'
                        : notification.notification_type === 'error'
                        ? 'bg-red-50 dark:bg-red-900/20 border-red-500 hover:bg-red-100 dark:hover:bg-red-900/30'
                        : 'bg-blue-50 dark:bg-blue-900/20 border-blue-500 hover:bg-blue-100 dark:hover:bg-blue-900/30'
                    }`}
                  >
                    {/* Blue dot for unread notifications */}
                    {!notification.is_read && (
                      <div className="absolute top-2 right-2">
                        <span className="relative flex h-3 w-3">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-500"></span>
                        </span>
                      </div>
                    )}
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0 mt-1">
                        {notification.notification_type === 'success' || notification.category === 'payslip' ? (
                          <CheckCircle2 className="h-5 w-5 text-green-600" />
                        ) : notification.notification_type === 'warning' ? (
                          <AlertCircle className="h-5 w-5 text-yellow-600" />
                        ) : notification.notification_type === 'error' ? (
                          <XCircle className="h-5 w-5 text-red-600" />
                        ) : (
                          <Bell className="h-5 w-5 text-blue-600" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0 pr-8">
                        <p className={`text-sm font-semibold ${notification.is_read ? 'text-gray-700 dark:text-gray-300' : 'text-gray-900 dark:text-gray-100'}`}>
                          {notification.title}
                        </p>
                        <p className={`text-xs mt-1 ${notification.is_read ? 'text-gray-500 dark:text-gray-500' : 'text-gray-600 dark:text-gray-400'}`}>
                          {notification.message}
                        </p>
                        {notification.created_at && (
                          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                            {new Date(notification.created_at).toLocaleDateString()} {new Date(notification.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        )}
                      </div>
                      {/* Eye icon to toggle read/unread */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleNotificationRead(notification.id, notification.is_read);
                        }}
                        className="flex-shrink-0 p-1 hover:bg-white/50 dark:hover:bg-gray-800/50 rounded transition-colors"
                        title={notification.is_read ? "Mark as unread" : "Mark as read"}
                      >
                        {notification.is_read ? (
                          <EyeOff className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                        ) : (
                          <Eye className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                        )}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Bell className="h-12 w-12 mx-auto text-gray-300 mb-3" />
                <p className="text-sm text-gray-500">No new notifications</p>
                <p className="text-xs text-gray-400 mt-1">You're all caught up!</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Upcoming Events & Milestones */}
        <Card className="card-elevated border-purple-200 dark:border-purple-500/30 bg-gradient-to-br from-purple-50 to-white dark:from-purple-900/20 dark:to-transparent">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-purple-700 dark:text-purple-400">
              <Gift className="h-5 w-5" />
              <span>Upcoming Events</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {upcomingEvents.length > 0 ? (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {upcomingEvents.map((event, index) => {
                  // Combine title and subtitle for full text
                  const fullText = event.subtitle ? `${event.title} ${event.subtitle}` : event.title;
                  
                  return (
                    <div
                      key={index}
                      className={`p-3 rounded-lg ${
                        event.type === 'birthday'
                          ? 'bg-gradient-to-r from-pink-50 to-rose-50 dark:from-pink-900/20 dark:to-rose-900/20 border border-pink-200 dark:border-pink-500/30'
                          : event.type === 'anniversary'
                          ? 'bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 border border-orange-200 dark:border-orange-500/30'
                          : event.type === 'holiday'
                          ? 'bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200 dark:border-blue-500/30'
                          : 'bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border border-green-200 dark:border-green-500/30'
                      }`}
                      title={fullText} // Tooltip showing full text on hover
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3 flex-1 min-w-0">
                          <div className="text-2xl flex-shrink-0">{event.icon}</div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate cursor-help">
                              {event.title}
                              {event.subtitle && (
                                <span className="text-purple-600 dark:text-purple-400 ml-1">{event.subtitle}</span>
                              )}
                            </p>
                            <p className="text-xs text-gray-600 dark:text-gray-400">
                              {event.date.toLocaleDateString('en-IN', { 
                                month: 'short', 
                                day: 'numeric',
                                year: 'numeric'
                              })}
                            </p>
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0 ml-2">
                          <p className={`text-lg font-bold ${
                            event.daysUntil === 0 ? 'text-red-600 dark:text-red-400' :
                            event.daysUntil <= 7 ? 'text-orange-600 dark:text-orange-400' :
                            'text-purple-600 dark:text-purple-400'
                          }`}>
                            {event.daysUntil === 0 ? 'Today' : event.daysUntil}
                          </p>
                          {event.daysUntil > 0 && (
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {event.daysUntil === 1 ? 'day' : 'days'}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8">
                <Calendar className="h-12 w-12 mx-auto text-gray-300 mb-3" />
                <p className="text-sm text-gray-500">No upcoming events</p>
                <p className="text-xs text-gray-400 mt-1">Check back later!</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Leave Entitlement Details */}
      {leaveEntitlement && (
        <Card className="card-elevated bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-blue-200 dark:border-blue-500/30">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-blue-700 dark:text-blue-400">
              <Calendar className="h-5 w-5" />
              <span>Leave Entitlement</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {employeeData?.probation_end_date && new Date(employeeData.probation_end_date) > new Date() ? (
              <div className="bg-orange-100 dark:bg-orange-900/20 border border-orange-300 dark:border-orange-500/30 rounded-lg p-4">
                <p className="text-orange-800 dark:text-orange-400 font-semibold">You are currently in probation period</p>
                <p className="text-orange-700 dark:text-orange-300 text-sm mt-1">
                  Leave entitlements will be available after {new Date(employeeData.probation_end_date).toLocaleDateString()}
                </p>
              </div>
            ) : (
              <div className="grid md:grid-cols-3 gap-4">
                <div className="bg-white dark:bg-gray-800/50 rounded-lg p-4 border border-blue-200 dark:border-blue-500/30">
                  <p className="text-sm text-gray-600 dark:text-gray-400">Casual Leave</p>
                  <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{leaveEntitlement.casual_leave_balance.toFixed(1)}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">of {leaveEntitlement.casual_leave_accrued.toFixed(1)} accrued</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Rate: {employeeData?.custom_casual_leave_per_month || '1.5'} days/month</p>
                </div>
                <div className="bg-white dark:bg-gray-800/50 rounded-lg p-4 border border-green-200 dark:border-green-500/30">
                  <p className="text-sm text-gray-600 dark:text-gray-400">Sick Leave</p>
                  <p className="text-2xl font-bold text-green-600 dark:text-green-400">{leaveEntitlement.sick_leave_balance.toFixed(1)}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">of {leaveEntitlement.sick_leave_total} per year</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Annual: {employeeData?.custom_sick_leave_per_year || '7'} days</p>
                </div>
                <div className="bg-white dark:bg-gray-800/50 rounded-lg p-4 border border-purple-200 dark:border-purple-500/30">
                  <p className="text-sm text-gray-600 dark:text-gray-400">Total Available</p>
                  <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">{leaveEntitlement.total_available_leaves.toFixed(1)}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Days you can take</p>
                  {employeeData?.annual_leave_days > 0 && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">+{employeeData.annual_leave_days} annual days</p>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Quick Actions */}
      <Card className="card-elevated">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Activity className="h-5 w-5" />
            <span>Quick Actions</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <Button 
              variant="outline" 
              className="h-20 flex flex-col items-center space-y-2 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:border-blue-200 dark:hover:border-blue-500/50"
              onClick={() => handleQuickAction('payslips')}
            >
              <FileText className="h-6 w-6 text-blue-600" />
              <span className="text-sm text-center text-gray-900 dark:text-gray-100">View Payslips</span>
            </Button>
            
            <Button 
              variant="outline" 
              className="h-20 flex flex-col items-center space-y-2 hover:bg-green-50 dark:hover:bg-green-900/20 hover:border-green-200 dark:hover:border-green-500/50"
              onClick={() => handleQuickAction('leave')}
            >
              <Calendar className="h-6 w-6 text-green-600 dark:text-green-400" />
              <span className="text-sm text-center text-gray-900 dark:text-gray-100">Apply Leave</span>
            </Button>
            
            <Button 
              variant="outline" 
              className="h-20 flex flex-col items-center space-y-2 hover:bg-purple-50 dark:hover:bg-purple-900/20 hover:border-purple-200 dark:hover:border-purple-500/50"
              onClick={() => handleQuickAction('loans')}
            >
              <CreditCard className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              <span className="text-sm text-center text-gray-900 dark:text-gray-100">Loan Request</span>
            </Button>
            
            <Button 
              variant="outline" 
              className="h-20 flex flex-col items-center space-y-2 hover:bg-orange-50 dark:hover:bg-orange-900/20 hover:border-orange-200 dark:hover:border-orange-500/50"
              onClick={() => handleQuickAction('profile')}
            >
              <User className="h-6 w-6 text-orange-600 dark:text-orange-400" />
              <span className="text-sm text-center text-gray-900 dark:text-gray-100">Update Profile</span>
            </Button>

            <Button 
              variant="outline" 
              className="h-20 flex flex-col items-center space-y-2 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 hover:border-indigo-200 dark:hover:border-indigo-500/50"
              onClick={() => handleQuickAction('attendance')}
            >
              <Clock className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
              <span className="text-sm text-center text-gray-900 dark:text-gray-100">Attendance</span>
            </Button>

            <Button 
              variant="outline" 
              className="h-20 flex flex-col items-center space-y-2 hover:bg-gray-50 dark:hover:bg-gray-800/50 hover:border-gray-200 dark:hover:border-gray-500/50"
              onClick={() => handleQuickAction('documents')}
            >
              <FolderOpen className="h-6 w-6 text-gray-600 dark:text-gray-400" />
              <span className="text-sm text-center text-gray-900 dark:text-gray-100">Documents</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Salary breakdown moved to Payslips page */}

      {/* Rating Details Dialog */}
      <Dialog open={showRatingDialog} onOpenChange={setShowRatingDialog}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold flex items-center gap-2">
              <Award className="h-6 w-6 text-orange-600" />
              Performance Rating Breakdown
            </DialogTitle>
            <DialogDescription>
              Understanding your rating and how to improve it
            </DialogDescription>
          </DialogHeader>

          {rating && (
            <div className="space-y-6 mt-4">
              {/* Current Rating Display */}
              <div className="bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20 p-6 rounded-lg border-2 border-orange-200 dark:border-orange-500/30">
                <div className="text-center">
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Your Current Rating</p>
                  <div className="flex items-center justify-center gap-4 mb-3">
                    <p className="text-5xl font-bold text-orange-600">{rating.rating.toFixed(3)}</p>
                    <div className="flex flex-col">
                      <div className="flex items-center gap-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            className={`h-5 w-5 ${
                              star <= Math.round(rating.rating)
                                ? 'fill-orange-500 text-orange-500'
                                : 'text-gray-300 dark:text-gray-600'
                            }`}
                          />
                        ))}
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {rating.rating >= 4.8 ? 'Outstanding' : rating.rating >= 4.5 ? 'Excellent' : rating.rating >= 4.0 ? 'Good' : rating.rating >= 3.5 ? 'Satisfactory' : 'Needs Improvement'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center justify-center gap-2 text-sm">
                    <Badge variant={rating.details.progress_from_baseline >= 0 ? "default" : "destructive"} className="text-xs">
                      {rating.details.progress_from_baseline >= 0 ? '+' : ''}{rating.details.progress_from_baseline.toFixed(3)} from baseline
                    </Badge>
                    <span className="text-gray-500 dark:text-gray-400">
                      • {rating.details.attendance_days} days tracked
                    </span>
                  </div>
                </div>
              </div>

              {/* Rating Calculation Breakdown */}
              <div>
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Target className="h-5 w-5 text-blue-600" />
                  Rating Calculation
                </h3>
                <div className="space-y-3">
                  {/* Starting Rating */}
                  <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                        <Star className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-gray-100">Starting Rating</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {rating.details.starting_rating === 4.0 ? 'Base rating (Jan)' : 'Carried from previous month'}
                        </p>
                      </div>
                    </div>
                    <p className="text-xl font-bold text-gray-900 dark:text-gray-100">{rating.details.starting_rating.toFixed(3)}</p>
                  </div>

                  {/* Late Arrivals Impact */}
                  {rating.details.late_arrivals > 0 && (
                    <div className="flex items-center justify-between p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-500/30">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
                          <AlertTriangle className="h-5 w-5 text-red-600" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 dark:text-gray-100">Late Arrivals</p>
                          <p className="text-xs text-red-600 dark:text-red-400">
                            {rating.details.late_arrivals} late arrival{rating.details.late_arrivals !== 1 ? 's' : ''} × -0.02
                          </p>
                        </div>
                      </div>
                      <p className="text-xl font-bold text-red-600">-{(rating.details.late_arrivals * 0.02).toFixed(3)}</p>
                    </div>
                  )}

                  {/* OT Hours Impact */}
                  {rating.details.ot_hours > 0 && (
                    <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-500/30">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                          <Zap className="h-5 w-5 text-green-600" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 dark:text-gray-100">Overtime Hours</p>
                          <p className="text-xs text-green-600 dark:text-green-400">
                            {rating.details.ot_hours} hour{rating.details.ot_hours !== 1 ? 's' : ''} × +0.01
                          </p>
                        </div>
                      </div>
                      <p className="text-xl font-bold text-green-600">+{(rating.details.ot_hours * 0.01).toFixed(3)}</p>
                    </div>
                  )}

                  {/* Punctuality Bonus - Earned (Past months only) */}
                  {rating.details.punctuality_bonus > 0 && rating.details.punctuality_bonus_status === 'earned' && (
                    <div className="flex items-center justify-between p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg border border-emerald-200 dark:border-emerald-500/30">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center">
                          <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 dark:text-gray-100">Punctuality Bonus (Earned)</p>
                          <p className="text-xs text-emerald-600 dark:text-emerald-400">
                            No late arrivals - Credited at month end
                          </p>
                        </div>
                      </div>
                      <p className="text-xl font-bold text-emerald-600">+{rating.details.punctuality_bonus.toFixed(3)}</p>
                    </div>
                  )}

                  {/* Punctuality Bonus - Pending (Current month, on track) */}
                  {rating.details.punctuality_bonus_status === 'pending' && rating.details.is_current_month && (
                    <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-500/30">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                          <Clock className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 dark:text-gray-100">Punctuality Bonus (Pending)</p>
                          <p className="text-xs text-blue-600 dark:text-blue-400">
                            On track! Will be credited at month end
                          </p>
                        </div>
                      </div>
                      <p className="text-xl font-bold text-blue-600">+0.15*</p>
                    </div>
                  )}

                  {/* No factors */}
                  {rating.details.late_arrivals === 0 && rating.details.ot_hours === 0 && rating.details.punctuality_bonus === 0 && rating.details.punctuality_bonus_status !== 'pending' && (
                    <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                      <Info className="h-8 w-8 mx-auto text-blue-500 mb-2" />
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        No rating changes this period. Your rating carried forward from last month.
                      </p>
                    </div>
                  )}

                  {/* Final Rating Line */}
                  <div className="flex items-center justify-between p-4 bg-orange-100 dark:bg-orange-900/30 rounded-lg border-2 border-orange-300 dark:border-orange-500/50">
                    <p className="font-bold text-lg text-gray-900 dark:text-gray-100">Final Rating</p>
                    <p className="text-2xl font-bold text-orange-600">{rating.rating.toFixed(3)}</p>
                  </div>
                </div>
              </div>

              {/* Immediate Improvement Tips */}
              <div>
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Zap className="h-5 w-5 text-yellow-600" />
                  Immediate Actions (This Month)
                </h3>
                <div className="grid gap-3">
                  {rating.details.late_arrivals > 0 ? (
                    <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border-l-4 border-yellow-500">
                      <div className="flex items-start gap-3">
                        <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
                        <div>
                          <p className="font-semibold text-gray-900 dark:text-gray-100 mb-1">Improve Punctuality</p>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                            You have {rating.details.late_arrivals} late arrival{rating.details.late_arrivals !== 1 ? 's' : ''} this month.
                            Each late arrival costs -0.02 points.
                          </p>
                          <p className="text-sm font-medium text-yellow-700 dark:text-yellow-400">
                            💡 {rating.details.is_current_month 
                              ? 'Punctuality bonus lost for this month. Start fresh next month to earn +0.15 bonus!' 
                              : 'Arrive on time next month to earn +0.15 punctuality bonus!'}
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border-l-4 border-green-500">
                      <div className="flex items-start gap-3">
                        <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
                        <div>
                          <p className="font-semibold text-gray-900 dark:text-gray-100 mb-1">Perfect Punctuality!</p>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                            {rating.details.is_current_month 
                              ? 'Keep up the excellent work! On track for +0.15 bonus (credited at month end).'
                              : 'Excellent work! You earned the +0.15 punctuality bonus.'}
                          </p>
                          <p className="text-sm font-medium text-green-700 dark:text-green-400">
                            💡 {rating.details.is_current_month
                              ? 'Continue arriving on time till month end to secure this bonus!'
                              : 'Continue this pattern next month to keep earning the bonus!'}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border-l-4 border-blue-500">
                    <div className="flex items-start gap-3">
                      <Zap className="h-5 w-5 text-blue-600 mt-0.5" />
                      <div>
                        <p className="font-semibold text-gray-900 dark:text-gray-100 mb-1">Log Overtime Hours</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                          Currently: {rating.details.ot_hours} approved OT hour{rating.details.ot_hours !== 1 ? 's' : ''}.
                          Each hour adds +0.01 to your rating.
                        </p>
                        <p className="text-sm font-medium text-blue-700 dark:text-blue-400">
                          💡 Potential: +10 OT hours this month = +0.10 rating boost!
                        </p>
                      </div>
                    </div>
                  </div>

                  {rating.rating < 5.0 && (
                    <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg border-l-4 border-purple-500">
                      <div className="flex items-start gap-3">
                        <Target className="h-5 w-5 text-purple-600 mt-0.5" />
                        <div>
                          <p className="font-semibold text-gray-900 dark:text-gray-100 mb-1">Quick Win Calculation</p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            To reach a {Math.min(5.0, rating.rating + 0.5).toFixed(1)} rating:
                          </p>
                          <ul className="text-sm text-gray-600 dark:text-gray-400 mt-2 space-y-1 ml-4">
                            <li>• Zero late arrivals → +0.15 bonus next month</li>
                            <li>• +20 OT hours → +0.20 rating</li>
                            <li>• Combined: +0.35 improvement possible!</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Long-term Strategies */}
              <div>
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Lightbulb className="h-5 w-5 text-indigo-600" />
                  Long-Term Strategies
                </h3>
                <div className="grid gap-3">
                  <div className="p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 bg-indigo-100 dark:bg-indigo-900/30 rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-sm font-bold text-indigo-600">1</span>
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900 dark:text-gray-100 mb-1">Consistent Punctuality</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Arrive on time every day. The cumulative system carries your rating forward, so maintaining
                          punctuality month-over-month compounds your rating growth. +0.15/month × 12 months = +1.80 potential!
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 bg-indigo-100 dark:bg-indigo-900/30 rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-sm font-bold text-indigo-600">2</span>
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900 dark:text-gray-100 mb-1">Strategic Overtime</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Take on meaningful OT when available. Regular 10-15 hours/month adds +0.10-0.15 consistently.
                          This compounds with punctuality for steady rating growth throughout the year.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 bg-indigo-100 dark:bg-indigo-900/30 rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-sm font-bold text-indigo-600">3</span>
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900 dark:text-gray-100 mb-1">Avoid Rating Decay</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Late arrivals are cumulative penalties. Even one late arrival loses you the punctuality bonus
                          (-0.15) plus the penalty (-0.02) = -0.17 impact. Consistency is key!
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 bg-indigo-100 dark:bg-indigo-900/30 rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-sm font-bold text-indigo-600">4</span>
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900 dark:text-gray-100 mb-1">Target 5.0 Rating</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          The system caps at 5.0. Maintain perfect punctuality + consistent OT to reach and stay at
                          maximum rating. This demonstrates sustained excellence and dedication.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Rating System Info */}
              <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded-lg">
                <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-2 flex items-center gap-2">
                  <Info className="h-4 w-4" />
                  How the Rating System Works
                </h4>
                <div className="text-sm text-gray-600 dark:text-gray-400 space-y-2">
                  <p>• <strong>Cumulative System:</strong> Your rating carries forward month-to-month throughout the year</p>
                  <p>• <strong>Base Rating:</strong> Starts at 4.0 in January, then uses previous month's rating</p>
                  <p>• <strong>Late Arrivals:</strong> -0.02 per occurrence (immediate penalty)</p>
                  <p>• <strong>Overtime:</strong> +0.01 per approved hour (reward for extra effort)</p>
                  <p>• <strong>Punctuality Bonus:</strong> +0.15 if zero late arrivals in the month <span className="text-orange-600 font-semibold">(credited at month end only)</span></p>
                  <p>• <strong>Maximum Rating:</strong> Capped at 5.0 to ensure fairness</p>
                  <p>• <strong>Annual Reset:</strong> Rating resets to 4.0 every January</p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Help button and dialog removed */}
    </div>
  );
};

export default EmployeeDashboard;
