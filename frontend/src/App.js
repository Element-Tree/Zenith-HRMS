import React, { useState } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import "@/App.css";
import { Toaster } from "@/components/ui/sonner";
import { AuthProvider } from "./contexts/AuthContext";
import { ThemeProvider } from "./contexts/ThemeContext";
import { WebSocketProvider } from "./contexts/WebSocketContext";
import { SubscriptionProvider } from "./contexts/SubscriptionContext";
import ProtectedRoute from "./components/ProtectedRoute";
import Login from "./pages/Login";
import Sidebar from "./components/Sidebar";
import TopBar from "./components/TopBar";
import Dashboard from "./pages/Dashboard";
import EmployeeList from "./pages/EmployeeList";
import AddEmployee from "./pages/AddEmployee";
import EditEmployee from "./pages/EditEmployee";
import RunPayroll from "./pages/RunPayroll";
import SalaryStructure from "./pages/SalaryStructure";
import Deductions from "./pages/Deductions";
import Compliance from "./pages/Compliance";
import Payslips from "./pages/Payslips";
import LeaveAttendance from "./pages/LeaveAttendance";
import BankAdvice from "./pages/BankAdvice";
import Settings from "./pages/Settings";
import EmployeeLayout from "./components/employee/EmployeeLayout";
import EmployeeDashboard from "./pages/employee/EmployeeDashboard";
import EmployeeProfile from "./pages/employee/EmployeeProfile";
import EmployeePayslips from "./pages/employee/EmployeePayslips";
import EmployeeLeave from "./pages/employee/EmployeeLeave";
import EmployeeLoans from "./pages/employee/EmployeeLoans";
import EmployeeAttendance from "./pages/employee/EmployeeAttendance";
import EmployeeDocuments from "./pages/employee/EmployeeDocuments";
import UserManual from "./pages/employee/UserManual";
import LeaveManagement from "./pages/admin/LeaveManagement";
import LoanManagement from "./pages/admin/LoanManagement";
import EmployeeImport from "./pages/admin/EmployeeImport";
import PinManagement from "./pages/admin/PinManagement";
import LoginDetails from "./pages/admin/LoginDetails";
import EventManagement from "./pages/admin/EventManagement";
import SalaryComponents from "./pages/admin/SalaryComponents";
import TaxConfiguration from "./pages/admin/TaxConfiguration";
// Super Admin imports
import SuperAdminLayout from "./components/super-admin/SuperAdminLayout";
import SuperAdminDashboard from "./pages/super-admin/SuperAdminDashboard";
import CompaniesList from "./pages/super-admin/CompaniesList";
import AddCompany from "./pages/super-admin/AddCompany";
import CompanyDetails from "./pages/super-admin/CompanyDetails";
import EditCompany from "./pages/super-admin/EditCompany";
import SubscriptionPlans from "./pages/super-admin/SubscriptionPlans";
import EditPlan from "./pages/super-admin/EditPlan";
import AcceptInvitation from "./pages/AcceptInvitation";
import UpgradeRequired from "./pages/UpgradeRequired";
import UpgradePlan from "./pages/UpgradePlan";
import FeatureProtectedRoute from "./components/FeatureProtectedRoute";
import PayrollAnalytics from "./pages/PayrollAnalytics";
import CustomReports from "./pages/CustomReports";
import AuditLogs from "./pages/AuditLogs";
// Public pages
import PricingPage from "./pages/public/PricingPage";
import SignupPage from "./pages/public/SignupPage";
import Payment from "./pages/Payment";

// Admin Layout Component
const AdminLayout = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <div className="flex h-screen bg-background dark:bg-background">
      {/* Sidebar */}
      <Sidebar 
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
      />
      
      {/* Main Content */}
      <div className={`flex-1 flex flex-col transition-all duration-300 ${
        sidebarCollapsed ? 'ml-16' : 'ml-64'
      }`}>
        {/* Top Bar */}
        <TopBar />
        
        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-6 bg-background">
          <Routes>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/upgrade" element={<UpgradePlan />} />
            <Route path="/employees" element={<EmployeeList />} />
            <Route path="/employees/new" element={<AddEmployee />} />
            <Route path="/employees/import" element={<FeatureProtectedRoute feature="bulk_employee_import"><EmployeeImport /></FeatureProtectedRoute>} />
            <Route path="/employees/:id/edit" element={<EditEmployee />} />
            <Route path="/payroll/run" element={<RunPayroll />} />
            <Route path="/payroll/salary-structure" element={<FeatureProtectedRoute feature="salary_structure_management"><SalaryStructure /></FeatureProtectedRoute>} />
            <Route path="/deductions" element={<FeatureProtectedRoute feature="deductions_advanced"><Deductions /></FeatureProtectedRoute>} />
            <Route path="/compliance" element={<FeatureProtectedRoute feature="compliance_reports_basic" featureOr="compliance_reports_full"><Compliance /></FeatureProtectedRoute>} />
            <Route path="/payslips" element={<Payslips />} />
            <Route path="/attendance" element={<LeaveAttendance />} />
            <Route path="/leave-management" element={<LeaveManagement />} />
            <Route path="/loan-management" element={<FeatureProtectedRoute feature="loans_advances"><LoanManagement /></FeatureProtectedRoute>} />
            <Route path="/bank-advice" element={<FeatureProtectedRoute feature="bank_advice_generation"><BankAdvice /></FeatureProtectedRoute>} />
            <Route path="/admin/login-details" element={<LoginDetails />} />
            <Route path="/admin/events" element={<FeatureProtectedRoute feature="event_management"><EventManagement /></FeatureProtectedRoute>} />
            <Route path="/payment" element={<Payment />} />
            <Route 
              path="/settings"
              element={
                  <FeatureProtectedRoute disallowedPlans={['free', 'starter']}>
                <Settings />
              </FeatureProtectedRoute>
              }
              />
              {/* 2. Salary Components (Disallow: Free) */}
          <Route 
            path="/salary-components" 
            element={
              <FeatureProtectedRoute disallowedPlans={['free']}>
                <SalaryComponents />
              </FeatureProtectedRoute>
            } 
          />

          {/* 3. Tax Configuration (Disallow: Free, Starter) */}
          <Route 
            path="/tax-configuration" 
            element={
              <FeatureProtectedRoute disallowedPlans={['free', 'starter']}>
                <TaxConfiguration />
              </FeatureProtectedRoute>
            } 
          />
            <Route path="/payroll-analytics" element={<FeatureProtectedRoute feature="payroll_analytics"><PayrollAnalytics /></FeatureProtectedRoute>} />
            <Route path="/custom-reports" element={<FeatureProtectedRoute feature="custom_reports"><CustomReports /></FeatureProtectedRoute>} />
            <Route path="/audit-logs" element={<FeatureProtectedRoute feature="audit_logs"><AuditLogs /></FeatureProtectedRoute>} />
            <Route path="/upgrade-required" element={<UpgradeRequired />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </main>
      </div>
    </div>
  );
};

function App() {
  return (
    <div className="App">
      <ThemeProvider>
        <AuthProvider>
          <SubscriptionProvider>
            <WebSocketProvider>
              <BrowserRouter>
              <Routes>
                {/* Public Routes */}
                <Route path="/login" element={<Login />} />
                <Route path="/pricing" element={<PricingPage />} />
                <Route path="/signup" element={<SignupPage />} />
                <Route path="/accept-invitation" element={<AcceptInvitation />} />
                
                {/* Protected Super Admin Routes */}
                <Route path="/super-admin/*" element={
                  <ProtectedRoute requireRole="super_admin">
                    <SuperAdminLayout />
                  </ProtectedRoute>
                }>
                  <Route path="dashboard" element={<SuperAdminDashboard />} />
                  <Route path="companies" element={<CompaniesList />} />
                  <Route path="companies/add" element={<AddCompany />} />
                  <Route path="companies/:companyId" element={<CompanyDetails />} />
                  <Route path="companies/:companyId/edit" element={<EditCompany />} />
                  <Route path="plans" element={<SubscriptionPlans />} />
                  <Route path="plans/:planId/edit" element={<EditPlan />} />
                  <Route index element={<Navigate to="/super-admin/dashboard" replace />} />
                </Route>
                
                {/* Protected Admin Routes */}
                <Route path="/*" element={
                  <ProtectedRoute requireRole="admin">
                    <AdminLayout />
                  </ProtectedRoute>
                } />
                
                {/* Protected Employee Routes */}
                <Route path="/employee/*" element={
                  <ProtectedRoute requireRole="employee">
                    <EmployeeLayout />
                  </ProtectedRoute>
                }>
                <Route path="dashboard" element={<EmployeeDashboard />} />
                <Route path="profile" element={<EmployeeProfile />} />
                <Route path="payslips" element={<EmployeePayslips />} />
                <Route path="leave" element={<EmployeeLeave />} />
                <Route path="finances" element={<EmployeeLoans />} />
                <Route path="attendance" element={<EmployeeAttendance />} />
                <Route path="documents" element={<EmployeeDocuments />} />
                <Route path="user-manual" element={<UserManual />} />
                <Route index element={<Navigate to="/employee/dashboard" replace />} />
              </Route>
              
              {/* Default redirect */}
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
            </Routes>
            
            {/* Toast notifications */}
            <Toaster position="top-right" richColors expand={true} visibleToasts={5} />
            </BrowserRouter>
          </WebSocketProvider>
        </SubscriptionProvider>
      </AuthProvider>
    </ThemeProvider>
  </div>
  );
}

export default App;