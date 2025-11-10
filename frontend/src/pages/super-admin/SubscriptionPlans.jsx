import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  DollarSign,
  Users,
  Edit,
  Loader2,
  Check,
  X
} from 'lucide-react';
import { toast } from 'sonner';
import { getEnabledFeatures } from '@/constants/planFeatures';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const SubscriptionPlans = () => {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${BACKEND_URL}/api/super-admin/plans`);
      setPlans(response.data.plans);
    } catch (error) {
      console.error('Error fetching plans:', error);
      toast.error('Failed to load subscription plans');
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Subscription Plans
        </h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Manage pricing and features for all subscription plans
        </p>
      </div>

      {/* Plans Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {plans.map((plan) => {
          const features = plan.features || {};
          const isTrial = plan.is_trial || plan.price_per_user_monthly === 0;
          const annualSavings = plan.price_per_user_monthly > 0 
            ? ((plan.price_per_user_monthly * 12 - plan.price_per_user_annual) / (plan.price_per_user_monthly * 12) * 100).toFixed(0)
            : 0;
          
          return (
            <Card key={plan.plan_id} className="relative hover:shadow-xl transition-shadow">
              {/* Popular Badge */}
              {plan.display_order === 3 && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <span className="bg-emerald-600 text-white px-4 py-1 rounded-full text-xs font-semibold">
                    MOST POPULAR
                  </span>
                </div>
              )}
              
              {/* Trial Badge */}
              {isTrial && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <span className="bg-blue-600 text-white px-4 py-1 rounded-full text-xs font-semibold">
                    FREE TRIAL
                  </span>
                </div>
              )}

              <CardHeader className="text-center pb-4">
                <CardTitle className="text-xl">{plan.plan_name}</CardTitle>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">
                  {plan.description}
                </p>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Pricing */}
                <div className="text-center">
                  {isTrial ? (
                    <div>
                      <span className="text-3xl font-bold text-gray-900 dark:text-white">₹0</span>
                      <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                        {features.trial_days} days free
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div>
                        <span className="text-3xl font-bold text-gray-900 dark:text-white">
                          {formatPrice(plan.price_per_user_monthly)}
                        </span>
                        <span className="text-gray-600 dark:text-gray-400 text-sm">/user/mo</span>
                      </div>
                      <div className="text-xs text-gray-600 dark:text-gray-400">
                        or {formatPrice(plan.price_per_user_annual)}/user/year
                        <span className="ml-2 text-emerald-600 font-semibold">
                          (Save {annualSavings}%)
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Key Features */}
                <div className="space-y-3 pt-4 border-t">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Employees:</span>
                    <span className="font-semibold text-gray-900 dark:text-white">
                      {features.employee_limit === -1 ? 'Unlimited' : `Up to ${features.employee_limit}`}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Admin Users:</span>
                    <span className="font-semibold text-gray-900 dark:text-white">
                      {features.admin_users_limit === -1 ? 'Unlimited' : features.admin_users_limit}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Support:</span>
                    <span className="font-semibold text-gray-900 dark:text-white capitalize">
                      {features.support_level?.replace(/_/g, ' ')}
                    </span>
                  </div>
                </div>

                {/* Feature List */}
                <div className="space-y-2 pt-4 border-t">
                  <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">
                    Key Features
                  </p>
                  {getEnabledFeatures(features).map(({ key, label }) => (
                    <div key={key} className="flex items-center space-x-2 text-sm">
                      <Check className="h-4 w-4 text-emerald-600 flex-shrink-0" />
                      <span className="text-gray-700 dark:text-gray-300">
                        {label}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Subscribers Count */}
                <div className="pt-4 border-t">
                  <div className="flex items-center justify-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                    <Users className="h-4 w-4" />
                    <span>
                      {plan.subscriber_count || 0} active {plan.subscriber_count === 1 ? 'subscriber' : 'subscribers'}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="pt-4">
                  <Link to={`/super-admin/plans/${plan.plan_id}/edit`} className="block">
                    <Button className="w-full bg-emerald-600 hover:bg-emerald-700">
                      <Edit className="h-4 w-4 mr-2" />
                      Edit Plan
                    </Button>
                  </Link>
                </div>

                {/* Status Badge */}
                <div className="flex justify-center">
                  <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                    plan.is_active
                      ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                      : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                  }`}>
                    {plan.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default SubscriptionPlans;
