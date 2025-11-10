import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { 
  Key, 
  RefreshCw, 
  Edit, 
  Search,
  Users,
  Shield,
  Clock,
  Mail,
  CheckSquare,
  Square,
  Send
} from 'lucide-react';
import { toast } from 'sonner';
import { formatDate } from '@/lib/utils';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || import.meta.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const PinManagement = () => {
  const [employees, setEmployees] = useState([]);
  const [filteredEmployees, setFilteredEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Wrapper to prevent unwanted searchTerm changes
  const safeSetSearchTerm = (value) => {
    console.log('safeSetSearchTerm called with:', value);
    if (value === 'admin' && !editDialog) {
      console.warn('Blocking suspicious "admin" searchTerm set');
      return;
    }
    setSearchTerm(value);
  };
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [newPin, setNewPin] = useState('');
  const [editDialog, setEditDialog] = useState(false);
  const [bulkUpdateDialog, setBulkUpdateDialog] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [selectedEmployees, setSelectedEmployees] = useState([]);
  const [emailDialog, setEmailDialog] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);

  useEffect(() => {
    fetchEmployeePins();
  }, []);

  // Debug: Monitor searchTerm changes
  useEffect(() => {
    console.log('SearchTerm changed to:', searchTerm);
    console.trace('SearchTerm change stack trace');
  }, [searchTerm]);


  useEffect(() => {
    filterEmployees();
    console.log('Filter effect triggered:', {
      employeesCount: employees.length,
      searchTerm,
      filteredCount: filteredEmployees.length
    });
  }, [employees, searchTerm]);

  const fetchEmployeePins = async () => {
    try {
      setLoading(true);
      console.log('Fetching employee PINs from:', `${API}/admin/employee-pins`);
      
      const response = await axios.get(`${API}/admin/employee-pins`);
      
      console.log('API Response:', response.data);
      setEmployees(response.data.employee_pins || []);
      
      if (!response.data.employee_pins || response.data.employee_pins.length === 0) {
        toast.info('No employee PINs found. Click "Update All PINs" to generate PINs for all employees.');
      }
    } catch (error) {
      console.error('Error fetching employee PINs:', error);
      console.error('Error response:', error.response?.data);
      toast.error(`Failed to fetch employee PINs: ${error.response?.data?.detail || error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const filterEmployees = () => {
    if (!searchTerm) {
      setFilteredEmployees(employees);
      return;
    }
    
    const filtered = employees.filter(emp => {
      const name = emp.name || '';
      const employeeId = emp.employee_id || '';
      const searchLower = searchTerm.toLowerCase();
      
      return name.toLowerCase().includes(searchLower) ||
             employeeId.toLowerCase().includes(searchLower);
    });
    setFilteredEmployees(filtered);
  };

  const updateEmployeePin = async (employeeId, pin = null) => {
    try {
      setUpdating(true);
      const response = await axios.put(`${API}/admin/employee-pins`, {
        employee_id: employeeId,
        new_pin: pin // null will generate random PIN
      });
      
      toast.success(response.data.message);
      fetchEmployeePins(); // Refresh data
      return response.data.new_pin;
    } catch (error) {
      console.error('Error updating PIN:', error);
      toast.error(error.response?.data?.detail || 'Failed to update PIN');
    } finally {
      setUpdating(false);
    }
  };

  const updateAllPins = async () => {
    try {
      setUpdating(true);
      const response = await axios.post(`${API}/update-employee-pins`, {});
      
      toast.success(`Updated PINs for ${response.data.updated_count} employees`);
      fetchEmployeePins(); // Refresh data
      setBulkUpdateDialog(false);
    } catch (error) {
      console.error('Error updating all PINs:', error);
      toast.error('Failed to update all PINs');
    } finally {
      setUpdating(false);
    }
  };

  const handleEditPin = async () => {
    if (!newPin || newPin.length !== 4 || !/^\d{4}$/.test(newPin)) {
      toast.error('PIN must be exactly 4 digits');
      return;
    }

    const updatedPin = await updateEmployeePin(selectedEmployee.employee_id, newPin);
    if (updatedPin) {
      setEditDialog(false);
      setNewPin('');
      setSelectedEmployee(null);
    }
  };

  const generateRandomPin = async (employee) => {
    const updatedPin = await updateEmployeePin(employee.employee_id);
    if (updatedPin) {
      // Show the new PIN briefly
      toast.success(`New PIN for ${employee.name}: ${updatedPin}`, {
        duration: 10000 // Show for 10 seconds
      });
    }
  };

  const cleanupUsers = async () => {
    if (!window.confirm('This will remove duplicate, test, and inactive employee accounts. Continue?')) {
      return;
    }
    
    try {
      setUpdating(true);
      const response = await axios.post(`${API}/admin/cleanup-users`);
      
      toast.success(
        `Cleanup completed: Removed ${response.data.deleted_count} accounts. ` +
        `${response.data.active_users} active employees remaining.`,
        { duration: 8000 }
      );
      
      // Refresh the data
      fetchEmployeePins();
    } catch (error) {
      console.error('Error during cleanup:', error);
      toast.error(`Cleanup failed: ${error.response?.data?.detail || error.message}`);
    } finally {
      setUpdating(false);
    }
  };

  const toggleEmployeeSelection = (employeeId) => {
    setSelectedEmployees(prev => 
      prev.includes(employeeId) 
        ? prev.filter(id => id !== employeeId)
        : [...prev, employeeId]
    );
  };

  const toggleSelectAll = () => {
    setSelectedEmployees(prev => 
      prev.length === filteredEmployees.length 
        ? [] 
        : filteredEmployees.map(emp => emp.employee_id)
    );
  };

  const sendPinEmails = async (selectedOnly = false) => {
    try {
      setSendingEmail(true);
      const employeesToSend = selectedOnly 
        ? employees.filter(emp => selectedEmployees.includes(emp.employee_id))
        : employees;
      
      if (employeesToSend.length === 0) {
        toast.error(selectedOnly ? 'No employees selected' : 'No employees found');
        return;
      }

      // Filter employees without email
      const employeesWithEmail = employeesToSend.filter(emp => emp.email && emp.email.trim());
      const employeesWithoutEmail = employeesToSend.filter(emp => !emp.email || !emp.email.trim());

      if (employeesToSend.length === 0) {
        toast.error(selectedOnly ? 'No employees selected for email sending' : 'No employees found');
        return;
      }

      if (employeesWithEmail.length === 0) {
        if (selectedOnly) {
          toast.error(`None of the selected ${employeesToSend.length} employees have email addresses configured`);
        } else {
          toast.error(`None of the ${employeesToSend.length} employees have email addresses configured. Please add email addresses in employee profiles.`);
        }
        return;
      }

      if (employeesWithoutEmail.length > 0) {
        toast.warning(`${employeesWithoutEmail.length} employees don't have email addresses and will be skipped`);
      }

      const response = await axios.post(`${API}/admin/send-pin-emails`, {
        employee_ids: employeesWithEmail.map(emp => emp.employee_id)
      });

      toast.success(`PIN emails sent to ${response.data.successful} employees successfully!`);
      
      if (response.data.failed > 0) {
        toast.warning(`${response.data.failed} emails failed to send`);
      }

      setEmailDialog(false);
      setSelectedEmployees([]);
    } catch (error) {
      console.error('Error sending PIN emails:', error);
      toast.error(error.response?.data?.detail || 'Failed to send PIN emails');
    } finally {
      setSendingEmail(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="flex items-center space-x-2">
          <RefreshCw className="h-6 w-6 animate-spin" />
          <span>Loading employee PINs...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Employee PIN Management</h1>
          <p className="text-gray-600">Manage employee PINs for secure login</p>
        </div>
        <div className="flex gap-2">
          <Button 
            onClick={() => sendPinEmails(false)} 
            variant="outline" 
            className="gap-2"
            disabled={sendingEmail || employees.length === 0}
          >
            <Mail className="h-4 w-4" />
            {sendingEmail ? 'Sending...' : 'Email All PINs'}
          </Button>
          <Button 
            onClick={() => sendPinEmails(true)} 
            variant="outline" 
            className="gap-2"
            disabled={sendingEmail || selectedEmployees.length === 0}
          >
            <Send className="h-4 w-4" />
            {sendingEmail ? 'Sending...' : `Email Selected (${selectedEmployees.length})`}
          </Button>
          <Button 
            onClick={cleanupUsers} 
            variant="outline" 
            className="gap-2"
            disabled={updating}
          >
            <Shield className="h-4 w-4" />
            {updating ? 'Cleaning...' : 'Cleanup Database'}
          </Button>
          <Button onClick={() => setBulkUpdateDialog(true)} className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Update All PINs
          </Button>
        </div>
      </div>

      {/* Selection Info */}
      {selectedEmployees.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckSquare className="h-5 w-5 text-blue-600" />
              <span className="text-blue-800 font-medium">
                {selectedEmployees.length} employee{selectedEmployees.length !== 1 ? 's' : ''} selected
              </span>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setSelectedEmployees([])}
              className="text-blue-600 border-blue-300"
            >
              Clear Selection
            </Button>
          </div>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Employees</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{employees.length}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active PINs</CardTitle>
            <Key className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{employees.filter(emp => emp.pin).length}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">With Email</CardTitle>
            <Mail className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {employees.filter(emp => emp.email && emp.email.trim()).length}
            </div>
            <p className="text-xs text-muted-foreground">
              Employees with email addresses
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Search and Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Employee PIN List</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search employees..."
                value={searchTerm}
                onChange={(e) => safeSetSearchTerm(e.target.value)}
                className="pl-8 pr-8"
                autoComplete="off"
                name="employee-search"
                type="search"
              />
              {searchTerm && (
                <button
                  onClick={() => safeSetSearchTerm('')}
                  className="absolute right-2 top-2.5 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
                  title="Clear search"
                >
                  ✕
                </button>
              )}
            </div>
            {filteredEmployees.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={toggleSelectAll}
                className="gap-2"
              >
                {selectedEmployees.length === filteredEmployees.length ? (
                  <CheckSquare className="h-4 w-4" />
                ) : (
                  <Square className="h-4 w-4" />
                )}
                Select All
              </Button>
            )}
          </div>

          {/* Employee Table */}
          {filteredEmployees.length === 0 && !loading ? (
            <div className="text-center py-8">
              <Key className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-semibold text-gray-600 dark:text-gray-300 mb-2">
                {searchTerm ? 'No Matching Employees Found' : 'No Employee PINs Found'}
              </h3>
              <p className="text-gray-500 dark:text-gray-400 mb-4">
                {searchTerm 
                  ? `No employees match "${searchTerm}". Try a different search term or clear the search.`
                  : 'Get started by clicking "Update All PINs" to generate secure PINs for all employees.'
                }
              </p>
              {searchTerm ? (
                <Button onClick={() => safeSetSearchTerm('')} variant="outline" className="gap-2">
                  Clear Search
                </Button>
              ) : (
                <Button onClick={() => setBulkUpdateDialog(true)} className="gap-2">
                  <RefreshCw className="h-4 w-4" />
                  Generate PINs for All Employees
                </Button>
              )}
            </div>
          ) : (
            <div className="rounded-md border border-gray-200 dark:border-gray-700">
              <Table>
              <TableHeader>
                <TableRow className="border-b border-gray-200 dark:border-gray-700">
                  <TableHead className="w-12 text-gray-700 dark:text-gray-300">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={toggleSelectAll}
                      className="h-6 w-6 p-0"
                    >
                      {selectedEmployees.length === filteredEmployees.length && filteredEmployees.length > 0 ? (
                        <CheckSquare className="h-4 w-4" />
                      ) : (
                        <Square className="h-4 w-4" />
                      )}
                    </Button>
                  </TableHead>
                  <TableHead className="text-gray-700 dark:text-gray-300">Employee</TableHead>
                  <TableHead className="text-gray-700 dark:text-gray-300">Employee ID</TableHead>
                  <TableHead className="text-gray-700 dark:text-gray-300">Current PIN</TableHead>
                  <TableHead className="text-right text-gray-700 dark:text-gray-300">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredEmployees.map((employee) => (
                  <TableRow key={employee.employee_id} className="border-b border-gray-200 dark:border-gray-700">
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleEmployeeSelection(employee.employee_id)}
                        className="h-6 w-6 p-0"
                      >
                        {selectedEmployees.includes(employee.employee_id) ? (
                          <CheckSquare className="h-4 w-4" />
                        ) : (
                          <Square className="h-4 w-4" />
                        )}
                      </Button>
                    </TableCell>
                    <TableCell className="font-medium">
                      <div>
                        <div className="font-semibold text-gray-900 dark:text-gray-200">{employee.name}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">{employee.email || 'No email'}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="dark:border-gray-600 dark:text-gray-300">{employee.employee_id}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Badge variant="secondary" className="font-mono">
                          {employee.pin || 'Not Set'}
                        </Badge>
                        {employee.pin && (
                          <Shield className="h-4 w-4 text-green-500" />
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            console.log('Edit button clicked for:', employee.name);
                            console.log('Current searchTerm before:', searchTerm);
                            
                            // Save and force-lock the search term
                            const currentSearch = searchTerm;
                            
                            // Open dialog
                            setSelectedEmployee(employee);
                            setNewPin('');
                            setEditDialog(true);
                            
                            // Immediately force search term back if it changes
                            requestAnimationFrame(() => {
                              if (searchTerm !== currentSearch) {
                                console.warn('SearchTerm was changed! Force reverting from', searchTerm, 'to', currentSearch);
                                setSearchTerm(currentSearch);
                              }
                            });
                          }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>

                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => generateRandomPin(employee)}
                          disabled={updating}
                        >
                          <RefreshCw className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          )}
        </CardContent>
      </Card>

      {/* Bulk Update Dialog */}
      <AlertDialog open={bulkUpdateDialog} onOpenChange={setBulkUpdateDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Update All Employee PINs</AlertDialogTitle>
            <AlertDialogDescription>
              This will generate new random 4-digit PINs for all employees. 
              Current PINs will be replaced. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={updateAllPins}
              disabled={updating}
              className="bg-red-600 hover:bg-red-700"
            >
              {updating ? 'Updating...' : 'Update All PINs'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Edit PIN Dialog - Single Instance */}
      <Dialog 
        open={editDialog}
        onOpenChange={(open) => {
          if (!open) {
            setEditDialog(false);
            setSelectedEmployee(null);
            setNewPin('');
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit PIN for {selectedEmployee?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium dark:text-gray-300">New PIN (4 digits)</label>
              <Input
                type="password"
                maxLength={4}
                value={newPin}
                onChange={(e) => setNewPin(e.target.value)}
                placeholder="Enter 4-digit PIN"
                className="dark:bg-gray-800 dark:border-gray-600 dark:text-gray-200"
                autoFocus
                autoComplete="new-password"
                name="employee-pin-edit"
                inputMode="numeric"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Enter a custom 4-digit PIN for this employee
              </p>
            </div>
            <div className="flex justify-end space-x-2">
              <Button
                variant="outline"
                onClick={() => {
                  setEditDialog(false);
                  setSelectedEmployee(null);
                  setNewPin('');
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={handleEditPin}
                disabled={updating}
              >
                {updating ? 'Updating...' : 'Update PIN'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PinManagement;