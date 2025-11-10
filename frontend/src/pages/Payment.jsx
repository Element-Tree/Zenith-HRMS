import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Cookies from 'js-cookie';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { AlertCircle, CheckCircle2, CreditCard, Calendar, Shield } from 'lucide-react';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const Payment = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [subscriptionStatus, setSubscriptionStatus] = useState(null);
  const [billingCycle, setBillingCycle] = useState('monthly');
  const userCookie = Cookies.get('user');
  const user = userCookie ? JSON.parse(userCookie) : null;

  useEffect(() => {
    fetchSubscriptionStatus();
  }, []);

  const fetchSubscriptionStatus = async () => {
    try {
      const token = Cookies.get('token');
      const response = await axios.get(`${BACKEND_URL}/api/subscription/status`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSubscriptionStatus(response.data);
      
      // If already active, redirect to dashboard
      if (response.data.status === 'active') {
        toast.success('You already have an active subscription!');
        navigate('/dashboard');
      }
    } catch (error) {
      console.error('Error fetching subscription status:', error);
      toast.error('Failed to fetch subscription status');
    }
  };

  const handlePayment = async () => {
    if (!user || !user.company_id) {
      toast.error('User information not found');
      return;
    }

    try {
      setLoading(true);
      const token = Cookies.get('token');

      // Create subscription
      const response = await axios.post(
        `${BACKEND_URL}/api/subscription/create`,
        {
          company_id: user.company_id,
          billing_cycle: billingCycle
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      const { subscription_id, razorpay_key, amount, currency, plan_name } = response.data;

      // Open Razorpay checkout
      const options = {
        key: razorpay_key,
        subscription_id: subscription_id,
        name: 'Elevate Payroll',
        description: `${plan_name} - ${billingCycle === 'annual' ? 'Annual' : 'Monthly'} Subscription`,
        currency: currency,
        amount: amount,
        handler: async function (response) {
          try {
            // Verify payment
            const verifyResponse = await axios.post(
              `${BACKEND_URL}/api/subscription/verify-payment`,
              {
                subscription_id: response.razorpay_subscription_id,
                payment_id: response.razorpay_payment_id,
                signature: response.razorpay_signature
              },
              {
                headers: { Authorization: `Bearer ${token}` }
              }
            );

            toast.success('Payment successful! Your subscription is now active.');
            navigate('/dashboard');
          } catch (error) {
            console.error('Payment verification failed:', error);
            toast.error('Payment verification failed. Please contact support.');
          }
        },
        prefill: {
          email: user.email,
          contact: user.phone || ''
        },
        theme: {
          color: '#2563eb'
        },
        modal: {
          ondismiss: function() {
            toast.info('Payment cancelled');
            setLoading(false);
          }
        }
      };

      const razorpay = new window.Razorpay(options);
      razorpay.open();
      setLoading(false);
    } catch (error) {
      console.error('Error creating subscription:', error);
      toast.error(error.response?.data?.detail || 'Failed to initiate payment');
      setLoading(false);
    }
  };

  if (!subscriptionStatus) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const { status, trial_end_date, trial_days_left, plan } = subscriptionStatus;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
            Activate Your Subscription
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Continue enjoying all the features of Elevate Payroll
          </p>
        </div>

        {/* Trial Status Alert */}
        {status === 'trial_expired' && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-red-900 dark:text-red-100">Trial Period Ended</h3>
              <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                Your trial period ended on {new Date(trial_end_date).toLocaleDateString()}. 
                Please subscribe to continue using Elevate Payroll.
              </p>
            </div>
          </div>
        )}

        {status === 'trial' && trial_days_left !== undefined && (
          <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-blue-900 dark:text-blue-100">Trial Period Active</h3>
              <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                You have {trial_days_left} days left in your free trial. Subscribe now to avoid any service interruption!
              </p>
            </div>
          </div>
        )}

        {/* Billing Cycle Selection */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Choose Billing Cycle</CardTitle>
            <CardDescription>Save 20% with annual billing</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-4">
              {/* Monthly Option */}
              <button
                onClick={() => setBillingCycle('monthly')}
                className={`p-6 rounded-lg border-2 transition-all ${
                  billingCycle === 'monthly'
                    ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20'
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Monthly</h3>
                  {billingCycle === 'monthly' && (
                    <CheckCircle2 className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  )}
                </div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                  ₹2,999<span className="text-sm font-normal text-gray-600 dark:text-gray-400">/month</span>
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Billed monthly</p>
              </button>

              {/* Annual Option */}
              <button
                onClick={() => setBillingCycle('annual')}
                className={`p-6 rounded-lg border-2 transition-all relative ${
                  billingCycle === 'annual'
                    ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20'
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                }`}
              >
                <div className="absolute -top-3 right-4 bg-green-500 text-white text-xs font-bold px-2 py-1 rounded">
                  SAVE 20%
                </div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Annual</h3>
                  {billingCycle === 'annual' && (
                    <CheckCircle2 className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  )}
                </div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                  ₹28,788<span className="text-sm font-normal text-gray-600 dark:text-gray-400">/year</span>
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">₹2,399/month billed annually</p>
              </button>
            </div>
          </CardContent>
        </Card>

        {/* Features Included */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>What's Included</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">Unlimited Employees</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Manage your entire workforce</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">Automated Payroll</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Process payroll in minutes</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">Compliance Reports</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Stay compliant effortlessly</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">24/7 Support</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Expert help when you need it</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Payment Button */}
        <Card>
          <CardContent className="pt-6">
            <Button
              onClick={handlePayment}
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white py-6 text-lg font-semibold"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Processing...
                </>
              ) : (
                <>
                  <CreditCard className="mr-2 h-5 w-5" />
                  Subscribe Now - {billingCycle === 'annual' ? '₹28,788/year' : '₹2,999/month'}
                </>
              )}
            </Button>

            <div className="mt-6 flex items-center justify-center gap-4 text-sm text-gray-600 dark:text-gray-400">
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4" />
                <span>Secure Payment</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                <span>Cancel Anytime</span>
              </div>
            </div>

            <p className="mt-4 text-center text-xs text-gray-500 dark:text-gray-500">
              By subscribing, you agree to our Terms of Service and Privacy Policy.
              Your subscription will automatically renew unless cancelled.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Payment;
