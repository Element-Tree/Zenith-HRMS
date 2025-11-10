import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import Cookies from 'js-cookie';
import { useAuth } from './AuthContext';

const SubscriptionContext = createContext();

export const useSubscription = () => {
  const context = useContext(SubscriptionContext);
  if (!context) {
    throw new Error('useSubscription must be used within a SubscriptionProvider');
  }
  return context;
};

export const SubscriptionProvider = ({ children }) => {
  const { user } = useAuth();
  const [features, setFeatures] = useState(null);
  const [loading, setLoading] = useState(true);
  const [planName, setPlanName] = useState('');
  const [planSlug, setPlanSlug] = useState('');

  const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || '';

  useEffect(() => {
    if (user && user.role !== 'super_admin') {
      fetchSubscriptionFeatures();
    } else if (user && user.role === 'super_admin') {
      // Super admin has all features
      setFeatures(getAllFeatures());
      setPlanName('Super Admin');
      setPlanSlug('super-admin');
      setLoading(false);
    } else {
      setLoading(false);
    }
  }, [user]);

  const getAllFeatures = () => {
    return {
      employee_limit: -1,
      admin_users_limit: -1,
      employee_database: true,
      payroll_processing_manual: true,
      payroll_processing_automated: true,
      payslip_generation: true,
      attendance_tracking_basic: true,
      attendance_tracking_advanced: true,
      leave_management_basic: true,
      leave_management_advanced: true,
      salary_structure_management: true,
      bank_advice_generation: true,
      custom_salary_components: true,
      bulk_employee_import: true,
      compliance_reports_basic: true,
      compliance_reports_full: true,
      employee_portal: true,
      loans_advances: true,
      deductions_advanced: true,
      event_management: true,
      payroll_analytics: true,
      multi_bank_accounts: true,
      notifications: true,
      dark_mode: true,
      api_access: true,
      white_labeling: true,
      custom_integrations: true,
      sso_security: true,
      custom_reports: true,
      audit_logs: true,
      sla_guarantee: true,
      support_level: 'phone'
    };
  };

  const fetchSubscriptionFeatures = async () => {
    try {
      const token = Cookies.get('access_token');
      if (!token) {
        setLoading(false);
        return;
      }

      const response = await axios.get(`${BACKEND_URL}/api/subscription/features`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      setFeatures(response.data.features);
      setPlanName(response.data.plan_name);
      setPlanSlug(response.data.plan_slug);
    } catch (error) {
      console.error('Error fetching subscription features:', error);
      // Set default free plan features on error
      setFeatures({
        employee_limit: 10,
        admin_users_limit: 1,
        employee_database: true,
        payroll_processing_manual: true,
        payroll_processing_automated: false,
        payslip_generation: true,
        attendance_tracking_basic: true,
        attendance_tracking_advanced: false,
        leave_management_basic: true,
        leave_management_advanced: false,
        salary_structure_management: false,
        bank_advice_generation: false,
        custom_salary_components: false,
        bulk_employee_import: false,
        compliance_reports_basic: false,
        compliance_reports_full: false,
        employee_portal: false,
        loans_advances: false,
        deductions_advanced: false,
        event_management: false,
        payroll_analytics: false,
        multi_bank_accounts: false,
        notifications: false,
        dark_mode: false,
        api_access: false,
        white_labeling: false,
        custom_integrations: false,
        sso_security: false,
        custom_reports: false,
        audit_logs: false,
        sla_guarantee: false,
        support_level: 'email'
      });
      setPlanName('Free');
      setPlanSlug('free');
    } finally {
      setLoading(false);
    }
  };

  const hasFeature = (featureName) => {
    if (!features) return false;
    return features[featureName] === true;
  };

  const value = {
    features,
    planName,
    planSlug,
    loading,
    hasFeature,
    refetchFeatures: fetchSubscriptionFeatures
  };

  return (
    <SubscriptionContext.Provider value={value}>
      {children}
    </SubscriptionContext.Provider>
  );
};
