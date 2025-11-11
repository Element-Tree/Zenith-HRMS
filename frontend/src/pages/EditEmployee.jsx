import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
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
import { Checkbox } from "@/components/ui/checkbox";
import {
  ArrowLeft,
  User,
  Briefcase,
  CreditCard,
  DollarSign,
  Building2,
  Save,
  Loader2,
  Calendar
} from "lucide-react";
import { validatePAN, validateAadhar, validateIFSC, calculateGrossSalary, calculateTotalDeductions, calculateNetSalary } from "@/lib/utils";
import { toast } from "sonner";
import EmployeeStatusManager from "@/components/EmployeeStatusManager";
import { getErrorMessage } from "@/utils/errorHandler";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const EditEmployee = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [employee, setEmployee] = useState(null);
  const [availableComponents, setAvailableComponents] = useState({ earnings: [], deductions: [] });
  const [selectedComponents, setSelectedComponents] = useState([]);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    gender: "",
    date_of_birth: "",
    aadhar_number: "",
    pan_number: "",
    marital_status: "",
    address: "",
    department: "",
    designation: "",
    date_of_joining: "",
    work_location: "",
    status: "",
    bank_info: {
      bank_name: "",
      account_number: "",
      ifsc_code: "",
      branch: ""
    },
    salary_structure: {
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
      others: 0
    }
  });
  
  const [errors, setErrors] = useState({});

  useEffect(() => {
    fetchEmployee();
    fetchSalaryComponents();
  }, [id]);

  const fetchSalaryComponents = async () => {
    try {
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

  const fetchEmployee = async () => {
    try {
      const response = await axios.get(`${API}/employees/${id}`);
      const emp = response.data;
      setEmployee(emp);
      
      // Load salary components if using component-based salary
      if (emp.salary_structure?.salary_components && emp.salary_structure.salary_components.length > 0) {
        setSelectedComponents(emp.salary_structure.salary_components);
      }
      
      setFormData({
        name: emp.name || "",
        email: emp.email || "",
        phone: emp.phone || "",
        gender: emp.gender || "",
        date_of_birth: emp.date_of_birth || "",
        aadhar_number: emp.aadhar_number || "",
        pan_number: emp.pan_number || "",
        marital_status: emp.marital_status || "",
        address: emp.address || "",
        department: emp.department || "",
        designation: emp.designation || "",
        date_of_joining: emp.date_of_joining || "",
        work_location: emp.work_location || "",
        status: emp.status || "",
        bank_info: {
          bank_name: emp.bank_info?.bank_name || "",
          account_number: emp.bank_info?.account_number || "",
          ifsc_code: emp.bank_info?.ifsc_code || "",
          branch: emp.bank_info?.branch || ""
        },
        salary_structure: {
          basic_salary: emp.salary_structure?.basic_salary || 0,
          house_rent_allowance: emp.salary_structure?.house_rent_allowance || emp.salary_structure?.hra || 0,
          medical_allowance: emp.salary_structure?.medical_allowance || 0,
          leave_travel_allowance: emp.salary_structure?.leave_travel_allowance || emp.salary_structure?.travel_allowance || 0,
          conveyance_allowance: emp.salary_structure?.conveyance_allowance || emp.salary_structure?.food_allowance || 0,
          performance_incentive: emp.salary_structure?.performance_incentive || emp.salary_structure?.internet_allowance || 0,
          other_benefits: emp.salary_structure?.other_benefits || emp.salary_structure?.special_allowance || 0,
          pf_employee: emp.salary_structure?.pf_employee || 0,
          pf_employer: emp.salary_structure?.pf_employer || 0,
          esi_employee: emp.salary_structure?.esi_employee || 0,
          esi_employer: emp.salary_structure?.esi_employer || 0,
          professional_tax: emp.salary_structure?.professional_tax || 0,
          tds: emp.salary_structure?.tds || 0,
          loan_deductions: emp.salary_structure?.loan_deductions || 0,
          others: emp.salary_structure?.others || 0
        },
        // Leave Configuration
        is_on_probation: emp.is_on_probation || false,
        probation_end_date: emp.probation_end_date || "",
        custom_casual_leave_per_month: emp.custom_casual_leave_per_month || "",
        custom_sick_leave_per_year: emp.custom_sick_leave_per_year || "",
        annual_leave_days: emp.annual_leave_days || ""
      });
    } catch (error) {
      console.error('Error fetching employee:', error);
      toast.error('Failed to load employee details');
      navigate('/employees');
    } finally {
      setLoading(false);
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

  const handleSalaryChange = (field, value) => {
    const numValue = parseFloat(value) || 0;
    setFormData(prev => {
      const updated = { 
        ...prev, 
        salary_structure: {
          ...prev.salary_structure,
          [field]: numValue
        }
      };
      
      // Auto-calculate PF and ESI based on basic salary
      if (field === 'basic_salary') {
        updated.salary_structure.pf_employee = Math.round(numValue * 0.12); // 12% PF
        updated.salary_structure.pf_employer = Math.round(numValue * 0.12);
        
        // ESI is applicable only if total salary is below 25,000
        const grossSalary = calculateGrossSalary(updated.salary_structure);
        if (grossSalary <= 25000) {
          updated.salary_structure.esi_employee = Math.round(grossSalary * 0.0075); // 0.75%
          updated.salary_structure.esi_employer = Math.round(grossSalary * 0.0325); // 3.25%
        } else {
          updated.salary_structure.esi_employee = 0;
          updated.salary_structure.esi_employer = 0;
        }
        
        // Auto-calculate HRA as 40% of basic (common practice)
        if (updated.salary_structure.hra === 0 || updated.salary_structure.hra === prev.salary_structure.basic_salary * 0.4) {
          updated.salary_structure.hra = Math.round(numValue * 0.4);
        }
      }
      
      return updated;
    });
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.name.trim()) newErrors.name = "Name is required";
    if (!formData.email.trim()) newErrors.email = "Email is required";
    if (!formData.phone.trim()) newErrors.phone = "Phone is required";
    if (!formData.department.trim()) newErrors.department = "Department is required";
    if (!formData.designation.trim()) newErrors.designation = "Designation is required";
    
    if (formData.pan_number.trim() && !validatePAN(formData.pan_number)) {
      newErrors.pan_number = "Invalid PAN number format";
    }
    if (formData.aadhar_number.trim() && !validateAadhar(formData.aadhar_number)) {
      newErrors.aadhar_number = "Invalid Aadhar number format";
    }
    if (formData.bank_info.ifsc_code.trim() && !validateIFSC(formData.bank_info.ifsc_code)) {
      newErrors.ifsc_code = "Invalid IFSC code format";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;
    
    setSaving(true);
    try {
      const processedData = {
        ...formData,
        // Convert empty strings to null for date fields
        date_of_birth: formData.date_of_birth || null,
        date_of_joining: formData.date_of_joining || null,
        probation_end_date: formData.probation_end_date || null,
        // Convert empty strings to null for numeric fields
        custom_casual_leave_per_month: formData.custom_casual_leave_per_month ? parseFloat(formData.custom_casual_leave_per_month) : null,
        custom_sick_leave_per_year: formData.custom_sick_leave_per_year ? parseFloat(formData.custom_sick_leave_per_year) : null,
        annual_leave_days: formData.annual_leave_days ? parseFloat(formData.annual_leave_days) : null,
        salary_structure: {
          ...formData.salary_structure,
          // Ensure all salary fields are numbers
          basic_salary: parseFloat(formData.salary_structure.basic_salary) || 0,
          house_rent_allowance: parseFloat(formData.salary_structure.house_rent_allowance || formData.salary_structure.hra) || 0,
          medical_allowance: parseFloat(formData.salary_structure.medical_allowance) || 0,
          leave_travel_allowance: parseFloat(formData.salary_structure.leave_travel_allowance || formData.salary_structure.travel_allowance) || 0,
          conveyance_allowance: parseFloat(formData.salary_structure.conveyance_allowance || formData.salary_structure.food_allowance) || 0,
          performance_incentive: parseFloat(formData.salary_structure.performance_incentive || formData.salary_structure.internet_allowance) || 0,
          other_benefits: parseFloat(formData.salary_structure.other_benefits || formData.salary_structure.special_allowance) || 0,
          pf_employee: parseFloat(formData.salary_structure.pf_employee) || 0,
          pf_employer: parseFloat(formData.salary_structure.pf_employer) || 0,
          esi_employee: parseFloat(formData.salary_structure.esi_employee) || 0,
          esi_employer: parseFloat(formData.salary_structure.esi_employer) || 0,
          professional_tax: parseFloat(formData.salary_structure.professional_tax) || 0,
          tds: parseFloat(formData.salary_structure.tds) || 0,
          loan_deductions: parseFloat(formData.salary_structure.loan_deductions) || 0,
          others: parseFloat(formData.salary_structure.others) || 0,
          // Include component-based salary if components are selected
          ...(selectedComponents.length > 0 ? {
            salary_components: selectedComponents,
            use_component_based_salary: true
          } : {})
        }
      };
      
      await axios.put(`${API}/employees/${id}`, processedData);
      toast.success('Employee updated successfully!');
      // Refresh employee data
      await fetchEmployee();
      // Optionally navigate back or stay on page
      // navigate('/employees');
    } catch (error) {
      console.error('Error updating employee:', error);
      const errorMessage = getErrorMessage(error, 'Failed to update employee');
      toast.error(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-10 bg-gray-200 rounded-lg w-64"></div>
        <div className="h-96 bg-gray-200 rounded-lg"></div>
      </div>
    );
  }

  if (!employee) {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Employee Not Found</h1>
          <p className="text-gray-500 mt-2">The employee you're looking for doesn't exist.</p>
          <Button onClick={() => navigate('/employees')} className="mt-4">
            Back to Employees
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="edit-employee">
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
            Edit Employee
          </h1>
          <p className="text-gray-500 dark:text-gray-400">
            Update {employee.name}'s information
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Personal Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <User className="h-5 w-5" />
              <span>Personal Information</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
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
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="phone">Phone Number *</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  className={errors.phone ? 'border-red-500' : ''}
                />
                {errors.phone && <p className="text-sm text-red-500 mt-1">{errors.phone}</p>}
              </div>
              <div>
                <Label htmlFor="gender">Gender</Label>
                <Select value={formData.gender} onValueChange={(value) => handleInputChange('gender', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select gender" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="date_of_birth">Date of Birth</Label>
                <Input
                  id="date_of_birth"
                  type="date"
                  value={formData.date_of_birth}
                  onChange={(e) => handleInputChange('date_of_birth', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="marital_status">Marital Status</Label>
                <Select value={formData.marital_status} onValueChange={(value) => handleInputChange('marital_status', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="single">Single</SelectItem>
                    <SelectItem value="married">Married</SelectItem>
                    <SelectItem value="divorced">Divorced</SelectItem>
                    <SelectItem value="widowed">Widowed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="aadhar_number">Aadhar Number</Label>
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
                <Label htmlFor="pan_number">PAN Number</Label>
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
              <Label htmlFor="address">Address</Label>
              <Textarea
                id="address"
                value={formData.address}
                onChange={(e) => handleInputChange('address', e.target.value)}
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        {/* Job Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Briefcase className="h-5 w-5" />
              <span>Job Information</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="department">Department *</Label>
                <Input
                  id="department"
                  value={formData.department}
                  onChange={(e) => handleInputChange('department', e.target.value)}
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
                  className={errors.designation ? 'border-red-500' : ''}
                />
                {errors.designation && <p className="text-sm text-red-500 mt-1">{errors.designation}</p>}
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="date_of_joining">Date of Joining</Label>
                <Input
                  id="date_of_joining"
                  type="date"
                  value={formData.date_of_joining}
                  onChange={(e) => handleInputChange('date_of_joining', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="work_location">Work Location</Label>
                <Input
                  id="work_location"
                  value={formData.work_location}
                  onChange={(e) => handleInputChange('work_location', e.target.value)}
                />
              </div>
            </div>
            
            <div className="flex items-center space-x-2 bg-orange-50 dark:bg-orange-300/30 p-4 rounded-lg border border-orange-200">
              <Checkbox
                id="is_on_probation"
                checked={formData.is_on_probation || false}
                onCheckedChange={(checked) => setFormData({ ...formData, is_on_probation: checked })}
              />
              <Label htmlFor="is_on_probation" className="text-sm font-medium cursor-pointer">
                Currently on Probation (Leave configuration will be disabled)
              </Label>
            </div>

            {/* Employee Status Manager */}
            <div className="border-t pt-4">
              <h3 className="font-semibold mb-4">Employee Status Management</h3>
              <EmployeeStatusManager 
                employee={employee} 
                onStatusUpdate={fetchEmployee}
              />
            </div>

            <Separator />

            <h3 className="font-semibold">Bank Information</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="bank_name">Bank Name</Label>
                <Input
                  id="bank_name"
                  value={formData.bank_info.bank_name}
                  onChange={(e) => handleInputChange('bank_name', e.target.value, 'bank_info')}
                />
              </div>
              <div>
                <Label htmlFor="branch">Branch</Label>
                <Input
                  id="branch"
                  value={formData.bank_info.branch}
                  onChange={(e) => handleInputChange('branch', e.target.value, 'bank_info')}
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="account_number">Account Number</Label>
                <Input
                  id="account_number"
                  value={formData.bank_info.account_number}
                  onChange={(e) => handleInputChange('account_number', e.target.value, 'bank_info')}
                />
              </div>
              <div>
                <Label htmlFor="ifsc_code">IFSC Code</Label>
                <Input
                  id="ifsc_code"
                  value={formData.bank_info.ifsc_code}
                  onChange={(e) => handleInputChange('ifsc_code', e.target.value.toUpperCase(), 'bank_info')}
                  className={errors.ifsc_code ? 'border-red-500' : ''}
                />
                {errors.ifsc_code && <p className="text-sm text-red-500 mt-1">{errors.ifsc_code}</p>}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Salary Structure */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <DollarSign className="h-5 w-5" />
            <span>Salary Structure (Component-Based)</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Migration Notice for Fixed Salary Employees */}
          {employee?.salary_structure && !employee?.salary_structure?.salary_components && (
            <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-500/30 rounded-lg">
              <div className="flex items-start gap-3">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5">
                  <circle cx="12" cy="12" r="10"></circle>
                  <path d="M12 16v-4"></path>
                  <path d="M12 8h.01"></path>
                </svg>
                <div>
                  <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-1">This employee uses legacy fixed salary structure</h4>
                  <p className="text-sm text-blue-700 dark:text-blue-300">
                    To update this employee's salary, select components below. The new component-based system provides better flexibility and reporting.
                  </p>
                </div>
              </div>
            </div>
          )}
          
          {/* Component-Based Salary Structure */}
          <div className="space-y-6">
            {/* Earnings Components */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-emerald-600">Earnings</h3>
                <Select
                  onValueChange={(value) => {
                    const component = availableComponents.earnings.find(c => c.component_id === value);
                    if (component) {
                      handleComponentToggle(component);
                    }
                  }}
                >
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="+ Add Earning" />
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
                    <p className="text-gray-500 dark:text-gray-400">No earnings added yet</p>
                    <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">Click "Add Earning" to get started</p>
                  </div>
                ) : (
                  selectedComponents
                    .filter(c => c.component_type === 'earnings')
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
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M3 6h18"></path>
                              <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
                              <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
                            </svg>
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
                    ₹{selectedComponents
                      .filter(c => c.component_type === 'earnings')
                      .reduce((sum, c) => sum + (parseFloat(c.amount) || 0), 0)
                      .toLocaleString()}
                  </span>
                </div>
              )}
            </div>

            <Separator />

            {/* Deductions Components */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-red-600">Deductions</h3>
                <Select
                  onValueChange={(value) => {
                    const component = availableComponents.deductions.find(c => c.component_id === value);
                    if (component) {
                      handleComponentToggle(component);
                    }
                  }}
                >
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="+ Add Deduction" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableComponents.deductions && availableComponents.deductions.length > 0 ? (
                      <>
                        {availableComponents.deductions
                          .filter(c => !selectedComponents.find(sc => sc.component_id === c.component_id))
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

              {/* Selected Deductions */}
              <div className="space-y-2">
                {selectedComponents.filter(c => c.component_type === 'deductions').length === 0 ? (
                  <div className="text-center py-12 border-2 border-dashed rounded-lg bg-gray-50/50 dark:bg-gray-800/50">
                    <p className="text-gray-500 dark:text-gray-400">No deductions added yet</p>
                    <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">Click "Add Deduction" to get started</p>
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
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M3 6h18"></path>
                              <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
                              <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
                            </svg>
                          </Button>
                        </div>
                      </div>
                    ))
                )}
              </div>

              {/* Deductions Total */}
              {selectedComponents.filter(c => c.component_type === 'deductions').length > 0 && (
                <div className="flex justify-end items-center gap-2 px-4 py-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                  <span className="font-medium text-gray-700 dark:text-gray-300">Total Deductions:</span>
                  <span className="text-xl font-bold text-red-600 dark:text-red-400">
                    ₹{selectedComponents
                      .filter(c => c.component_type === 'deductions')
                      .reduce((sum, c) => sum + (parseFloat(c.amount) || 0), 0)
                      .toLocaleString()}
                  </span>
                </div>
              )}
            </div>

            <Separator />

            {/* Salary Summary */}
            <div className="p-6 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 rounded-lg border">
              <h4 className="font-semibold mb-4 text-lg">Salary Summary</h4>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 dark:text-gray-400">Gross Salary:</span>
                  <span className="font-semibold text-lg">
                    ₹{selectedComponents
                      .filter(c => c.component_type === 'earnings')
                      .reduce((sum, c) => sum + (parseFloat(c.amount) || 0), 0)
                      .toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 dark:text-gray-400">Total Deductions:</span>
                  <span className="font-semibold text-lg text-red-600 dark:text-red-400">
                    -₹{selectedComponents
                      .filter(c => c.component_type === 'deductions')
                      .reduce((sum, c) => sum + (parseFloat(c.amount) || 0), 0)
                      .toLocaleString()}
                  </span>
                </div>
                <Separator />
                <div className="flex justify-between items-center pt-2">
                  <span className="font-semibold text-gray-900 dark:text-white">Net Salary:</span>
                  <span className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                    ₹{(
                      selectedComponents
                        .filter(c => c.component_type === 'earnings')
                        .reduce((sum, c) => sum + (parseFloat(c.amount) || 0), 0) -
                      selectedComponents
                        .filter(c => c.component_type === 'deductions')
                        .reduce((sum, c) => sum + (parseFloat(c.amount) || 0), 0)
                    ).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            {/* Legacy Fixed Fields (Hidden by default, show only if no components) */}
            {selectedComponents.length === 0 && (
              <details className="mt-6">
                <summary className="cursor-pointer text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300">
                  Show legacy fixed salary fields (deprecated)
                </summary>
                <div className="mt-4 p-4 border rounded-lg bg-gray-50/50 dark:bg-gray-800/50">
                  <div className="grid gap-6 md:grid-cols-2">
                <div>
                  <Label htmlFor="basic_salary">Basic Salary</Label>
                  <Input
                    id="basic_salary"
                    type="number"
                    value={formData.salary_structure.basic_salary}
                    onChange={(e) => handleSalaryChange('basic_salary', e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="house_rent_allowance">House Rent Allowance</Label>
                  <Input
                    id="house_rent_allowance"
                    type="number"
                    value={formData.salary_structure.house_rent_allowance}
                    onChange={(e) => handleSalaryChange('house_rent_allowance', e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="medical_allowance">Medical Allowance</Label>
                  <Input
                    id="medical_allowance"
                    type="number"
                    value={formData.salary_structure.medical_allowance}
                    onChange={(e) => handleSalaryChange('medical_allowance', e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="leave_travel_allowance">Leave Travel Allowance</Label>
                  <Input
                    id="leave_travel_allowance"
                    type="number"
                    value={formData.salary_structure.leave_travel_allowance}
                    onChange={(e) => handleSalaryChange('leave_travel_allowance', e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="conveyance_allowance">Bonus</Label>
                  <Input
                    id="conveyance_allowance"
                    type="number"
                    value={formData.salary_structure.conveyance_allowance}
                    onChange={(e) => handleSalaryChange('conveyance_allowance', e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="performance_incentive">Performance Incentive</Label>
                  <Input
                    id="performance_incentive"
                    type="number"
                    value={formData.salary_structure.performance_incentive}
                    onChange={(e) => handleSalaryChange('performance_incentive', e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="other_benefits">Other Benefits</Label>
                  <Input
                    id="other_benefits"
                    type="number"
                    value={formData.salary_structure.other_benefits}
                    onChange={(e) => handleSalaryChange('other_benefits', e.target.value)}
                  />
                </div>
              </div>

              {/* Deductions */}
              <div className="space-y-4">
              <h3 className="text-lg font-semibold text-red-600">Deductions</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="pf_employee">PF (Employee)</Label>
                  <Input
                    id="pf_employee"
                    type="number"
                    value={formData.salary_structure.pf_employee}
                    onChange={(e) => handleSalaryChange('pf_employee', e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="esi_employee">ESI (Employee)</Label>
                  <Input
                    id="esi_employee"
                    type="number"
                    value={formData.salary_structure.esi_employee}
                    onChange={(e) => handleSalaryChange('esi_employee', e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="professional_tax">Professional Tax</Label>
                  <Input
                    id="professional_tax"
                    type="number"
                    value={formData.salary_structure.professional_tax}
                    onChange={(e) => handleSalaryChange('professional_tax', e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="tds">TDS</Label>
                  <Input
                    id="tds"
                    type="number"
                    value={formData.salary_structure.tds}
                    onChange={(e) => handleSalaryChange('tds', e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="loan_deductions">Loan Deductions</Label>
                  <Input
                    id="loan_deductions"
                    type="number"
                    value={formData.salary_structure.loan_deductions}
                    onChange={(e) => handleSalaryChange('loan_deductions', e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="others">Others</Label>
                  <Input
                    id="others"
                    type="number"
                    value={formData.salary_structure.others}
                    onChange={(e) => handleSalaryChange('others', e.target.value)}
                  />
                </div>
              </div>

              {/* Summary */}
              <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <h4 className="font-semibold mb-2">Salary Summary</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Gross Salary:</span>
                    <span>₹{calculateGrossSalary(formData.salary_structure).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Total Deductions:</span>
                    <span className="text-red-600">₹{calculateTotalDeductions(formData.salary_structure).toLocaleString()}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between font-semibold">
                    <span>Net Salary:</span>
                    <span className="text-emerald-600">₹{calculateNetSalary(formData.salary_structure).toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </details>
      )}
          </div>
        </CardContent>
      </Card>

      {/* Leave Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Calendar className="h-5 w-5" />
            <span>Leave Configuration</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {formData.is_on_probation ? (
            <div className="bg-orange-100 border border-orange-300 rounded-lg p-6 text-center">
              <h4 className="font-semibold text-orange-900 mb-2">Employee on Probation</h4>
              <p className="text-sm text-orange-700">Leave configuration is disabled for probation employees.</p>
              <p className="text-sm text-orange-600 mt-2">Any leave taken will be unpaid and deducted from salary.</p>
            </div>
          ) : (
            <>
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-500/30 rounded-lg p-4 mb-4">
                <p className="text-sm text-blue-700 dark:text-blue-300">Configure custom leave entitlements. If left blank, defaults apply: 1.5 casual days/month, 7 sick days/year.</p>
              </div>
              
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label htmlFor="probation_end_date">Probation End Date</Label>
                  <Input
                    id="probation_end_date"
                    type="date"
                    value={formData.probation_end_date || ''}
                    onChange={(e) => setFormData({ ...formData, probation_end_date: e.target.value })}
                  />
                  <p className="text-xs text-gray-500 mt-1">Set when probation ends</p>
                </div>
                <div>
                  <Label htmlFor="custom_casual_leave_per_month">Casual Leave (days/month)</Label>
                  <Input
                    id="custom_casual_leave_per_month"
                    type="number"
                    step="0.5"
                    min="0"
                    placeholder="Default: 1.5"
                    value={formData.custom_casual_leave_per_month || ''}
                    onChange={(e) => setFormData({ ...formData, custom_casual_leave_per_month: e.target.value })}
                  />
                  <p className="text-xs text-gray-500 mt-1">Override default 1.5 days/month</p>
                </div>
                <div>
                  <Label htmlFor="custom_sick_leave_per_year">Sick Leave (days/year)</Label>
                  <Input
                    id="custom_sick_leave_per_year"
                    type="number"
                    step="0.5"
                    min="0"
                    placeholder="Default: 7"
                    value={formData.custom_sick_leave_per_year || ''}
                    onChange={(e) => setFormData({ ...formData, custom_sick_leave_per_year: e.target.value })}
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
                    value={formData.annual_leave_days || ''}
                    onChange={(e) => setFormData({ ...formData, annual_leave_days: e.target.value })}
                  />
                  <p className="text-xs text-gray-500 mt-1">Additional annual leave</p>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex justify-end space-x-4">
        <Button variant="outline" onClick={() => navigate('/employees')}>
          Cancel
        </Button>
        <Button 
          onClick={handleSubmit} 
          disabled={saving}
          data-testid="save-employee-btn"
        >
          {saving ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="w-4 h-4 mr-2" />
              Save Changes
            </>
          )}
        </Button>
      </div>
    </div>
  );
};

export default EditEmployee;