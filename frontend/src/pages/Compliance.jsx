import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
import { Progress } from "@/components/ui/progress";
import {
  Shield,
  Calendar,
  FileText,
  Download,
  AlertTriangle,
  CheckCircle,
  Clock,
  Building2,
  CreditCard,
  Users,
  TrendingUp
} from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";
import { toast } from "sonner";

const Compliance = () => {
  const [selectedMonth, setSelectedMonth] = useState('10');
  const [selectedYear, setSelectedYear] = useState('2024');

  // ⚠️ WARNING: Mock compliance data for UI demonstration only
  // TODO: Implement real compliance tracking API integration
  // This data will NOT affect actual compliance tracking or regulatory filings
  const complianceItems = [
    {
      id: 1,
      type: 'PF Return',
      description: 'Monthly PF ECR submission',
      due_date: '2024-10-15',
      status: 'overdue',
      priority: 'high',
      penalty: 25000,
      employees_count: 45,
      amount: 125000
    },
    {
      id: 2,
      type: 'ESI Return',
      description: 'Monthly ESI contribution',
      due_date: '2024-10-21',
      status: 'pending',
      priority: 'high',
      penalty: 0,
      employees_count: 32,
      amount: 85000
    },
    {
      id: 3,
      type: 'Professional Tax',
      description: 'Monthly PT payment to state',
      due_date: '2024-10-07',
      status: 'completed',
      priority: 'medium',
      penalty: 0,
      employees_count: 45,
      amount: 9000
    },
    {
      id: 4,
      type: 'TDS Return',
      description: 'Quarterly TDS return filing',
      due_date: '2024-10-31',
      status: 'pending',
      priority: 'medium',
      penalty: 0,
      employees_count: 25,
      amount: 150000
    },
    {
      id: 5,
      type: 'Labour Welfare Fund',
      description: 'Annual LWF contribution',
      due_date: '2024-12-31',
      status: 'upcoming',
      priority: 'low',
      penalty: 0,
      employees_count: 45,
      amount: 45000
    }
  ];

  // ⚠️ WARNING: Mock forms data for UI demonstration only
  // TODO: Implement real compliance forms API integration
  const forms = [
    {
      name: 'Form 16',
      description: 'Annual salary certificate for employees',
      category: 'TDS',
      status: 'available',
      applicable_employees: 25
    },
    {
      name: 'Form 24Q',
      description: 'Quarterly TDS return',
      category: 'TDS',
      status: 'pending',
      applicable_employees: 25
    },
    {
      name: 'Form 12BA',
      description: 'Annual information return',
      category: 'TDS',
      status: 'upcoming',
      applicable_employees: 45
    },
    {
      name: 'PF ECR',
      description: 'Electronic challan cum return',
      category: 'PF',
      status: 'overdue',
      applicable_employees: 45
    },
    {
      name: 'ESI Return',
      description: 'Monthly ESI contribution return',
      category: 'ESI',
      status: 'pending',
      applicable_employees: 32
    }
  ];

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'bg-primary/10 text-primary';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'overdue': return 'bg-red-100 text-red-800';
      case 'upcoming': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityIcon = (priority) => {
    switch (priority) {
      case 'high': return <AlertTriangle className="h-4 w-4 text-red-600" />;
      case 'medium': return <Clock className="h-4 w-4 text-yellow-600" />;
      case 'low': return <CheckCircle className="h-4 w-4 text-green-600" />;
      default: return null;
    }
  };

  const handleGenerateReport = (type) => {
    toast.success(`Generating ${type} report...`);
    // In a real app, this would generate and download the report
  };

  const handleFileReturn = (item) => {
    toast.success(`Filing ${item.type} return...`);
    // In a real app, this would handle the filing process
  };

  const overdueTasks = complianceItems.filter(item => item.status === 'overdue').length;
  const pendingTasks = complianceItems.filter(item => item.status === 'pending').length;
  const completedTasks = complianceItems.filter(item => item.status === 'completed').length;
  const totalPenalties = complianceItems.reduce((sum, item) => sum + item.penalty, 0);

  return (
    <div className="space-y-6" data-testid="compliance">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
            Compliance Management
          </h1>
          <p className="text-gray-500 dark:text-gray-400">
            Manage statutory compliance and regulatory requirements
          </p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline">
            <Calendar className="w-4 h-4 mr-2" />
            View Calendar
          </Button>
          <Button>
            <FileText className="w-4 h-4 mr-2" />
            Generate Reports
          </Button>
        </div>
      </div>

      {/* Warning Banner for Demo Data */}
      <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="text-sm font-semibold text-yellow-800 dark:text-yellow-300">
              Demo Data Notice
            </h3>
            <p className="text-sm text-yellow-700 dark:text-yellow-400 mt-1">
              This page displays sample compliance data for demonstration purposes only. Real compliance tracking requires API integration with statutory platforms. This data does not reflect actual regulatory obligations or filings.
            </p>
          </div>
        </div>
      </div>


      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="h-8 w-8 text-red-600" />
              <div>
                <p className="text-2xl font-bold text-red-600">{overdueTasks}</p>
                <p className="text-xs text-gray-500">Overdue Tasks</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Clock className="h-8 w-8 text-yellow-600" />
              <div>
                <p className="text-2xl font-bold text-yellow-600">{pendingTasks}</p>
                <p className="text-xs text-gray-500">Pending Tasks</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-8 w-8 text-primary" />
              <div>
                <p className="text-2xl font-bold text-primary">{completedTasks}</p>
                <p className="text-xs text-gray-500">Completed</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-8 w-8 text-purple-600" />
              <div>
                <p className="text-2xl font-bold text-red-600">{formatCurrency(totalPenalties)}</p>
                <p className="text-xs text-gray-500">Total Penalties</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Compliance Overview */}
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Shield className="h-5 w-5" />
              <span>Compliance Tasks</span>
            </CardTitle>
            <div className="flex items-center space-x-4">
              <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 12 }, (_, i) => (
                    <SelectItem key={i + 1} value={String(i + 1)}>
                      {new Date(2024, i).toLocaleDateString('en-US', { month: 'long' })}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={selectedYear} onValueChange={setSelectedYear}>
                <SelectTrigger className="w-24">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 5 }, (_, i) => (
                    <SelectItem key={2024 + i} value={String(2024 + i)}>
                      {2024 + i}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            <div className="border border-gray-200 dark:border-gray-700 rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow className="border-b border-gray-200 dark:border-gray-700">
                    <TableHead className="text-gray-700 dark:text-gray-300">Task</TableHead>
                    <TableHead className="text-gray-700 dark:text-gray-300">Due Date</TableHead>
                    <TableHead className="text-gray-700 dark:text-gray-300">Employees</TableHead>
                    <TableHead className="text-gray-700 dark:text-gray-300">Amount</TableHead>
                    <TableHead className="text-gray-700 dark:text-gray-300">Status</TableHead>
                    <TableHead className="text-gray-700 dark:text-gray-300">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {complianceItems.map((item) => (
                    <TableRow key={item.id} className="border-b border-gray-200 dark:border-gray-700">
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          {getPriorityIcon(item.priority)}
                          <div>
                            <div className="font-medium text-gray-900 dark:text-gray-200">{item.type}</div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">{item.description}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className={item.status === 'overdue' ? 'text-red-600 dark:text-red-400 font-medium' : 'text-gray-800 dark:text-gray-300'}>
                          {formatDate(item.due_date)}
                        </div>
                      </TableCell>
                      <TableCell className="text-gray-800 dark:text-gray-300">{item.employees_count}</TableCell>
                      <TableCell className="text-gray-800 dark:text-gray-300">{formatCurrency(item.amount)}</TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(item.status)}>
                          {item.status}
                        </Badge>
                        {item.penalty > 0 && (
                          <div className="text-xs text-red-600 dark:text-red-400 mt-1">
                            Penalty: {formatCurrency(item.penalty)}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-1">
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleFileReturn(item)}
                            disabled={item.status === 'completed'}
                          >
                            <FileText className="w-3 h-3" />
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleGenerateReport(item.type)}
                          >
                            <Download className="w-3 h-3" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Compliance Progress</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span>Overall Compliance</span>
                <span>75%</span>
              </div>
              <Progress value={75} className="h-2" />
            </div>
            
            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Building2 className="h-4 w-4" />
                  <span>PF Compliance</span>
                </div>
                <Badge variant="destructive">Overdue</Badge>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <CreditCard className="h-4 w-4" />
                  <span>ESI Compliance</span>
                </div>
                <Badge variant="secondary">Pending</Badge>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Shield className="h-4 w-4" />
                  <span>PT Compliance</span>
                </div>
                <Badge variant="default">Completed</Badge>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <FileText className="h-4 w-4" />
                  <span>TDS Compliance</span>
                </div>
                <Badge variant="secondary">Pending</Badge>
              </div>
            </div>
            
            <div className="pt-4 border-t">
              <h4 className="font-medium mb-2">Next Deadlines</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>PF Return</span>
                  <span className="text-red-600">Oct 15 (Overdue)</span>
                </div>
                <div className="flex justify-between">
                  <span>ESI Return</span>
                  <span className="text-yellow-600">Oct 21</span>
                </div>
                <div className="flex justify-between">
                  <span>TDS Return</span>
                  <span>Oct 31</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Forms and Returns */}
      <Card>
        <CardHeader>
          <CardTitle>Available Forms and Returns</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {forms.map((form, index) => (
              <Card key={index} className="cursor-pointer hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold">{form.name}</h3>
                      <p className="text-sm text-gray-600 mt-1">{form.description}</p>
                      <div className="flex items-center space-x-2 mt-2">
                        <Badge variant="outline">{form.category}</Badge>
                        <Badge className={getStatusColor(form.status)}>
                          {form.status}
                        </Badge>
                      </div>
                      <div className="text-xs text-gray-500 mt-2">
                        {form.applicable_employees} employees
                      </div>
                    </div>
                  </div>
                  <div className="flex space-x-2 mt-3">
                    <Button size="sm" className="flex-1">
                      Generate
                    </Button>
                    <Button size="sm" variant="outline">
                      <Download className="w-3 h-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Regulatory Updates */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Regulatory Updates</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="border-l-4 border-primary pl-4">
              <h4 className="font-medium">New PF Rate Notification</h4>
              <p className="text-sm text-gray-600">PF contribution rate remains unchanged at 12% for FY 2024-25</p>
              <p className="text-xs text-gray-500 mt-1">Published: October 1, 2024</p>
            </div>
            
            <div className="border-l-4 border-yellow-500 pl-4">
              <h4 className="font-medium">ESI Contribution Ceiling Update</h4>
              <p className="text-sm text-gray-600">ESI wage ceiling increased to ₹25,000 per month effective from October 2024</p>
              <p className="text-xs text-gray-500 mt-1">Published: September 28, 2024</p>
            </div>
            
            <div className="border-l-4 border-blue-500 pl-4">
              <h4 className="font-medium">Professional Tax Amendment</h4>
              <p className="text-sm text-gray-600">Maharashtra state has updated PT rates for employees earning above ₹15,000</p>
              <p className="text-xs text-gray-500 mt-1">Published: September 25, 2024</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Compliance;
