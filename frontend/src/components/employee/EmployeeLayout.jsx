import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import axios from 'axios';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Building2,
  Home,
  FileText,
  Calendar,
  CreditCard,
  User,
  Clock,
  FolderOpen,
  Bell,
  LogOut,
  ChevronDown,
  Menu,
  X,
  Sun,
  Moon,
  IndianRupee,
  BookOpen
} from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const EmployeeLayout = () => {
  const { user, logout } = useAuth();
  const { isDarkMode, toggleTheme } = useTheme();
  const { hasFeature, loading: subscriptionLoading } = useSubscription();
  const navigate = useNavigate();
  const location = useLocation();
  const [employeeData, setEmployeeData] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  
  const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
  const API = `${BACKEND_URL}/api`;

  useEffect(() => {
    fetchEmployeeData();
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      const response = await axios.get(`${API}/notifications`);
      setNotifications(response.data || []);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  const fetchEmployeeData = async () => {
    try {
      if (user?.employee_id) {
        const response = await axios.get(`${API}/employees/${user.employee_id}`);
        setEmployeeData(response.data);
      }
    } catch (error) {
      console.error('Error fetching employee data:', error);
    }
  };

  const allNavigationItems = [
    { path: '/employee/dashboard', label: 'Dashboard', icon: Home, featureRequired: 'employee_portal' },
    { path: '/employee/payslips', label: 'Payslips', icon: FileText, featureRequired: 'employee_portal' },
    { path: '/employee/leave', label: 'Leave', icon: Calendar, featureRequired: 'leave_management_basic' },
    { path: '/employee/loans', label: 'Finances', icon: IndianRupee, featureRequired: 'loans_advances' },
    { path: '/employee/attendance', label: 'Attendance', icon: Clock, featureRequired: 'attendance_tracking_basic' },
    { path: '/employee/documents', label: 'Documents', icon: FolderOpen, featureRequired: 'employee_portal' },
    { path: '/employee/profile', label: 'Profile', icon: User, featureRequired: 'employee_portal' },
    { path: '/employee/user-manual', label: 'Help', icon: BookOpen, featureRequired: null },
  ];

  // Filter navigation items based on subscription
  const navigationItems = subscriptionLoading 
    ? allNavigationItems 
    : allNavigationItems.filter(item => {
        if (!item.featureRequired) return true;
        return hasFeature(item.featureRequired);
      });

  const handleNavigation = (path) => {
    navigate(path);
    setMobileMenuOpen(false);
  };

  const handleLogout = () => {
    logout();
  };

  const markAllAsRead = async () => {
    try {
      await axios.put(`${API}/notifications/mark-all-read`);
      setNotifications(notifications.map(n => ({ ...n, is_read: true })));
      toast.success('All notifications marked as read');
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      toast.error('Failed to mark notifications as read');
    }
  };

  const clearAllNotifications = async () => {
    if (!confirm('Are you sure you want to clear all notifications? This action cannot be undone.')) {
      return;
    }
    
    try {
      await axios.delete(`${API}/notifications/clear-all`);
      setNotifications([]);
      toast.success('All notifications cleared');
    } catch (error) {
      console.error('Error clearing all notifications:', error);
      toast.error('Failed to clear notifications');
    }
  };

  const handleNotificationClick = async (notification) => {
    // Mark notification as read (if you have an API for this)
    try {
      await axios.put(`${API}/notifications/${notification.id}/read`);
      // Update local state
      setNotifications(prev => 
        prev.map(n => n.id === notification.id ? {...n, is_read: true} : n)
      );
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
    
    // Navigate based on notification category and content
    const category = notification.category || '';
    const content = `${notification.title} ${notification.message}`.toLowerCase();
    
    // Smart navigation for employee portal
    switch (category) {
      case 'leave':
        navigate('/employee/leave');
        break;
      case 'loan':
        navigate('/employee/finances');
        break;
      case 'payslip':
        navigate('/employee/payslips');
        break;
      case 'profile':
        navigate('/employee/profile');
        break;
      case 'document':
        navigate('/employee/documents');
        break;
      default:
        // Fallback: Smart navigation based on content keywords
        if (content.includes('leave') || content.includes('vacation') || content.includes('sick')) {
          navigate('/employee/leave');
        } else if (content.includes('loan') || content.includes('advance')) {
          navigate('/employee/finances');
        } else if (content.includes('payslip') || content.includes('salary')) {
          navigate('/employee/payslips');
        } else if (content.includes('profile') || content.includes('personal')) {
          navigate('/employee/profile');
        } else if (content.includes('document')) {
          navigate('/employee/documents');
        } else {
          // Default to employee dashboard
          navigate('/employee/dashboard');
        }
        break;
    }
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <div className="min-h-screen bg-background">
      {/* Top Header */}
      <header className="bg-card border-b border-border sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo and Brand */}
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <img 
                  src="/elevate-logo.png" 
                  alt="Elevate Logo" 
                  className="w-8 h-8"
                />
                <div className="hidden sm:block">
                  <h1 className="text-lg font-bold text-foreground">Elevate</h1>
                </div>
              </div>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex space-x-1">
              {navigationItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                return (
                  <Button
                    key={item.path}
                    variant={isActive ? "default" : "ghost"}
                    size="sm"
                    onClick={() => handleNavigation(item.path)}
                    className={`flex items-center space-x-1 ${
                      isActive ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{item.label}</span>
                  </Button>
                );
              })}
            </nav>

            {/* Right Section */}
            <div className="flex items-center space-x-2">
              {/* Notifications */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="relative">
                    <Bell className="h-4 w-4 text-gray-700 dark:text-gray-300" />
                    {unreadCount > 0 && (
                      <Badge 
                        className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 text-xs flex items-center justify-center"
                        variant="destructive"
                      >
                        {unreadCount}
                      </Badge>
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-80">
                  <DropdownMenuLabel>Notifications</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <div className="max-h-60 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <DropdownMenuItem disabled>
                        <span className="text-sm text-muted-foreground">No notifications</span>
                      </DropdownMenuItem>
                    ) : (
                      notifications.map((notification) => (
                        <DropdownMenuItem 
                          key={notification.id} 
                          className={`cursor-pointer ${!notification.is_read ? 'bg-blue-50 dark:bg-blue-950' : ''}`}
                          onClick={() => handleNotificationClick(notification)}
                        >
                          <div className="flex flex-col space-y-1 w-full">
                            <div className="flex justify-between items-start">
                              <p className={`text-sm ${!notification.is_read ? 'font-semibold' : 'font-medium'}`}>
                                {notification.title}
                              </p>
                              {!notification.is_read && (
                                <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground">{notification.message}</p>
                            <div className="flex items-center space-x-2">
                              <Badge 
                                variant={notification.notification_type === 'success' ? 'default' : 
                                       notification.notification_type === 'error' ? 'destructive' : 'secondary'}
                                className="text-xs"
                              >
                                {notification.notification_type || 'info'}
                              </Badge>
                              <span className="text-xs text-muted-foreground">
                                {new Date(notification.created_at).toLocaleDateString()} {new Date(notification.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                          </div>
                        </DropdownMenuItem>
                      ))
                    )}
                  </div>
                  {notifications.length > 0 && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem 
                        className="justify-center cursor-pointer"
                        onClick={markAllAsRead}
                        disabled={unreadCount === 0}
                      >
                        <span className="text-sm text-primary">
                          {unreadCount > 0 ? 'Mark all as read' : 'All notifications read'}
                        </span>
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        className="justify-center cursor-pointer"
                        onClick={clearAllNotifications}
                      >
                        <span className="text-sm text-red-600">
                          Clear All Notifications
                        </span>
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Theme Toggle */}
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleTheme}
                className="h-8 w-8 p-0"
                title={isDarkMode ? "Switch to light mode" : "Switch to dark mode"}
              >
                {isDarkMode ? (
                  <Sun className="h-4 w-4 text-gray-700 dark:text-gray-300" />
                ) : (
                  <Moon className="h-4 w-4 text-gray-700 dark:text-gray-300" />
                )}
              </Button>

              {/* User Menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="flex items-center space-x-2 h-8">
                    <Avatar className="h-6 w-6">
                      <AvatarImage src={employeeData?.photo_url} />
                      <AvatarFallback className="text-xs bg-blue-600 text-white">
                        {employeeData?.name?.split(' ').map(n => n[0]).join('') || user?.username?.slice(0,2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm font-medium text-gray-900 dark:text-gray-200 hidden sm:inline">
                      {employeeData?.name?.split(' ')[0] || user?.username?.split(' ')[0] || user?.username}
                    </span>
                    <ChevronDown className="h-3 w-3 text-gray-700 dark:text-gray-300" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuLabel>
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium dark:text-gray-200">{employeeData?.name?.split(' ')[0] || user?.username?.split(' ')[0] || user?.username}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{employeeData?.employee_id}</p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => handleNavigation('/employee/profile')}>
                    <User className="mr-2 h-4 w-4" />
                    <span>Profile</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="text-red-600" onClick={handleLogout}>
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Mobile Menu Toggle */}
              <Button
                variant="ghost"
                size="sm"
                className="md:hidden"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                {mobileMenuOpen ? <X className="h-4 w-4 text-gray-700 dark:text-gray-300" /> : <Menu className="h-4 w-4 text-gray-700 dark:text-gray-300" />}
              </Button>
            </div>
          </div>

          {/* Mobile Navigation Menu */}
          {mobileMenuOpen && (
            <div className="md:hidden border-t border-border py-4">
              <nav className="space-y-2">
                {navigationItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = location.pathname === item.path;
                  return (
                    <Button
                      key={item.path}
                      variant={isActive ? "default" : "ghost"}
                      size="sm"
                      onClick={() => handleNavigation(item.path)}
                      className={`w-full justify-start flex items-center space-x-1 ${
                        isActive ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                      <span>{item.label}</span>
                    </Button>
                  );
                })}
              </nav>
            </div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <Outlet context={{ employeeData, refreshEmployeeData: fetchEmployeeData }} />
        </div>
      </main>
    </div>
  );
};

export default EmployeeLayout;
