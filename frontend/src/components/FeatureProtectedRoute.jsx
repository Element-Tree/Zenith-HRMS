import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useSubscription } from '@/contexts/SubscriptionContext';

/**
 * FeatureProtectedRoute - Protects routes based on subscription features
 * Usage: <Route path="/salary-components" element={<FeatureProtectedRoute feature="custom_salary_components"><SalaryComponents /></FeatureProtectedRoute>} />
 */
const FeatureProtectedRoute = ({ children, feature, featureOr = null,disallowedPlans = null }) => {
  const { hasFeature, loading, planName, planSlug } = useSubscription();
  const location = useLocation();

  // Show loading state while checking subscription
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 dark:border-blue-400"></div>
      </div>
    );
  }

  // **NEW:** Check for disallowed plans first
  if (disallowedPlans && disallowedPlans.includes(planSlug)) {
    return (
      <Navigate 
        to="/upgrade-required" 
        state={{ 
          from: location.pathname,
          requiredFeature: 'N/A', // Indicating it's a plan-level restriction
          reason: `This page is not available on the ${planName} plan.`,
          currentPlan: planName,
          currentPlanSlug: planSlug
        }} 
        replace 
      />
    );
  }
  
  // Check if feature is required
  if (!feature) {
    // No feature required, allow access
    return children;
  }

  // Check if user has the required feature
  let hasAccess = hasFeature(feature);
  
  // If featureOr is specified, check if EITHER feature is available
  if (!hasAccess && featureOr) {
    hasAccess = hasFeature(featureOr);
  }

  // If no access, redirect to upgrade page with state
  if (!hasAccess) {
    return (
      <Navigate 
        to="/upgrade-required" 
        state={{ 
          from: location.pathname,
          requiredFeature: feature,
          featureOr: featureOr,
          currentPlan: planName,
          currentPlanSlug: planSlug
        }} 
        replace 
      />
    );
  }

  // Has access, render the protected component
  return children;
};

export default FeatureProtectedRoute;
