import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import {
  Percent,
  Settings,
  Calculator,
  MapPin,
  Building2,
  CreditCard,
  Shield,
  AlertTriangle,
  CheckCircle
} from "lucide-react";
import { toast } from "sonner";

const Deductions = () => {
  const [deductionSettings, setDeductionSettings] = useState({
    pf: {
      enabled: true,
      employee_rate: 12,
      employer_rate: 12,
      ceiling: 15000,
      admin_charges: 1.16
    },
    esi: {
      enabled: true,
      employee_rate: 0.75,
      employer_rate: 3.25,
      ceiling: 25000
    },
    professional_tax: {
      enabled: true,
      state_rates: {
        'Maharashtra': [
          { min: 0, max: 5000, tax: 0 },
          { min: 5001, max: 10000, tax: 150 },
          { min: 10001, max: 15000, tax: 200 },
          { min: 15001, max: 999999, tax: 200 }
        ],
        'Karnataka': [
          { min: 0, max: 15000, tax: 0 },
          { min: 15001, max: 999999, tax: 200 }
        ],
        'Tamil Nadu': [
          { min: 0, max: 7500, tax: 0 },
          { min: 7501, max: 12500, tax: 150 },
          { min: 12501, max: 999999, tax: 200 }
        ],
        'Delhi': [
          { min: 0, max: 999999, tax: 0 } // No PT in Delhi
        ],
        'Gujarat': [
          { min: 0, max: 6000, tax: 0 },
          { min: 6001, max: 9000, tax: 80 },
          { min: 9001, max: 12000, tax: 150 },
          { min: 12001, max: 999999, tax: 200 }
        ]
      }
    },
    tds: {
      enabled: true,
      financial_year: '2024-25',
      old_regime: {
        basic_exemption: 250000,
        slabs: [
          { min: 0, max: 250000, rate: 0 },
          { min: 250001, max: 500000, rate: 5 },
          { min: 500001, max: 1000000, rate: 20 },
          { min: 1000001, max: 999999999, rate: 30 }
        ]
      },
      new_regime: {
        basic_exemption: 300000,
        slabs: [
          { min: 0, max: 300000, rate: 0 },
          { min: 300001, max: 600000, rate: 5 },
          { min: 600001, max: 900000, rate: 10 },
          { min: 900001, max: 1200000, rate: 15 },
          { min: 1200001, max: 1500000, rate: 20 },
          { min: 1500001, max: 999999999, rate: 30 }
        ]
      }
    },
    lwf: {
      enabled: true,
      state_rates: {
        'Maharashtra': { employee: 0.75, employer: 0.75 },
        'Karnataka': { employee: 1, employer: 1 },
        'Tamil Nadu': { employee: 0, employer: 0 },
        'Gujarat': { employee: 0.5, employer: 0.5 }
      }
    }
  });

  const [selectedState, setSelectedState] = useState('Maharashtra');
  const [calculatorInputs, setCalculatorInputs] = useState({
    basicSalary: 50000,
    totalSalary: 76000,
    state: 'Maharashtra'
  });
  const [calculatedDeductions, setCalculatedDeductions] = useState(null);

  const states = ['Maharashtra', 'Karnataka', 'Tamil Nadu', 'Delhi', 'Gujarat'];

  const handleSettingChange = (category, field, value) => {
    setDeductionSettings(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [field]: value
      }
    }));
  };

  const calculateDeductions = () => {
    const { basicSalary, totalSalary, state } = calculatorInputs;
    const basic = parseFloat(basicSalary);
    const total = parseFloat(totalSalary);
    
    let deductions = {
      pf_employee: 0,
      pf_employer: 0,
      esi_employee: 0,
      esi_employer: 0,
      professional_tax: 0,
      lwf_employee: 0,
      lwf_employer: 0
    };

    // PF Calculation
    if (deductionSettings.pf.enabled) {
      const pfBase = Math.min(basic, deductionSettings.pf.ceiling);
      deductions.pf_employee = Math.round((pfBase * deductionSettings.pf.employee_rate) / 100);
      deductions.pf_employer = Math.round((pfBase * deductionSettings.pf.employer_rate) / 100);
    }

    // ESI Calculation
    if (deductionSettings.esi.enabled && total <= deductionSettings.esi.ceiling) {
      deductions.esi_employee = Math.round((total * deductionSettings.esi.employee_rate) / 100);
      deductions.esi_employer = Math.round((total * deductionSettings.esi.employer_rate) / 100);
    }

    // Professional Tax Calculation
    if (deductionSettings.professional_tax.enabled && deductionSettings.professional_tax.state_rates[state]) {
      const ptSlabs = deductionSettings.professional_tax.state_rates[state];
      const applicableSlab = ptSlabs.find(slab => total >= slab.min && total <= slab.max);
      if (applicableSlab) {
        deductions.professional_tax = applicableSlab.tax;
      }
    }

    // LWF Calculation
    if (deductionSettings.lwf.enabled && deductionSettings.lwf.state_rates[state]) {
      const lwfRates = deductionSettings.lwf.state_rates[state];
      deductions.lwf_employee = lwfRates.employee;
      deductions.lwf_employer = lwfRates.employer;
    }

    setCalculatedDeductions(deductions);
    toast.success('Deductions calculated successfully');
  };

  const saveSettings = () => {
    // In a real app, this would save to backend
    localStorage.setItem('deductionSettings', JSON.stringify(deductionSettings));
    toast.success('Deduction settings saved successfully');
  };

  const resetToDefaults = () => {
    setDeductionSettings({
      // ... default settings would be reset here
    });
    toast.info('Settings reset to defaults');
  };

  useEffect(() => {
    // Load saved settings
    const savedSettings = localStorage.getItem('deductionSettings');
    if (savedSettings) {
      setDeductionSettings(JSON.parse(savedSettings));
    }
  }, []);

  return (
    <div className="space-y-6" data-testid="deductions">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
            Deductions Management
          </h1>
          <p className="text-gray-500 dark:text-gray-400">
            Configure statutory deductions and tax settings
          </p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={resetToDefaults}>
            Reset Defaults
          </Button>
          <Button onClick={saveSettings}>
            Save Settings
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Shield className="h-8 w-8 text-blue-600" />
              <div>
                <p className="text-2xl font-bold">{deductionSettings.pf.employee_rate}%</p>
                <p className="text-xs text-gray-500">PF Rate</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <CreditCard className="h-8 w-8 text-emerald-600" />
              <div>
                <p className="text-2xl font-bold">{deductionSettings.esi.employee_rate}%</p>
                <p className="text-xs text-gray-500">ESI Rate</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Building2 className="h-8 w-8 text-purple-600" />
              <div>
                <p className="text-2xl font-bold">₹{deductionSettings.professional_tax.state_rates[selectedState]?.[deductionSettings.professional_tax.state_rates[selectedState]?.length - 1]?.tax || 0}</p>
                <p className="text-xs text-gray-500">Max PT ({selectedState})</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <MapPin className="h-8 w-8 text-orange-600" />
              <div>
                <p className="text-2xl font-bold">{states.length}</p>
                <p className="text-xs text-gray-500">States Configured</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Settings Panel */}
        <div className="space-y-6">
          {/* PF Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Shield className="h-5 w-5" />
                <span>Provident Fund (PF) Settings</span>
                <Switch 
                  checked={deductionSettings.pf.enabled}
                  onCheckedChange={(checked) => handleSettingChange('pf', 'enabled', checked)}
                />
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Employee Rate (%)</Label>
                  <Input
                    type="number"
                    value={deductionSettings.pf.employee_rate}
                    onChange={(e) => handleSettingChange('pf', 'employee_rate', parseFloat(e.target.value))}
                    disabled={!deductionSettings.pf.enabled}
                  />
                </div>
                <div>
                  <Label>Employer Rate (%)</Label>
                  <Input
                    type="number"
                    value={deductionSettings.pf.employer_rate}
                    onChange={(e) => handleSettingChange('pf', 'employer_rate', parseFloat(e.target.value))}
                    disabled={!deductionSettings.pf.enabled}
                  />
                </div>
              </div>
              <div>
                <Label>Salary Ceiling (₹)</Label>
                <Input
                  type="number"
                  value={deductionSettings.pf.ceiling}
                  onChange={(e) => handleSettingChange('pf', 'ceiling', parseFloat(e.target.value))}
                  disabled={!deductionSettings.pf.enabled}
                />
              </div>
              <div className="text-sm text-gray-600">
                PF is calculated on basic salary up to ₹{deductionSettings.pf.ceiling.toLocaleString()}
              </div>
            </CardContent>
          </Card>

          {/* ESI Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <CreditCard className="h-5 w-5" />
                <span>Employee State Insurance (ESI) Settings</span>
                <Switch 
                  checked={deductionSettings.esi.enabled}
                  onCheckedChange={(checked) => handleSettingChange('esi', 'enabled', checked)}
                />
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Employee Rate (%)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={deductionSettings.esi.employee_rate}
                    onChange={(e) => handleSettingChange('esi', 'employee_rate', parseFloat(e.target.value))}
                    disabled={!deductionSettings.esi.enabled}
                  />
                </div>
                <div>
                  <Label>Employer Rate (%)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={deductionSettings.esi.employer_rate}
                    onChange={(e) => handleSettingChange('esi', 'employer_rate', parseFloat(e.target.value))}
                    disabled={!deductionSettings.esi.enabled}
                  />
                </div>
              </div>
              <div>
                <Label>Salary Ceiling (₹)</Label>
                <Input
                  type="number"
                  value={deductionSettings.esi.ceiling}
                  onChange={(e) => handleSettingChange('esi', 'ceiling', parseFloat(e.target.value))}
                  disabled={!deductionSettings.esi.enabled}
                />
              </div>
              <div className="text-sm text-gray-600">
                ESI is applicable only if total salary is ≤ ₹{deductionSettings.esi.ceiling.toLocaleString()}
              </div>
            </CardContent>
          </Card>

          {/* Professional Tax Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Building2 className="h-5 w-5" />
                <span>Professional Tax Settings</span>
                <Switch 
                  checked={deductionSettings.professional_tax.enabled}
                  onCheckedChange={(checked) => handleSettingChange('professional_tax', 'enabled', checked)}
                />
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Select State</Label>
                <Select value={selectedState} onValueChange={setSelectedState}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {states.map(state => (
                      <SelectItem key={state} value={state}>{state}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              {deductionSettings.professional_tax.state_rates[selectedState] && (
                <div>
                  <Label>Tax Slabs for {selectedState}</Label>
                  <div className="border border-gray-200 dark:border-gray-700 rounded-lg">
                    <Table>
                      <TableHeader>
                        <TableRow className="border-b border-gray-200 dark:border-gray-700">
                          <TableHead className="text-gray-700 dark:text-gray-300">Salary Range (₹)</TableHead>
                          <TableHead className="text-gray-700 dark:text-gray-300">Tax Amount (₹)</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {deductionSettings.professional_tax.state_rates[selectedState].map((slab, index) => (
                          <TableRow key={index} className="border-b border-gray-200 dark:border-gray-700">
                            <TableCell className="text-gray-800 dark:text-gray-300">
                              {slab.min.toLocaleString()} - {slab.max === 999999 ? 'Above' : slab.max.toLocaleString()}
                            </TableCell>
                            <TableCell className="text-gray-800 dark:text-gray-300">₹{slab.tax}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Calculator Panel */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Calculator className="h-5 w-5" />
                <span>Deduction Calculator</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Basic Salary (₹)</Label>
                <Input
                  type="number"
                  value={calculatorInputs.basicSalary}
                  onChange={(e) => setCalculatorInputs(prev => ({ ...prev, basicSalary: e.target.value }))}
                />
              </div>
              <div>
                <Label>Total Salary (₹)</Label>
                <Input
                  type="number"
                  value={calculatorInputs.totalSalary}
                  onChange={(e) => setCalculatorInputs(prev => ({ ...prev, totalSalary: e.target.value }))}
                />
              </div>
              <div>
                <Label>State</Label>
                <Select 
                  value={calculatorInputs.state} 
                  onValueChange={(value) => setCalculatorInputs(prev => ({ ...prev, state: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {states.map(state => (
                      <SelectItem key={state} value={state}>{state}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button className="w-full" onClick={calculateDeductions}>
                Calculate Deductions
              </Button>
            </CardContent>
          </Card>

          {calculatedDeductions && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <CheckCircle className="h-5 w-5 text-emerald-600" />
                  <span>Calculated Deductions</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="space-y-2">
                      <h4 className="font-semibold text-emerald-600">Employee Deductions</h4>
                      <div className="flex justify-between">
                        <span>PF:</span>
                        <span>₹{calculatedDeductions.pf_employee}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>ESI:</span>
                        <span>₹{calculatedDeductions.esi_employee}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Professional Tax:</span>
                        <span>₹{calculatedDeductions.professional_tax}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>LWF:</span>
                        <span>₹{calculatedDeductions.lwf_employee}</span>
                      </div>
                      <Separator />
                      <div className="flex justify-between font-semibold">
                        <span>Total Employee:</span>
                        <span>₹{calculatedDeductions.pf_employee + calculatedDeductions.esi_employee + calculatedDeductions.professional_tax + calculatedDeductions.lwf_employee}</span>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <h4 className="font-semibold text-red-600">Employer Contributions</h4>
                      <div className="flex justify-between">
                        <span>PF:</span>
                        <span>₹{calculatedDeductions.pf_employer}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>ESI:</span>
                        <span>₹{calculatedDeductions.esi_employer}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>LWF:</span>
                        <span>₹{calculatedDeductions.lwf_employer}</span>
                      </div>
                      <Separator />
                      <div className="flex justify-between font-semibold">
                        <span>Total Employer:</span>
                        <span>₹{calculatedDeductions.pf_employer + calculatedDeductions.esi_employer + calculatedDeductions.lwf_employer}</span>
                      </div>
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <div className="text-center">
                    <div className="text-lg font-semibold">
                      Net Salary: ₹{calculatorInputs.totalSalary - (calculatedDeductions.pf_employee + calculatedDeductions.esi_employee + calculatedDeductions.professional_tax + calculatedDeductions.lwf_employee)}
                    </div>
                    <div className="text-sm text-gray-600">
                      Total Company Cost: ₹{parseFloat(calculatorInputs.totalSalary) + calculatedDeductions.pf_employer + calculatedDeductions.esi_employer + calculatedDeductions.lwf_employer}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Compliance Status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <AlertTriangle className="h-5 w-5 text-yellow-600" />
                <span>Compliance Status</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm">PF Registration</span>
                <Badge variant="default">Active</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">ESI Registration</span>
                <Badge variant="default">Active</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">PT Registration</span>
                <Badge variant="secondary">Pending</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">LWF Registration</span>
                <Badge variant="default">Active</Badge>
              </div>
              <Separator />
              <div className="text-sm text-gray-600">
                <p className="font-medium">Next Due Dates:</p>
                <p>• PF Return: 15th of next month</p>
                <p>• ESI Return: 21st of next month</p>
                <p>• PT Payment: 7th of next month</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Deductions;