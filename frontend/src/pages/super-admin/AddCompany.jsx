import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Building2,
  User,
  Settings,
  CheckCircle,
  ArrowLeft,
  ArrowRight,
  Loader2,
  Copy,
  Check,
  Mail,
  Plus
} from 'lucide-react';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const AddCompany = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [invitationLink, setInvitationLink] = useState('');
  const [linkCopied, setLinkCopied] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const [formData, setFormData] = useState({
    // Step 1: Company Details
    company_name: '',
    contact_email: '',
    phone: '',
    address: '',
    
    // Step 2: Admin User
    admin_name: '',
    admin_email: '',
    admin_phone: '',
  });

  const steps = [
    { number: 1, title: 'Company Details', icon: Building2 },
    { number: 2, title: 'Admin User', icon: User },
    { number: 3, title: 'Review & Send', icon: CheckCircle },
  ];

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
        // Basic email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(formData.contact_email)) {
          toast.error('Please enter a valid email address');
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
          toast.error('Please enter a valid admin email address');
          return false;
        }
        return true;
      default:
        return true;
    }
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, steps.length));
    }
  };

  const handleBack = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);

      const payload = {
        company_name: formData.company_name,
        contact_email: formData.contact_email,
        phone: formData.phone || null,
        address: formData.address || null,
        admin_name: formData.admin_name,
        admin_email: formData.admin_email,
        admin_phone: formData.admin_phone || null,
        // Settings will be created with defaults by backend, admin can update later
      };

      const response = await axios.post(`${BACKEND_URL}/api/super-admin/companies`, payload);
      
      setInvitationLink(response.data.invitation_link);
      setEmailSent(response.data.email_sent);
      
      toast.success('Company created successfully!');
      
      // Move to final step
      setCurrentStep(4); // Invitation sent step (changed from 5 to 4)
    } catch (error) {
      console.error('Error creating company:', error);
      toast.error(error.response?.data?.detail || 'Failed to create company');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(invitationLink);
    setLinkCopied(true);
    toast.success('Invitation link copied to clipboard!');
    setTimeout(() => setLinkCopied(false), 2000);
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Company Information
            </h3>
            
            <div className="space-y-4">
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
                  placeholder="e.g., +91-XXXXXXXXXX"
                />
              </div>

              <div>
                <Label>Address</Label>
                <Textarea
                  value={formData.address}
                  onChange={(e) => handleInputChange('address', e.target.value)}
                  placeholder="Full company address"
                  rows={3}
                />
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Admin User Details
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              This person will receive an invitation email to set up their admin account
            </p>
            
            <div className="space-y-4">
              <div>
                <Label>Admin Name *</Label>
                <Input
                  value={formData.admin_name}
                  onChange={(e) => handleInputChange('admin_name', e.target.value)}
                  placeholder="e.g., John Doe"
                />
              </div>

              <div>
                <Label>Admin Email *</Label>
                <Input
                  type="email"
                  value={formData.admin_email}
                  onChange={(e) => handleInputChange('admin_email', e.target.value)}
                  placeholder="e.g., admin@acme.com"
                />
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Invitation will be sent to this email
                </p>
              </div>

              <div>
                <Label>Admin Phone (Optional)</Label>
                <Input
                  value={formData.admin_phone}
                  onChange={(e) => handleInputChange('admin_phone', e.target.value)}
                  placeholder="e.g., +91-XXXXXXXXXX"
                />
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Review & Confirm
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Please review the information before creating the company
            </p>

            <div className="space-y-4">
              {/* Company Details */}
              <div className="p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                <h4 className="font-medium text-gray-900 dark:text-white mb-3 flex items-center">
                  <Building2 className="h-4 w-4 mr-2" />
                  Company Details
                </h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Name:</span>
                    <span className="font-medium text-gray-900 dark:text-white">{formData.company_name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Email:</span>
                    <span className="font-medium text-gray-900 dark:text-white">{formData.contact_email}</span>
                  </div>
                  {formData.phone && (
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Phone:</span>
                      <span className="font-medium text-gray-900 dark:text-white">{formData.phone}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Admin Details */}
              <div className="p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                <h4 className="font-medium text-gray-900 dark:text-white mb-3 flex items-center">
                  <User className="h-4 w-4 mr-2" />
                  Admin User
                </h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Name:</span>
                    <span className="font-medium text-gray-900 dark:text-white">{formData.admin_name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Email:</span>
                    <span className="font-medium text-gray-900 dark:text-white">{formData.admin_email}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
              <p className="text-sm text-blue-900 dark:text-blue-300">
                <Mail className="h-4 w-4 inline mr-2" />
                An invitation email will be sent to <strong>{formData.admin_email}</strong> to set up their admin account.
                The admin can configure company settings after login.
              </p>
            </div>
          </div>
        );

      // Case 4 is handled below - Invitation Sent Success Screen

      case 4:
        // Invitation Sent - Success Screen
        return (
          <div className="text-center space-y-6 py-8">
            <div className="w-20 h-20 mx-auto bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
              <CheckCircle className="h-10 w-10 text-green-600 dark:text-green-400" />
            </div>
            
            <div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Company Created Successfully!
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                {formData.company_name} has been added to the platform
              </p>
            </div>

            {/* Invitation Link */}
            <div className="p-6 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800">
              <h4 className="font-medium text-gray-900 dark:text-white mb-3">
                Admin Invitation Link
              </h4>
              
              {emailSent && (
                <div className="mb-4 p-3 rounded bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
                  <p className="text-sm text-green-800 dark:text-green-300">
                    ✉️ Invitation email sent to {formData.admin_email}
                  </p>
                </div>
              )}

              <div className="flex items-center gap-2">
                <Input
                  value={invitationLink}
                  readOnly
                  className="font-mono text-sm"
                />
                <Button
                  onClick={copyToClipboard}
                  variant="outline"
                  className="flex-shrink-0"
                >
                  {linkCopied ? (
                    <>
                      <Check className="h-4 w-4 mr-2" />
                      Copied
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4 mr-2" />
                      Copy
                    </>
                  )}
                </Button>
              </div>
              
              <p className="mt-3 text-xs text-gray-500 dark:text-gray-400">
                Share this link with the admin to set up their account. Link expires in 7 days.
              </p>
            </div>

            <div className="flex gap-4 justify-center pt-4">
              <Button
                onClick={() => navigate('/super-admin/companies')}
                variant="outline"
              >
                View All Companies
              </Button>
              <Button
                onClick={() => {
                  setCurrentStep(1);
                  setFormData({
                    company_name: '',
                    contact_email: '',
                    phone: '',
                    address: '',
                    admin_name: '',
                    admin_email: '',
                    admin_phone: '',
                  });
                  setInvitationLink('');
                  setEmailSent(false);
                }}
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Another Company
              </Button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <Button
          variant="ghost"
          onClick={() => navigate('/super-admin/companies')}
          disabled={loading}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Add New Company
          </h1>
          <p className="mt-1 text-gray-600 dark:text-gray-400">
            Onboard a new company to the Elevate platform
          </p>
        </div>
      </div>

      {/* Progress Steps */}
      {currentStep < 4 && (
        <div className="flex items-center justify-between">
          {steps.map((step, index) => {
            const Icon = step.icon;
            const isActive = step.number === currentStep;
            const isCompleted = step.number < currentStep;
            
            return (
              <React.Fragment key={step.number}>
                <div className="flex items-center">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      isActive
                        ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white'
                        : isCompleted
                        ? 'bg-green-500 text-white'
                        : 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
                    }`}
                  >
                    {isCompleted ? (
                      <CheckCircle className="h-5 w-5" />
                    ) : (
                      <Icon className="h-5 w-5" />
                    )}
                  </div>
                  <div className="ml-3 hidden sm:block">
                    <p className={`text-sm font-medium ${
                      isActive ? 'text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400'
                    }`}>
                      {step.title}
                    </p>
                  </div>
                </div>
                {index < steps.length - 1 && (
                  <div className={`flex-1 h-0.5 mx-4 ${
                    isCompleted ? 'bg-green-500' : 'bg-gray-200 dark:bg-gray-700'
                  }`} />
                )}
              </React.Fragment>
            );
          })}
        </div>
      )}

      {/* Form Card */}
      <Card>
        <CardContent className="p-8">
          {renderStepContent()}
        </CardContent>
      </Card>

      {/* Navigation Buttons */}
      {currentStep < 4 && (
        <div className="flex justify-between">
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
              className="bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-600"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creating Company...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Create Company & Send Invitation
                </>
              )}
            </Button>
          )}
        </div>
      )}
    </div>
  );
};

export default AddCompany;
