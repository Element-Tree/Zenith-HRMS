import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Lock, 
  Zap, 
  ArrowRight, 
  Check,
  ChevronLeft,
  Sparkles
} from 'lucide-react';

// Feature to plan mapping
const FEATURE_TO_PLAN = {
  'custom_salary_components': { plan: 'Professional', slug: 'professional' },
  'salary_structure_management': { plan: 'Starter', slug: 'starter' },
  'bank_advice_generation': { plan: 'Professional', slug: 'professional' },
  'loans_advances': { plan: 'Professional', slug: 'professional' },
  'event_management': { plan: 'Professional', slug: 'professional' },
  'bulk_employee_import': { plan: 'Professional', slug: 'professional' },
  'compliance_reports_basic': { plan: 'Professional', slug: 'professional' },
  'compliance_reports_full': { plan: 'Enterprise', slug: 'enterprise' },
  'deductions_advanced': { plan: 'Professional', slug: 'professional' },
  'payroll_analytics': { plan: 'Professional', slug: 'professional' },
  'custom_reports': { plan: 'Enterprise', slug: 'enterprise' },
  'audit_logs': { plan: 'Enterprise', slug: 'enterprise' },
  'api_access': { plan: 'Enterprise', slug: 'enterprise' },
  'white_labeling': { plan: 'Enterprise', slug: 'enterprise' },
  'custom_integrations': { plan: 'Enterprise', slug: 'enterprise' },
  'sso_security': { plan: 'Enterprise', slug: 'enterprise' }
};

// Feature display names
const FEATURE_NAMES = {
  'custom_salary_components': 'Custom Salary Components',
  'salary_structure_management': 'Salary Structure Management',
  'bank_advice_generation': 'Bank Advice Generation',
  'loans_advances': 'Loans & Advances',
  'event_management': 'Event Management',
  'bulk_employee_import': 'Bulk Employee Import',
  'compliance_reports_basic': 'Compliance Reports',
  'compliance_reports_full': 'Full Compliance Reports',
  'deductions_advanced': 'Advanced Deductions',
  'payroll_analytics': 'Payroll Analytics',
  'custom_reports': 'Custom Reports',
  'audit_logs': 'Audit Logs',
  'api_access': 'API Access',
  'white_labeling': 'White Labeling',
  'custom_integrations': 'Custom Integrations',
  'sso_security': 'SSO Security'
};

const UpgradeRequired = () => {
  const location = useLocation();
  const navigate = useNavigate();
  
  const { 
    from = '/', 
    requiredFeature = '', 
    currentPlan = 'Free Trial',
    currentPlanSlug = 'free'
  } = location.state || {};

  const requiredPlanInfo = FEATURE_TO_PLAN[requiredFeature] || { plan: 'Professional', slug: 'professional' };
  const featureName = FEATURE_NAMES[requiredFeature] || 'This Feature';

  const handleUpgrade = () => {
    // ✅ Directly open the in-app Upgrade Plan page
    navigate('/upgrade', { 
      state: { 
        highlightPlan: requiredPlanInfo.slug,
        fromFeature: requiredFeature 
      } 
    });
  };

  const handleBack = () => {
    navigate(-1);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <Card className="max-w-2xl w-full shadow-2xl border-2">
        <CardContent className="p-8">
          {/* Icon */}
          <div className="flex justify-center mb-6">
            <div className="relative">
              <div className="absolute inset-0 bg-blue-500/20 dark:bg-blue-400/20 blur-xl rounded-full"></div>
              <div className="relative bg-gradient-to-br from-blue-500 to-blue-600 dark:from-blue-400 dark:to-blue-500 p-6 rounded-full">
                <Lock className="h-12 w-12 text-white" />
              </div>
            </div>
          </div>

          {/* Heading */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Upgrade to {requiredPlanInfo.plan}
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-400">
              Unlock <span className="font-semibold text-blue-600 dark:text-blue-400">{featureName}</span> and more!
            </p>
          </div>

          {/* Current vs Required */}
          <div className="grid grid-cols-2 gap-4 mb-8">
            <div className="text-center p-4 bg-gray-100 dark:bg-gray-800 rounded-lg">
              <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Current Plan</div>
              <div className="text-xl font-bold text-gray-900 dark:text-white">{currentPlan}</div>
            </div>
            <div className="text-center p-4 bg-gradient-to-br from-blue-500 to-blue-600 dark:from-blue-400 dark:to-blue-500 rounded-lg">
              <div className="text-sm text-blue-100 mb-1">Required Plan</div>
              <div className="text-xl font-bold text-white flex items-center justify-center gap-2">
                <Sparkles className="h-5 w-5" />
                {requiredPlanInfo.plan}
              </div>
            </div>
          </div>

          {/* Benefits */}
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg p-6 mb-8">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Zap className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              What you'll get with {requiredPlanInfo.plan}:
            </h3>
            <ul className="space-y-3">
              {requiredPlanInfo.slug === 'starter' && (
                <>
                  <li className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700 dark:text-gray-300">Up to 10 employees</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700 dark:text-gray-300">Automated Payroll Processing</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700 dark:text-gray-300">Salary Structure Management</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700 dark:text-gray-300">Advanced Attendance & Leave</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700 dark:text-gray-300">Notifications & Dark Mode</span>
                  </li>
                </>
              )}
              {requiredPlanInfo.slug === 'professional' && (
                <>
                  <li className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700 dark:text-gray-300">Up to 25 employees</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700 dark:text-gray-300">Custom Salary Components</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700 dark:text-gray-300">Bank Advice & Loans Management</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700 dark:text-gray-300">Compliance Reports & Event Management</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700 dark:text-gray-300">Bulk Import & Payroll Analytics</span>
                  </li>
                </>
              )}
              {requiredPlanInfo.slug === 'enterprise' && (
                <>
                  <li className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700 dark:text-gray-300">Unlimited employees & admin users</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700 dark:text-gray-300">Full Compliance Reports & Audit Logs</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700 dark:text-gray-300">API Access & White Labeling</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700 dark:text-gray-300">Custom Integrations & SSO Security</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700 dark:text-gray-300">SLA Guarantee & Phone Support</span>
                  </li>
                </>
              )}
            </ul>
          </div>

          {/* Actions */}
          <div className="flex gap-4">
            <Button
              onClick={handleBack}
              variant="outline"
              className="flex-1"
            >
              <ChevronLeft className="h-4 w-4 mr-2" />
              Go Back
            </Button>
            <Button
              onClick={handleUpgrade}
              className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 dark:from-blue-500 dark:to-blue-600 text-white"
            >
              Upgrade Now
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>

          {/* Help Text */}
          <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-6">
            Need help choosing? Contact our sales team for a personalized demo
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default UpgradeRequired;
