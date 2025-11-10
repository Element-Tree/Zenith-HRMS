import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Search,
  Monitor,
  Globe,
  Clock,
  User,
  RefreshCw,
  MapPin,
  History
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { formatDateTime } from '@/lib/utils';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || import.meta.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const LoginDetails = () => {
  const [employees, setEmployees] = useState([]);
  const [filteredEmployees, setFilteredEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [loginHistory, setLoginHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [showHistoryDialog, setShowHistoryDialog] = useState(false);

  useEffect(() => {
    fetchLoginDetails();
  }, []);

  useEffect(() => {
    filterEmployees();
  }, [employees, searchTerm]);

  const fetchLoginDetails = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API}/admin/employee-pins`);
      setEmployees(response.data.employee_pins || []);
    } catch (error) {
      console.error('Error fetching login details:', error);
      toast.error('Failed to fetch login details');
    } finally {
      setLoading(false);
    }
  };

  const fetchLoginHistory = async (employeeId, employeeName) => {
    try {
      setHistoryLoading(true);
      setShowHistoryDialog(true);
      setSelectedEmployee({ employee_id: employeeId, name: employeeName });
      
      const response = await axios.get(`${API}/employees/${employeeId}/login-history?days=365`);
      setLoginHistory(response.data.history || []);
    } catch (error) {
      console.error('Error fetching login history:', error);
      toast.error('Failed to fetch login history');
      setLoginHistory([]);
    } finally {
      setHistoryLoading(false);
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

  const formatLocation = (location) => {
    if (!location) return null;
    
    const parts = [];
    if (location.city && location.city !== 'Unknown') parts.push(location.city);
    if (location.region && location.region !== 'Unknown') parts.push(location.region);
    if (location.country && location.country !== 'Unknown') parts.push(location.country);
    
    return parts.length > 0 ? parts.join(', ') : null;
  };

  const getLoginStats = () => {
    const loggedInCount = employees.filter(emp => emp.last_login).length;
    const neverLoggedIn = employees.length - loggedInCount;

    return {
      total: employees.length,
      loggedIn: loggedInCount,
      neverLoggedIn
    };
  };

  const stats = getLoginStats();

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Login Details</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Track employee login history, devices, IP addresses, and locations
          </p>
        </div>
        <Button onClick={fetchLoginDetails} disabled={loading} className="gap-2">
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Employees</CardTitle>
            <User className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">Active employees</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Logged In</CardTitle>
            <Clock className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.loggedIn}</div>
            <p className="text-xs text-muted-foreground">Have logged in at least once</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Never Logged In</CardTitle>
            <Clock className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{stats.neverLoggedIn}</div>
            <p className="text-xs text-muted-foreground">No login history</p>
          </CardContent>
        </Card>
      </div>

      {/* Login Details Table */}
      <Card>
        <CardHeader>
          <CardTitle>Employee Login History</CardTitle>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
            Click on any row to view full 365-day login history
          </p>
        </CardHeader>
        <CardContent>
          {/* Search Bar */}
          <div className="flex items-center space-x-2 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name or employee ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 pr-8"
                autoComplete="off"
                type="search"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-2 top-2.5 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
                  title="Clear search"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* Table */}
          {loading ? (
            <div className="text-center py-8">
              <RefreshCw className="h-8 w-8 animate-spin mx-auto text-gray-400 mb-2" />
              <p className="text-gray-500">Loading login details...</p>
            </div>
          ) : filteredEmployees.length === 0 ? (
            <div className="text-center py-8">
              <Clock className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-semibold text-gray-600 dark:text-gray-300 mb-2">
                {searchTerm ? 'No Matching Employees Found' : 'No Employees Found'}
              </h3>
              <p className="text-gray-500 dark:text-gray-400">
                {searchTerm 
                  ? `No employees match "${searchTerm}".`
                  : 'No employee login data available.'
                }
              </p>
            </div>
          ) : (
            <div className="rounded-md border border-gray-200 dark:border-gray-700">
              <Table>
                <TableHeader>
                  <TableRow className="border-b border-gray-200 dark:border-gray-700">
                    <TableHead className="text-gray-700 dark:text-gray-300">Employee</TableHead>
                    <TableHead className="text-gray-700 dark:text-gray-300">Employee ID</TableHead>
                    <TableHead className="text-gray-700 dark:text-gray-300">Last Login</TableHead>
                    <TableHead className="text-gray-700 dark:text-gray-300">Device</TableHead>
                    <TableHead className="text-gray-700 dark:text-gray-300">IP Address & Location</TableHead>
                    <TableHead className="text-gray-700 dark:text-gray-300">PC Name</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredEmployees.map((employee) => (
                    <TableRow 
                      key={employee.employee_id} 
                      className="border-b border-gray-200 dark:border-gray-700 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                      onClick={() => fetchLoginHistory(employee.employee_id, employee.name)}
                    >
                      <TableCell className="font-medium">
                        <div>
                          <div className="font-semibold text-gray-900 dark:text-gray-200">{employee.name}</div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">{employee.email || 'No email'}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="dark:border-gray-600 dark:text-gray-300">
                          {employee.employee_id}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {employee.last_login ? (
                          <div className="flex flex-col">
                            <span className="text-sm font-medium text-gray-900 dark:text-gray-200">
                              {formatDateTime(employee.last_login)}
                            </span>
                          </div>
                        ) : (
                          <Badge variant="outline" className="dark:border-gray-600 dark:text-gray-300">
                            Never
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {employee.last_login_device ? (
                          <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                            <Monitor className="h-4 w-4 text-gray-500" />
                            {employee.last_login_device}
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400 dark:text-gray-500">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {employee.last_login_ip ? (
                          <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-2 text-sm font-mono text-gray-700 dark:text-gray-300">
                              <Globe className="h-4 w-4 text-gray-500 flex-shrink-0" />
                              {employee.last_login_ip}
                            </div>
                            {employee.last_login_location && formatLocation(employee.last_login_location) && (
                              <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                                <MapPin className="h-3 w-3 text-gray-400 flex-shrink-0 ml-0.5" />
                                {formatLocation(employee.last_login_location)}
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400 dark:text-gray-500">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {employee.last_login_device ? (
                          <span className="text-sm text-gray-600 dark:text-gray-400">
                            {employee.last_login_device.includes('Desktop') ? 'Desktop' : 'Mobile Device'}
                          </span>
                        ) : (
                          <span className="text-xs text-gray-400 dark:text-gray-500">-</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Login History Dialog */}
      <Dialog open={showHistoryDialog} onOpenChange={setShowHistoryDialog}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <History className="h-5 w-5" />
              Login History - {selectedEmployee?.name}
            </DialogTitle>
            <DialogDescription>
              Complete login history for the past 365 days (including today)
            </DialogDescription>
          </DialogHeader>

          {historyLoading ? (
            <div className="text-center py-8">
              <RefreshCw className="h-8 w-8 animate-spin mx-auto text-gray-400 mb-2" />
              <p className="text-gray-500">Loading login history...</p>
            </div>
          ) : loginHistory.length === 0 ? (
            <div className="text-center py-8">
              <Clock className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-semibold text-gray-600 dark:text-gray-300 mb-2">
                No Login History
              </h3>
              <p className="text-gray-500 dark:text-gray-400">
                No login records found for the past 365 days.
              </p>
            </div>
          ) : (
            <div>
              <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-500/30 rounded-lg">
                <p className="text-sm text-blue-700 dark:text-blue-400">
                  <strong>{loginHistory.length}</strong> login(s) found in the past 365 days
                </p>
              </div>
              
              <div className="rounded-md border border-gray-200 dark:border-gray-700">
                <Table>
                  <TableHeader>
                    <TableRow className="border-b border-gray-200 dark:border-gray-700">
                      <TableHead className="text-gray-700 dark:text-gray-300">Date & Time</TableHead>
                      <TableHead className="text-gray-700 dark:text-gray-300">IP Address & Location</TableHead>
                      <TableHead className="text-gray-700 dark:text-gray-300">Device Name</TableHead>
                      <TableHead className="text-gray-700 dark:text-gray-300">PC Name</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loginHistory.map((entry) => (
                      <TableRow key={entry.id} className="border-b border-gray-200 dark:border-gray-700">
                        <TableCell>
                          <div className="flex items-center gap-2 text-sm font-medium text-gray-900 dark:text-gray-200">
                            <Clock className="h-4 w-4 text-gray-500" />
                            {formatDateTime(entry.login_time)}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-2 text-sm font-mono text-gray-700 dark:text-gray-300">
                              <Globe className="h-4 w-4 text-gray-500 flex-shrink-0" />
                              {entry.ip_address || '-'}
                            </div>
                            {entry.location && formatLocation(entry.location) && (
                              <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                                <MapPin className="h-3 w-3 text-gray-400 flex-shrink-0 ml-0.5" />
                                {formatLocation(entry.location)}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                            <Monitor className="h-4 w-4 text-gray-500" />
                            {entry.device_name || '-'}
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm text-gray-600 dark:text-gray-400">
                            {entry.pc_name || 'Desktop'}
                          </span>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default LoginDetails;
