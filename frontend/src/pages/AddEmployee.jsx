import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import {
  ArrowLeft,
  User,
  Briefcase,
  CreditCard,
  DollarSign,
  Building2,
  CheckCircle,
  Calendar,
  Plus,
  Trash2
} from "lucide-react";
import { generateEmployeeId, validatePAN, validateAadhar, validateIFSC } from "@/lib/utils";
import { toast } from "sonner";
import { getErrorMessage } from '@/utils/errorHandler';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const AddEmployee = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [employeeLimit, setEmployeeLimit] = useState(null);
  const [limitLoading, setLimitLoading] = useState(true);

  // Check employee limit on component mount
  React.useEffect(() => {
    const checkLimit = async () => {
      try {
        const response = await axios.get(`${API}/employees/limit-status`);
        setEmployeeLimit(response.data);
        
        // If limit reached, show warning and redirect
        if (!response.data.can_add_more) {
          toast.error(response.data.message);
          setTimeout(() => navigate('/employees'), 2000);
        }
      } catch (error) {
        console.error('Error checking employee limit:', error);
      } finally {
        setLimitLoading(false);
      }
    };
    checkLimit();
  }, [navigate]);
  const [availableComponents, setAvailableComponents] = useState([]);
  const [selectedComponents, setSelectedComponents] = useState([]);
  const [formData, setFormData] = useState({
    // Personal Information
    employee_id: generateEmployeeId(),
    name: "",
    email: "",
    phone: "",
    gender: "",
    date_of_birth: "",
    aadhar_number: "",
    pan_number: "",
    marital_status: "",
    address: "",
    
    // Job Information
    department: "",
    designation: "",
    date_of_joining: "",
    work_location: "",
    
    // Bank Information
    bank_info: {
      bank_name: "",
      account_number: "",
      ifsc_code: "",
      branch: ""
    },
    
    // Salary Structure
    salary_structure: {
      basic_salary: "",
      house_rent_allowance: "",
      medical_allowance: "",
      leave_travel_allowance: "",
      conveyance_allowance: "",
      performance_incentive: "",
      other_benefits: "",
      pf_employee: "",
      pf_employer: "",
      esi_employee: "",
      esi_employer: "",
      professional_tax: "",
      tds: "",
      loan_deductions: "",
      others: ""
    },
    
    // Leave Configuration
    is_on_probation: false,
    probation_end_date: "",
    custom_casual_leave_per_month: "",
    custom_sick_leave_per_year: "",
    annual_leave_days: ""
  });
  
  const [errors, setErrors] = useState({});

  const steps = [
    { id: 1, title: "Personal Info", icon: User },
    { id: 2, title: "Job Info", icon: Briefcase },
    { id: 3, title: "Bank Info", icon: Building2 },
    { id: 4, title: "Salary Structure", icon: DollarSign },
    { id: 5, title: "Leave Configuration", icon: Calendar },
    { id: 6, title: "Review", icon: CheckCircle }
  ];

  // Fetch available salary components when reaching salary step
  React.useEffect(() => {
    if (currentStep === 4) {
      fetchSalaryComponents();
    }
  }, [currentStep]);

  const fetchSalaryComponents = async () => {
    try {
      // Fetch earnings
      const earningsRes = await axios.get(`${API}/salary-components?category=earnings`);
      const deductionsRes = await axios.get(`${API}/salary-components?category=deductions`);
      
      const earnings = (earningsRes.data.components || []).filter(c => c.is_active && c.part_of_salary_structure);
      const deductions = (deductionsRes.data.components || []).filter(c => c.is_active);
      
      setAvailableComponents({
        earnings,
        deductions
      });
    } catch (error) {
      console.error('Error fetching salary components:', error);
      toast.error('Failed to load salary components');
    }
  };

  const handleComponentToggle = (component) => {
    const exists = selectedComponents.find(c => c.component_id === component.component_id);
    
    if (exists) {
      // Remove component
      setSelectedComponents(selectedComponents.filter(c => c.component_id !== component.component_id));
    } else {
      // Add component with default amount
      setSelectedComponents([...selectedComponents, {
        component_id: component.component_id,
        component_name: component.component_name,
        component_type: component.category,
        category: component.component_type,
        name_in_payslip: component.name_in_payslip,
        amount: 0,
        is_active: true
      }]);
    }
  };

  const handleComponentAmountChange = (componentId, amount) => {
    setSelectedComponents(selectedComponents.map(c => 
      c.component_id === componentId ? { ...c, amount: parseFloat(amount) || 0 } : c
    ));
  };

  const handleInputChange = (field, value, nested = null) => {
    if (nested) {
      setFormData(prev => ({
        ...prev,
        [nested]: {
          ...prev[nested],
          [field]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: value
      }));
    }
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ""
      }));
    }
  };

  const validateStep = (step) => {
    const newErrors = {};
    
    switch (step) {
      case 1: // Personal Info
        if (!formData.name.trim()) newErrors.name = "Name is required";
        if (!formData.email.trim()) newErrors.email = "Email is required";
        if (!formData.phone.trim()) newErrors.phone = "Phone is required";
        if (!formData.gender) newErrors.gender = "Gender is required";
        if (!formData.date_of_birth) newErrors.date_of_birth = "Date of birth is required";
        if (!formData.aadhar_number.trim()) {
          newErrors.aadhar_number = "Aadhar number is required";
        } else if (!validateAadhar(formData.aadhar_number)) {
          newErrors.aadhar_number = "Invalid Aadhar number format";
        }
        if (!formData.pan_number.trim()) {
          newErrors.pan_number = "PAN number is required";
        } else if (!validatePAN(formData.pan_number)) {
          newErrors.pan_number = "Invalid PAN number format";
        }
        if (!formData.marital_status) newErrors.marital_status = "Marital status is required";
        if (!formData.address.trim()) newErrors.address = "Address is required";
        break;
        
      case 2: // Job Info
        if (!formData.department.trim()) newErrors.department = "Department is required";
        if (!formData.designation.trim()) newErrors.designation = "Designation is required";
        if (!formData.date_of_joining) newErrors.date_of_joining = "Date of joining is required";
        if (!formData.work_location.trim()) newErrors.work_location = "Work location is required";
        break;
        
      case 3: // Bank Info
        if (!formData.bank_info.bank_name.trim()) newErrors.bank_name = "Bank name is required";
        if (!formData.bank_info.account_number.trim()) newErrors.account_number = "Account number is required";
        if (!formData.bank_info.ifsc_code.trim()) {
          newErrors.ifsc_code = "IFSC code is required";
        } else if (!validateIFSC(formData.bank_info.ifsc_code)) {
          newErrors.ifsc_code = "Invalid IFSC code format";
        }
        break;
        
      case 4: // Salary Structure
        const earningsSelected = selectedComponents.filter(c => c.component_type === 'earnings');
        
        if (earningsSelected.length === 0) {
          newErrors.salary_structure = "Please select at least one earning component";
          toast.error("Please select at least one earning component");
        } else {
          // Check if all earnings have amounts (can be 0 or greater)
          const missingAmounts = earningsSelected.filter(c => c.amount === null || c.amount === undefined || c.amount === '');
          if (missingAmounts.length > 0) {
            newErrors.salary_structure = "Please enter amount for all selected earnings (can be 0)";
            toast.error("Please enter amount for all selected earnings (can be 0)");
          }
        }
        break;
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, steps.length));
    }
  };

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleSubmit = async () => {
    if (!validateStep(4)) return;
    
    setLoading(true);
    try {
      // Sanitize optional date/number fields before submit
      const toNumberOrNull = (v) => (v === '' || v === null || v === undefined ? null : Number(v));

      const sanitizedRoot = {
        ...formData,
        probation_end_date: formData.probation_end_date ? formData.probation_end_date : null,
        custom_casual_leave_per_month: toNumberOrNull(formData.custom_casual_leave_per_month),
        custom_sick_leave_per_year: toNumberOrNull(formData.custom_sick_leave_per_year),
        annual_leave_days: toNumberOrNull(formData.annual_leave_days),
      };

      // If employee is on probation, force leave fields to null
      if (sanitizedRoot.is_on_probation) {
        sanitizedRoot.custom_casual_leave_per_month = null;
        sanitizedRoot.custom_sick_leave_per_year = null;
        sanitizedRoot.annual_leave_days = null;
      }

      // Prepare data with component-based salary structure
      const processedData = {
        ...sanitizedRoot,
        salary_structure: {
          // Keep legacy fields empty for backward compatibility
          basic_salary: 0,
          house_rent_allowance: 0,
          medical_allowance: 0,
          leave_travel_allowance: 0,
          conveyance_allowance: 0,
          performance_incentive: 0,
          other_benefits: 0,
          pf_employee: 0,
          pf_employer: 0,
          esi_employee: 0,
          esi_employer: 0,
          professional_tax: 0,
          tds: 0,
          loan_deductions: 0,
          others: 0,
          // NEW: Component-based salary
          salary_components: selectedComponents,
          use_component_based_salary: true
        }
      };
      
      const response = await axios.post(`${API}/employees`, processedData);
      toast.success('Employee added successfully!');
      navigate('/employees');
    } catch (error) {
      console.error('Error creating employee:', error);
      const errorMessage = getErrorMessage(error, 'Failed to create employee');
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="employee_id">Employee ID</Label>
                <Input
                  id="employee_id"
                  value={formData.employee_id}
                  onChange={(e) => handleInputChange('employee_id', e.target.value)}
                  className="bg-gray-50"
                  readOnly
                />
              </div>
              <div>
                <Label htmlFor="name">Full Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  className={errors.name ? 'border-red-500' : ''}
                  data-testid="name-input"
                />
                {errors.name && <p className="text-sm text-red-500 mt-1">{errors.name}</p>}
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="email">Email Address *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  className={errors.email ? 'border-red-500' : ''}
                  data-testid="email-input"
                />
                {errors.email && <p className="text-sm text-red-500 mt-1">{errors.email}</p>}
              </div>
              <div>
                <Label htmlFor="phone">Phone Number *</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  className={errors.phone ? 'border-red-500' : ''}
                  data-testid="phone-input"
                />
                {errors.phone && <p className="text-sm text-red-500 mt-1">{errors.phone}</p>}
              </div>
            </div>
            
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="gender">Gender *</Label>
                <Select value={formData.gender} onValueChange={(value) => handleInputChange('gender', value)}>
                  <SelectTrigger className={errors.gender ? 'border-red-500' : ''}>
                    <SelectValue placeholder="Select gender" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
                {errors.gender && <p className="text-sm text-red-500 mt-1">{errors.gender}</p>}
              </div>
              <div>
                <Label htmlFor="date_of_birth">Date of Birth *</Label>
                <Input
                  id="date_of_birth"
                  type="date"
                  value={formData.date_of_birth}
                  onChange={(e) => handleInputChange('date_of_birth', e.target.value)}
                  className={errors.date_of_birth ? 'border-red-500' : ''}
                />
                {errors.date_of_birth && <p className="text-sm text-red-500 mt-1">{errors.date_of_birth}</p>}
              </div>
              <div>
                <Label htmlFor="marital_status">Marital Status *</Label>
                <Select value={formData.marital_status} onValueChange={(value) => handleInputChange('marital_status', value)}>
                  <SelectTrigger className={errors.marital_status ? 'border-red-500' : ''}>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="single">Single</SelectItem>
                    <SelectItem value="married">Married</SelectItem>
                    <SelectItem value="divorced">Divorced</SelectItem>
                    <SelectItem value="widowed">Widowed</SelectItem>
                  </SelectContent>
                </Select>
                {errors.marital_status && <p className="text-sm text-red-500 mt-1">{errors.marital_status}</p>}
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="aadhar_number">Aadhar Number *</Label>
                <Input
                  id="aadhar_number"
                  value={formData.aadhar_number}
                  onChange={(e) => handleInputChange('aadhar_number', e.target.value)}
                  placeholder="1234 5678 9012"
                  className={errors.aadhar_number ? 'border-red-500' : ''}
                />
                {errors.aadhar_number && <p className="text-sm text-red-500 mt-1">{errors.aadhar_number}</p>}
              </div>
              <div>
                <Label htmlFor="pan_number">PAN Number *</Label>
                <Input
                  id="pan_number"
                  value={formData.pan_number}
                  onChange={(e) => handleInputChange('pan_number', e.target.value.toUpperCase())}
                  placeholder="ABCDE1234F"
                  className={errors.pan_number ? 'border-red-500' : ''}
                />
                {errors.pan_number && <p className="text-sm text-red-500 mt-1">{errors.pan_number}</p>}
              </div>
            </div>
            
            <div>
              <Label htmlFor="address">Address *</Label>
              <Textarea
                id="address"
                value={formData.address}
                onChange={(e) => handleInputChange('address', e.target.value)}
                className={errors.address ? 'border-red-500' : ''}
                rows={3}
              />
              {errors.address && <p className="text-sm text-red-500 mt-1">{errors.address}</p>}
            </div>
          </div>
        );
      
      case 2:
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="department">Department *</Label>
                <Input
                  id="department"
                  value={formData.department}
                  onChange={(e) => handleInputChange('department', e.target.value)}
                  placeholder="e.g., Software Development"
                  className={errors.department ? 'border-red-500' : ''}
                />
                {errors.department && <p className="text-sm text-red-500 mt-1">{errors.department}</p>}
              </div>
              <div>
                <Label htmlFor="designation">Designation *</Label>
                <Input
                  id="designation"
                  value={formData.designation}
                  onChange={(e) => handleInputChange('designation', e.target.value)}
                  placeholder="e.g., Senior Developer"
                  className={errors.designation ? 'border-red-500' : ''}
                />
                {errors.designation && <p className="text-sm text-red-500 mt-1">{errors.designation}</p>}
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="date_of_joining">Date of Joining *</Label>
                <Input
                  id="date_of_joining"
                  type="date"
                  value={formData.date_of_joining}
                  onChange={(e) => handleInputChange('date_of_joining', e.target.value)}
                  className={errors.date_of_joining ? 'border-red-500' : ''}
                />
                {errors.date_of_joining && <p className="text-sm text-red-500 mt-1">{errors.date_of_joining}</p>}
              </div>
              <div>
                <Label htmlFor="work_location">Work Location *</Label>
                <Input
                  id="work_location"
                  value={formData.work_location}
                  onChange={(e) => handleInputChange('work_location', e.target.value)}
                  placeholder="e.g., Mumbai Office"
                  className={errors.work_location ? 'border-red-500' : ''}
                />
                {errors.work_location && <p className="text-sm text-red-500 mt-1">{errors.work_location}</p>}
              </div>
            </div>
            
            <div
              className="flex items-center space-x-2 p-4 rounded-lg border 
              bg-orange-50 border-orange-200 
              dark:bg-gray-800 dark:border-gray-700"
            >
              <Checkbox
                id="is_on_probation"
                checked={formData.is_on_probation}
                onCheckedChange={(checked) =>
                  handleInputChange("is_on_probation", checked)
                }
              />
              <Label
                htmlFor="is_on_probation"
                className="text-sm font-medium cursor-pointer 
                text-orange-700 dark:text-gray-200"
              >
                Currently on Probation (Leave configuration will be disabled)
              </Label>
            </div>
          </div>
        );
      
      case 3:
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="bank_name">Bank Name *</Label>
                <Input
                  id="bank_name"
                  value={formData.bank_info.bank_name}
                  onChange={(e) => handleInputChange('bank_name', e.target.value, 'bank_info')}
                  placeholder="e.g., State Bank of India"
                  className={errors.bank_name ? 'border-red-500' : ''}
                />
                {errors.bank_name && <p className="text-sm text-red-500 mt-1">{errors.bank_name}</p>}
              </div>
              <div>
                <Label htmlFor="branch">Branch</Label>
                <Input
                  id="branch"
                  value={formData.bank_info.branch}
                  onChange={(e) => handleInputChange('branch', e.target.value, 'bank_info')}
                  placeholder="e.g., Andheri East"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="account_number">Account Number *</Label>
                <Input
                  id="account_number"
                  value={formData.bank_info.account_number}
                  onChange={(e) => handleInputChange('account_number', e.target.value, 'bank_info')}
                  className={errors.account_number ? 'border-red-500' : ''}
                />
                {errors.account_number && <p className="text-sm text-red-500 mt-1">{errors.account_number}</p>}
              </div>
              <div>
                <Label htmlFor="ifsc_code">IFSC Code *</Label>
                <Input
                  id="ifsc_code"
                  value={formData.bank_info.ifsc_code}
                  onChange={(e) => handleInputChange('ifsc_code', e.target.value.toUpperCase(), 'bank_info')}
                  placeholder="SBIN0001234"
                  className={errors.ifsc_code ? 'border-red-500' : ''}
                />
                {errors.ifsc_code && <p className="text-sm text-red-500 mt-1">{errors.ifsc_code}</p>}
              </div>
            </div>
          </div>
        );
      
      case 4: {
        const totalEarnings = selectedComponents
          .filter(c => c.component_type === 'earnings')
          .reduce((sum, c) => sum + (c.amount || 0), 0);
        
        const totalDeductions = selectedComponents
          .filter(c => c.component_type === 'deductions')
          .reduce((sum, c) => sum + (c.amount || 0), 0);
        
        return (
          <div className="space-y-8">
            {/* Earnings Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-semibold flex items-center gap-2">
                    <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                      <DollarSign className="w-5 h-5 text-green-600 dark:text-green-400" />
                    </div>
                    Earnings
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    Add salary components for this employee
                  </p>
                </div>
                <Select
                  onValueChange={(value) => {
                    if (value && value !== 'placeholder') {
                      const component = availableComponents.earnings?.find(c => c.component_id === value);
                      if (component) {
                        handleComponentToggle(component);
                      }
                    }
                  }}
                >
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder={
                      <div className="flex items-center gap-2">
                        <Plus className="w-4 h-4" />
                        <span>Add Earning</span>
                      </div>
                    } />
                  </SelectTrigger>
                  <SelectContent>
                    {availableComponents.earnings && availableComponents.earnings.length > 0 ? (
                      <>
                        {availableComponents.earnings
                          .filter(c => !selectedComponents.find(sc => sc.component_id === c.component_id))
                          .map((component) => (
                            <SelectItem key={component.component_id} value={component.component_id}>
                              <div className="flex flex-col">
                                <span className="font-medium">{component.name_in_payslip}</span>
                                <span className="text-xs text-gray-500">{component.component_type}</span>
                              </div>
                            </SelectItem>
                          ))}
                        {availableComponents.earnings
                          .filter(c => !selectedComponents.find(sc => sc.component_id === c.component_id))
                          .length === 0 && (
                          <SelectItem value="placeholder" disabled>All components added</SelectItem>
                        )}
                      </>
                    ) : (
                      <SelectItem value="placeholder" disabled>No components available</SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>

              {/* Selected Earnings */}
              <div className="space-y-2">
                {selectedComponents.filter(c => c.component_type === 'earnings').length === 0 ? (
                  <div className="text-center py-12 border-2 border-dashed rounded-lg bg-gray-50/50 dark:bg-gray-800/50">
                    <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center mx-auto mb-3">
                      <Plus className="w-8 h-8 text-gray-400" />
                    </div>
                    <p className="text-gray-500 dark:text-gray-400">No earnings added yet</p>
                    <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">Click "Add Earning" to get started</p>
                  </div>
                ) : (
                  selectedComponents
                    .filter(c => c.component_type === 'earnings')
                    .map((component, index) => (
                      <div
                        key={component.component_id}
                        className="flex items-center gap-4 p-4 bg-white dark:bg-gray-800 border rounded-lg hover:shadow-md transition-shadow"
                      >
                        <div className="flex-1">
                          <div className="font-medium text-gray-900 dark:text-white">
                            {component.name_in_payslip}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {component.category}
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="flex items-center">
                            <span className="text-gray-500 mr-2">₹</span>
                            <Input
                              type="number"
                              placeholder="0"
                              className="w-32 text-right"
                              value={component.amount || ''}
                              onChange={(e) => handleComponentAmountChange(component.component_id, e.target.value)}
                            />
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                            onClick={() => handleComponentToggle(component)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))
                )}
              </div>

              {/* Earnings Total */}
              {selectedComponents.filter(c => c.component_type === 'earnings').length > 0 && (
                <div className="flex justify-end items-center gap-2 px-4 py-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <span className="font-medium text-gray-700 dark:text-gray-300">Total Earnings:</span>
                  <span className="text-xl font-bold text-green-600 dark:text-green-400">
                    ₹{totalEarnings.toLocaleString()}
                  </span>
                </div>
              )}
            </div>

            <Separator className="my-6" />

            {/* Deductions Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-semibold flex items-center gap-2">
                    <div className="w-10 h-10 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
                      <CreditCard className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                    </div>
                    Deductions
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    Add non-tax deductions (EPF, ESI, TDS, PT will be auto-calculated)
                  </p>
                </div>
                <Select
                  onValueChange={(value) => {
                    if (value && value !== 'placeholder') {
                      const component = availableComponents.deductions?.find(c => c.component_id === value);
                      if (component) {
                        handleComponentToggle(component);
                      }
                    }
                  }}
                >
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder={
                      <div className="flex items-center gap-2">
                        <Plus className="w-4 h-4" />
                        <span>Add Deduction</span>
                      </div>
                    } />
                  </SelectTrigger>
                  <SelectContent>
                    {availableComponents.deductions && availableComponents.deductions.length > 0 ? (
                      <>
                        {availableComponents.deductions
                          .filter(c => !selectedComponents.find(sc => sc.component_id === c.component_id))
                          .filter(c => !['Provident Fund', 'EPF', 'ESI', 'TDS', 'Professional Tax', 'PT'].includes(c.component_type))
                          .map((component) => (
                            <SelectItem key={component.component_id} value={component.component_id}>
                              <div className="flex flex-col">
                                <span className="font-medium">{component.name_in_payslip}</span>
                                <span className="text-xs text-gray-500">{component.component_type}</span>
                              </div>
                            </SelectItem>
                          ))}
                        {availableComponents.deductions
                          .filter(c => !selectedComponents.find(sc => sc.component_id === c.component_id))
                          .filter(c => !['Provident Fund', 'EPF', 'ESI', 'TDS', 'Professional Tax', 'PT'].includes(c.component_type))
                          .length === 0 && (
                          <SelectItem value="placeholder" disabled>No manual deductions available</SelectItem>
                        )}
                      </>
                    ) : (
                      <SelectItem value="placeholder" disabled>No deductions available</SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>

              {/* Selected Deductions */}
              <div className="space-y-2">
                {selectedComponents.filter(c => c.component_type === 'deductions').length === 0 ? (
                  <div className="text-center py-8 border-2 border-dashed rounded-lg bg-gray-50/50 dark:bg-gray-800/50">
                    <p className="text-gray-500 dark:text-gray-400 text-sm">No manual deductions added</p>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Amounts will be configured during payroll</p>
                  </div>
                ) : (
                  selectedComponents
                    .filter(c => c.component_type === 'deductions')
                    .map((component) => (
                      <div
                        key={component.component_id}
                        className="flex items-center gap-4 p-4 bg-white dark:bg-gray-800 border rounded-lg hover:shadow-md transition-shadow"
                      >
                        <div className="flex-1">
                          <div className="font-medium text-gray-900 dark:text-white">
                            {component.name_in_payslip}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {component.category}
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="text-xs text-gray-500 italic">
                            Amount will be set during payroll
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                            onClick={() => handleComponentToggle(component)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))
                )}
              </div>

              {/* Remove Deductions Total since amounts aren't entered */}
            </div>

            {/* Net Salary Summary */}
            {(selectedComponents.filter(c => c.component_type === 'earnings').length > 0) && (
              <div className="mt-6 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Gross Monthly Salary</p>
                    <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                      Deductions (including EPF, ESI, TDS, PT, Loans) will be calculated during payroll
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                      ₹{totalEarnings.toLocaleString()}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Total Earnings
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      }
      
      case 5:
        return (
          <div className="space-y-6">
            {formData.is_on_probation ? (
              <div className="bg-orange-100 border border-orange-300 rounded-lg p-6 text-center">
                <h4 className="font-semibold text-orange-900 mb-2">Employee on Probation</h4>
                <p className="text-sm text-orange-700">Leave configuration is disabled for probation employees.</p>
                <p className="text-sm text-orange-600 mt-2">Any leave taken will be unpaid and deducted from salary.</p>
              </div>
            ) : (
              <>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                  <h4 className="font-semibold text-blue-900 mb-2">Leave Configuration (Optional)</h4>
                  <p className="text-sm text-blue-700">Configure custom leave entitlements for this employee. If left blank, default values will be used.</p>
                  <ul className="text-sm text-blue-600 mt-2 ml-4 list-disc">
                    <li>Default Casual Leave: 1.5 days per month</li>
                    <li>Default Sick Leave: 7 days per year</li>
                  </ul>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="probation_end_date">Probation End Date</Label>
                    <Input
                      id="probation_end_date"
                      type="date"
                      value={formData.probation_end_date}
                      onChange={(e) => handleInputChange('probation_end_date', e.target.value)}
                    />
                    <p className="text-xs text-gray-500 mt-1">Set date when probation period ends</p>
                  </div>
                  <div>
                    <Label htmlFor="custom_casual_leave_per_month">Casual Leave (days/month)</Label>
                    <Input
                      id="custom_casual_leave_per_month"
                      type="number"
                      step="0.5"
                      min="0"
                      placeholder="Default: 1.5"
                      value={formData.custom_casual_leave_per_month}
                      onChange={(e) => handleInputChange('custom_casual_leave_per_month', e.target.value)}
                    />
                    <p className="text-xs text-gray-500 mt-1">Override default 1.5 days/month (e.g., Founders may get 2)</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="custom_sick_leave_per_year">Sick Leave (days/year)</Label>
                    <Input
                      id="custom_sick_leave_per_year"
                      type="number"
                      step="0.5"
                      min="0"
                      placeholder="Default: 7"
                      value={formData.custom_sick_leave_per_year}
                      onChange={(e) => handleInputChange('custom_sick_leave_per_year', e.target.value)}
                    />
                    <p className="text-xs text-gray-500 mt-1">Override default 7 days/year</p>
                  </div>
                  <div>
                    <Label htmlFor="annual_leave_days">Annual Leave Days</Label>
                    <Input
                      id="annual_leave_days"
                      type="number"
                      step="0.5"
                      min="0"
                      placeholder="0"
                      value={formData.annual_leave_days}
                      onChange={(e) => handleInputChange('annual_leave_days', e.target.value)}
                    />
                    <p className="text-xs text-gray-500 mt-1">Additional annual leave entitlement (e.g., 5 for senior roles)</p>
                  </div>
                </div>
              </>
            )}
          </div>
        );
      
      case 6: {
        const grossSalary = selectedComponents
          .filter(c => c.component_type === 'earnings')
          .reduce((sum, c) => sum + (c.amount || 0), 0);
        
        const totalDeductions = selectedComponents
          .filter(c => c.component_type === 'deductions')
          .reduce((sum, c) => sum + (c.amount || 0), 0);
        
        const netSalary = grossSalary - totalDeductions;
        
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-2xl font-bold text-emerald-600 mb-2">Review Employee Details</h3>
              <p className="text-gray-600">Please review all information before submitting</p>
            </div>
            
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Personal Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div><strong>Name:</strong> {formData.name}</div>
                  <div><strong>Email:</strong> {formData.email}</div>
                  <div><strong>Phone:</strong> {formData.phone}</div>
                  <div><strong>Gender:</strong> {formData.gender}</div>
                  <div><strong>PAN:</strong> {formData.pan_number}</div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Job Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div><strong>Department:</strong> {formData.department}</div>
                  <div><strong>Designation:</strong> {formData.designation}</div>
                  <div><strong>Joining Date:</strong> {formData.date_of_joining}</div>
                  <div><strong>Location:</strong> {formData.work_location}</div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Bank Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div><strong>Bank:</strong> {formData.bank_info.bank_name}</div>
                  <div><strong>Account:</strong> {formData.bank_info.account_number}</div>
                  <div><strong>IFSC:</strong> {formData.bank_info.ifsc_code}</div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Salary Components</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  {/* Earnings */}
                  <div>
                    <div className="font-semibold text-green-600 mb-2">Earnings:</div>
                    {selectedComponents.filter(c => c.component_type === 'earnings').map((comp) => (
                      <div key={comp.component_id} className="flex justify-between ml-2">
                        <span>{comp.name_in_payslip}:</span>
                        <span>₹{comp.amount.toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                  
                  {/* Deductions - Just list names, no amounts */}
                  {selectedComponents.filter(c => c.component_type === 'deductions').length > 0 && (
                    <div>
                      <div className="font-semibold text-orange-600 mb-2">Deductions (configured during payroll):</div>
                      {selectedComponents.filter(c => c.component_type === 'deductions').map((comp) => (
                        <div key={comp.component_id} className="ml-2 text-gray-600 dark:text-gray-400">
                          • {comp.name_in_payslip}
                        </div>
                      ))}
                    </div>
                  )}
                  
                  <Separator />
                  <div className="flex justify-between">
                    <span className="font-semibold">Gross Salary:</span>
                    <span className="font-semibold text-green-600">₹{grossSalary.toLocaleString()}</span>
                  </div>
                  <div className="text-xs text-gray-500 mt-2">
                    Note: Deductions (EPF, ESI, TDS, PT, Loans) will be calculated during payroll processing
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Leave Configuration</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  {formData.is_on_probation ? (
                    <div className="bg-orange-100 border border-orange-300 rounded p-3">
                      <strong className="text-orange-900">Currently on Probation</strong>
                      <p className="text-orange-700 text-xs mt-1">All leaves will be unpaid and deducted</p>
                    </div>
                  ) : (
                    <>
                      {formData.probation_end_date ? (
                        <div><strong>Probation End:</strong> {formData.probation_end_date}</div>
                      ) : (
                        <div className="text-gray-500">No probation period</div>
                      )}
                      <div><strong>Casual Leave:</strong> {formData.custom_casual_leave_per_month || '1.5'} days/month</div>
                      <div><strong>Sick Leave:</strong> {formData.custom_sick_leave_per_year || '7'} days/year</div>
                      {formData.annual_leave_days && (
                        <div><strong>Annual Leave:</strong> {formData.annual_leave_days} days</div>
                      )}
                    </>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        );
      }
        
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6" data-testid="add-employee-form">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <Button 
          variant="outline" 
          size="icon"
          onClick={() => navigate('/employees')}
          data-testid="back-btn"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
            Add New Employee
          </h1>
          <p className="text-gray-500 dark:text-gray-400">
            Create a new employee record with complete details
          </p>
        </div>
      </div>

      {/* Progress Steps */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-8">
            {steps.map((step, index) => {
              const Icon = step.icon;
              const isActive = currentStep === step.id;
              const isCompleted = currentStep > step.id;
              
              return (
                <div key={step.id} className="flex items-center">
                  <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                    isCompleted ? 'bg-emerald-600 border-emerald-600 text-white' :
                    isActive ? 'border-emerald-600 text-emerald-600' :
                    'border-gray-300 text-gray-400'
                  }`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className={`ml-2 hidden sm:block ${
                    isActive ? 'text-emerald-600 font-medium' :
                    isCompleted ? 'text-emerald-600' :
                    'text-gray-400'
                  }`}>
                    {step.title}
                  </div>
                  {index < steps.length - 1 && (
                    <div className={`w-12 h-0.5 mx-4 ${
                      isCompleted ? 'bg-emerald-600' : 'bg-gray-300'
                    }`} />
                  )}
                </div>
              );
            })}
          </div>
          
          <Progress value={(currentStep / steps.length) * 100} className="mb-6" />
          
          {/* Step Content */}
          <div className="min-h-96">
            {renderStepContent()}
          </div>
          
          {/* Navigation Buttons */}
          <div className="flex justify-between mt-8">
            <Button 
              variant="outline" 
              onClick={prevStep}
              disabled={currentStep === 1}
            >
              Previous
            </Button>
            
            <div className="flex space-x-2">
              {currentStep < steps.length ? (
                <Button 
                  onClick={nextStep}
                  className="bg-emerald-600 hover:bg-emerald-700"
                  data-testid="next-step-btn"
                >
                  Next Step
                </Button>
              ) : (
                <Button 
                  onClick={handleSubmit}
                  disabled={loading}
                  className="bg-emerald-600 hover:bg-emerald-700"
                  data-testid="submit-employee-btn"
                >
                  {loading ? "Creating Employee..." : "Create Employee"}
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AddEmployee;
