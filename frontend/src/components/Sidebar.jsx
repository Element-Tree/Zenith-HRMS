import React, { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import axios from "axios";
import {
  LayoutDashboard,
  Users,
  CreditCard,
  Percent,
  Shield,
  FileText,
  Calendar,
  IndianRupee,
  DollarSign,
  Building2,
  Settings,
  Key,
  LogOut,
  ChevronLeft,
  ChevronRight,
  UserPlus,
  Upload,
  CalendarDays,
  Monitor
} from "lucide-react";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const allMenuItems = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
    badge: null,
    featureRequired: null // Always visible
  },
  {
    title: "Employees",
    href: "/employees",
    icon: Users,
    badge: null,
    featureRequired: 'employee_database'
  },
  {
    title: "Payroll",
    icon: CreditCard,
    featureRequired: 'payroll_processing_manual', // Show if manual OR automated
    items: [
      { title: "Run Payroll", href: "/payroll/run", icon: CreditCard, featureRequired: 'payroll_processing_manual' },
      { title: "Salary Structure", href: "/payroll/salary-structure", icon: CreditCard, featureRequired: 'salary_structure_management' }
    ]
  },
  {
    title: "Deductions",
    href: "/deductions",
    icon: Percent,
    badge: null,
    featureRequired: 'deductions_advanced'
  },
  {
    title: "Compliance",
    href: "/compliance",
    icon: Shield,
    badge: null,
    featureRequired: 'compliance_reports_basic', // Will check basic OR full
    featureOr: 'compliance_reports_full'
  },
  {
    title: "Payslips",
    href: "/payslips",
    icon: FileText,
    badge: null,
    featureRequired: 'payslip_generation'
  },
  {
    title: "Attendance",
    href: "/attendance",
    icon: Calendar,
    badge: null,
    featureRequired: 'attendance_tracking_basic', // Will check basic OR advanced
    featureOr: 'attendance_tracking_advanced'
  },
  {
    title: "Leave Management",
    href: "/leave-management",
    icon: Calendar,
    badge: null,
    featureRequired: 'leave_management_basic', // Will check basic OR advanced
    featureOr: 'leave_management_advanced'
  },
  {
    title: "Loan Management",
    href: "/loan-management",
    icon: DollarSign,
    badge: null,
    featureRequired: 'loans_advances'
  },
  {
    title: "Bank Advice",
    href: "/bank-advice",
    icon: Building2,
    badge: null,
    featureRequired: 'bank_advice_generation'
  },
  {
    title: "Login Details",
    href: "/admin/login-details",
    icon: Monitor,
    badge: null,
    featureRequired: null // Always visible for admins
  },
  {
    title: "Event Management",
    href: "/admin/events",
    icon: CalendarDays,
    badge: null,
    featureRequired: 'event_management'
  },
  {
    title: "Analytics & Reports",
    icon: Shield,
    featureRequired: 'payroll_analytics', // Show if any analytics feature
    featureOr: 'custom_reports',
    items: [
      { title: "Payroll Analytics", href: "/payroll-analytics", icon: Shield, featureRequired: 'payroll_analytics' },
      { title: "Custom Reports", href: "/custom-reports", icon: FileText, featureRequired: 'custom_reports' },
      { title: "Audit Logs", href: "/audit-logs", icon: Shield, featureRequired: 'audit_logs' }
    ]
  },
  {
    title: "Settings",
    icon: Settings,
    featureRequired: null, // Always visible
    items: [
      { 
        title: "General Settings", 
        href: "/settings", 
        icon: Settings, 
        featureRequired: null, 
        // disallowedPlans: ['free', 'starter'],
      },
      { title: "Salary Components", href: "/salary-components", icon: CreditCard, featureRequired: null, disallowedPlans: ['free'] },
      { title: "Tax Configuration", href: "/tax-configuration", icon: FileText, featureRequired: 'salary_structure_management',disallowedPlans: ['free'] }
    ]
  }
];

const Sidebar = ({ collapsed, onToggle }) => {
  const location = useLocation();
  const [openSubmenu, setOpenSubmenu] = React.useState(null);
  const { logout } = useAuth();
  const { hasFeature, loading: subscriptionLoading, planSlug } = useSubscription();
  const [notificationCounts, setNotificationCounts] = useState({});

  useEffect(() => {
    fetchNotificationCounts();
    
    // Poll for notification updates every 30 seconds
    const interval = setInterval(() => {
      fetchNotificationCounts();
    }, 30000);
    
    // Expose refresh function globally so other components can trigger it
    window.refreshSidebarNotifications = fetchNotificationCounts;
    
    return () => {
      clearInterval(interval);
      delete window.refreshSidebarNotifications;
    };
  }, []);

  const fetchNotificationCounts = async () => {
    try {
      const response = await axios.get(`${API}/notifications`);
      const notifications = response.data;
      
      console.log('Sidebar: Fetched notifications:', notifications.length);
      
      // Count unread notifications by category
      const counts = {};
      notifications.forEach(notif => {
        if (!notif.is_read) {
          let category = notif.category;
          
          // Fallback: infer category from title/message if not set
          if (!category || category === 'general') {
            const title = (notif.title || '').toLowerCase();
            const message = (notif.message || '').toLowerCase();
            
            // More specific pattern matching
            if (title.includes('ot log') || title.includes('overtime') || message.includes('overtime log') || 
                (title.includes('ot') && (title.includes('logged') || title.includes('submitted') || title.includes('approved') || title.includes('rejected')))) {
              category = 'ot';
            } else if (title.includes('leave') || message.includes('leave request') || message.includes('leave application')) {
              category = 'leave';
            } else if (title.includes('loan') || message.includes('loan application') || message.includes('loan request')) {
              category = 'loan';
            } else if (title.includes('payslip') || message.includes('payslip generated')) {
              category = 'payslip';
            } else if (title.includes('employee') || title.includes('birthday') || message.includes('new employee')) {
              category = 'employee';
            } else {
              category = 'general';
            }
          }
          
          counts[category] = (counts[category] || 0) + 1;
          console.log('Sidebar: Unread notification with category:', category, 'title:', notif.title);
        }
      });
      
      console.log('Sidebar: Notification counts by category:', counts);
      setNotificationCounts(counts);
    } catch (error) {
      console.error('Error fetching notification counts:', error);
    }
  };

  // Filter menu items based on subscription
  const filterMenuItems = (items) => {
    if (subscriptionLoading) return items; // Show all while loading
    
    return items.filter(item => {

      // **NEW:** Check for disallowed plans
      if (item.disallowedPlans && item.disallowedPlans.includes(planSlug)) {
        return false;
      }

      // If no feature required, always show
      if (!item.featureRequired) {
        // If it has subitems, filter them too
        if (item.items) {
          const filteredSubitems = filterMenuItems(item.items);
          // Only show parent if it has at least one visible subitem
          if (filteredSubitems.length > 0) {
            return { ...item, items: filteredSubitems };
          }
          return false;
        }
        return true;
      }
      
      // Check if feature is available (with OR logic support)
      let hasAccess = hasFeature(item.featureRequired);
      
      // If featureOr is specified, check if EITHER feature is available
      if (!hasAccess && item.featureOr) {
        hasAccess = hasFeature(item.featureOr);
      }
      
      if (hasAccess && item.items) {
        // Filter subitems
        const filteredSubitems = filterMenuItems(item.items);
        return filteredSubitems.length > 0;
      }
      
      return hasAccess;
    }).map(item => {
      if (item.items) {
        return { ...item, items: filterMenuItems(item.items) };
      }
      return item;
    });
  };

  const menuItems = filterMenuItems(allMenuItems);

  // Map categories to menu routes
  const getNotificationCountForRoute = (href) => {
    const routeCategoryMap = {
      '/attendance': ['ot', 'overtime', 'ot_log'],
      '/leave-management': ['leave'],
      '/loan-management': ['loan'],
      '/payslips': ['payslip'],
      '/employees': ['employee', 'profile', 'document', 'birthday']
    };
    
    const categories = routeCategoryMap[href] || [];
    let total = 0;
    categories.forEach(cat => {
      total += notificationCounts[cat] || 0;
    });
    
    if (total > 0) {
      console.log(`Sidebar: Badge for ${href}: ${total} notifications`);
    }
    
    return total > 0 ? total : null;
  };

  const handleLogout = () => {
    console.log('🔍 Sidebar logout button clicked');
    logout();
  };

  const isActiveLink = (href) => {
    return location.pathname === href;
  };

  const isActiveSubmenu = (items) => {
    return items?.some(item => location.pathname === item.href);
  };

  const toggleSubmenu = (index) => {
    if (collapsed) return;
    setOpenSubmenu(openSubmenu === index ? null : index);
  };

  React.useEffect(() => {
    // Auto-open submenu if current path matches
    menuItems.forEach((item, index) => {
      if (item.items && isActiveSubmenu(item.items)) {
        setOpenSubmenu(index);
      }
    });
  }, [location.pathname]);

  return (
    <div className={cn(
      "fixed left-0 top-0 z-40 h-full bg-card border-r border-border transition-all duration-300 ease-in-out",
      collapsed ? "w-16" : "w-64"
    )}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        {!collapsed && (
          <div className="flex items-center space-x-2">
            <div className="flex items-center space-x-3">
              <img 
                src="/elevate-logo.png" 
                alt="Elevate Logo" 
                className="w-8 h-8"
              />
              <div>
                <h1 className="font-bold text-lg text-foreground">Elevate</h1>
                <p className="text-xs text-muted-foreground">HR Management</p>
              </div>
            </div>
          </div>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggle}
          className="h-8 w-8 hover:bg-accent"
          data-testid="sidebar-toggle-btn"
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* Navigation */}
      <ScrollArea className="flex-1 px-3 py-4">
        <nav className="space-y-2">
          {menuItems.map((item, index) => {
            const isActive = item.href ? isActiveLink(item.href) : isActiveSubmenu(item.items);
            const hasSubmenu = !!item.items;
            const isSubmenuOpen = openSubmenu === index;
            const Icon = item.icon;

            return (
              <div key={index}>
                {item.href ? (
                  // Single menu item
                  <Link to={item.href}>
                    <Button
                      variant={isActive ? "secondary" : "ghost"}
                      className={cn(
                        "w-full justify-start h-10 px-3 text-foreground",
                        isActive && "bg-primary/10 text-primary hover:bg-primary/20",
                        !isActive && "hover:bg-accent hover:text-accent-foreground",
                        collapsed && "justify-center px-0"
                      )}
                      data-testid={`sidebar-${item.title.toLowerCase().replace(/\s+/g, '-')}-link`}
                    >
                      <Icon className={cn("h-4 w-4", !collapsed && "mr-3")} />
                      {!collapsed && (
                        <>
                          <span className="flex-1 text-left">{item.title}</span>
                          {(() => {
                            // Show dynamic notification count or static badge
                            const notifCount = getNotificationCountForRoute(item.href);
                            const badge = item.badge;
                            
                            if (notifCount) {
                              return (
                                <Badge variant="destructive" className="ml-2">
                                  {notifCount}
                                </Badge>
                              );
                            } else if (badge) {
                              return (
                                <Badge variant={badge.variant || "secondary"} className="ml-2">
                                  {badge.text}
                                </Badge>
                              );
                            }
                            return null;
                          })()}
                        </>
                      )}
                    </Button>
                  </Link>
                ) : (
                  // Menu item with submenu
                  <>
                    <Button
                      variant={isActive ? "secondary" : "ghost"}
                      className={cn(
                        "w-full justify-start h-10 px-3 text-foreground",
                        isActive && "bg-primary/10 text-primary hover:bg-primary/20",
                        !isActive && "hover:bg-accent hover:text-accent-foreground",
                        collapsed && "justify-center px-0"
                      )}
                      onClick={() => toggleSubmenu(index)}
                      data-testid={`sidebar-${item.title.toLowerCase().replace(/\s+/g, '-')}-toggle`}
                    >
                      <Icon className={cn("h-4 w-4", !collapsed && "mr-3")} />
                      {!collapsed && (
                        <>
                          <span className="flex-1 text-left">{item.title}</span>
                          <ChevronRight 
                            className={cn(
                              "h-4 w-4 transition-transform duration-200",
                              isSubmenuOpen && "rotate-90"
                            )} 
                          />
                        </>
                      )}
                    </Button>
                    
                    {/* Submenu */}
                    {!collapsed && isSubmenuOpen && (
                      <div className="ml-4 mt-1 space-y-1 animate-slide-in">
                        {item.items.map((subItem, subIndex) => {
                          const SubIcon = subItem.icon;
                          const isSubActive = isActiveLink(subItem.href);
                          
                          return (
                            <Link key={subIndex} to={subItem.href}>
                              <Button
                                variant={isSubActive ? "secondary" : "ghost"}
                                className={cn(
                                  "w-full justify-start h-9 px-3 text-sm text-foreground",
                                  isSubActive && "bg-primary/10 text-primary hover:bg-primary/20",
                                  !isSubActive && "hover:bg-accent hover:text-accent-foreground"
                                )}
                                data-testid={`sidebar-${subItem.title.toLowerCase().replace(/\s+/g, '-')}-link`}
                              >
                                <SubIcon className="h-3 w-3 mr-2" />
                                {subItem.title}
                              </Button>
                            </Link>
                          );
                        })}
                      </div>
                    )}
                  </>
                )}
              </div>
            );
          })}
        </nav>
        
        <Separator className="my-4" />
        
        {/* Logout */}
        <Button
          variant="ghost"
          className={cn(
            "w-full justify-start h-10 px-3 text-destructive hover:text-destructive hover:bg-destructive/10",
            collapsed && "justify-center px-0"
          )}
          onClick={handleLogout}
          data-testid="sidebar-logout-btn"
        >
          <LogOut className={cn("h-4 w-4", !collapsed && "mr-3")} />
          {!collapsed && "Logout"}
        </Button>
      </ScrollArea>
    </div>
  );
};

export default Sidebar;