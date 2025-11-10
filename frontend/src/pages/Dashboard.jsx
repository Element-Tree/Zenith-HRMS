import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Users,
  DollarSign,
  FileText,
  AlertCircle,
  TrendingUp,
  Calendar,
  Clock,
  UserCheck,
  UserPlus,
  CheckCircle,
  ClipboardList,
  CreditCard,
  Clock3
} from "lucide-react";
import { formatCurrency, formatNumber } from "@/lib/utils";
import { toast } from "sonner";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const Dashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    total_employees: 0,
    active_employees: 0,
    this_month_payroll: 0,
    payslips_generated: 0,
    upcoming_deadlines: 0
  });
  const [attendanceOverview, setAttendanceOverview] = useState({
    present: 0,
    absent: 0,
    late: 0,
    leave: 0,
    present_rate: 0,
    on_time_rate: 0
  });
  const [pendingActions, setPendingActions] = useState({
    pending_leaves: 0,
    pending_loans: 0,
    pending_ot: 0,
    recent_late_arrivals: 0,
    total_pending: 0
  });
  const [leaveStats, setLeaveStats] = useState({
    pending_leaves: 0,
    approved_this_month: 0,
    utilization_percentage: 0
  });
  const [loanOverview, setLoanOverview] = useState({
    active_loans: 0,
    total_outstanding: 0,
    monthly_deductions: 0
  });
  const [employeeDistribution, setEmployeeDistribution] = useState({
    by_department: [],
    by_designation: []
  });
  const [payrollTrends, setPayrollTrends] = useState({ trends: [] });
  const [recentActivities, setRecentActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activitiesLoading, setActivitiesLoading] = useState(true);
  const [subscriptionStatus, setSubscriptionStatus] = useState(null);

  useEffect(() => {
    fetchDashboardStats();
    fetchAttendanceOverview();
    fetchPendingActions();
    fetchLeaveStats();
    fetchLoanOverview();
    fetchEmployeeDistribution();
    fetchPayrollTrends();
    fetchRecentActivities();
    fetchSubscriptionStatus();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      const response = await axios.get(`${API}/dashboard/stats`);
      setStats(response.data);
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      toast.error('Failed to load dashboard statistics');
    } finally {
      setLoading(false);
    }
  };

  const fetchAttendanceOverview = async () => {
    try {
      const response = await axios.get(`${API}/dashboard/attendance-overview`);
      setAttendanceOverview(response.data);
    } catch (error) {
      console.error('Error fetching attendance overview:', error);
      toast.error('Failed to load attendance overview');
    }
  };

  const fetchPendingActions = async () => {
    try {
      const response = await axios.get(`${API}/dashboard/pending-actions`);
      setPendingActions(response.data);
    } catch (error) {
      console.error('Error fetching pending actions:', error);
    }
  };

  const fetchLeaveStats = async () => {
    try {
      const response = await axios.get(`${API}/dashboard/leave-statistics`);
      setLeaveStats(response.data);
    } catch (error) {
      console.error('Error fetching leave statistics:', error);
    }
  };

  const fetchLoanOverview = async () => {
    try {
      const response = await axios.get(`${API}/dashboard/loan-overview`);
      setLoanOverview(response.data);
    } catch (error) {
      console.error('Error fetching loan overview:', error);
    }
  };

  const fetchEmployeeDistribution = async () => {
    try {
      const response = await axios.get(`${API}/dashboard/employee-distribution`);
      setEmployeeDistribution(response.data);
    } catch (error) {
      console.error('Error fetching employee distribution:', error);
    }
  };

  const fetchPayrollTrends = async () => {
    try {
      const response = await axios.get(`${API}/dashboard/payroll-trends`);
      setPayrollTrends(response.data);
    } catch (error) {
      console.error('Error fetching payroll trends:', error);
    }
  };

  const fetchRecentActivities = async () => {
    try {
      setActivitiesLoading(true);
      const response = await axios.get(`${API}/admin/recent-activities`);
      setRecentActivities(response.data.activities || []);
    } catch (error) {
      console.error("Error fetching recent activities:", error);
      toast.error("Failed to load recent activities");
    } finally {
      setActivitiesLoading(false);
    }
  };

  const fetchSubscriptionStatus = async () => {
    try {
      const response = await axios.get(`${API}/subscription/status`);
      setSubscriptionStatus(response.data);
    } catch (error) {
      // Don't show error for missing subscription status
      console.error('Error fetching subscription status:', error);
    }
  };

  const statCards = [
    {
      title: "Active Employees",
      value: formatNumber(stats.active_employees),
      icon: Users,
      change: "+12%",
      changeType: "positive",
      description: "from last month"
    },
    {
      title: "This Month's Payroll",
      value: formatCurrency(stats.this_month_payroll),
      icon: DollarSign,
      change: "+8%",
      changeType: "positive",
      description: "from last month"
    },
    {
      title: "Payslips Generated",
      value: formatNumber(stats.payslips_generated),
      icon: FileText,
      change: "100%",
      changeType: "neutral",
      description: "completion rate"
    },
    {
      title: "Upcoming Deadlines",
      value: formatNumber(stats.upcoming_deadlines),
      icon: AlertCircle,
      change: "Due Soon",
      changeType: "negative",
      description: "compliance items"
    }
  ];

  // Helper function to format activity timestamps
  const formatActivityTime = (timestamp) => {
    if (!timestamp) return "Recently";
    
    const now = new Date();
    const activityTime = new Date(timestamp);
    const diffInMinutes = Math.floor((now - activityTime) / (1000 * 60));
    
    if (diffInMinutes < 1) return "Just now";
    if (diffInMinutes < 60) return `${diffInMinutes} min ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)} hours ago`;
    return `${Math.floor(diffInMinutes / 1440)} days ago`;
  };

  // Helper function to get activity type for styling
  const getActivityType = (category, notificationType) => {
    if (category === "birthday") return "info";
    if (category === "leave") return "warning";
    if (category === "payslip") return "success";
    if (category === "employee") return "info";
    if (notificationType === "success") return "success";
    if (notificationType === "error") return "error";
    return "info";
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-32 bg-gray-200 rounded-lg"></div>
          ))}
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
          <div className="col-span-4 h-80 bg-gray-200 rounded-lg"></div>
          <div className="col-span-3 h-80 bg-gray-200 rounded-lg"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="dashboard">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
            Dashboard
          </h1>
          <p className="text-gray-500 dark:text-gray-400">
            Overview of your payroll management system
          </p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" size="sm">
            <Calendar className="w-4 h-4 mr-2" />
            This Month
          </Button>
          <Button size="sm" className="">
            Generate Report
          </Button>
        </div>
      </div>

      {/* Subscription Status Banner */}
      {subscriptionStatus && subscriptionStatus.status === 'trial' && subscriptionStatus.trial_days_left !== undefined && (
        <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-start gap-3">
              <Clock3 className="h-6 w-6 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-blue-900 dark:text-blue-100">Trial Period Active</h3>
                <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                  You have {subscriptionStatus.trial_days_left} days left in your free trial. 
                  Subscribe now to avoid any service interruption!
                </p>
              </div>
            </div>
            <Button 
              onClick={() => navigate('/payment')}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <CreditCard className="mr-2 h-4 w-4" />
              Subscribe Now
            </Button>
          </div>
        </div>
      )}

      {subscriptionStatus && subscriptionStatus.status === 'trial_expired' && (
        <div className="p-4 bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-900/20 dark:to-orange-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-6 w-6 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-red-900 dark:text-red-100">Trial Period Ended</h3>
                <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                  Your trial period has ended. Please subscribe to continue using Elevate Payroll.
                </p>
              </div>
            </div>
            <Button 
              onClick={() => navigate('/payment')}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              <CreditCard className="mr-2 h-4 w-4" />
              Subscribe Now
            </Button>
          </div>
        </div>
      )}

      {subscriptionStatus && subscriptionStatus.status === 'active' && (
        <Card className="border-green-200 dark:border-green-800 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-medium text-green-900 dark:text-green-100">
                    Subscription Active - {subscriptionStatus.plan} Plan
                  </h3>
                  <p className="text-sm text-green-700 dark:text-green-300 mt-0.5">
                    Next billing date: {subscriptionStatus.next_billing_date ? new Date(subscriptionStatus.next_billing_date).toLocaleDateString() : 'N/A'}
                    {subscriptionStatus.amount && ` • ₹${subscriptionStatus.amount.toLocaleString()}`}
                  </p>
                </div>
              </div>
              <Button
                onClick={() => navigate('/upgrade')}
                variant="outline"
                size="sm"
                className="bg-white hover:bg-green-50 border-green-300 text-green-700 hover:text-green-800 dark:bg-gray-800 dark:hover:bg-gray-700 dark:border-green-700 dark:text-green-300"
              >
                <TrendingUp className="h-4 w-4 mr-2" />
                Upgrade Plan
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((card, index) => {
          const Icon = card.icon;
          return (
            <Card key={index} className="card-hover">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  {card.title}
                </CardTitle>
                <Icon className="h-4 w-4 text-gray-500 dark:text-gray-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {card.value}
                </div>
                <div className="flex items-center space-x-2 text-xs text-gray-500 dark:text-gray-400">
                  <Badge 
                    variant={card.changeType === 'positive' ? 'default' : 
                            card.changeType === 'negative' ? 'destructive' : 'secondary'}
                    className="text-xs"
                  >
                    {card.change}
                  </Badge>
                  <span>{card.description}</span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
        {/* Attendance Overview */}
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <UserCheck className="h-5 w-5" />
              <span>Attendance Overview</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-emerald-600">{attendanceOverview.present}</div>
                <div className="text-xs text-gray-500">Present</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">{attendanceOverview.absent}</div>
                <div className="text-xs text-gray-500">Absent</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-600">{attendanceOverview.late}</div>
                <div className="text-xs text-gray-500">Late</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{attendanceOverview.leave}</div>
                <div className="text-xs text-gray-500">Leave</div>
              </div>
            </div>
            
            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Present Rate</span>
                  <span>{attendanceOverview.present_rate}%</span>
                </div>
                <Progress value={attendanceOverview.present_rate} className="h-2" />
              </div>
              
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>On-time Rate</span>
                  <span>{attendanceOverview.on_time_rate}%</span>
                </div>
                <Progress value={attendanceOverview.on_time_rate} className="h-2" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Pending Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <AlertCircle className="h-5 w-5 text-orange-600" />
              <span>Pending Actions</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between items-center p-2 bg-blue-50 dark:bg-blue-900/20 rounded border dark:border-blue-500/30">
              <span className="text-sm dark:text-gray-300">Leave Approvals</span>
              <Badge className="dark:bg-gray-700 dark:text-gray-200" variant="secondary">{pendingActions.pending_leaves}</Badge>
            </div>
            <div className="flex justify-between items-center p-2 bg-purple-50 dark:bg-purple-900/20 rounded border dark:border-purple-500/30">
              <span className="text-sm dark:text-gray-300">Loan Approvals</span>
              <Badge className="dark:bg-gray-700 dark:text-gray-200" variant="secondary">{pendingActions.pending_loans}</Badge>
            </div>
            <div className="flex justify-between items-center p-2 bg-green-50 dark:bg-green-900/20 rounded border dark:border-green-500/30">
              <span className="text-sm dark:text-gray-300">OT Approvals</span>
              <Badge className="dark:bg-gray-700 dark:text-gray-200" variant="secondary">{pendingActions.pending_ot}</Badge>
            </div>
            <div className="flex justify-between items-center p-2 bg-red-50 dark:bg-red-900/20 rounded border dark:border-red-500/30">
              <span className="text-sm dark:text-gray-300">Late Arrivals (7 days)</span>
              <Badge className="dark:bg-gray-700 dark:text-gray-200" variant="secondary">{pendingActions.recent_late_arrivals}</Badge>
            </div>
          </CardContent>
        </Card>

        {/* Leave Statistics */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Calendar className="h-5 w-5 text-blue-600" />
              <span>Leave Statistics</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center">
              <div className="text-3xl font-bold text-orange-600">{leaveStats.pending_leaves}</div>
              <div className="text-xs text-gray-500">Pending Approvals</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">{leaveStats.approved_this_month}</div>
              <div className="text-xs text-gray-500">Approved This Month</div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Balance Utilization</span>
                <span>{leaveStats.utilization_percentage}%</span>
              </div>
              <Progress value={leaveStats.utilization_percentage} className="h-2" />
            </div>
          </CardContent>
        </Card>

        {/* Loan Overview */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <DollarSign className="h-5 w-5 text-purple-600" />
              <span>Loan Overview</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <div className="text-sm text-gray-500">Active Loans</div>
              <div className="text-2xl font-bold">{loanOverview.active_loans}</div>
            </div>
            <div>
              <div className="text-sm text-gray-500">Total Outstanding</div>
              <div className="text-xl font-bold text-red-600">₹{loanOverview.total_outstanding.toLocaleString()}</div>
            </div>
            <div>
              <div className="text-sm text-gray-500">Monthly Deductions</div>
              <div className="text-lg font-semibold text-blue-600">₹{loanOverview.monthly_deductions.toLocaleString()}</div>
            </div>
          </CardContent>
        </Card>

        {/* Recent Activities */}
        <Card className="col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Clock className="h-5 w-5" />
              <span>Recent Activities</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {activitiesLoading ? (
                // Loading state
                <div className="space-y-4">
                  {[1, 2, 3, 4].map(i => (
                    <div key={i} className="flex space-x-3 animate-pulse">
                      <div className="w-2 h-2 rounded-full mt-2 bg-gray-300"></div>
                      <div className="flex-1 space-y-2">
                        <div className="h-4 bg-gray-300 rounded w-3/4"></div>
                        <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                        <div className="h-3 bg-gray-200 rounded w-1/4"></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : recentActivities.length > 0 ? (
                // Real activities data
                recentActivities.map((activity, index) => (
                  <div key={activity.id || index} className="flex space-x-3">
                    <div className={`w-2 h-2 rounded-full mt-2 ${
                      getActivityType(activity.category, activity.notification_type || activity.type) === 'success' ? 'bg-primary' :
                      getActivityType(activity.category, activity.notification_type || activity.type) === 'warning' ? 'bg-yellow-500' :
                      getActivityType(activity.category, activity.notification_type || activity.type) === 'error' ? 'bg-red-500' :
                      'bg-blue-500'
                    }`} />
                    <div className="flex-1 space-y-1">
                      <p className="text-sm font-medium text-foreground">
                        {activity.title}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {activity.message || activity.description}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatActivityTime(activity.timestamp)}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                // No activities state
                <div className="text-center py-8">
                  <Clock className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">No recent activities</p>
                  <p className="text-xs text-muted-foreground mt-1">Activities will appear here as they happen</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Employee Distribution Pie Chart */}
        <Card className="col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Users className="h-5 w-5 text-blue-600" />
              <span>Employee Distribution</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {employeeDistribution.by_department.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={employeeDistribution.by_department.map(dept => ({
                      name: dept.name,
                      value: dept.count
                    }))}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {employeeDistribution.by_department.map((entry, index) => {
                      const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6'];
                      return <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />;
                    })}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-64 flex items-center justify-center text-gray-500">
                No data available
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions - Matching Reference Design */}
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <UserPlus className="h-5 w-5 text-primary" />
              <span>Quick Actions</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {/* Primary Action - Solid Teal */}
            <Button
              onClick={() => window.location.href = '/employees/new'}
              className="w-full h-14 text-white flex items-center justify-start px-4 space-x-3 shadow-sm transition-all duration-200"
            >
              <UserPlus className="h-5 w-5" />
              <span className="font-medium">Add New Employee</span>
            </Button>

            {/* Secondary Actions - White with Teal Border */}
            <Button
              onClick={() => window.location.href = '/payroll/run'}
              variant="outline"
              className="w-full h-14 bg-white dark:bg-gray-800 hover:bg-teal-50 dark:hover:bg-primary/30 border-2 border-primary dark:border-primary/50 text-gray-900 dark:text-gray-200 flex items-center justify-start px-4 space-x-3 transition-all duration-200"
            >
              <DollarSign className="h-5 w-5 text-primary" />
              <span className="font-medium">Run Payroll</span>
            </Button>

            <Button
              onClick={() => window.location.href = '/leave-attendance'}
              variant="outline"
              className="w-full h-14 bg-white dark:bg-gray-800 hover:bg-teal-50 dark:hover:bg-primary/30 border-2 border-primary dark:border-primary/50 text-gray-900 dark:text-gray-200 flex items-center justify-start px-4 space-x-3 transition-all duration-200"
            >
              <CheckCircle className="h-5 w-5 text-primary" />
              <span className="font-medium">Approve Leaves</span>
            </Button>

            <Button
              onClick={() => window.location.href = '/leave-attendance'}
              variant="outline"
              className="w-full h-14 bg-white dark:bg-gray-800 hover:bg-teal-50 dark:hover:bg-primary/30 border-2 border-primary dark:border-primary/50 text-gray-900 dark:text-gray-200 flex items-center justify-start px-4 space-x-3 transition-all duration-200"
            >
              <ClipboardList className="h-5 w-5 text-primary" />
              <span className="font-medium">Manage Attendance</span>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Payroll Trends Chart */}
      <Card className="mt-4">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <TrendingUp className="h-5 w-5 text-green-600" />
            <span>Payroll Trends (6 Months)</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {payrollTrends.trends.map((trend, index) => (
              <div key={index}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-600">{trend.month}</span>
                  <span className="font-semibold">₹{(trend.amount / 1000).toFixed(0)}K</span>
                </div>
                <Progress 
                  value={payrollTrends.trends.length > 0 ? (trend.amount / Math.max(...payrollTrends.trends.map(t => t.amount)) * 100) : 0} 
                  className="h-2" 
                />
              </div>
            ))}
            {payrollTrends.trends.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                No payroll data available
              </div>
            )}
          </div>
        </CardContent>
      </Card>

    </div>
  );
};

export default Dashboard;