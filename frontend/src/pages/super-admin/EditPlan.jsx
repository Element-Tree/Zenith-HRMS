import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  ArrowLeft,
  Loader2,
  Save,
  AlertCircle
} from 'lucide-react';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const EditPlan = () => {
  const { planId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState({
    plan_name: '',
    description: '',
    price_per_user_monthly: 0,
    price_per_user_annual: 0,
    is_active: true,
    features: {
      employee_limit: 10,
      admin_users_limit: 1,
      trial_days: 0,
      basic_payroll: true,
      employee_portal: true,
      leave_management: true,
      attendance_tracking: true,
      basic_reports: true,
      loan_advances: false,
      overtime_management: false,
      bank_advice: false,
      compliance_reports: false,
      custom_salary_structures: false,
      multi_location: false,
      api_access: false,
      white_labeling: false,
      excel_pdf_export: false,
      support_level: 'email'
    }
  });

  useEffect(() => {
    fetchPlanDetails();
  }, [planId]);

  const fetchPlanDetails = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${BACKEND_URL}/api/super-admin/plans/${planId}`);
      const plan = response.data;
      
      setFormData({
        plan_name: plan.plan_name || '',
        description: plan.description || '',
        price_per_user_monthly: plan.price_per_user_monthly || 0,
        price_per_user_annual: plan.price_per_user_annual || 0,
        is_active: plan.is_active !== undefined ? plan.is_active : true,
        features: plan.features || formData.features
      });
    } catch (error) {
      console.error('Error fetching plan:', error);
      setError(error.response?.data?.detail || 'Failed to load plan details');
      toast.error('Failed to load plan details');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleFeatureChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      features: {
        ...prev.features,
        [field]: value
      }
    }));
  };

  const validateForm = () => {
    if (!formData.plan_name.trim()) {
      toast.error('Plan name is required');
      return false;
    }
    
    // Allow 0 price for trial plans, but must be non-negative
    if (formData.price_per_user_monthly < 0) {
      toast.error('Monthly price cannot be negative');
      return false;
    }
    if (formData.price_per_user_annual < 0) {
      toast.error('Annual price cannot be negative');
      return false;
    }
    
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    try {
      setSaving(true);
      
      const payload = {
        plan_name: formData.plan_name,
        description: formData.description,
        price_per_user_monthly: parseFloat(formData.price_per_user_monthly),
        price_per_user_annual: parseFloat(formData.price_per_user_annual),
        is_active: formData.is_active,
        features: formData.features
      };

      console.log('Sending payload:', JSON.stringify(payload, null, 2));
      
      await axios.put(`${BACKEND_URL}/api/super-admin/plans/${planId}`, payload);
      
      toast.success('Plan updated successfully!');
      navigate('/super-admin/plans');
    } catch (error) {
      console.error('Error updating plan:', error);
      toast.error(error.response?.data?.detail || 'Failed to update plan');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto">
        <Card>
          <CardContent className="p-12 text-center">
            <AlertCircle className="h-16 w-16 mx-auto text-red-500 mb-4" />
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
              Error Loading Plan
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">{error}</p>
            <Button onClick={() => navigate('/super-admin/plans')} variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Plans
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <Button
          variant="ghost"
          onClick={() => navigate('/super-admin/plans')}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Edit Plan: {formData.plan_name}
          </h1>
          <p className="mt-1 text-gray-600 dark:text-gray-400">
            Update pricing and features
          </p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Plan Name *</Label>
              <Input
                value={formData.plan_name}
                onChange={(e) => handleInputChange('plan_name', e.target.value)}
                placeholder="e.g., Professional"
                required
              />
            </div>

            <div>
              <Label>Description</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="Brief description of the plan"
                rows={2}
              />
            </div>

            <div>
              <Label>Status</Label>
              <select
                value={formData.is_active}
                onChange={(e) => handleInputChange('is_active', e.target.value === 'true')}
                className="w-full px-3 py-2 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              >
                <option value="true">Active</option>
                <option value="false">Inactive</option>
              </select>
            </div>
          </CardContent>
        </Card>

        {/* Pricing */}
        <Card>
          <CardHeader>
            <CardTitle>Pricing</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Monthly Price (₹) *</Label>
                <Input
                  type="number"
                  value={formData.price_per_user_monthly}
                  onChange={(e) => handleInputChange('price_per_user_monthly', e.target.value)}
                  placeholder="999"
                  min="0"
                  step="1"
                  required
                />
              </div>
              <div>
                <Label>Annual Price (₹) *</Label>
                <Input
                  type="number"
                  value={formData.price_per_user_annual}
                  onChange={(e) => handleInputChange('price_per_user_annual', e.target.value)}
                  placeholder="9999"
                  min="0"
                  step="1"
                  required
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Limits */}
        <Card>
          <CardHeader>
            <CardTitle>Limits</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Employee Limit</Label>
                <Input
                  type="number"
                  value={formData.features.employee_limit}
                  onChange={(e) => handleFeatureChange('employee_limit', parseInt(e.target.value))}
                  placeholder="10"
                  min="-1"
                />
                <p className="text-xs text-gray-500 mt-1">Use -1 for unlimited</p>
              </div>
              <div>
                <Label>Admin Users Limit</Label>
                <Input
                  type="number"
                  value={formData.features.admin_users_limit}
                  onChange={(e) => handleFeatureChange('admin_users_limit', parseInt(e.target.value))}
                  placeholder="1"
                  min="-1"
                />
                <p className="text-xs text-gray-500 mt-1">Use -1 for unlimited</p>
              </div>
              <div>
                <Label>Trial Days</Label>
                <Input
                  type="number"
                  value={formData.features.trial_days || 0}
                  onChange={(e) => handleFeatureChange('trial_days', parseInt(e.target.value))}
                  placeholder="0"
                  min="0"
                />
                <p className="text-xs text-gray-500 mt-1">0 for no trial, 30 for free plan</p>
              </div>
            </div>

            <div>
              <Label>Support Level</Label>
              <select
                value={formData.features.support_level}
                onChange={(e) => handleFeatureChange('support_level', e.target.value)}
                className="w-full px-3 py-2 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800"
              >
                <option value="email">Email Support</option>
                <option value="priority_email">Priority Email</option>
                <option value="priority_email_chat">Priority Email + Chat</option>
                <option value="phone">Phone Support</option>
              </select>
            </div>
          </CardContent>
        </Card>

        {/* Features */}
        <Card>
          <CardHeader>
            <CardTitle>Features</CardTitle>
            <CardDescription>Configure which features are available in this plan</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Core Features */}
              <div>
                <h4 className="font-medium text-sm mb-2">Core Features</h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {[
                    { key: 'employee_database', label: 'Employee Database' },
                    { key: 'payroll_processing_manual', label: 'Manual Payroll' },
                    { key: 'payroll_processing_automated', label: 'Automated Payroll' },
                    { key: 'payslip_generation', label: 'Payslip Generation' },
                    { key: 'salary_structure_management', label: 'Salary Structure' },
                    { key: 'custom_salary_components', label: 'Custom Salary' },
                  ].map(({ key, label }) => (
                    <div key={key} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id={key}
                        checked={formData.features[key] || false}
                        onChange={(e) => handleFeatureChange(key, e.target.checked)}
                        className="h-4 w-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                      />
                      <label htmlFor={key} className="text-sm text-gray-700 dark:text-gray-300">
                        {label}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Attendance & Leave */}
              <div>
                <h4 className="font-medium text-sm mb-2">Attendance & Leave</h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {[
                    { key: 'attendance_tracking_basic', label: 'Basic Attendance' },
                    { key: 'attendance_tracking_advanced', label: 'Advanced Attendance' },
                    { key: 'leave_management_basic', label: 'Basic Leave' },
                    { key: 'leave_management_advanced', label: 'Advanced Leave' },
                  ].map(({ key, label }) => (
                    <div key={key} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id={key}
                        checked={formData.features[key] || false}
                        onChange={(e) => handleFeatureChange(key, e.target.checked)}
                        className="h-4 w-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                      />
                      <label htmlFor={key} className="text-sm text-gray-700 dark:text-gray-300">
                        {label}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Advanced Features */}
              <div>
                <h4 className="font-medium text-sm mb-2">Advanced Features</h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {[
                    { key: 'bank_advice_generation', label: 'Bank Advice' },
                    { key: 'compliance_reports_basic', label: 'Basic Compliance' },
                    { key: 'compliance_reports_full', label: 'Full Compliance' },
                    { key: 'employee_portal', label: 'Employee Portal' },
                    { key: 'loans_advances', label: 'Loans & Advances' },
                    { key: 'deductions_advanced', label: 'Advanced Deductions' },
                    { key: 'event_management', label: 'Event Management' },
                    { key: 'payroll_analytics', label: 'Payroll Analytics' },
                    { key: 'multi_bank_accounts', label: 'Multi Bank Accounts' },
                    { key: 'bulk_employee_import', label: 'Bulk Import' },
                    { key: 'notifications', label: 'Notifications' },
                    { key: 'dark_mode', label: 'Dark Mode' },
                  ].map(({ key, label }) => (
                    <div key={key} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id={key}
                        checked={formData.features[key] || false}
                        onChange={(e) => handleFeatureChange(key, e.target.checked)}
                        className="h-4 w-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                      />
                      <label htmlFor={key} className="text-sm text-gray-700 dark:text-gray-300">
                        {label}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Enterprise Features */}
              <div>
                <h4 className="font-medium text-sm mb-2">Enterprise Features</h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {[
                    { key: 'api_access', label: 'API Access' },
                    { key: 'white_labeling', label: 'White Labeling' },
                    { key: 'custom_integrations', label: 'Custom Integrations' },
                    { key: 'sso_security', label: 'SSO Security' },
                    { key: 'custom_reports', label: 'Custom Reports' },
                    { key: 'audit_logs', label: 'Audit Logs' },
                    { key: 'sla_guarantee', label: 'SLA Guarantee' },
                  ].map(({ key, label }) => (
                    <div key={key} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id={key}
                        checked={formData.features[key] || false}
                        onChange={(e) => handleFeatureChange(key, e.target.checked)}
                        className="h-4 w-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                      />
                      <label htmlFor={key} className="text-sm text-gray-700 dark:text-gray-300">
                        {label}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Submit Button */}
        <div className="flex justify-end space-x-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate('/super-admin/plans')}
            disabled={saving}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            className="bg-emerald-600 hover:bg-emerald-700"
            disabled={saving}
          >
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save Changes
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default EditPlan;
