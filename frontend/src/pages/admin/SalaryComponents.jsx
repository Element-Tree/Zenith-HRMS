import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Plus, Edit, Trash2, Search, Info } from 'lucide-react';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Predefined benefit plans with display names
const BENEFIT_PLANS = {
  'Section 80C - Tax Saving Investments': ['Life Insurance Premium', 'Public Provident Fund', 'Unit-linked insurance plan', 'ELSS Tax Saving Mutual Fund'],
  'Section 80D - Medical Insurance': [
    'Medi Claim Policy for self, spouse, children - 80D',
    'Medi Claim Policy for self, spouse, children for senior citizen - 80D',
    'Medi Claim Policy for parents - 80D',
    'Medi Claim Policy for parents for senior citizen - 80D',
    'Preventive health check up - 80D',
    'Preventive health check up for parents - 80D',
    'Medical Bills for self, spouse, children for senior citizen - 80D',
    'Medical Bills for parents for senior citizen - 80D'
  ],
  'Section 80DD - Maintenance of Disabled Dependents': ['Treatment of dependent with disability', 'Treatment of dependent with severe disability'],
  'Section 80DDB - Medical Treatment for Specified Diseases': [
    'Medical expenditure for self or dependent - 80DDB',
    'Medical expenditure for self or dependent for senior citizen - 80DDB',
    'Medical expenditure for self or dependent for very senior citizen - 80DDB'
  ],
  'Section 80GGC - Political Donations': ['Donation for political party']
};

// Predefined reimbursement types
const REIMBURSEMENT_TYPES = [
  'Club Reimbursement',
  'Entertainment Reimbursement',
  'Gadget Reimbursement',
  'Books and Periodicals Reimbursement',
  'Business Development Expense Reimbursement',
  'Helper Reimbursement',
  'Children Education Reimbursement',
  'Hostel Expenditure Reimbursement',
  'Research Reimbursement',
  'Uniform Reimbursement',
  'Internet Reimbursement'
];

const SalaryComponents = () => {
  const [activeTab, setActiveTab] = useState('earnings');
  const [components, setComponents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editingComponent, setEditingComponent] = useState(null);
  const [componentToDelete, setComponentToDelete] = useState(null);
  const [componentTypes, setComponentTypes] = useState([]);
  const [benefitAssociations, setBenefitAssociations] = useState([]);
  
  const [formData, setFormData] = useState({
    component_type: '',
    component_name: '',
    name_in_payslip: '',
    is_variable: false,
    calculation_type: 'flat_amount',
    amount_value: 0,
    is_active: true,
    part_of_salary_structure: true,
    is_taxable: false,
    calculate_on_pro_rata: false,
    is_scheduled_earning: false,
    tax_deduction_preference: 'subsequent_payrolls',
    include_in_fbp: false,
    consider_for_epf: false,
    epf_contribution_rule: 'always',
    pf_wage_threshold: 15000,
    consider_for_esi: false,
    show_in_payslip: true,
    // Deduction specific
    deduction_frequency: 'one_time',
    // Benefits specific
    benefit_plan: '',
    benefit_association: '',
    include_employer_contribution: false,
    is_superannuation_fund: false,
    // Reimbursements specific
    unclaimed_handling: 'carry_forward',
    amount_per_month: 0
  });

  useEffect(() => {
    fetchComponents(activeTab);
    fetchComponentTypes(activeTab);
  }, [activeTab]);

  const fetchComponents = async (category) => {
    setLoading(true);
    try {
      const response = await axios.get(`${API}/salary-components?category=${category}`);
      setComponents(response.data.components || []);
    } catch (error) {
      console.error('Error fetching components:', error);
      toast.error('Failed to load salary components');
    } finally {
      setLoading(false);
    }
  };

  const fetchComponentTypes = async (category) => {
    try {
      const response = await axios.get(`${API}/salary-components/types/${category}`);
      setComponentTypes(response.data.types || []);
    } catch (error) {
      console.error('Error fetching component types:', error);
    }
  };

  const handleOpenDialog = (component = null) => {
    if (component) {
      setEditingComponent(component);
      setFormData({ ...component });
    } else {
      setEditingComponent(null);
      resetForm();
    }
    setIsDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({
      component_type: '',
      component_name: '',
      name_in_payslip: '',
      is_variable: false,
      calculation_type: 'flat_amount',
      amount_value: 0,
      is_active: true,
      part_of_salary_structure: true,
      is_taxable: false,
      calculate_on_pro_rata: false,
      is_scheduled_earning: false,
      tax_deduction_preference: 'subsequent_payrolls',
      include_in_fbp: false,
      consider_for_epf: false,
      epf_contribution_rule: 'always',
      pf_wage_threshold: 15000,
      consider_for_esi: false,
      show_in_payslip: true,
      deduction_frequency: 'one_time',
      benefit_plan: '',
      benefit_association: '',
      include_employer_contribution: false,
      is_superannuation_fund: false,
      unclaimed_handling: 'carry_forward',
      amount_per_month: 0
    });
    setBenefitAssociations([]);
  };

  const handleSave = async () => {
    // Basic validation
    if (!formData.name_in_payslip) {
      toast.error('Please fill in Name in Payslip');
      return;
    }

    // Category-specific validation
    if (activeTab === 'earnings' && !formData.component_type) {
      toast.error('Please select component type');
      return;
    }

    try {
      const payload = {
        ...formData,
        category: activeTab
      };
      // Strip deprecated amount fields from payload
      delete payload.amount_value;
      delete payload.amount_per_month;

      if (editingComponent) {
        await axios.put(`${API}/salary-components/${editingComponent.component_id}`, payload);
        toast.success('Component updated successfully');
      } else {
        await axios.post(`${API}/salary-components`, payload);
        toast.success('Component created successfully');
      }

      setIsDialogOpen(false);
      fetchComponents(activeTab);
      fetchComponentTypes(activeTab);
    } catch (error) {
      console.error('Error saving component:', error);
      toast.error(error.response?.data?.detail || 'Failed to save component');
    }
  };

  const handleDelete = async () => {
    if (!componentToDelete) return;

    try {
      await axios.delete(`${API}/salary-components/${componentToDelete.component_id}`);
      toast.success('Component deleted successfully');
      setIsDeleteDialogOpen(false);
      setComponentToDelete(null);
      fetchComponents(activeTab);
    } catch (error) {
      console.error('Error deleting component:', error);
      toast.error(error.response?.data?.detail || 'Failed to delete component');
    }
  };

  const filteredComponents = components.filter(c =>
    c.component_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.component_type?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.name_in_payslip?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getCategoryLabel = (category) => {
    const labels = {
      earnings: 'Earnings',
      deductions: 'Deductions',
      benefits: 'Benefits',
      reimbursements: 'Reimbursements'
    };
    return labels[category] || category;
  };

  // Render form based on active tab
  const renderFormFields = () => {
    switch (activeTab) {
      case 'earnings':
        return renderEarningsForm();
      case 'deductions':
        return renderDeductionsForm();
      case 'benefits':
        return renderBenefitsForm();
      case 'reimbursements':
        return renderReimbursementsForm();
      default:
        return null;
    }
  };

  const renderEarningsForm = () => (
    <div className="grid grid-cols-2 gap-6 py-4">
      {/* Left Column */}
      <div className="space-y-4">
        <div>
          <Label htmlFor="component_type">Component Type *</Label>
          <Select
            value={formData.component_type}
            onValueChange={(value) => setFormData({ ...formData, component_type: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select type" />
            </SelectTrigger>
            <SelectContent>
              {componentTypes.map((type) => (
                <SelectItem key={type} value={type}>{type}</SelectItem>
              ))}
              <SelectItem value="__custom__">+ Add Custom Type</SelectItem>
            </SelectContent>
          </Select>
          {formData.component_type === '__custom__' && (
            <Input
              placeholder="Enter custom type"
              className="mt-2"
              onChange={(e) => setFormData({ ...formData, component_type: e.target.value })}
            />
          )}
        </div>

        <div>
          <Label htmlFor="component_name">Component Name *</Label>
          <Input
            id="component_name"
            value={formData.component_name}
            onChange={(e) => setFormData({ ...formData, component_name: e.target.value })}
            placeholder="e.g., Monthly HRA"
          />
        </div>

        <div>
          <Label htmlFor="name_in_payslip">Name in Payslip *</Label>
          <Input
            id="name_in_payslip"
            value={formData.name_in_payslip}
            onChange={(e) => setFormData({ ...formData, name_in_payslip: e.target.value })}
            placeholder="e.g., House Rent Allowance"
          />
        </div>

        <div className="flex items-center space-x-2">
          <Checkbox
            id="is_variable"
            checked={formData.is_variable}
            onCheckedChange={(checked) => setFormData({ ...formData, is_variable: checked })}
          />
          <Label htmlFor="is_variable" className="font-normal">
            This is a variable earning (e.g., Bonus, Commission)
          </Label>
        </div>

        {!formData.is_variable && (
          <div>
            <Label>Calculation Type *</Label>
            <RadioGroup
              value={formData.calculation_type}
              onValueChange={(value) => setFormData({ ...formData, calculation_type: value })}
              className="mt-2"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="flat_amount" id="flat_amount" />
                <Label htmlFor="flat_amount" className="font-normal">Flat Amount</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="percentage_of_ctc" id="percentage_of_ctc" />
                <Label htmlFor="percentage_of_ctc" className="font-normal">Percentage of CTC</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="percentage_of_basic" id="percentage_of_basic" />
                <Label htmlFor="percentage_of_basic" className="font-normal">Percentage of Basic</Label>
              </div>
            </RadioGroup>
          </div>
        )}

        <div className="flex items-center space-x-2">
          <Checkbox
            id="is_active"
            checked={formData.is_active}
            onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
          />
          <Label htmlFor="is_active" className="font-normal">
            Mark this as Active
          </Label>
        </div>
      </div>

      {/* Right Column - Other Configurations */}
      <div className="space-y-4">
        <h3 className="font-semibold text-lg">Other Configurations</h3>

        <div className="space-y-3">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="part_of_salary_structure"
              checked={formData.part_of_salary_structure}
              onCheckedChange={(checked) => setFormData({ ...formData, part_of_salary_structure: checked })}
            />
            <Label htmlFor="part_of_salary_structure" className="font-normal">
              Make this a part of the employee's salary structure
            </Label>
          </div>

          <div className="flex items-start space-x-2">
            <Checkbox
              id="is_taxable"
              checked={formData.is_taxable}
              onCheckedChange={(checked) => setFormData({ ...formData, is_taxable: checked })}
            />
            <div>
              <Label htmlFor="is_taxable" className="font-normal">
                This is a taxable earning
              </Label>
              <p className="text-xs text-gray-500 mt-1">
                The income tax amount will be divided equally and deducted every month across the financial year.
              </p>
            </div>
          </div>

          {formData.is_taxable && formData.is_variable && (
            <div className="ml-6 space-y-2">
              <Label>Tax Deduction Preference</Label>
              <RadioGroup
                value={formData.tax_deduction_preference}
                onValueChange={(value) => setFormData({ ...formData, tax_deduction_preference: value })}
              >
                <div className="flex items-start space-x-2">
                  <RadioGroupItem value="subsequent_payrolls" id="subsequent_payrolls" />
                  <div>
                    <Label htmlFor="subsequent_payrolls" className="font-normal">
                      Deduct tax in subsequent payrolls of the financial year
                    </Label>
                    <p className="text-xs text-gray-500 mt-1">
                      The income tax amount will be divided equally and deducted every month.
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-2">
                  <RadioGroupItem value="same_payroll" id="same_payroll" />
                  <div>
                    <Label htmlFor="same_payroll" className="font-normal">
                      Deduct tax in same payroll
                    </Label>
                    <p className="text-xs text-gray-500 mt-1">
                      The entire income tax amount will be deducted when it is paid.
                    </p>
                  </div>
                </div>
              </RadioGroup>
            </div>
          )}

          <div className="flex items-start space-x-2">
            <Checkbox
              id="calculate_on_pro_rata"
              checked={formData.calculate_on_pro_rata}
              onCheckedChange={(checked) => setFormData({ ...formData, calculate_on_pro_rata: checked })}
            />
            <div>
              <Label htmlFor="calculate_on_pro_rata" className="font-normal">
                Calculate on pro-rata basis
              </Label>
              <p className="text-xs text-gray-500 mt-1">
                Pay will be adjusted based on employee working days.
              </p>
            </div>
          </div>

          {formData.is_variable && (
            <div className="flex items-center space-x-2">
              <Checkbox
                id="is_scheduled_earning"
                checked={formData.is_scheduled_earning}
                onCheckedChange={(checked) => setFormData({ ...formData, is_scheduled_earning: checked })}
              />
              <Label htmlFor="is_scheduled_earning" className="font-normal">
                This is a scheduled earning
              </Label>
            </div>
          )}

          <div className="flex items-start space-x-2">
            <Checkbox
              id="include_in_fbp"
              checked={formData.include_in_fbp}
              onCheckedChange={(checked) => setFormData({ ...formData, include_in_fbp: checked })}
            />
            <div>
              <Label htmlFor="include_in_fbp" className="font-normal">
                Include this as a Flexible Benefit Plan component
              </Label>
              <p className="text-xs text-gray-500 mt-1">
                FBP allows employees to personalize their salary structure.
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="consider_for_epf"
                checked={formData.consider_for_epf}
                onCheckedChange={(checked) => setFormData({ ...formData, consider_for_epf: checked })}
              />
              <Label htmlFor="consider_for_epf" className="font-normal">
                Consider for EPF Contribution
              </Label>
            </div>

            {formData.consider_for_epf && (
              <RadioGroup
                value={formData.epf_contribution_rule}
                onValueChange={(value) => setFormData({ ...formData, epf_contribution_rule: value })}
                className="ml-6"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="always" id="epf_always" />
                  <Label htmlFor="epf_always" className="font-normal">Always</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="conditional" id="epf_conditional" />
                  <Label htmlFor="epf_conditional" className="font-normal">
                    Only when PF Wage is less than ₹15,000
                  </Label>
                </div>
              </RadioGroup>
            )}
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="consider_for_esi"
              checked={formData.consider_for_esi}
              onCheckedChange={(checked) => setFormData({ ...formData, consider_for_esi: checked })}
            />
            <Label htmlFor="consider_for_esi" className="font-normal">
              Consider for ESI Contribution
            </Label>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="show_in_payslip"
              checked={formData.show_in_payslip}
              onCheckedChange={(checked) => setFormData({ ...formData, show_in_payslip: checked })}
            />
            <Label htmlFor="show_in_payslip" className="font-normal">
              Show this component in payslip
            </Label>
          </div>
        </div>
      </div>
    </div>
  );

  const renderDeductionsForm = () => (
    <div className="space-y-4 py-4">
      <div>
        <Label htmlFor="name_in_payslip">Name in Payslip *</Label>
        <Input
          id="name_in_payslip"
          value={formData.name_in_payslip}
          onChange={(e) => setFormData({ ...formData, name_in_payslip: e.target.value })}
          placeholder="e.g., Provident Fund Deduction"
        />
      </div>

      <div>
        <Label>Select the deduction frequency *</Label>
        <RadioGroup
          value={formData.deduction_frequency}
          onValueChange={(value) => setFormData({ ...formData, deduction_frequency: value })}
          className="mt-2"
        >
          <div className="flex items-start space-x-2">
            <RadioGroupItem value="one_time" id="one_time" />
            <div>
              <Label htmlFor="one_time" className="font-normal">One-time deduction</Label>
              <p className="text-xs text-gray-500 mt-1">
                The deduction will only be applied once.
              </p>
            </div>
          </div>
          <div className="flex items-start space-x-2">
            <RadioGroupItem value="recurring" id="recurring" />
            <div>
              <Label htmlFor="recurring" className="font-normal">Recurring deduction for subsequent Payrolls</Label>
              <p className="text-xs text-gray-500 mt-1">
                The deduction will be applied in every payroll cycle going forward.
              </p>
            </div>
          </div>
        </RadioGroup>
      </div>

      <div className="flex items-center space-x-2">
        <Checkbox
          id="is_active"
          checked={formData.is_active}
          onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
        />
        <Label htmlFor="is_active" className="font-normal">
          Mark this as Active
        </Label>
      </div>
    </div>
  );

  const renderBenefitsForm = () => (
    <div className="space-y-4 py-4">
      <div>
        <Label htmlFor="benefit_plan">Benefit Plan *</Label>
        <Select
          value={formData.benefit_plan}
          onValueChange={(value) => {
            setFormData({ ...formData, benefit_plan: value, benefit_association: '' });
            setBenefitAssociations(BENEFIT_PLANS[value] || []);
          }}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select benefit plan" />
          </SelectTrigger>
          <SelectContent>
            {Object.keys(BENEFIT_PLANS).map((plan) => (
              <SelectItem key={plan} value={plan}>{plan}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {formData.benefit_plan && (
        <div>
          <Label htmlFor="benefit_association">Associate this benefit with *</Label>
          <Select
            value={formData.benefit_association}
            onValueChange={(value) => setFormData({ ...formData, benefit_association: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select association" />
            </SelectTrigger>
            <SelectContent>
              {benefitAssociations.map((assoc) => (
                <SelectItem key={assoc} value={assoc}>{assoc}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      <div>
        <Label htmlFor="name_in_payslip">Name in Payslip *</Label>
        <Input
          id="name_in_payslip"
          value={formData.name_in_payslip}
          onChange={(e) => setFormData({ ...formData, name_in_payslip: e.target.value })}
          placeholder="e.g., LIC Premium"
        />
      </div>

      <div className="flex items-start space-x-2">
        <Checkbox
          id="include_employer_contribution"
          checked={formData.include_employer_contribution}
          onCheckedChange={(checked) => setFormData({ ...formData, include_employer_contribution: checked })}
        />
        <div>
          <Label htmlFor="include_employer_contribution" className="font-normal">
            Include employer's contribution in employee's salary structure
          </Label>
          <p className="text-xs text-gray-500 mt-1">
            Enable this if employer contributions should be part of CTC.
          </p>
        </div>
      </div>

      <div className="flex items-center space-x-2">
        <Checkbox
          id="is_superannuation_fund"
          checked={formData.is_superannuation_fund}
          onCheckedChange={(checked) => setFormData({ ...formData, is_superannuation_fund: checked })}
        />
        <Label htmlFor="is_superannuation_fund" className="font-normal">
          Consider this a superannuation fund
        </Label>
      </div>

      <div className="flex items-start space-x-2">
        <Checkbox
          id="calculate_on_pro_rata"
          checked={formData.calculate_on_pro_rata}
          onCheckedChange={(checked) => setFormData({ ...formData, calculate_on_pro_rata: checked })}
        />
        <div>
          <Label htmlFor="calculate_on_pro_rata" className="font-normal">
            Calculate on pro-rata basis
          </Label>
          <p className="text-xs text-gray-500 mt-1">
            Benefit will be adjusted based on employee working days.
          </p>
        </div>
      </div>

      <div className="flex items-center space-x-2">
        <Checkbox
          id="is_active"
          checked={formData.is_active}
          onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
        />
        <Label htmlFor="is_active" className="font-normal">
          Mark this as Active
        </Label>
      </div>
    </div>
  );

  const renderReimbursementsForm = () => (
    <div className="space-y-4 py-4">
      <div>
        <Label htmlFor="component_type">Reimbursement Type *</Label>
        <Select
          value={formData.component_type}
          onValueChange={(value) => setFormData({ ...formData, component_type: value })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select reimbursement type" />
          </SelectTrigger>
          <SelectContent>
            {REIMBURSEMENT_TYPES.map((type) => (
              <SelectItem key={type} value={type}>{type}</SelectItem>
            ))}
            <SelectItem value="__custom__">+ Add Custom Reimbursement</SelectItem>
          </SelectContent>
        </Select>
        {formData.component_type === '__custom__' && (
          <Input
            placeholder="Enter custom reimbursement type"
            className="mt-2"
            onChange={(e) => setFormData({ ...formData, component_type: e.target.value })}
          />
        )}
      </div>

      <div>
        <Label htmlFor="name_in_payslip">Name in Payslip *</Label>
        <Input
          id="name_in_payslip"
          value={formData.name_in_payslip}
          onChange={(e) => setFormData({ ...formData, name_in_payslip: e.target.value })}
          placeholder="e.g., Travel Reimbursement"
        />
      </div>

      <div className="flex items-start space-x-2">
        <Checkbox
          id="include_in_fbp"
          checked={formData.include_in_fbp}
          onCheckedChange={(checked) => setFormData({ ...formData, include_in_fbp: checked })}
        />
        <div>
          <Label htmlFor="include_in_fbp" className="font-normal">
            Include this as a Flexible Benefit Plan component
          </Label>
          <p className="text-xs text-gray-500 mt-1">
            FBP allows employees to customize their reimbursements.
          </p>
        </div>
      </div>

      <div>
        <Label>How to handle unclaimed reimbursement? *</Label>
        <RadioGroup
          value={formData.unclaimed_handling}
          onValueChange={(value) => setFormData({ ...formData, unclaimed_handling: value })}
          className="mt-2"
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="carry_forward" id="carry_forward" />
            <Label htmlFor="carry_forward" className="font-normal">Carry forward to the next payroll</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="do_not_carry_forward" id="do_not_carry_forward" />
            <Label htmlFor="do_not_carry_forward" className="font-normal">Do not carry forward</Label>
          </div>
        </RadioGroup>
      </div>

      {/* Removed per-month amount entry; amounts are set per employee/usage */}

      <div className="flex items-center space-x-2">
        <Checkbox
          id="is_active"
          checked={formData.is_active}
          onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
        />
        <Label htmlFor="is_active" className="font-normal">
          Mark this as Active
        </Label>
      </div>
    </div>
  );

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Salary Components</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Configure earnings, deductions, benefits, and reimbursements
          </p>
        </div>
        <Button onClick={() => handleOpenDialog()} className="bg-primary hover:bg-primary/90">
          <Plus className="w-4 h-4 mr-2" />
          Add Component
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="border-b border-gray-200 dark:border-gray-700 mb-6">
          <TabsList className="flex justify-start space-x-8 bg-transparent h-auto p-0">
            <TabsTrigger 
              value="earnings"
              className="relative pb-3 text-sm font-medium transition-all duration-500 ease-in-out data-[state=active]:text-blue-600 data-[state=inactive]:text-gray-600 dark:data-[state=active]:text-blue-400 dark:data-[state=inactive]:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 border-b-2 border-transparent data-[state=active]:border-blue-600 dark:data-[state=active]:border-blue-400 rounded-none bg-transparent"
            >
              Earnings
            </TabsTrigger>
            <TabsTrigger 
              value="deductions"
              className="relative pb-3 text-sm font-medium transition-all duration-500 ease-in-out data-[state=active]:text-blue-600 data-[state=inactive]:text-gray-600 dark:data-[state=active]:text-blue-400 dark:data-[state=inactive]:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 border-b-2 border-transparent data-[state=active]:border-blue-600 dark:data-[state=active]:border-blue-400 rounded-none bg-transparent"
            >
              Deductions
            </TabsTrigger>
            <TabsTrigger 
              value="benefits"
              className="relative pb-3 text-sm font-medium transition-all duration-500 ease-in-out data-[state=active]:text-blue-600 data-[state=inactive]:text-gray-600 dark:data-[state=active]:text-blue-400 dark:data-[state=inactive]:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 border-b-2 border-transparent data-[state=active]:border-blue-600 dark:data-[state=active]:border-blue-400 rounded-none bg-transparent"
            >
              Benefits
            </TabsTrigger>
            <TabsTrigger 
              value="reimbursements"
              className="relative pb-3 text-sm font-medium transition-all duration-500 ease-in-out data-[state=active]:text-blue-600 data-[state=inactive]:text-gray-600 dark:data-[state=active]:text-blue-400 dark:data-[state=inactive]:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 border-b-2 border-transparent data-[state=active]:border-blue-600 dark:data-[state=active]:border-blue-400 rounded-none bg-transparent"
            >
              Reimbursements
            </TabsTrigger>
          </TabsList>
        </div>

        {['earnings', 'deductions', 'benefits', 'reimbursements'].map((category) => (
          <TabsContent key={category} value={category}>
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>{getCategoryLabel(category)}</CardTitle>
                    <CardDescription>
                      Manage {category} components for your payroll system
                    </CardDescription>
                  </div>
                  <div className="w-72">
                    <Input
                      placeholder="Search components..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full"
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="text-center py-8">Loading...</div>
                ) : filteredComponents.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    No {category} components found. Add your first component to get started.
                  </div>
                ) : (
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Name in Payslip</TableHead>
                          {category === 'earnings' && <TableHead>Type</TableHead>}
                          {category === 'earnings' && <TableHead>Calculation</TableHead>}
                          {category === 'benefits' && <TableHead>Benefit Plan</TableHead>}
                          {category === 'reimbursements' && <TableHead>Type</TableHead>}
                          <TableHead>Status</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredComponents.map((component) => (
                          <TableRow key={component.component_id}>
                            <TableCell className="font-medium">{component.name_in_payslip}</TableCell>
                            {category === 'earnings' && <TableCell>{component.component_type}</TableCell>}
                            {category === 'earnings' && (
                              <TableCell>
                                {component.is_variable ? (
                                  <Badge variant="outline">Variable</Badge>
                                ) : (
                                  <>
                                    {component.calculation_type === 'flat_amount' && `Flat Amount`}
                                    {component.calculation_type === 'percentage_of_ctc' && `Percentage of CTC`}
                                    {component.calculation_type === 'percentage_of_basic' && `Percentage of Basic`}
                                  </>
                                )}
                              </TableCell>
                            )}
                            {category === 'benefits' && <TableCell>{component.benefit_plan}</TableCell>}
                            {category === 'reimbursements' && <TableCell>{component.component_type}</TableCell>}
                            <TableCell>
                              {component.is_active ? (
                                <Badge variant="success" className="bg-green-100 text-green-800">Active</Badge>
                              ) : (
                                <Badge variant="secondary">Inactive</Badge>
                              )}
                            </TableCell>
                            <TableCell className="text-right">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleOpenDialog(component)}
                                className="mr-2"
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setComponentToDelete(component);
                                  setIsDeleteDialogOpen(true);
                                }}
                                className="text-red-600 hover:text-red-700"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>

      {/* Add/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingComponent ? 'Edit' : 'New'} {getCategoryLabel(activeTab)}</DialogTitle>
            <DialogDescription>
              Configure the component details and settings
            </DialogDescription>
          </DialogHeader>

          {renderFormFields()}

          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mt-4">
            <div className="flex items-start">
              <Info className="w-5 h-5 text-amber-600 mr-2 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-amber-800">
                <strong>Note:</strong> Once you associate this component with an employee, you will only be able to edit the Name in Payslip. The changes you make will apply only to new employees.
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} className="bg-primary hover:bg-primary/90">
              {editingComponent ? 'Update' : 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the component "{componentToDelete?.name_in_payslip}". 
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default SalaryComponents;
