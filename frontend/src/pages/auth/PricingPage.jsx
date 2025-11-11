import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import {
  Check,
  CheckCircle,
  Loader2,
  ArrowRight,
  Shield
} from 'lucide-react';
import { toast } from 'sonner';
import { getEnabledFeatures } from '@/constants/planFeatures';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const PricingPage = () => {
  const navigate = useNavigate();
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [billingCycle, setBillingCycle] = useState('monthly'); // monthly or annual
  const [selectedPlanId, setSelectedPlanId] = useState(null);

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${BACKEND_URL}/api/plans/public`);
      setPlans(response.data.plans);
    } catch (error) {
      console.error('Error fetching plans:', error);
      toast.error('Failed to load pricing plans');
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(price);
  };

  const handleGetStarted = (planId) => {
    navigate(`/signup?plan=${planId}&billing=${billingCycle}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 via-blue-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-blue-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Header */}
      <header className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-b border-gray-200 dark:border-gray-700 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-2">
              <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                <Shield className="h-6 w-6 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900 dark:text-white">Elevate Payroll</span>
            </div>
            <Button
              variant="outline"
              onClick={() => navigate('/login')}
            >
              Sign In
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-12 text-center">
        <h1 className="text-5xl font-bold text-gray-900 dark:text-white mb-4">
          Simple, Transparent Pricing
        </h1>
        <p className="text-xl text-gray-600 dark:text-gray-400 mb-8">
          Choose the perfect plan for your business. Start with a 14-day free trial.
        </p>

        {/* Billing Toggle */}
        <div className="flex items-center justify-center space-x-4 mb-12">
          <span className={`text-sm font-medium ${billingCycle === 'monthly' ? 'text-gray-900 dark:text-white' : 'text-gray-500'}`}>
            Monthly
          </span>
          <button
            onClick={() => setBillingCycle(billingCycle === 'monthly' ? 'annual' : 'monthly')}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              billingCycle === 'annual' ? 'bg-primary' : 'bg-gray-300'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                billingCycle === 'annual' ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
          <span className={`text-sm font-medium ${billingCycle === 'annual' ? 'text-gray-900 dark:text-white' : 'text-gray-500'}`}>
            Annual
            <span className="ml-2 text-primary font-semibold">Save 17%</span>
          </span>
        </div>
      </div>

      {/* Pricing Cards */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {plans.map((plan) => {
            const features = plan.features || {};
            const isFree = plan.is_trial || plan.price_per_user_monthly === 0;
            const pricePerUser = billingCycle === 'annual' ? plan.price_per_user_annual : plan.price_per_user_monthly;
            const isPopular = plan.display_order === 3; // Professional plan
            const isSelected = selectedPlanId === plan.plan_id;
            
            // Calculate savings
            const monthlyCost = plan.price_per_user_monthly * 12;
            const annualSavings = monthlyCost - plan.price_per_user_annual;

            return (
              <div
                key={plan.plan_id}
                onClick={() => setSelectedPlanId(plan.plan_id)}
                className={`relative bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden transition-all duration-300 cursor-pointer
                  ${isSelected 
                    ? 'ring-4 ring-primary scale-105' 
                    : 'ring-2 ring-gray-200 dark:ring-gray-700 hover:ring-4 hover:ring-primary hover:scale-105'
                  }`}
              >
                {/* Popular Badge */}
                {isPopular && (
                  <div className="absolute top-0 right-0 bg-primary text-primary-foreground px-3 py-1 text-xs font-semibold rounded-bl-lg z-10">
                    MOST POPULAR
                  </div>
                )}

                {/* Selected Badge */}
                {isSelected && (
                  <div className="absolute top-0 left-0 bg-primary text-primary-foreground px-3 py-1 text-xs font-semibold rounded-br-lg z-10 flex items-center gap-1">
                    <CheckCircle className="h-3 w-3" />
                    SELECTED
                  </div>
                )}
                
                {/* Free Trial Badge */}
                {isFree && (
                  <div className="absolute top-0 left-0 bg-blue-600 text-white px-3 py-1 text-xs font-semibold rounded-br-lg z-10">
                    30-DAY TRIAL
                  </div>
                )}

                <div className="p-6">
                  {/* Plan Name */}
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1">
                    {plan.plan_name}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 text-xs mb-4 h-8">
                    {plan.description}
                  </p>

                  {/* Pricing */}
                  <div className="mb-4">
                    {isFree ? (
                      <>
                        <div className="flex items-baseline">
                          <span className="text-4xl font-bold text-gray-900 dark:text-white">₹0</span>
                        </div>
                        <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                          Free for 30 days
                        </p>
                      </>
                    ) : (
                      <>
                        <div className="flex items-baseline">
                          <span className="text-4xl font-bold text-gray-900 dark:text-white">
                            {formatPrice(pricePerUser)}
                          </span>
                          <span className="text-gray-600 dark:text-gray-400 ml-1 text-sm">
                            /user/{billingCycle === 'annual' ? 'year' : 'mo'}
                          </span>
                        </div>
                        {billingCycle === 'annual' && annualSavings > 0 && (
                          <div className="mt-2">
                            <p className="text-xs font-semibold text-primary">
                              🎉 Pay for 10 months, get 2 FREE!
                            </p>
                            <p className="text-xs text-gray-600 dark:text-gray-400">
                              Total: {formatPrice(plan.price_per_user_annual)}/user/year
                            </p>
                          </div>
                        )}
                        {billingCycle === 'monthly' && (
                          <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                            Billed monthly
                          </p>
                        )}
                      </>
                    )}
                  </div>

                  {/* Employee Limit */}
                  <div className="mb-4 pb-4 border-b border-gray-200 dark:border-gray-700">
                    <p className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                      {features.employee_limit === -1 ? 'Unlimited' : `Up to ${features.employee_limit}`} employees
                    </p>
                  </div>

                  {/* CTA Button */}
                  <Button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleGetStarted(plan.plan_id);
                    }}
                    className={`w-full mb-4 text-sm ${
                      isSelected
                        ? 'bg-primary hover:bg-primary/90'
                        : 'bg-gray-900 hover:bg-gray-800 dark:bg-gray-700 dark:hover:bg-gray-600'
                    }`}
                  >
                    {isFree ? 'Start Free Trial' : 'Get Started'}
                    <ArrowRight className="h-3 w-3 ml-2" />
                  </Button>

                  {/* Features */}
                  <div className="space-y-2 text-xs">
                    <p className="font-semibold text-gray-600 dark:text-gray-400 uppercase mb-2">
                      Key Features
                    </p>
                    {/* Always show employee limit */}
                    <div className="flex items-start gap-2">
                      <Check className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                      <span className="text-gray-700 dark:text-gray-300">
                        {features.employee_limit === -1 ? 'Unlimited' : features.employee_limit} employees
                      </span>
                    </div>

                    {/* Show ONLY enabled features (no X marks) */}
                    {getEnabledFeatures(features).map(({ key, label }) => (
                      <div key={key} className="flex items-start gap-2">
                        <Check className="h-4 w-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                        <span className="text-gray-700 dark:text-gray-300">{label}</span>
                      </div>
                    ))}
                    
                    {/* Support level */}
                    <div className="flex items-start gap-2">
                      <Check className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                      <span className="text-gray-700 dark:text-gray-300">
                        {features.support_level === 'phone' ? 'Phone Support' : 
                         features.support_level === 'priority_email_chat' ? 'Priority Support' : 
                         features.support_level === 'priority_email' ? 'Priority Email' : 
                         'Email Support'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Trust Section */}
        <div className="mt-16 text-center">
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            🎉 Pay for 10 months, get 2 months FREE on annual plans
          </p>
          <p className="text-gray-600 dark:text-gray-400 mt-6">
            Already have an account?{' '}
            <a 
              href="/login" 
              className="text-primary hover:text-primary/80 font-semibold underline"
            >
              Sign in
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default PricingPage;
