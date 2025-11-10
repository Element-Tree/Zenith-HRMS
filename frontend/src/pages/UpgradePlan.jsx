import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  ArrowLeft,
  Loader2,
  Check,
  TrendingUp,
  Calendar,
  Users,
  CreditCard,
  Sparkles,
  X,
  AlertCircle
} from 'lucide-react';
import { toast } from 'sonner';
import { formatCurrency } from '@/lib/utils';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

import { useAuth } from "@/contexts/AuthContext"; // ✅ Add this at top of file (near other imports)

const UpgradePlan = () => {
  const navigate = useNavigate();
  const { user } = useAuth(); // ✅ Access the logged-in user safely

  // ✅ Safely read current billing cycle from user's company
  const company = user?.company || {};
  const currentBillingCycle =
    company?.subscription_info?.billing_cycle || "monthly";

  // ✅ Define your React states
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [calculating, setCalculating] = useState(false);
  const [currentPlan, setCurrentPlan] = useState(null);
  const [upgradeOptions, setUpgradeOptions] = useState([]);
  const [billingCycle, setBillingCycle] = useState(currentBillingCycle);

  // 💡 Handle switching between Monthly ↔ Annual
  const handleCycleChange = (cycle) => {
    if (cycle === billingCycle) return; // no change
    setBillingCycle(cycle);

    // re-run calculation if a plan is already selected
    if (selectedPlan) {
      calculateUpgrade(selectedPlan.plan_id, cycle);
    }
  };

  const [selectedPlan, setSelectedPlan] = useState(null);
  const [upgradeCalculation, setUpgradeCalculation] = useState(null);


  useEffect(() => {
    fetchUpgradeOptions();
    loadRazorpayScript();
  }, []);

  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const fetchUpgradeOptions = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${BACKEND_URL}/api/subscription/upgrade-options`);
      setCurrentPlan(response.data.current_plan);
      setUpgradeOptions(response.data.upgrade_options);
      setBillingCycle(response.data.billing_cycle);
    } catch (error) {
      console.error('Error fetching upgrade options:', error);
      toast.error('Failed to load upgrade options');
    } finally {
      setLoading(false);
    }
  };

  const calculateUpgrade = async (targetPlanId, cycleOverride = null) => {
    try {
      setCalculating(true);

      // ✅ Always use the freshest cycle (from override if provided)
      const cycleToUse = cycleOverride || billingCycle;

      const response = await axios.post(
        `${BACKEND_URL}/api/subscription/calculate-upgrade`,
        null,
        {
          params: {
            target_plan_id: targetPlanId,
            new_billing_cycle: cycleToUse, // ✅ directly send the selected value
          },
        }
      );

      setUpgradeCalculation(response.data);
      setSelectedPlan(upgradeOptions.find((p) => p.plan_id === targetPlanId));
    } catch (error) {
      console.error("Error calculating upgrade:", error);
      toast.error(
        error.response?.data?.detail || "Failed to calculate upgrade cost"
      );
    } finally {
      setCalculating(false);
    }
  };




  const handleUpgrade = async () => {
    if (!selectedPlan || !upgradeCalculation) return;

    try {
      setProcessing(true);

      // Create Razorpay order
      const options = {
        key: 'rzp_test_RWUjPFnzUmeWKF',
        amount: Math.round(upgradeCalculation.total_upgrade_cost * 100), // Convert to paise
        currency: 'INR',
        name: 'Elevate Payroll',
        description: `Upgrade to ${selectedPlan.plan_name}`,
        handler: async function (response) {
          try {
            // Process upgrade with payment_id
            await axios.post(`${BACKEND_URL}/api/subscription/upgrade`, null, {
              params: {
                target_plan_id: selectedPlan.plan_id,
                payment_id: response.razorpay_payment_id
              }
            });

            toast.success('Plan upgraded successfully!');
            setTimeout(() => {
              navigate('/dashboard');
              window.location.reload(); // Reload to refresh subscription data
            }, 1500);
          } catch (error) {
            console.error('Error processing upgrade:', error);
            toast.error(error.response?.data?.detail || 'Failed to process upgrade');
            setProcessing(false);
          }
        },
        prefill: {
          name: currentPlan?.plan_name || 'Company',
          email: ''
        },
        theme: {
          color: '#10b981'
        },
        modal: {
          ondismiss: function() {
            setProcessing(false);
          }
        }
      };

      const razorpay = new window.Razorpay(options);
      razorpay.open();
    } catch (error) {
      console.error('Error initiating upgrade:', error);
      toast.error('Failed to initiate payment');
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  if (upgradeOptions.length === 0) {
    return (
      <div className="max-w-4xl mx-auto">
        <Button
          variant="ghost"
          onClick={() => navigate('/dashboard')}
          className="mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Dashboard
        </Button>

        <Card>
          <CardContent className="p-12 text-center">
            <Sparkles className="h-16 w-16 mx-auto text-emerald-500 mb-4" />
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
              You're on the Highest Plan!
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              You're already enjoying all the premium features on the {currentPlan?.plan_name} plan.
            </p>
            <Button onClick={() => navigate('/dashboard')}>
              Back to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Button
            variant="ghost"
            onClick={() => navigate('/dashboard')}
            className="mb-2"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Upgrade Your Plan
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Unlock more features and grow your business
          </p>
        </div>
      </div>
      
      <div className="flex items-center justify-end mb-4">
        <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-800 rounded-full p-1">
          <button
            className={`px-4 py-1 rounded-full text-sm font-medium transition ${
              billingCycle === "monthly"
                ? "bg-emerald-600 text-white"
                : "text-gray-600 dark:text-gray-300"
            }`}
            onClick={() => handleCycleChange("monthly")}
          >
            Monthly
          </button>
          <button
            className={`px-4 py-1 rounded-full text-sm font-medium transition ${
              billingCycle === "annual"
                ? "bg-emerald-600 text-white"
                : "text-gray-600 dark:text-gray-300"
            }`}
            onClick={() => handleCycleChange("annual")}
          >
            Annual
          </button>
        </div>
      </div>


      {/* Current Plan */}
      <Card className="bg-gradient-to-br from-emerald-50 to-blue-50 dark:from-gray-800 dark:to-gray-900 border-emerald-200 dark:border-emerald-800">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl">Current Plan</CardTitle>
              <CardDescription className="text-gray-700 dark:text-gray-300">
                {currentPlan?.plan_name}
              </CardDescription>
            </div>
            <Badge variant="outline" className="bg-white dark:bg-gray-800">
              {formatCurrency(
                billingCycle === 'annual' 
                  ? currentPlan?.price_per_user_annual 
                  : currentPlan?.price_per_user_monthly
              )}/user/{billingCycle === 'annual' ? 'year' : 'month'}
            </Badge>
          </div>
        </CardHeader>
      </Card>

      {/* Upgrade Options */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {upgradeOptions.map((plan) => (
          <Card
            key={plan.plan_id}
            className={`cursor-pointer transition-all ${
              selectedPlan?.plan_id === plan.plan_id
                ? 'ring-4 ring-emerald-500 scale-105'
                : 'hover:ring-2 hover:ring-emerald-300 hover:scale-102'
            }`}
            onClick={() => {
              setSelectedPlan(plan);
              calculateUpgrade(plan.plan_id, billingCycle);
            }}

          >
            <CardHeader>
              <div className="flex items-center justify-between mb-2">
                <CardTitle className="text-xl">{plan.plan_name}</CardTitle>
                {selectedPlan?.plan_id === plan.plan_id && (
                  <Check className="h-5 w-5 text-emerald-600" />
                )}
              </div>
              <div className="text-3xl font-bold text-emerald-600">
                {formatCurrency(
                  billingCycle === 'annual' 
                    ? plan.price_per_user_annual 
                    : plan.price_per_user_monthly
                )}
                <span className="text-sm text-gray-600 dark:text-gray-400 font-normal">
                  /user/{billingCycle === 'annual' ? 'year' : 'month'}
                </span>
              </div>
              <CardDescription className="mt-2">
                {plan.description}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <Users className="h-4 w-4" />
                  <span>
                    {plan.features?.employee_limit === -1 
                      ? 'Unlimited' 
                      : plan.features?.employee_limit} employees
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm text-emerald-600">
                  <TrendingUp className="h-4 w-4" />
                  <span>Upgrade Now</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Upgrade Calculation */}
      {selectedPlan && upgradeCalculation && (
        <Card className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-800 dark:to-gray-900">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Upgrade Summary
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Active Employees</span>
                  <span className="font-semibold">{upgradeCalculation.employee_count}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Days Remaining</span>
                  <span className="font-semibold">{upgradeCalculation.days_remaining} days</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Price Difference</span>
                  <span className="font-semibold">
                    {formatCurrency(upgradeCalculation.price_difference_per_user)}/user
                  </span>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Pro-rated per User</span>
                  <span className="font-semibold">
                    {formatCurrency(upgradeCalculation.pro_rated_amount_per_user)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Next Billing Date</span>
                  <span className="font-semibold flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {new Date(upgradeCalculation.next_billing_date).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
              <div className="flex justify-between items-center mb-4">
                <span className="text-lg font-semibold">Total Upgrade Cost</span>
                <span className="text-3xl font-bold text-emerald-600">
                  {formatCurrency(upgradeCalculation.total_upgrade_cost)}
                </span>
              </div>

              <div className="bg-blue-100 dark:bg-blue-900/30 p-3 rounded-lg mb-4">
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 text-blue-600 dark:text-blue-400 mt-0.5" />
                  <p className="text-sm text-blue-800 dark:text-blue-200">
                    You'll be charged the pro-rated difference for the remaining {upgradeCalculation.days_remaining} days. 
                    From your next billing date, you'll be charged {formatCurrency(upgradeCalculation.target_plan.price_per_user * upgradeCalculation.employee_count)} 
                    per {billingCycle === 'annual' ? 'year' : 'month'}.
                  </p>
                </div>
              </div>

              <Button
                onClick={handleUpgrade}
                disabled={processing || calculating}
                className="w-full bg-emerald-600 hover:bg-emerald-700"
                size="lg"
              >
                {processing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-2" />
                    Upgrade to {selectedPlan.plan_name}
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {calculating && (
        <div className="text-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-600 mx-auto" />
          <p className="text-gray-600 dark:text-gray-400 mt-2">Calculating upgrade cost...</p>
        </div>
      )}
    </div>
  );
};

export default UpgradePlan;
