import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  BookOpen, 
  LayoutDashboard, 
  Calendar,
  ChevronRight,
  Home,
  Award,
  Clock,
  Bell,
  Zap,
  Users,
  CheckCircle,
  XCircle,
  AlertCircle,
  Info,
  Target,
  TrendingUp,
  MinusCircle,
  Plus
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const UserManual = () => {
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState('dashboard-overview');

  const sections = [
    {
      id: 'dashboard',
      title: 'Dashboard',
      icon: LayoutDashboard,
      subsections: [
        { id: 'dashboard-overview', title: 'Overview' },
        { id: 'dashboard-performance', title: 'Performance Rating' },
        { id: 'dashboard-attendance', title: "Today's Status" },
        { id: 'dashboard-quick-actions', title: 'Quick Actions' },
        { id: 'dashboard-notifications', title: 'Notifications' },
        { id: 'dashboard-events', title: 'Upcoming Events' },
      ]
    },
    {
      id: 'attendance',
      title: 'Attendance',
      icon: Calendar,
      subsections: [
        { id: 'attendance-overview', title: 'Overview' },
        { id: 'attendance-calendar', title: 'Monthly Calendar' },
        { id: 'attendance-summary', title: 'Monthly Summary' },
        { id: 'attendance-ot-logging', title: 'Logging Overtime' },
        { id: 'attendance-late-arrivals', title: 'Late Arrivals' },
      ]
    }
  ];

  const ScrollToSection = ({ sectionId }) => {
    React.useEffect(() => {
      const element = document.getElementById(sectionId);
      if (element && activeSection === sectionId) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, [sectionId]);
    return null;
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <ScrollToSection sectionId={activeSection} />
      
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <BookOpen className="h-8 w-8 text-blue-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">User Manual</h1>
                <p className="text-sm text-gray-600 dark:text-gray-400">Complete guide to the Employee Portal</p>
              </div>
            </div>
            <Button onClick={() => navigate('/employee/dashboard')} variant="outline">
              <Home className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex gap-8">
          {/* Left Sidebar Navigation */}
          <div className="w-64 flex-shrink-0">
            <div className="sticky top-24 space-y-2">
              <h2 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
                Contents
              </h2>
              {sections.map((section) => (
                <div key={section.id} className="space-y-1">
                  <div className="flex items-center space-x-2 text-sm font-medium text-gray-900 dark:text-gray-100 py-2">
                    <section.icon className="h-4 w-4" />
                    <span>{section.title}</span>
                  </div>
                  {section.subsections.map((subsection) => (
                    <button
                      key={subsection.id}
                      onClick={() => setActiveSection(subsection.id)}
                      className={`w-full text-left pl-6 py-2 text-sm rounded-lg transition-colors ${
                        activeSection === subsection.id
                          ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 font-medium'
                          : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span>{subsection.title}</span>
                        {activeSection === subsection.id && (
                          <ChevronRight className="h-4 w-4" />
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              ))}
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 space-y-12">
            
            {/* ==================== DASHBOARD SECTION ==================== */}
            
            {/* Dashboard Overview */}
            <section id="dashboard-overview" className="scroll-mt-24">
              <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg p-6 mb-6">
                <div className="flex items-center space-x-3 text-white">
                  <LayoutDashboard className="h-8 w-8" />
                  <div>
                    <h2 className="text-3xl font-bold">Dashboard</h2>
                    <p className="text-blue-100">Your personal workspace at a glance</p>
                  </div>
                </div>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Info className="h-5 w-5 text-blue-600" />
                    What is the Dashboard?
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-gray-700 dark:text-gray-300">
                    The Dashboard is your home page in the Employee Portal. It provides a comprehensive overview of your work status, performance, and important updates—all in one place.
                  </p>
                  
                  <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                    <p className="text-sm text-blue-900 dark:text-blue-200 font-medium mb-2">📸 Screenshot: Dashboard Page</p>
                    <div className="bg-white dark:bg-gray-800 border-2 border-dashed border-blue-300 dark:border-blue-700 rounded-lg h-64 flex items-center justify-center">
                      <div className="text-center text-gray-500 dark:text-gray-400">
                        <LayoutDashboard className="h-12 w-12 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">Dashboard overview screenshot placeholder</p>
                        <p className="text-xs mt-1">Shows: Performance card, Today's Status, Quick Actions, Notifications, Events</p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">Key Features:</h3>
                    <ul className="space-y-2">
                      <li className="flex items-start gap-2">
                        <Award className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                        <div>
                          <span className="font-medium">Performance Rating:</span> See your monthly performance score and breakdown
                        </div>
                      </li>
                      <li className="flex items-start gap-2">
                        <Clock className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                        <div>
                          <span className="font-medium">Today's Status:</span> Real-time attendance and work status with countdowns
                        </div>
                      </li>
                      <li className="flex items-start gap-2">
                        <Zap className="h-5 w-5 text-purple-600 mt-0.5 flex-shrink-0" />
                        <div>
                          <span className="font-medium">Quick Actions:</span> One-click access to common tasks
                        </div>
                      </li>
                      <li className="flex items-start gap-2">
                        <Bell className="h-5 w-5 text-orange-600 mt-0.5 flex-shrink-0" />
                        <div>
                          <span className="font-medium">Notifications:</span> Important updates from HR and admin
                        </div>
                      </li>
                      <li className="flex items-start gap-2">
                        <Users className="h-5 w-5 text-pink-600 mt-0.5 flex-shrink-0" />
                        <div>
                          <span className="font-medium">Upcoming Events:</span> Birthdays, holidays, and company celebrations
                        </div>
                      </li>
                    </ul>
                  </div>
                </CardContent>
              </Card>
            </section>

            {/* Performance Rating */}
            <section id="dashboard-performance" className="scroll-mt-24">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Award className="h-5 w-5 text-blue-600" />
                    Understanding Your Performance Rating
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <p className="text-gray-700 dark:text-gray-300">
                    Your Performance Rating is a numerical score (out of 5.0) that reflects your work performance. It updates monthly and is cumulative, meaning your rating carries forward each month.
                  </p>

                  <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                    <p className="text-sm text-yellow-900 dark:text-yellow-200 font-medium mb-2">📸 Screenshot: Performance Rating Card</p>
                    <div className="bg-white dark:bg-gray-800 border-2 border-dashed border-yellow-300 dark:border-yellow-700 rounded-lg h-48 flex items-center justify-center">
                      <div className="text-center text-gray-500 dark:text-gray-400">
                        <Award className="h-12 w-12 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">Performance rating card screenshot</p>
                        <p className="text-xs mt-1">Shows: Rating number (4.520), month selector, clickable card hint</p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">How It Works:</h3>
                    
                    <div className="space-y-4">
                      <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <Target className="h-5 w-5 text-green-600" />
                          <h4 className="font-semibold text-green-900 dark:text-green-200">Base Rating: 4.0</h4>
                        </div>
                        <p className="text-sm text-green-800 dark:text-green-300">
                          Everyone starts with a base rating of 4.0. This carries forward each month, so your rating is cumulative!
                        </p>
                      </div>

                      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <CheckCircle className="h-5 w-5 text-blue-600" />
                          <h4 className="font-semibold text-blue-900 dark:text-blue-200">Overtime Bonus: +0.01 per hour</h4>
                        </div>
                        <p className="text-sm text-blue-800 dark:text-blue-300 mb-2">
                          Earn rating points for logged and approved overtime hours.
                        </p>
                        <ul className="text-sm text-blue-800 dark:text-blue-300 space-y-1 ml-4">
                          <li>• 30 minutes OT = +0.005 points</li>
                          <li>• 1 hour OT = +0.01 points</li>
                          <li>• 2 hours OT = +0.02 points</li>
                        </ul>
                      </div>

                      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <XCircle className="h-5 w-5 text-red-600" />
                          <h4 className="font-semibold text-red-900 dark:text-red-200">Late Arrival Penalty: -0.02 per occurrence</h4>
                        </div>
                        <p className="text-sm text-red-800 dark:text-red-300">
                          Arriving after 8:30 AM on working days deducts 0.02 points from your rating. Be punctual!
                        </p>
                      </div>

                      <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <Award className="h-5 w-5 text-yellow-600" />
                          <h4 className="font-semibold text-yellow-900 dark:text-yellow-200">Punctuality Bonus: +0.15 at month-end</h4>
                        </div>
                        <p className="text-sm text-yellow-800 dark:text-yellow-300">
                          If you have ZERO late arrivals for the entire month, you automatically earn +0.15 bonus at month-end. This is a big boost!
                        </p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">Step-by-Step: Viewing Rating Details</h3>
                    <ol className="space-y-3">
                      <li className="flex gap-3">
                        <Badge className="h-6 w-6 rounded-full flex items-center justify-center flex-shrink-0">1</Badge>
                        <div>
                          <p className="font-medium text-gray-900 dark:text-gray-100">Click on the Performance Rating card</p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">The card is clickable and shows your current rating number</p>
                        </div>
                      </li>
                      <li className="flex gap-3">
                        <Badge className="h-6 w-6 rounded-full flex items-center justify-center flex-shrink-0">2</Badge>
                        <div>
                          <p className="font-medium text-gray-900 dark:text-gray-100">View detailed breakdown</p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">A dialog opens showing: Base rating, OT hours, Late arrivals, Punctuality bonus</p>
                        </div>
                      </li>
                      <li className="flex gap-3">
                        <Badge className="h-6 w-6 rounded-full flex items-center justify-center flex-shrink-0">3</Badge>
                        <div>
                          <p className="font-medium text-gray-900 dark:text-gray-100">Read improvement tips</p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">The dialog provides personalized tips to improve your rating</p>
                        </div>
                      </li>
                    </ol>

                    <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-4 mt-4">
                      <p className="text-sm text-purple-900 dark:text-purple-200 font-medium mb-2">📸 Screenshot: Rating Details Dialog</p>
                      <div className="bg-white dark:bg-gray-800 border-2 border-dashed border-purple-300 dark:border-purple-700 rounded-lg h-64 flex items-center justify-center">
                        <div className="text-center text-gray-500 dark:text-gray-400">
                          <TrendingUp className="h-12 w-12 mx-auto mb-2 opacity-50" />
                          <p className="text-sm">Rating breakdown dialog screenshot</p>
                          <p className="text-xs mt-1">Shows: Base (4.0), OT (+0.02), Late (-0.04), Bonus (0), Tips section</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-600 p-4">
                    <p className="text-sm text-blue-900 dark:text-blue-200">
                      <strong>💡 Pro Tip:</strong> Your rating is displayed to 3 decimal places (e.g., 4.520). This precision ensures that even 30-minute OT increments (+0.005) are visible!
                    </p>
                  </div>
                </CardContent>
              </Card>
            </section>

            {/* Today's Status */}
            <section id="dashboard-attendance" className="scroll-mt-24">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5 text-green-600" />
                    Today's Status - Real-Time Attendance
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <p className="text-gray-700 dark:text-gray-300">
                    The "Today's Status" card shows your current work status with live countdowns and attendance information. It changes based on the time of day and whether you're on leave.
                  </p>

                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">Status Types:</h3>
                    
                    <div className="space-y-4">
                      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <Clock className="h-5 w-5 text-blue-600" />
                          <h4 className="font-semibold text-blue-900 dark:text-blue-200">Before 8:30 AM: Countdown to Work Start</h4>
                        </div>
                        <p className="text-sm text-blue-800 dark:text-blue-300 mb-2">
                          Shows a live countdown timer with hours, minutes, and seconds until work begins.
                        </p>
                        <div className="bg-white dark:bg-gray-800 border-2 border-dashed border-blue-300 dark:border-blue-700 rounded-lg p-3 text-center">
                          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Example Display:</p>
                          <p className="text-2xl font-bold text-blue-600">02 : 45 : 30</p>
                          <p className="text-xs text-gray-600 dark:text-gray-400">hours  mins  secs</p>
                          <p className="text-sm text-blue-700 dark:text-blue-400 mt-2">Work starts at 8:30 AM</p>
                        </div>
                      </div>

                      <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <CheckCircle className="h-5 w-5 text-green-600" />
                          <h4 className="font-semibold text-green-900 dark:text-green-200">8:30 AM - 5:30 PM: During Work Hours</h4>
                        </div>
                        <p className="text-sm text-green-800 dark:text-green-300 mb-2">
                          Shows your attendance details: check-in time, hours worked so far, and any OT logged.
                        </p>
                      </div>

                      <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <Clock className="h-5 w-5 text-purple-600" />
                          <h4 className="font-semibold text-purple-900 dark:text-purple-200">After 5:30 PM: Countdown to Next Day</h4>
                        </div>
                        <p className="text-sm text-purple-800 dark:text-purple-300">
                          Shows countdown to tomorrow's work start. Congratulates you on completing the day!
                        </p>
                      </div>

                      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <AlertCircle className="h-5 w-5 text-red-600" />
                          <h4 className="font-semibold text-red-900 dark:text-red-200">On Leave</h4>
                        </div>
                        <p className="text-sm text-red-800 dark:text-red-300">
                          If you have approved leave for today, shows "You are on leave today" message.
                        </p>
                      </div>

                      <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <Info className="h-5 w-5 text-gray-600" />
                          <h4 className="font-semibold text-gray-900 dark:text-gray-200">Weekend/Holiday</h4>
                        </div>
                        <p className="text-sm text-gray-700 dark:text-gray-300">
                          Shows "It's a weekend/holiday - Enjoy your day off!" with option to log OT if working.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                    <p className="text-sm text-green-900 dark:text-green-200 font-medium mb-2">📸 Screenshot: Today's Status Card</p>
                    <div className="bg-white dark:bg-gray-800 border-2 border-dashed border-green-300 dark:border-green-700 rounded-lg h-48 flex items-center justify-center">
                      <div className="text-center text-gray-500 dark:text-gray-400">
                        <Clock className="h-12 w-12 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">Today's status screenshot</p>
                        <p className="text-xs mt-1">Shows: Status badge, countdown timer, check-in details, OT info</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-600 p-4">
                    <p className="text-sm text-blue-900 dark:text-blue-200">
                      <strong>💡 Pro Tip:</strong> The countdown timers update every second in real-time, giving you exact awareness of work timing!
                    </p>
                  </div>
                </CardContent>
              </Card>
            </section>

            {/* Quick Actions */}
            <section id="dashboard-quick-actions" className="scroll-mt-24">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Zap className="h-5 w-5 text-purple-600" />
                    Quick Actions - One-Click Tasks
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <p className="text-gray-700 dark:text-gray-300">
                    Quick Actions provide instant access to the most common tasks you perform regularly. No need to navigate through menus!
                  </p>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Calendar className="h-5 w-5 text-purple-600" />
                        <h4 className="font-semibold text-purple-900 dark:text-purple-200">Apply Leave</h4>
                      </div>
                      <p className="text-sm text-purple-800 dark:text-purple-300">
                        Opens the leave application page where you can submit leave requests for Casual, Sick, or Annual leave.
                      </p>
                    </div>

                    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Award className="h-5 w-5 text-blue-600" />
                        <h4 className="font-semibold text-blue-900 dark:text-blue-200">View Payslips</h4>
                      </div>
                      <p className="text-sm text-blue-800 dark:text-blue-300">
                        Takes you to the payslips page where you can view and download all your salary slips.
                      </p>
                    </div>

                    <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Users className="h-5 w-5 text-green-600" />
                        <h4 className="font-semibold text-green-900 dark:text-green-200">Update Profile</h4>
                      </div>
                      <p className="text-sm text-green-800 dark:text-green-300">
                        Opens your profile page where you can update personal information, emergency contacts, and bank details.
                      </p>
                    </div>

                    <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Clock className="h-5 w-5 text-orange-600" />
                        <h4 className="font-semibold text-orange-900 dark:text-orange-200">Log OT</h4>
                      </div>
                      <p className="text-sm text-orange-800 dark:text-orange-300">
                        Opens the attendance page where you can log today's overtime hours (in 30-minute increments).
                      </p>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">Step-by-Step: Using Quick Actions</h3>
                    <ol className="space-y-3">
                      <li className="flex gap-3">
                        <Badge className="h-6 w-6 rounded-full flex items-center justify-center flex-shrink-0">1</Badge>
                        <div>
                          <p className="font-medium text-gray-900 dark:text-gray-100">Locate the Quick Actions section</p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">It's in the middle-right area of the dashboard, below Today's Status</p>
                        </div>
                      </li>
                      <li className="flex gap-3">
                        <Badge className="h-6 w-6 rounded-full flex items-center justify-center flex-shrink-0">2</Badge>
                        <div>
                          <p className="font-medium text-gray-900 dark:text-gray-100">Click the button for your desired action</p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">Each button has an icon and label for easy identification</p>
                        </div>
                      </li>
                      <li className="flex gap-3">
                        <Badge className="h-6 w-6 rounded-full flex items-center justify-center flex-shrink-0">3</Badge>
                        <div>
                          <p className="font-medium text-gray-900 dark:text-gray-100">Complete your task</p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">You'll be taken directly to the relevant page</p>
                        </div>
                      </li>
                    </ol>
                  </div>

                  <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-4">
                    <p className="text-sm text-purple-900 dark:text-purple-200 font-medium mb-2">📸 Screenshot: Quick Actions</p>
                    <div className="bg-white dark:bg-gray-800 border-2 border-dashed border-purple-300 dark:border-purple-700 rounded-lg h-32 flex items-center justify-center">
                      <div className="text-center text-gray-500 dark:text-gray-400">
                        <Zap className="h-12 w-12 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">Quick actions section screenshot</p>
                        <p className="text-xs mt-1">Shows: 4 colorful buttons with icons</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </section>

            {/* Notifications */}
            <section id="dashboard-notifications" className="scroll-mt-24">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Bell className="h-5 w-5 text-orange-600" />
                    Notifications - Stay Informed
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <p className="text-gray-700 dark:text-gray-300">
                    The Notifications section keeps you updated on important announcements, leave/loan approvals, policy changes, and system updates from HR and administration.
                  </p>

                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">Key Features:</h3>
                    
                    <div className="space-y-4">
                      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <Bell className="h-5 w-5 text-blue-600" />
                          <h4 className="font-semibold text-blue-900 dark:text-blue-200">Unread Indicator</h4>
                        </div>
                        <p className="text-sm text-blue-800 dark:text-blue-300">
                          A blue animated dot appears next to unread notifications, making them easy to spot.
                        </p>
                      </div>

                      <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <CheckCircle className="h-5 w-5 text-green-600" />
                          <h4 className="font-semibold text-green-900 dark:text-green-200">Mark as Read/Unread</h4>
                        </div>
                        <p className="text-sm text-green-800 dark:text-green-300">
                          Click the eye icon to toggle between read and unread status for any notification.
                        </p>
                      </div>

                      <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <MinusCircle className="h-5 w-5 text-purple-600" />
                          <h4 className="font-semibold text-purple-900 dark:text-purple-200">Clear Read Notifications</h4>
                        </div>
                        <p className="text-sm text-purple-800 dark:text-purple-300">
                          Use the "Clear Read" button to remove all read notifications and keep your list clean.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">Step-by-Step: Managing Notifications</h3>
                    <ol className="space-y-3">
                      <li className="flex gap-3">
                        <Badge className="h-6 w-6 rounded-full flex items-center justify-center flex-shrink-0">1</Badge>
                        <div>
                          <p className="font-medium text-gray-900 dark:text-gray-100">View notification list</p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">Recent notifications section shows the latest 10 notifications</p>
                        </div>
                      </li>
                      <li className="flex gap-3">
                        <Badge className="h-6 w-6 rounded-full flex items-center justify-center flex-shrink-0">2</Badge>
                        <div>
                          <p className="font-medium text-gray-900 dark:text-gray-100">Click a notification to navigate</p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">Some notifications take you directly to the relevant page (e.g., leave approval opens Leave page)</p>
                        </div>
                      </li>
                      <li className="flex gap-3">
                        <Badge className="h-6 w-6 rounded-full flex items-center justify-center flex-shrink-0">3</Badge>
                        <div>
                          <p className="font-medium text-gray-900 dark:text-gray-100">Use eye icon to mark as read/unread</p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">Click the eye icon next to any notification to toggle its status</p>
                        </div>
                      </li>
                      <li className="flex gap-3">
                        <Badge className="h-6 w-6 rounded-full flex items-center justify-center flex-shrink-0">4</Badge>
                        <div>
                          <p className="font-medium text-gray-900 dark:text-gray-100">Clear read notifications</p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">Click "Clear Read" button to remove all read notifications at once</p>
                        </div>
                      </li>
                    </ol>
                  </div>

                  <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-4">
                    <p className="text-sm text-orange-900 dark:text-orange-200 font-medium mb-2">📸 Screenshot: Notifications Section</p>
                    <div className="bg-white dark:bg-gray-800 border-2 border-dashed border-orange-300 dark:border-orange-700 rounded-lg h-48 flex items-center justify-center">
                      <div className="text-center text-gray-500 dark:text-gray-400">
                        <Bell className="h-12 w-12 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">Notifications card screenshot</p>
                        <p className="text-xs mt-1">Shows: Blue dots for unread, eye icons, notification list, "Clear Read" button</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </section>

            {/* Upcoming Events */}
            <section id="dashboard-events" className="scroll-mt-24">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-pink-600" />
                    Upcoming Events - Don't Miss Out
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <p className="text-gray-700 dark:text-gray-300">
                    The Upcoming Events card shows important dates and celebrations happening in the next 30 days, including colleague birthdays, work anniversaries, company holidays, and special events.
                  </p>

                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">Event Types:</h3>
                    
                    <div className="space-y-4">
                      <div className="bg-pink-50 dark:bg-pink-900/20 border border-pink-200 dark:border-pink-800 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-2xl">🎂</span>
                          <h4 className="font-semibold text-pink-900 dark:text-pink-200">Birthdays</h4>
                        </div>
                        <p className="text-sm text-pink-800 dark:text-pink-300">
                          Colleague birthdays in the next 30 days are displayed with days remaining.
                        </p>
                      </div>

                      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-2xl">🎉</span>
                          <h4 className="font-semibold text-blue-900 dark:text-blue-200">Work Anniversaries</h4>
                        </div>
                        <p className="text-sm text-blue-800 dark:text-blue-300">
                          Celebrates employees' work anniversaries with the company.
                        </p>
                      </div>

                      <div className="bg-primary/10 dark:bg-primary/20 border border-primary/30 dark:border-primary/40 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-2xl">🏖️</span>
                          <h4 className="font-semibold text-primary">Who's on Leave</h4>
                        </div>
                        <p className="text-sm text-primary">
                          Shows colleagues who are currently on approved leave or starting leave soon (next 7 days).
                        </p>
                      </div>

                      <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-2xl">🎊</span>
                          <h4 className="font-semibold text-orange-900 dark:text-orange-200">Company Holidays & Events</h4>
                        </div>
                        <p className="text-sm text-orange-800 dark:text-orange-300">
                          Public holidays and special company events scheduled by administration.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-pink-50 dark:bg-pink-900/20 border border-pink-200 dark:border-pink-800 rounded-lg p-4">
                    <p className="text-sm text-pink-900 dark:text-pink-200 font-medium mb-2">📸 Screenshot: Upcoming Events</p>
                    <div className="bg-white dark:bg-gray-800 border-2 border-dashed border-pink-300 dark:border-pink-700 rounded-lg h-48 flex items-center justify-center">
                      <div className="text-center text-gray-500 dark:text-gray-400">
                        <Users className="h-12 w-12 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">Upcoming events card screenshot</p>
                        <p className="text-xs mt-1">Shows: Event icons, names, dates, days remaining</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-600 p-4">
                    <p className="text-sm text-blue-900 dark:text-blue-200">
                      <strong>💡 Pro Tip:</strong> Events include today! So if someone's birthday or work anniversary is today, you'll see "Today" in the subtitle.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </section>

            {/* ==================== ATTENDANCE SECTION ==================== */}
            
            {/* Attendance Overview */}
            <section id="attendance-overview" className="scroll-mt-24">
              <div className="bg-primary rounded-lg p-6 mb-6">
                <div className="flex items-center space-x-3 text-white">
                  <Calendar className="h-8 w-8" />
                  <div>
                    <h2 className="text-3xl font-bold">Attendance</h2>
                    <p className="text-green-100">Track your working hours and overtime</p>
                  </div>
                </div>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Info className="h-5 w-5 text-green-600" />
                    What is the Attendance System?
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-gray-700 dark:text-gray-300">
                    The Attendance page provides a comprehensive view of your monthly work hours, overtime logs, and attendance patterns. The system uses <strong>auto-attendance</strong> - meaning you're automatically marked present on working days (8:30 AM - 5:30 PM = 9 hours) unless you're on approved leave.
                  </p>
                  
                  <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                    <p className="text-sm text-green-900 dark:text-green-200 font-medium mb-2">📸 Screenshot: Attendance Page</p>
                    <div className="bg-white dark:bg-gray-800 border-2 border-dashed border-green-300 dark:border-green-700 rounded-lg h-64 flex items-center justify-center">
                      <div className="text-center text-gray-500 dark:text-gray-400">
                        <Calendar className="h-12 w-12 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">Attendance page screenshot</p>
                        <p className="text-xs mt-1">Shows: Monthly calendar, summary cards, OT logging form</p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">How Auto-Attendance Works:</h3>
                    <ul className="space-y-2">
                      <li className="flex items-start gap-2">
                        <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                        <div>
                          <span className="font-medium">Working Days:</span> Automatically marked present with 9 hours (8:30 AM - 5:30 PM)
                        </div>
                      </li>
                      <li className="flex items-start gap-2">
                        <XCircle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
                        <div>
                          <span className="font-medium">Weekends/Holidays:</span> Not counted as working days
                        </div>
                      </li>
                      <li className="flex items-start gap-2">
                        <AlertCircle className="h-5 w-5 text-orange-600 mt-0.5 flex-shrink-0" />
                        <div>
                          <span className="font-medium">Approved Leave:</span> Automatically deducts from attendance
                        </div>
                      </li>
                      <li className="flex items-start gap-2">
                        <Plus className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                        <div>
                          <span className="font-medium">Overtime:</span> Manually log OT hours, which are added after approval
                        </div>
                      </li>
                    </ul>
                  </div>
                </CardContent>
              </Card>
            </section>

            {/* Monthly Calendar */}
            <section id="attendance-calendar" className="scroll-mt-24">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-green-600" />
                    Monthly Attendance Calendar
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <p className="text-gray-700 dark:text-gray-300">
                    The monthly calendar provides a visual representation of your attendance, showing present days, weekends, holidays, approved leaves, overtime logs, and late arrivals all in one place.
                  </p>

                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">Calendar Color Coding:</h3>
                    
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-green-100 dark:bg-green-900/30 border-2 border-green-500 flex items-center justify-center">
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 dark:text-gray-100">Present (Green)</p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">Working days with attendance. Shows hours worked (e.g., "8h00m")</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/30 border-2 border-blue-500 flex items-center justify-center">
                          <Clock className="h-4 w-4 text-blue-600" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 dark:text-gray-100">OT Logged (Blue)</p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">Days with logged overtime. Shows OT hours (e.g., "2h00m")</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-orange-100 dark:bg-orange-900/30 border-2 border-orange-500 flex items-center justify-center">
                          <AlertCircle className="h-4 w-4 text-orange-600" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 dark:text-gray-100">Late Arrival (Orange)</p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">Days you arrived late. Shows time late (e.g., "0h15m" for 15 minutes)</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-700 border-2 border-gray-400 flex items-center justify-center">
                          <MinusCircle className="h-4 w-4 text-gray-500" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 dark:text-gray-100">Weekend/Holiday (Gray)</p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">Non-working days (Sundays, alternate Saturdays, public holidays)</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-red-100 dark:bg-red-900/30 border-2 border-red-500 flex items-center justify-center">
                          <XCircle className="h-4 w-4 text-red-600" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 dark:text-gray-100">On Leave (Red)</p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">Days with approved leave (Annual, Sick, Casual, etc.)</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                    <p className="text-sm text-green-900 dark:text-green-200 font-medium mb-2">📸 Screenshot: Monthly Calendar</p>
                    <div className="bg-white dark:bg-gray-800 border-2 border-dashed border-green-300 dark:border-green-700 rounded-lg h-64 flex items-center justify-center">
                      <div className="text-center text-gray-500 dark:text-gray-400">
                        <Calendar className="h-12 w-12 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">Calendar with color-coded days</p>
                        <p className="text-xs mt-1">Shows: Green present, Blue OT, Orange late, Gray weekends, Red leave</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-600 p-4">
                    <p className="text-sm text-blue-900 dark:text-blue-200">
                      <strong>💡 Pro Tip:</strong> A single day can show multiple indicators! For example, a day might show green (present), blue (OT logged), and orange (late arrival) all together.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </section>

            {/* Monthly Summary */}
            <section id="attendance-summary" className="scroll-mt-24">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-blue-600" />
                    Monthly Attendance Summary
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <p className="text-gray-700 dark:text-gray-300">
                    The summary cards at the top of the Attendance page show your key attendance metrics for the selected month.
                  </p>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Calendar className="h-5 w-5 text-blue-600" />
                        <h4 className="font-semibold text-blue-900 dark:text-blue-200">Total Hours</h4>
                      </div>
                      <p className="text-sm text-blue-800 dark:text-blue-300">
                        Sum of all working hours and approved OT for the month (e.g., "152h" = 144h working + 8h OT).
                      </p>
                    </div>

                    <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <CheckCircle className="h-5 w-5 text-green-600" />
                        <h4 className="font-semibold text-green-900 dark:text-green-200">Present Days</h4>
                      </div>
                      <p className="text-sm text-green-800 dark:text-green-300">
                        Number of working days you were present (excludes weekends, holidays, and leaves).
                      </p>
                    </div>

                    <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Clock className="h-5 w-5 text-purple-600" />
                        <h4 className="font-semibold text-purple-900 dark:text-purple-200">OT Hours</h4>
                      </div>
                      <p className="text-sm text-purple-800 dark:text-purple-300">
                        Total approved overtime hours for the month. This adds to your performance rating!
                      </p>
                    </div>

                    <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <AlertCircle className="h-5 w-5 text-orange-600" />
                        <h4 className="font-semibold text-orange-900 dark:text-orange-200">Late Arrivals</h4>
                      </div>
                      <p className="text-sm text-orange-800 dark:text-orange-300">
                        Number of times you arrived after 8:30 AM. Each occurrence deducts 0.02 from your rating.
                      </p>
                    </div>
                  </div>

                  <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                    <p className="text-sm text-blue-900 dark:text-blue-200 font-medium mb-2">📸 Screenshot: Summary Cards</p>
                    <div className="bg-white dark:bg-gray-800 border-2 border-dashed border-blue-300 dark:border-blue-700 rounded-lg h-32 flex items-center justify-center">
                      <div className="text-center text-gray-500 dark:text-gray-400">
                        <TrendingUp className="h-12 w-12 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">Summary cards row</p>
                        <p className="text-xs mt-1">Shows: Total Hours, Present Days, OT Hours, Late Arrivals</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </section>

            {/* OT Logging */}
            <section id="attendance-ot-logging" className="scroll-mt-24">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5 text-purple-600" />
                    Logging Overtime (OT)
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <p className="text-gray-700 dark:text-gray-300">
                    When you work beyond regular hours (8:30 AM - 5:30 PM) or on weekends/holidays, you can log those extra hours as overtime. OT must be logged and approved by administration to count toward your hours and performance rating.
                  </p>

                  <div className="bg-red-50 dark:bg-red-900/20 border-l-4 border-red-600 p-4">
                    <p className="text-sm text-red-900 dark:text-red-200">
                      <strong>⚠️ Important Rules:</strong>
                    </p>
                    <ul className="text-sm text-red-800 dark:text-red-300 space-y-1 mt-2 ml-4">
                      <li>• OT can only be logged in <strong>30-minute increments</strong> (e.g., 0.5h, 1h, 1.5h, 2h)</li>
                      <li>• <strong>Total OT must be in whole hours</strong> (1h, 2h, 3h - not 1.5h or 2.5h)</li>
                      <li>• You <strong>cannot log OT on days with approved leave</strong></li>
                      <li>• OT can be logged on weekends and holidays</li>
                      <li>• All OT requires admin approval before it's counted</li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">Step-by-Step: Logging Overtime</h3>
                    <ol className="space-y-3">
                      <li className="flex gap-3">
                        <Badge className="h-6 w-6 rounded-full flex items-center justify-center flex-shrink-0">1</Badge>
                        <div>
                          <p className="font-medium text-gray-900 dark:text-gray-100">Navigate to Attendance page</p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">From Dashboard, click "Attendance" in the navigation or use the Quick Action</p>
                        </div>
                      </li>
                      <li className="flex gap-3">
                        <Badge className="h-6 w-6 rounded-full flex items-center justify-center flex-shrink-0">2</Badge>
                        <div>
                          <p className="font-medium text-gray-900 dark:text-gray-100">Locate the "Log Today's OT" form</p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">It's below the monthly calendar on the right side</p>
                        </div>
                      </li>
                      <li className="flex gap-3">
                        <Badge className="h-6 w-6 rounded-full flex items-center justify-center flex-shrink-0">3</Badge>
                        <div>
                          <p className="font-medium text-gray-900 dark:text-gray-100">Select start time</p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">Use hour dropdown (00-23) and minute dropdown (00 or 30 only)</p>
                        </div>
                      </li>
                      <li className="flex gap-3">
                        <Badge className="h-6 w-6 rounded-full flex items-center justify-center flex-shrink-0">4</Badge>
                        <div>
                          <p className="font-medium text-gray-900 dark:text-gray-100">Select end time</p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">Same format - hour (00-23) and minute (00 or 30 only)</p>
                        </div>
                      </li>
                      <li className="flex gap-3">
                        <Badge className="h-6 w-6 rounded-full flex items-center justify-center flex-shrink-0">5</Badge>
                        <div>
                          <p className="font-medium text-gray-900 dark:text-gray-100">Add description (optional)</p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">Explain the reason for overtime (e.g., "Project deadline", "Server maintenance")</p>
                        </div>
                      </li>
                      <li className="flex gap-3">
                        <Badge className="h-6 w-6 rounded-full flex items-center justify-center flex-shrink-0">6</Badge>
                        <div>
                          <p className="font-medium text-gray-900 dark:text-gray-100">Verify total OT hours</p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">System calculates and displays total OT. Must be whole hours (e.g., 2h, not 1.5h)</p>
                        </div>
                      </li>
                      <li className="flex gap-3">
                        <Badge className="h-6 w-6 rounded-full flex items-center justify-center flex-shrink-0">7</Badge>
                        <div>
                          <p className="font-medium text-gray-900 dark:text-gray-100">Click "Log OT"</p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">Submit for admin approval. You'll receive a notification when approved/rejected</p>
                        </div>
                      </li>
                    </ol>
                  </div>

                  <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-4">
                    <p className="text-sm text-purple-900 dark:text-purple-200 font-medium mb-2">📸 Screenshot: Log OT Form</p>
                    <div className="bg-white dark:bg-gray-800 border-2 border-dashed border-purple-300 dark:border-purple-700 rounded-lg h-48 flex items-center justify-center">
                      <div className="text-center text-gray-500 dark:text-gray-400">
                        <Clock className="h-12 w-12 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">OT logging form screenshot</p>
                        <p className="text-xs mt-1">Shows: Start time, End time dropdowns, Description field, Log OT button</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                    <h4 className="font-semibold text-green-900 dark:text-green-200 mb-2">✅ Valid OT Examples:</h4>
                    <ul className="text-sm text-green-800 dark:text-green-300 space-y-1">
                      <li>• 6:00 PM - 8:00 PM = 2 hours ✓</li>
                      <li>• 8:00 AM - 11:00 AM (Sunday) = 3 hours ✓</li>
                      <li>• 5:30 PM - 6:30 PM = 1 hour ✓</li>
                    </ul>
                  </div>

                  <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                    <h4 className="font-semibold text-red-900 dark:text-red-200 mb-2">❌ Invalid OT Examples:</h4>
                    <ul className="text-sm text-red-800 dark:text-red-300 space-y-1">
                      <li>• 6:00 PM - 7:30 PM = 1.5 hours ✗ (not whole hours)</li>
                      <li>• 5:30 PM - 8:00 PM = 2.5 hours ✗ (not whole hours)</li>
                      <li>• Logging on a day you have approved leave ✗</li>
                    </ul>
                  </div>
                </CardContent>
              </Card>
            </section>

            {/* Late Arrivals */}
            <section id="attendance-late-arrivals" className="scroll-mt-24">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertCircle className="h-5 w-5 text-orange-600" />
                    Understanding Late Arrivals
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <p className="text-gray-700 dark:text-gray-300">
                    A late arrival is recorded when you start work after 8:30 AM on a working day. Late arrivals are automatically tracked by the system and impact your performance rating.
                  </p>

                  <div className="bg-orange-50 dark:bg-orange-900/20 border-l-4 border-orange-600 p-4">
                    <p className="text-sm text-orange-900 dark:text-orange-200">
                      <strong>⚠️ Performance Impact:</strong>
                    </p>
                    <ul className="text-sm text-orange-800 dark:text-orange-300 space-y-1 mt-2 ml-4">
                      <li>• Each late arrival deducts <strong>0.02 points</strong> from your rating</li>
                      <li>• Even one late arrival in a month <strong>removes the +0.15 punctuality bonus</strong></li>
                      <li>• Late arrivals are shown on the calendar with orange icons and time late</li>
                      <li>• The count is displayed in the Monthly Summary cards</li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">How to Maintain Punctuality:</h3>
                    
                    <div className="space-y-3">
                      <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <CheckCircle className="h-5 w-5 text-green-600" />
                          <h4 className="font-semibold text-green-900 dark:text-green-200">Target: Zero Late Arrivals</h4>
                        </div>
                        <p className="text-sm text-green-800 dark:text-green-300">
                          Complete a full month with zero late arrivals to earn the +0.15 punctuality bonus at month-end. This is the single biggest rating boost you can get!
                        </p>
                      </div>

                      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <Clock className="h-5 w-5 text-blue-600" />
                          <h4 className="font-semibold text-blue-900 dark:text-blue-200">Track Your Progress</h4>
                        </div>
                        <p className="text-sm text-blue-800 dark:text-blue-300">
                          Check the Attendance page regularly to see your late arrival count. The Dashboard also shows your current status for the punctuality bonus.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-4">
                    <p className="text-sm text-orange-900 dark:text-orange-200 font-medium mb-2">📸 Screenshot: Late Arrival on Calendar</p>
                    <div className="bg-white dark:bg-gray-800 border-2 border-dashed border-orange-300 dark:border-orange-700 rounded-lg h-32 flex items-center justify-center">
                      <div className="text-center text-gray-500 dark:text-gray-400">
                        <AlertCircle className="h-12 w-12 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">Calendar showing late arrival</p>
                        <p className="text-xs mt-1">Shows: Orange alert icon with "0h15m" indicating 15 minutes late</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-600 p-4">
                    <p className="text-sm text-blue-900 dark:text-blue-200">
                      <strong>💡 Pro Tip:</strong> Time format is consistent! Late arrivals show as "0h15m" (15 minutes), same format as working hours and OT.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </section>

            {/* Final Section - Help and Support */}
            <section className="scroll-mt-24">
              <Card className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border-2 border-blue-200 dark:border-blue-800">
                <CardContent className="p-8 text-center">
                  <div className="mb-4">
                    <BookOpen className="h-16 w-16 mx-auto text-blue-600 dark:text-blue-400" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">Need More Help?</h3>
                  <p className="text-gray-700 dark:text-gray-300 mb-6">
                    If you have questions not covered in this manual, please contact your HR administrator or IT support team.
                  </p>
                  <div className="flex gap-4 justify-center">
                    <Button onClick={() => navigate('/employee/dashboard')} className="bg-blue-600 hover:bg-blue-700">
                      <Home className="h-4 w-4 mr-2" />
                      Back to Dashboard
                    </Button>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-6">
                    Manual last updated: January 2025 | Version 1.0
                  </p>
                </CardContent>
              </Card>
            </section>

          </div>
        </div>
      </div>
    </div>
  );
};

export default UserManual;
