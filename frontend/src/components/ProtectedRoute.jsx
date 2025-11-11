import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';

const ProtectedRoute = ({ children, requireRole = null, allowedRoles = [] }) => {
  const { isAuthenticated, user, loading } = useAuth();
  const location = useLocation();
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex items-center space-x-2">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
          <span className="text-gray-600">Loading...</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check role-based access
  if (requireRole && user?.role !== requireRole) {
    // Redirect based on user role
    if (user?.role === 'super_admin') {
      return <Navigate to="/super-admin/dashboard" replace />;
    } else if (user?.role === 'admin') {
      return <Navigate to="/dashboard" replace />;
    } else if (user?.role === 'employee') {
      return <Navigate to="/employee/dashboard" replace />;
    }
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(user?.role)) {
    // Redirect to appropriate dashboard
    if (user?.role === 'super_admin') {
      return <Navigate to="/super-admin/dashboard" replace />;
    } else if (user?.role === 'admin') {
      return <Navigate to="/dashboard" replace />;
    } else if (user?.role === 'employee') {
      return <Navigate to="/employee/dashboard" replace />;
    }
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default ProtectedRoute;