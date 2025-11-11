import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Bell,
  Sun,
  Moon,
  User,
  Settings,
  LogOut,
  Grid3X3,
  ChevronDown
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { useWebSocket } from "@/contexts/WebSocketContext";
import axios from "axios";
import { toast } from "sonner";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const TopBar = () => {
  const { user, logout } = useAuth();
  const { isDarkMode, toggleTheme } = useTheme();
  const { addNotificationListener } = useWebSocket();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchNotifications();
    
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

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API}/notifications`);
      // Sort notifications by created_at (newest first)
      const sortedNotifications = response.data.sort((a, b) => {
        return new Date(b.created_at) - new Date(a.created_at);
      });
      console.log('TopBar: Fetched notifications:', sortedNotifications.map(n => ({ 
        title: n.title, 
        category: n.category, 
        is_read: n.is_read 
      })));
      setNotifications(sortedNotifications);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId) => {
    try {
      await axios.put(`${API}/notifications/${notificationId}/read`);
      setNotifications(notifications.map(n => 
        n.id === notificationId ? { ...n, is_read: true } : n
      ));
      // Refresh sidebar notification counts
      if (window.refreshSidebarNotifications) {
        window.refreshSidebarNotifications();
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await axios.put(`${API}/notifications/mark-all-read`);
      setNotifications(notifications.map(n => ({ ...n, is_read: true })));
      toast.success('All notifications marked as read');
      // Refresh sidebar notification counts
      if (window.refreshSidebarNotifications) {
        window.refreshSidebarNotifications();
      }
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
    // Mark as read first
    await markAsRead(notification.id);
    
    // Navigate based on notification category and content
    const category = notification.category || '';
    const content = `${notification.title} ${notification.message}`.toLowerCase();
    
    console.log('Notification clicked:', { category, title: notification.title, message: notification.message });
    
    // Smart navigation based on category first, then content analysis
    switch (category) {
      case 'leave':
        navigate('/attendance'); // Admin Leave & Attendance page
        break;
      case 'loan':
        navigate('/loan-management');
        break;
      case 'payslip':
        navigate('/payslips');
        break;
      case 'employee':
        navigate('/employees');
        break;
      case 'profile':
        navigate('/employees');
        break;
      case 'document':
        navigate('/employees');
        break;
      case 'birthday':
        navigate('/employees');
        break;
      case 'ot':
      case 'overtime':
      case 'ot_log':
        navigate('/attendance'); // OT approvals in attendance page
        break;
      default:
        // Fallback: Smart navigation based on content keywords
        if (content.includes('ot log') || content.includes('overtime log') || content.includes('ot') && (content.includes('logged') || content.includes('submitted') || content.includes('approved') || content.includes('rejected'))) {
          navigate('/attendance');
        } else if (content.includes('leave') || content.includes('vacation') || content.includes('sick')) {
          navigate('/attendance');
        } else if (content.includes('loan') || content.includes('advance')) {
          navigate('/loan-management');
        } else if (content.includes('payslip') || content.includes('salary') || content.includes('payroll')) {
          navigate('/payslips');
        } else if (content.includes('employee') || content.includes('staff') || content.includes('profile')) {
          navigate('/employees');
        } else if (content.includes('birthday')) {
          navigate('/employees');
        } else if (content.includes('overtime')) {
          navigate('/attendance');
        } else {
          // Default to dashboard if no specific match
          navigate('/dashboard');
        }
        break;
    }
  };

  const removeTestNotifications = async () => {
    try {
      const response = await axios.delete(`${API}/notifications/test`);
      toast.success(`Removed ${response.data.deleted_count} test notifications`);
      fetchNotifications(); // Refresh notifications
    } catch (error) {
      console.error('Error removing test notifications:', error);
      toast.error('Failed to remove test notifications');
    }
  };

  const handleLogout = () => {
    logout();
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;
  
  const getNotificationVariant = (type) => {
    switch (type) {
      case 'error':
      case 'warning':
        return 'destructive';
      case 'success':
        return 'default';
      default:
        return 'secondary';
    }
  };

  return (
    <header className="h-16 bg-card border-b border-border flex items-center justify-between px-6">
      {/* Left section */}
      <div className="flex items-center space-x-4">
        <div>
          <h2 className="text-lg font-semibold text-foreground">
            Good morning, {user?.role === 'admin' ? 'Admin' : user?.username}
          </h2>
          <p className="text-sm text-muted-foreground">
            {new Date().toLocaleDateString('en-IN', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </p>
        </div>
      </div>

      {/* Right section */}
      <div className="flex items-center space-x-4">
        {/* App Switcher */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="ghost" 
              size="icon"
              className="h-8 w-8"
              data-testid="app-switcher-btn"
            >
              <Grid3X3 className="h-4 w-4 text-gray-700 dark:text-gray-300" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuLabel>Applications</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <span>Payroll Management</span>
              <Badge className="ml-2" variant="secondary">Current</Badge>
            </DropdownMenuItem>
            <DropdownMenuItem>HR Management</DropdownMenuItem>
            <DropdownMenuItem>Employee Portal</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Notifications */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="ghost" 
              size="icon" 
              className="relative h-8 w-8"
              data-testid="notifications-btn"
            >
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
            <div className="max-h-80 overflow-y-auto">
              {loading ? (
                <DropdownMenuItem disabled>
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600"></div>
                    <span className="text-sm">Loading...</span>
                  </div>
                </DropdownMenuItem>
              ) : notifications.length === 0 ? (
                <DropdownMenuItem disabled>
                  <span className="text-sm text-gray-500">No notifications</span>
                </DropdownMenuItem>
              ) : (
                notifications.map((notification) => {
                  // Truncate long messages to 100 characters
                  const truncatedMessage = notification.message.length > 100 
                    ? notification.message.substring(0, 100) + '...'
                    : notification.message;
                  
                  return (
                    <DropdownMenuItem 
                      key={notification.id} 
                      className={`cursor-pointer ${!notification.is_read ? 'bg-blue-50 dark:bg-blue-900/20' : ''}`}
                      onClick={() => handleNotificationClick(notification)}
                    >
                      <div className="flex flex-col space-y-1 w-full">
                        <div className="flex justify-between items-start">
                          <p className={`text-sm ${!notification.is_read ? 'font-semibold' : 'font-medium'}`}>
                            {notification.title}
                          </p>
                          {!notification.is_read && (
                            <div className="w-2 h-2 bg-blue-600 rounded-full flex-shrink-0 ml-2"></div>
                          )}
                        </div>
                        <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2">{truncatedMessage}</p>
                        <div className="flex items-center space-x-2">
                          <Badge 
                            variant={getNotificationVariant(notification.notification_type)}
                            className="text-xs"
                          >
                            {notification.notification_type}
                          </Badge>
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {new Date(notification.created_at).toLocaleDateString()} {new Date(notification.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </div>
                    </DropdownMenuItem>
                  );
                })
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
          size="icon"
          onClick={toggleTheme}
          className="h-8 w-8 text-foreground hover:bg-accent"
          data-testid="theme-toggle-btn"
          title={isDarkMode ? "Switch to light mode" : "Switch to dark mode"}
        >
          {isDarkMode ? (
            <Sun className="h-4 w-4 text-yellow-400" />
          ) : (
            <Moon className="h-4 w-4 text-gray-700" />
          )}
        </Button>

        {/* User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="ghost" 
              className="h-8 px-2 flex items-center space-x-2"
              data-testid="user-menu-btn"
            >
              <Avatar className="h-6 w-6">
                <AvatarFallback className="text-xs bg-primary text-primary-foreground">
                  {user?.role === 'admin' ? 'AD' : (user?.username?.split(' ').map(n => n[0]).join('').toUpperCase() || 'U')}
                </AvatarFallback>
              </Avatar>
              <span className="text-sm font-medium text-gray-900 dark:text-gray-200 hidden md:inline">
                {user?.role === 'admin' ? 'Admin' : (user?.username?.split(' ')[0] || user?.username)}
              </span>
              <ChevronDown className="h-3 w-3 text-gray-700 dark:text-gray-300" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuLabel>
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium">
                  {user?.role === 'admin' ? 'Administrator' : (user?.username?.split(' ')[0] || user?.username)}
                </p>
                <p className="text-xs text-gray-500">{user?.email || 'admin@company.com'}</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => {
              if (user?.role === 'employee') {
                navigate('/employee/profile');
              } else {
                navigate('/settings'); // Admin profile is in settings for now
              }
            }}>
              <User className="mr-2 h-4 w-4" />
              <span>Profile</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate('/settings')}>
              <Settings className="mr-2 h-4 w-4" />
              <span>Settings</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-red-600" onClick={handleLogout} data-testid="admin-logout">
              <LogOut className="mr-2 h-4 w-4" />
              <span>Log out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
};

export default TopBar;
