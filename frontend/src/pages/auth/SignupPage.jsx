import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import Cookies from 'js-cookie';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Building2,
  User,
  CheckCircle,
  Loader2,
  ArrowLeft,
  ArrowRight,
  Eye,
  EyeOff,
  Shield
} from 'lucide-react';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const SignupPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const planId = searchParams.get('plan');
  const billingCycle = searchParams.get('billing') || 'monthly';

  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [plan, setPlan] = useState(null);

  const [formData, setFormData] = useState({
    // Company info
    company_name: '',
    contact_email: '',
    phone: '',
    industry: '',
    country: 'India',
    
    // Admin info
    admin_name: '',
    admin_email: '',
    password: '',
    confirm_password: '',
    
    // Terms
    terms_accepted: false
  });

  useEffect(() => {
    if (planId) {
      fetchPlan();
    } else {
      navigate('/pricing');
    }
  }, [planId]);

  const fetchPlan = async () => {
    try {
      const response = await axios.get(`${BACKEND_URL}/api/plans/public`);
      const selectedPlan = response.data.plans.find(p => p.plan_id === planId);
      if (selectedPlan) {
        setPlan(selectedPlan);
      } else {
        toast.error('Plan not found');
        navigate('/pricing');
      }
    } catch (error) {
      console.error('Error fetching plan:', error);
      toast.error('Failed to load plan');
      navigate('/pricing');
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const validateStep = (step) => {
    switch (step) {
      case 1:
        if (!formData.company_name.trim()) {
          toast.error('Company name is required');
          return false;
        }
        if (!formData.contact_email.trim()) {
          toast.error('Contact email is required');
          return false;
        }
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(formData.contact_email)) {
          toast.error('Please enter a valid email');
          return false;
        }
        return true;
      case 2:
        if (!formData.admin_name.trim()) {
          toast.error('Admin name is required');
          return false;
        }
        if (!formData.admin_email.trim()) {
          toast.error('Admin email is required');
          return false;
        }
        const adminEmailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!adminEmailRegex.test(formData.admin_email)) {
          toast.error('Please enter a valid email');
          return false;
        }
        if (formData.password.length < 8) {
          toast.error('Password must be at least 8 characters');
          return false;
        }
        if (formData.password !== formData.confirm_password) {
          toast.error('Passwords do not match');
          return false;
        }
        return true;
      case 3:
        if (!formData.terms_accepted) {
          toast.error('Please accept the terms and conditions');
          return false;
        }
        return true;
      default:
        return true;
    }
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, 3));
    }
  };

  const handleBack = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleSubmit = async () => {
    if (!validateStep(currentStep)) return;

    try {
      setLoading(true);

      const payload = {
        company_name: formData.company_name,
        contact_email: formData.contact_email,
        phone: formData.phone || null,
        industry: formData.industry || null,
        country: formData.country,
        admin_name: formData.admin_name,
        admin_email: formData.admin_email,
        password: formData.password,
        plan_id: planId,
        billing_cycle: billingCycle,
        terms_accepted: formData.terms_accepted
      };

      const response = await axios.post(`${BACKEND_URL}/api/signup`, payload);
      
      // Store tokens
      Cookies.set('access_token', response.data.access_token, { expires: 7 });
      Cookies.set('refresh_token', response.data.refresh_token, { expires: 7 });
      Cookies.set('user', JSON.stringify(response.data.user), { expires: 7 });
      
      axios.defaults.headers.common['Authorization'] = `Bearer ${response.data.access_token}`;

      toast.success(response.data.message || 'Account created successfully!');
      
      // Redirect to dashboard
      setTimeout(() => {
        navigate('/dashboard');
      }, 1000);
    } catch (error) {
      console.error('Error creating account:', error);
      toast.error(error.response?.data?.detail || 'Failed to create account');
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

  const steps = [
    { number: 1, title: 'Company', icon: Building2 },
    { number: 2, title: 'Admin', icon: User },
    { number: 3, title: 'Confirm', icon: CheckCircle },
  ];

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-4">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
              Company Information
            </h3>
            
            <div>
              <Label>Company Name *</Label>
              <Input
                value={formData.company_name}
                onChange={(e) => handleInputChange('company_name', e.target.value)}
                placeholder="e.g., Acme Corporation"
              />
            </div>

            <div>
              <Label>Contact Email *</Label>
              <Input
                type="email"
                value={formData.contact_email}
                onChange={(e) => handleInputChange('contact_email', e.target.value)}
                placeholder="e.g., contact@acme.com"
              />
            </div>

            <div>
              <Label>Phone Number</Label>
              <Input
                value={formData.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                placeholder="e.g., +91-9876543210"
              />
            </div>

            <div>
              <Label>Industry</Label>
              <select
                value={formData.industry}
                onChange={(e) => handleInputChange('industry', e.target.value)}
                className="w-full px-3 py-2 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800"
              >
                <option value="">Select industry</option>
                <option value="IT & Software">IT & Software</option>
                <option value="Manufacturing">Manufacturing</option>
                <option value="Retail">Retail</option>
                <option value="Healthcare">Healthcare</option>
                <option value="Education">Education</option>
                <option value="Finance">Finance</option>
                <option value="Construction">Construction</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-4">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
              Admin Account
            </h3>
            
            <div>
              <Label>Full Name *</Label>
              <Input
                value={formData.admin_name}
                onChange={(e) => handleInputChange('admin_name', e.target.value)}
                placeholder="e.g., John Doe"
              />
            </div>

            <div>
              <Label>Email *</Label>
              <Input
                type="email"
                value={formData.admin_email}
                onChange={(e) => handleInputChange('admin_email', e.target.value)}
                placeholder="e.g., john@acme.com"
              />
            </div>

            <div>
              <Label>Password *</Label>
              <div className="relative">
                <Input
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  placeholder="Minimum 8 characters"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div>
              <Label>Confirm Password *</Label>
              <Input
                type="password"
                value={formData.confirm_password}
                onChange={(e) => handleInputChange('confirm_password', e.target.value)}
                placeholder="Re-enter password"
              />
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
              Review & Confirm
            </h3>

            {/* Plan Summary */}
            <div className="p-4 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800">
              <div className="flex items-start justify-between mb-2">
                <h4 className="font-semibold text-emerald-900 dark:text-emerald-300">
                  Selected Plan: {plan?.plan_name}
                </h4>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate('/pricing')}
                  className="text-emerald-700 dark:text-emerald-400 hover:text-emerald-900 dark:hover:text-emerald-200"
                >
                  <ArrowLeft className="h-3 w-3 mr-1" />
                  Change Plan
                </Button>
              </div>
              <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-400">
                {formatPrice(billingCycle === 'annual' ? plan?.price_per_user_annual : plan?.price_per_user_monthly)}
                <span className="text-sm font-normal text-emerald-600 dark:text-emerald-500">
                  {billingCycle === 'annual' ? '/year' : '/month'}
                </span>
              </p>
              <p className="text-sm text-emerald-700 dark:text-emerald-400 mt-2">
                ✨ 14-day free trial included
              </p>
            </div>

            {/* Company Info */}
            <div className="p-4 rounded-lg border border-gray-200 dark:border-gray-700">
              <h4 className="font-medium text-gray-900 dark:text-white mb-3">Company</h4>
              <div className="space-y-1 text-sm">
                <p className="text-gray-700 dark:text-gray-300">{formData.company_name}</p>
                <p className="text-gray-600 dark:text-gray-400">{formData.contact_email}</p>
              </div>
            </div>

            {/* Admin Info */}
            <div className="p-4 rounded-lg border border-gray-200 dark:border-gray-700">
              <h4 className="font-medium text-gray-900 dark:text-white mb-3">Administrator</h4>
              <div className="space-y-1 text-sm">
                <p className="text-gray-700 dark:text-gray-300">{formData.admin_name}</p>
                <p className="text-gray-600 dark:text-gray-400">{formData.admin_email}</p>
              </div>
            </div>

            {/* Terms */}
            <div className="flex items-start space-x-2">
              <input
                type="checkbox"
                id="terms"
                checked={formData.terms_accepted}
                onChange={(e) => handleInputChange('terms_accepted', e.target.checked)}
                className="mt-1 h-4 w-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
              />
              <label htmlFor="terms" className="text-sm text-gray-700 dark:text-gray-300">
                I agree to the Terms of Service and Privacy Policy
              </label>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  if (!plan) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-blue-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Header */}
      <header className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-2">
              <div className="w-10 h-10 bg-emerald-600 rounded-lg flex items-center justify-center">
                <Shield className="h-6 w-6 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900 dark:text-white">Elevate Payroll</span>
            </div>
            <Button variant="outline" onClick={() => navigate('/login')}>
              Sign In
            </Button>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Progress Steps */}
        <div className="flex items-center justify-between mb-8">
          {steps.map((step, index) => {
            const Icon = step.icon;
            const isActive = step.number === currentStep;
            const isCompleted = step.number < currentStep;
            
            return (
              <React.Fragment key={step.number}>
                <div className="flex flex-col items-center">
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center ${
                      isActive
                        ? 'bg-emerald-600 text-white'
                        : isCompleted
                        ? 'bg-green-500 text-white'
                        : 'bg-gray-200 dark:bg-gray-700 text-gray-500'
                    }`}
                  >
                    <Icon className="h-6 w-6" />
                  </div>
                  <p className={`text-sm mt-2 ${isActive ? 'font-semibold text-gray-900 dark:text-white' : 'text-gray-500'}`}>
                    {step.title}
                  </p>
                </div>
                {index < steps.length - 1 && (
                  <div className={`flex-1 h-0.5 mx-4 ${isCompleted ? 'bg-green-500' : 'bg-gray-200 dark:bg-gray-700'}`} />
                )}
              </React.Fragment>
            );
          })}
        </div>

        {/* Selected Plan Banner */}
        <div className="mb-6 p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Selected Plan</p>
              <p className="text-lg font-semibold text-gray-900 dark:text-white">
                {plan?.plan_name} - {formatPrice(billingCycle === 'annual' ? plan?.price_per_user_annual : plan?.price_per_user_monthly)}
                <span className="text-sm font-normal text-gray-600 dark:text-gray-400">
                  {billingCycle === 'annual' ? '/user/year' : '/user/month'}
                </span>
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => navigate('/pricing')}
              className="flex items-center gap-1"
            >
              <ArrowLeft className="h-3 w-3" />
              Change
            </Button>
          </div>
        </div>

        {/* Form Card */}
        <Card>
          <CardContent className="p-8">
            {renderStepContent()}
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="flex justify-between mt-6">
          <Button
            variant="outline"
            onClick={handleBack}
            disabled={currentStep === 1 || loading}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>

          {currentStep < 3 ? (
            <Button onClick={handleNext} disabled={loading}>
              Next
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              disabled={loading}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creating Account...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Create Account
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default SignupPage;
