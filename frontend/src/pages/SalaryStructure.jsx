import React, { useState, useEffect } from "react";
import axios from "axios";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import {
  DollarSign,
  Edit,
  Calculator,
  TrendingUp,
  Users
} from "lucide-react";
import { formatCurrency, calculateGrossSalary, calculateTotalDeductions, calculateNetSalary } from "@/lib/utils";
import { toast } from "sonner";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const SalaryStructure = () => {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [currentSalary, setCurrentSalary] = useState({
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
  });

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    try {
      const response = await axios.get(`${API}/employees`);
      const activeEmployees = response.data.filter(emp => emp.status === 'active');
      setEmployees(activeEmployees);
    } catch (error) {
      console.error('Error fetching employees:', error);
      toast.error('Failed to load employees');
    } finally {
      setLoading(false);
    }
  };

  // Removed unused salary template functionality

  const handleEditSalary = (employee) => {
    setSelectedEmployee(employee);
    setCurrentSalary(employee.salary_structure);
    setShowEditDialog(true);
  };

  const handleSalaryChange = (field, value) => {
    const numValue = parseFloat(value) || 0;
    setCurrentSalary(prev => {
      const updated = { ...prev, [field]: numValue };
      
      // Auto-calculate PF and ESI based on basic salary
      if (field === 'basic_salary') {
        updated.pf_employee = Math.round(numValue * 0.12); // 12% PF
        updated.pf_employer = Math.round(numValue * 0.12);
        
        // ESI is applicable only if total salary is below 25,000
        const grossSalary = calculateGrossSalary(updated);
        if (grossSalary <= 25000) {
          updated.esi_employee = Math.round(grossSalary * 0.0075); // 0.75%
          updated.esi_employer = Math.round(grossSalary * 0.0325); // 3.25%
        } else {
          updated.esi_employee = 0;
          updated.esi_employer = 0;
        }
        
        // Auto-calculate HRA as 40% of basic (common practice)
        if (updated.house_rent_allowance === 0 || updated.house_rent_allowance === prev.basic_salary * 0.4) {
          updated.house_rent_allowance = Math.round(numValue * 0.4);
        }
      }
      
      return updated;
    });
  };

  const handleUpdateSalary = async () => {
    try {
      await axios.put(`${API}/employees/${selectedEmployee.employee_id}`, {
        salary_structure: currentSalary
      });
      
      // Update local state
      setEmployees(prev => prev.map(emp => 
        emp.employee_id === selectedEmployee.employee_id 
          ? { ...emp, salary_structure: currentSalary }
          : emp
      ));
      
      setShowEditDialog(false);
      toast.success('Salary structure updated successfully');
    } catch (error) {
      console.error('Error updating salary:', error);
      toast.error('Failed to update salary structure');
    }
  };

  // Removed unused template functions

  const calculateSalaryBreakdown = (salaryStructure) => {
    const gross = calculateGrossSalary(salaryStructure);
    const deductions = calculateTotalDeductions(salaryStructure);
    const net = gross - deductions;
    
    return {
      gross,
      deductions,
      net,
      ctc: gross + salaryStructure.pf_employer + salaryStructure.esi_employer
    };
  };

  const getSalaryInsights = () => {
    if (employees.length === 0) return { avgSalary: 0, totalPayroll: 0, salaryRanges: [] };
    
    const salaries = employees.map(emp => calculateSalaryBreakdown(emp.salary_structure).net);
    const avgSalary = salaries.reduce((sum, sal) => sum + sal, 0) / salaries.length;
    const totalPayroll = salaries.reduce((sum, sal) => sum + sal, 0);
    
    const ranges = [
      { label: 'Below 50k', count: salaries.filter(s => s < 50000).length },
      { label: '50k - 75k', count: salaries.filter(s => s >= 50000 && s < 75000).length },
      { label: '75k - 1L', count: salaries.filter(s => s >= 75000 && s < 100000).length },
      { label: 'Above 1L', count: salaries.filter(s => s >= 100000).length }
    ];
    
    return { avgSalary, totalPayroll, salaryRanges: ranges };
  };

  const insights = getSalaryInsights();

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-10 bg-gray-200 rounded-lg w-64"></div>
        <div className="h-96 bg-gray-200 rounded-lg"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="salary-structure">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
            Salary Structure
          </h1>
          <p className="text-gray-500 dark:text-gray-400">
            Manage employee salary structures
          </p>
        </div>
        {/* Template creation button removed */}
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Users className="h-8 w-8 text-blue-600" />
              <div>
                <p className="text-2xl font-bold">{employees.length}</p>
                <p className="text-xs text-gray-500">Total Employees</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <DollarSign className="h-8 w-8 text-emerald-600" />
              <div>
                <p className="text-2xl font-bold">{formatCurrency(insights.avgSalary)}</p>
                <p className="text-xs text-gray-500">Average Salary</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-8 w-8 text-purple-600" />
              <div>
                <p className="text-2xl font-bold">{formatCurrency(insights.totalPayroll)}</p>
                <p className="text-xs text-gray-500">Monthly Payroll</p>
              </div>
            </div>
          </CardContent>
        </Card>
        {/* Templates card removed - template functionality disabled */}
      </div>

      {/* Salary Distribution */}
      <Card>
        <CardHeader>
          <CardTitle>Salary Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {insights.salaryRanges.map((range, index) => (
              <div key={index} className="flex items-center space-x-4">
                <div className="w-24 text-sm">{range.label}</div>
                <div className="flex-1">
                  <Progress 
                    value={(range.count / employees.length) * 100} 
                    className="h-2"
                  />
                </div>
                <div className="w-12 text-sm text-gray-600">{range.count}</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Employee Salary List */}
      <Card>
        <CardHeader>
          <CardTitle>Employee Salary Structures</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="border border-gray-200 dark:border-gray-700 rounded-lg">
            <Table>
              <TableHeader>
                <TableRow className="border-b border-gray-200 dark:border-gray-700">
                  <TableHead className="text-gray-700 dark:text-gray-300">Employee</TableHead>
                  <TableHead className="text-gray-700 dark:text-gray-300">Department</TableHead>
                  <TableHead className="text-gray-700 dark:text-gray-300">Basic Salary</TableHead>
                  <TableHead className="text-gray-700 dark:text-gray-300">HRA</TableHead>
                  <TableHead className="text-gray-700 dark:text-gray-300">Medical</TableHead>
                  <TableHead className="text-gray-700 dark:text-gray-300">LTA</TableHead>
                  <TableHead className="text-gray-700 dark:text-gray-300">Performance</TableHead>
                  <TableHead className="text-gray-700 dark:text-gray-300">PF</TableHead>
                  <TableHead className="text-gray-700 dark:text-gray-300">TDS</TableHead>
                  <TableHead className="text-gray-700 dark:text-gray-300">Gross Salary</TableHead>
                  <TableHead className="text-gray-700 dark:text-gray-300">Total Deductions</TableHead>
                  <TableHead className="text-gray-700 dark:text-gray-300">Net Salary</TableHead>
                  <TableHead className="text-gray-700 dark:text-gray-300">CTC</TableHead>
                  <TableHead className="text-right text-gray-700 dark:text-gray-300">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {employees.map((employee) => {
                  const breakdown = calculateSalaryBreakdown(employee.salary_structure);
                  return (
                    <TableRow key={employee.id} className="border-b border-gray-200 dark:border-gray-700">
                      <TableCell>
                        <div>
                          <div className="font-medium text-gray-900 dark:text-gray-200">{employee.name}</div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">{employee.employee_id}</div>
                        </div>
                      </TableCell>
                      <TableCell className="text-gray-800 dark:text-gray-300">{employee.department}</TableCell>
                      <TableCell className="text-gray-800 dark:text-gray-300">{formatCurrency(employee.salary_structure.basic_salary)}</TableCell>
                      <TableCell className="text-gray-800 dark:text-gray-300">{formatCurrency(employee.salary_structure.house_rent_allowance || 0)}</TableCell>
                      <TableCell className="text-gray-800 dark:text-gray-300">{formatCurrency(employee.salary_structure.medical_allowance || 0)}</TableCell>
                      <TableCell className="text-gray-800 dark:text-gray-300">{formatCurrency(employee.salary_structure.leave_travel_allowance || 0)}</TableCell>
                      <TableCell className="text-gray-800 dark:text-gray-300">{formatCurrency(employee.salary_structure.performance_incentive || 0)}</TableCell>
                      <TableCell className="text-gray-800 dark:text-gray-300">{formatCurrency(employee.salary_structure.pf_employee || 0)}</TableCell>
                      <TableCell className="text-gray-800 dark:text-gray-300">{formatCurrency(employee.salary_structure.tds || 0)}</TableCell>
                      <TableCell className="font-medium text-gray-900 dark:text-gray-200">{formatCurrency(breakdown.gross)}</TableCell>
                      <TableCell className="text-red-600 dark:text-red-400">{formatCurrency(breakdown.deductions)}</TableCell>
                      <TableCell className="font-medium text-emerald-600 dark:text-emerald-400">
                        {formatCurrency(breakdown.net)}
                      </TableCell>
                      <TableCell className="font-medium text-gray-900 dark:text-gray-200">{formatCurrency(breakdown.ctc)}</TableCell>
                      <TableCell className="text-right">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleEditSalary(employee)}
                          title="Edit Salary Structure"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Edit Salary Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Salary Structure - {selectedEmployee?.name}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-6 md:grid-cols-2">
            {/* Earnings */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-emerald-600">Earnings</h3>
              <div className="space-y-3">
                <div>
                  <Label htmlFor="basic_salary">Basic Salary</Label>
                  <Input
                    id="basic_salary"
                    type="number"
                    value={currentSalary.basic_salary}
                    onChange={(e) => handleSalaryChange('basic_salary', e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="house_rent_allowance">House Rent Allowance</Label>
                  <Input
                    id="house_rent_allowance"
                    type="number"
                    value={currentSalary.house_rent_allowance}
                    onChange={(e) => handleSalaryChange('house_rent_allowance', e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="medical_allowance">Medical Allowance</Label>
                  <Input
                    id="medical_allowance"
                    type="number"
                    value={currentSalary.medical_allowance}
                    onChange={(e) => handleSalaryChange('medical_allowance', e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="leave_travel_allowance">Leave Travel Allowance</Label>
                  <Input
                    id="leave_travel_allowance"
                    type="number"
                    value={currentSalary.leave_travel_allowance}
                    onChange={(e) => handleSalaryChange('leave_travel_allowance', e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="conveyance_allowance">Bonus</Label>
                  <Input
                    id="conveyance_allowance"
                    type="number"
                    value={currentSalary.conveyance_allowance}
                    onChange={(e) => handleSalaryChange('conveyance_allowance', e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="performance_incentive">Performance Incentive</Label>
                  <Input
                    id="performance_incentive"
                    type="number"
                    value={currentSalary.performance_incentive}
                    onChange={(e) => handleSalaryChange('performance_incentive', e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="other_benefits">Other Benefits</Label>
                  <Input
                    id="other_benefits"
                    type="number"
                    value={currentSalary.other_benefits}
                    onChange={(e) => handleSalaryChange('other_benefits', e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Deductions */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-red-600">Deductions</h3>
              <div className="space-y-3">
                <div>
                  <Label htmlFor="pf_employee">PF (Employee)</Label>
                  <Input
                    id="pf_employee"
                    type="number"
                    value={currentSalary.pf_employee}
                    onChange={(e) => handleSalaryChange('pf_employee', e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="pf_employer">PF (Employer)</Label>
                  <Input
                    id="pf_employer"
                    type="number"
                    value={currentSalary.pf_employer}
                    onChange={(e) => handleSalaryChange('pf_employer', e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="esi_employee">ESI (Employee)</Label>
                  <Input
                    id="esi_employee"
                    type="number"
                    value={currentSalary.esi_employee}
                    onChange={(e) => handleSalaryChange('esi_employee', e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="esi_employer">ESI (Employer)</Label>
                  <Input
                    id="esi_employer"
                    type="number"
                    value={currentSalary.esi_employer}
                    onChange={(e) => handleSalaryChange('esi_employer', e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="professional_tax">Professional Tax</Label>
                  <Input
                    id="professional_tax"
                    type="number"
                    value={currentSalary.professional_tax}
                    onChange={(e) => handleSalaryChange('professional_tax', e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="tds">TDS</Label>
                  <Input
                    id="tds"
                    type="number"
                    value={currentSalary.tds}
                    onChange={(e) => handleSalaryChange('tds', e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="loan_deductions">Loan Deductions</Label>
                  <Input
                    id="loan_deductions"
                    type="number"
                    value={currentSalary.loan_deductions}
                    onChange={(e) => handleSalaryChange('loan_deductions', e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="others">Others</Label>
                  <Input
                    id="others"
                    type="number"
                    value={currentSalary.others}
                    onChange={(e) => handleSalaryChange('others', e.target.value)}
                  />
                </div>
              </div>

              {/* Summary */}
              <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <h4 className="font-semibold mb-2">Summary</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Gross Salary:</span>
                    <span>{formatCurrency(calculateGrossSalary(currentSalary))}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Total Deductions:</span>
                    <span className="text-red-600">{formatCurrency(calculateTotalDeductions(currentSalary))}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between font-semibold">
                    <span>Net Salary:</span>
                    <span className="text-emerald-600">{formatCurrency(calculateNetSalary(currentSalary))}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-2 mt-6">
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>Cancel</Button>
            <Button onClick={handleUpdateSalary}>Update Salary</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Template dialog removed - template functionality disabled */}
    </div>
  );
};

export default SalaryStructure;