import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Info } from 'lucide-react';

const TaxConfiguration = () => {
  const [activeTab, setActiveTab] = useState('epf');
  
  // Track enabled/disabled state for each component
  const [componentStates, setComponentStates] = useState({
    epf: false,
    esi: false,
    tds: false,
    professional_tax: false,
    lwf: false,
    statutory_bonus: false
  });

  const tabs = [
    { id: 'epf', label: 'EPF' },
    { id: 'esi', label: 'ESI' },
    { id: 'tds', label: 'TDS' },
    { id: 'professional_tax', label: 'Professional Tax' },
    { id: 'lwf', label: 'Labour Welfare Fund' },
    { id: 'statutory_bonus', label: 'Statutory Bonus' }
  ];

  const handleEnable = (component) => {
    setComponentStates({
      ...componentStates,
      [component]: true
    });
  };

  const handleDisable = (component) => {
    setComponentStates({
      ...componentStates,
      [component]: false
    });
  };

  const renderTabContent = () => {
    const isEnabled = componentStates[activeTab];
    
    // If disabled, show prompt
    if (!isEnabled) {
      return renderDisabledState();
    }
    
    // If enabled, show configuration form
    switch (activeTab) {
      case 'epf':
        return renderEPFContent();
      case 'esi':
        return renderESIContent();
      case 'tds':
        return renderTDSContent();
      case 'professional_tax':
        return renderProfessionalTaxContent();
      case 'lwf':
        return renderLWFContent();
      case 'statutory_bonus':
        return renderStatutoryBonusContent();
      default:
        return null;
    }
  };

  const renderDisabledState = () => {
    const prompts = {
      epf: {
        illustration: '🌱',
        title: 'Are you registered for EPF?',
        description: 'Any organisation with 20 or more employees must register for the Employee Provident Fund (EPF) scheme, a retirement benefit plan for all salaried employees.'
      },
      esi: {
        illustration: '🏥',
        title: 'Are you registered for ESI?',
        description: 'Any organisation with 10 or more employees must register for the Employee State Insurance (ESI) scheme. It is a multidimensional social security system for workers.'
      },
      tds: {
        illustration: '📄',
        title: 'Configure TDS',
        description: 'Tax Deducted at Source (TDS) is a means of collecting tax on income, dividends or asset sales by requiring the payer to deduct tax due before paying the balance to the payee.'
      },
      professional_tax: {
        illustration: '📋',
        title: 'Configure Professional Tax',
        description: 'Professional Tax is a tax levied by the state government on all types of professions, trades and employment. The tax amount varies by state.'
      },
      lwf: {
        illustration: '👷',
        title: 'Configure Labour Welfare Fund',
        description: 'Labour Welfare Fund is a statutory contribution for employee welfare activities. The contribution varies by state and is paid by both employer and employee.'
      },
      statutory_bonus: {
        illustration: '💰',
        title: 'Are your employees eligible to receive statutory bonus?',
        description: 'According to the Payment of Bonus Act, 1965, an eligible employee can receive a statutory bonus of 8.33% (min) to 20% (max) of their salary earned during a financial year. Configure statutory bonus of your organisation and start paying your employees.'
      }
    };

    const prompt = prompts[activeTab];

    return (
      <div className="flex flex-col items-center justify-center py-12">
        <div className="text-center max-w-2xl">
          <div className="mb-6">
            <div className="w-48 h-48 mx-auto bg-gradient-to-br from-blue-100 to-green-100 dark:from-blue-900 dark:to-green-900 rounded-full flex items-center justify-center">
              <span className="text-6xl">{prompt.illustration}</span>
            </div>
          </div>
          
          <h3 className="text-2xl font-semibold mb-4">
            {prompt.title}
          </h3>
          
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            {prompt.description}
          </p>
          
          <Button 
            onClick={() => handleEnable(activeTab)}
            className="bg-blue-600 hover:bg-blue-700"
          >
            Enable {tabs.find(t => t.id === activeTab)?.label}
          </Button>
        </div>
      </div>
    );
  };

  const renderEPFContent = () => (
    <div className="grid grid-cols-3 gap-6">
      {/* Left: Form Fields */}
      <div className="col-span-2 space-y-6">
        <div>
          <Label htmlFor="epf_number">EPF Number</Label>
          <Input
            id="epf_number"
            placeholder="A/AAA/00000000/XXX"
            className="mt-2"
          />
          <p className="text-xs text-gray-500 mt-1">Format: A/AAA/00000000/XXX</p>
        </div>

        <div>
          <Label htmlFor="deduction_cycle">
            Deduction Cycle 
            <Info className="inline w-4 h-4 ml-1 text-gray-400" />
          </Label>
          <Select defaultValue="monthly">
            <SelectTrigger className="mt-2">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="monthly">Monthly</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="employee_contribution">Employee Contribution Rate</Label>
          <Select defaultValue="12_actual">
            <SelectTrigger className="mt-2">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="12_actual">12% of Actual PF Wage</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="employer_contribution">Employer Contribution Rate</Label>
          <div className="flex items-center gap-2 mt-2">
            <Select defaultValue="12_actual" className="flex-1">
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="12_actual">12% of Actual PF Wage</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="link" className="text-blue-600">View Splitup</Button>
          </div>
        </div>

        <div className="space-y-4 pt-4">
          <div className="flex items-center space-x-2">
            <Checkbox id="include_employer_contribution" defaultChecked />
            <Label htmlFor="include_employer_contribution" className="font-normal">
              Include employer's contribution in employee's salary structure.
            </Label>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox id="include_edli" />
            <Label htmlFor="include_edli" className="font-normal">
              Include employer's EDLI contribution in employee's salary structure.
              <Info className="inline w-4 h-4 ml-1 text-gray-400" />
            </Label>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox id="include_admin_charges" />
            <Label htmlFor="include_admin_charges" className="font-normal">
              Include admin charges in employee's salary structure.
              <Info className="inline w-4 h-4 ml-1 text-gray-400" />
            </Label>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox id="override_pf" />
            <Label htmlFor="override_pf" className="font-normal">
              Override PF contribution rate at employee level.
            </Label>
          </div>
        </div>

        <div className="pt-4 border-t">
          <h3 className="font-semibold mb-4">PF Configuration when LOP Applied</h3>
          
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Checkbox id="pro_rate_pf" />
              <Label htmlFor="pro_rate_pf" className="font-normal">
                Pro-rate Restricted PF Wage
              </Label>
            </div>
            <p className="text-sm text-gray-600 ml-6">
              PF contribution will be pro-rated based on the number of days worked by the employee.
            </p>

            <div className="flex items-center space-x-2">
              <Checkbox id="consider_applicable" defaultChecked />
              <Label htmlFor="consider_applicable" className="font-normal">
                Consider all applicable salary components if PF wage is less than ₹15,000 after Loss of Pay.
              </Label>
            </div>
            <p className="text-sm text-gray-600 ml-6">
              PF wage will be computed using the salary earned in that particular month (based on LOP) rather than the actual amount mentioned in the salary structure.
            </p>
          </div>
        </div>

        <div className="flex gap-4 pt-6">
          <Button className="bg-emerald-600 hover:bg-emerald-700">Save</Button>
          <Button variant="outline">Cancel</Button>
          <Button 
            variant="destructive" 
            onClick={() => handleDisable('epf')}
            className="ml-auto"
          >
            Disable EPF
          </Button>
        </div>
      </div>

      {/* Right: Sample Calculation */}
      <div>
        <Card className="border-orange-300 border-2">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Sample EPF Calculation</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-gray-600">
              Let's assume the PF wage is ₹20,000. The breakup of contribution will be:
            </p>

            <div className="space-y-3 pt-4">
              <div>
                <p className="text-sm font-semibold mb-2">Employee's Contribution</p>
                <div className="flex justify-between text-sm">
                  <span>EPF (12% of 20000)</span>
                  <span>₹ 2,400</span>
                </div>
              </div>

              <div>
                <p className="text-sm font-semibold mb-2">Employer's Contribution</p>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span>EPS (8.33% of 20000, Max of ₹15000)</span>
                    <span>₹ 1,250</span>
                  </div>
                  <div className="flex justify-between">
                    <span>EPF (3.67 of 20000 - EPS)</span>
                    <span>₹ 1,150</span>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t">
                <div className="flex justify-between font-semibold">
                  <span>Total</span>
                  <span>₹ 4,800</span>
                </div>
              </div>
            </div>

            <div className="pt-4">
              <p className="text-xs text-gray-500">
                Do you want to preview EPF calculation for multiple cases, based on the preferences you have configured?
              </p>
              <Button variant="link" className="text-blue-600 p-0 h-auto mt-2">
                Preview EPF Calculation
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  const renderESIContent = () => (
    <div className="grid grid-cols-3 gap-6">
      {/* Left: Form Fields */}
      <div className="col-span-2 space-y-6">
        <div>
          <Label htmlFor="esi_number">ESI Number</Label>
          <Input
            id="esi_number"
            placeholder="00-00-000000-000-0000"
            className="mt-2"
          />
          <p className="text-xs text-gray-500 mt-1">Format: 00-00-000000-000-0000</p>
        </div>

        <div>
          <Label htmlFor="esi_deduction_cycle">
            Deduction Cycle 
            <Info className="inline w-4 h-4 ml-1 text-gray-400" />
          </Label>
          <Select defaultValue="monthly">
            <SelectTrigger className="mt-2">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="monthly">Monthly</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label>Employee Contribution</Label>
          <div className="mt-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-md">
            <p className="text-sm">0.75% of Gross Pay</p>
          </div>
        </div>

        <div>
          <Label>Employer's Contribution</Label>
          <div className="mt-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-md">
            <p className="text-sm">3.25% of Gross Pay</p>
          </div>
        </div>

        <div className="space-y-4 pt-4">
          <div className="flex items-center space-x-2">
            <Checkbox id="include_esi_employer" />
            <Label htmlFor="include_esi_employer" className="font-normal">
              Include employer's contribution in employee's salary structure.
            </Label>
          </div>
        </div>

        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
          <p className="text-sm text-amber-800 dark:text-amber-200">
            <strong>Note:</strong> ESI deductions will be made only if the employee's monthly salary is less than or equal to ₹21,000. If the employee gets a salary revision which increases their monthly salary above ₹21,000, they would have to continue making ESI contributions till the end of the contribution period in which the salary was revised (April-September or October-March).
          </p>
        </div>

        <div className="flex gap-4 pt-6">
          <Button className="bg-emerald-600 hover:bg-emerald-700">Save</Button>
          <Button variant="outline">Cancel</Button>
          <Button 
            variant="destructive" 
            onClick={() => handleDisable('esi')}
            className="ml-auto"
          >
            Disable ESI
          </Button>
        </div>
      </div>

      {/* Right: Sample Calculation - Empty for ESI */}
      <div>
        {/* ESI doesn't have sample calculation in the screenshot */}
      </div>
    </div>
  );

  const renderTDSContent = () => (
    <div className="space-y-6">
      <p className="text-gray-600 dark:text-gray-400">TDS configuration form will be displayed here...</p>
      <div className="flex gap-4 pt-6">
        <Button className="bg-emerald-600 hover:bg-emerald-700">Save</Button>
        <Button variant="outline">Cancel</Button>
        <Button 
          variant="destructive" 
          onClick={() => handleDisable('tds')}
          className="ml-auto"
        >
          Disable TDS
        </Button>
      </div>
    </div>
  );

  const renderProfessionalTaxContent = () => (
    <div className="space-y-6">
      <p className="text-gray-600 dark:text-gray-400">Professional Tax configuration form will be displayed here...</p>
      <div className="flex gap-4 pt-6">
        <Button className="bg-emerald-600 hover:bg-emerald-700">Save</Button>
        <Button variant="outline">Cancel</Button>
        <Button 
          variant="destructive" 
          onClick={() => handleDisable('professional_tax')}
          className="ml-auto"
        >
          Disable Professional Tax
        </Button>
      </div>
    </div>
  );

  const renderLWFContent = () => (
    <div className="space-y-6">
      <p className="text-gray-600 dark:text-gray-400">Labour Welfare Fund configuration form will be displayed here...</p>
      <div className="flex gap-4 pt-6">
        <Button className="bg-emerald-600 hover:bg-emerald-700">Save</Button>
        <Button variant="outline">Cancel</Button>
        <Button 
          variant="destructive" 
          onClick={() => handleDisable('lwf')}
          className="ml-auto"
        >
          Disable Labour Welfare Fund
        </Button>
      </div>
    </div>
  );

  const renderStatutoryBonusContent = () => {
    // When enabled, show configuration form
    return (
      <div className="space-y-6">
        <p className="text-gray-600 dark:text-gray-400">Statutory Bonus configuration form will be displayed here...</p>
        <div className="flex gap-4 pt-6">
          <Button className="bg-emerald-600 hover:bg-emerald-700">Save</Button>
          <Button variant="outline">Cancel</Button>
          <Button 
            variant="destructive" 
            onClick={() => handleDisable('statutory_bonus')}
            className="ml-auto"
          >
            Disable Statutory Bonus
          </Button>
        </div>
      </div>
    );
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Tax Configuration</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Configure statutory components for payroll compliance
        </p>
      </div>

      {/* Custom Horizontal Tabs - Text with Underline */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <div className="flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                relative pb-3 text-sm font-medium transition-colors duration-200
                ${activeTab === tab.id
                  ? 'text-blue-600 dark:text-blue-400'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                }
              `}
            >
              {tab.label}
              {/* Animated Underline */}
              <span
                className={`
                  absolute bottom-0 left-0 w-full h-0.5 bg-blue-600 dark:bg-blue-400
                  transition-all duration-300 ease-in-out
                  ${activeTab === tab.id ? 'opacity-100 scale-x-100' : 'opacity-0 scale-x-0'}
                `}
              />
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="pt-6">
        {renderTabContent()}
      </div>
    </div>
  );
};

export default TaxConfiguration;
