import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import {
  UserCheck,
  UserX,
  UserMinus,
  Calendar,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';
import { toast } from 'sonner';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const EmployeeStatusManager = ({ employee, onStatusUpdate }) => {
  const [showDialog, setShowDialog] = useState(false);
  const [newStatus, setNewStatus] = useState('');
  const [effectiveDate, setEffectiveDate] = useState(new Date().toISOString().split('T')[0]);
  const [reason, setReason] = useState('');
  const [updating, setUpdating] = useState(false);

  const statusOptions = [
    { value: 'active', label: 'Active', icon: UserCheck, color: 'bg-green-100 text-green-800' },
    { value: 'resigned', label: 'Resigned', icon: UserMinus, color: 'bg-yellow-100 text-yellow-800' },
    { value: 'terminated', label: 'Terminated', icon: UserX, color: 'bg-red-100 text-red-800' },
  ];

  const getStatusIcon = (status) => {
    const statusConfig = statusOptions.find(s => s.value === status);
    if (statusConfig) {
      const Icon = statusConfig.icon;
      return <Icon className="h-4 w-4" />;
    }
    return <UserCheck className="h-4 w-4" />;
  };

  const getStatusColor = (status) => {
    const statusConfig = statusOptions.find(s => s.value === status);
    return statusConfig ? statusConfig.color : 'bg-gray-100 text-gray-800';
  };

  const handleStatusChange = async () => {
    if (!newStatus) {
      toast.error('Please select a status');
      return;
    }

    if ((newStatus === 'resigned' || newStatus === 'terminated') && !reason.trim()) {
      toast.error('Please provide a reason for status change');
      return;
    }

    setUpdating(true);
    try {
      const updateData = {
        status: newStatus,
        status_reason: reason
      };
      
      // Set the appropriate date field based on status
      if (newStatus === 'resigned') {
        updateData.resignation_date = effectiveDate;
      } else if (newStatus === 'terminated') {
        updateData.termination_date = effectiveDate;
      }

      await axios.put(`${API}/employees/${employee.employee_id}/status`, updateData);
      
      toast.success(`Employee status changed to ${newStatus} successfully`);
      setShowDialog(false);
      setNewStatus('');
      setReason('');
      
      // Call the callback to refresh employee data
      if (onStatusUpdate) {
        onStatusUpdate();
      }
    } catch (error) {
      console.error('Error updating employee status:', error);
      toast.error(error.response?.data?.detail || 'Failed to update employee status');
    } finally {
      setUpdating(false);
    }
  };

  const resetForm = () => {
    setNewStatus('');
    setReason('');
    setEffectiveDate(new Date().toISOString().split('T')[0]);
    setShowDialog(false);
  };

  return (
    <div className="flex items-center space-x-2">
      <div className="flex items-center space-x-2">
        <span className="text-sm text-gray-500">Status:</span>
        <Badge className={getStatusColor(employee.status)}>
          <div className="flex items-center space-x-1">
            {getStatusIcon(employee.status)}
            <span className="capitalize">{employee.status}</span>
          </div>
        </Badge>
      </div>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm">
            <UserCheck className="w-4 h-4 mr-2" />
            Change Status
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <UserCheck className="h-5 w-5" />
              <span>Change Employee Status</span>
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {/* Current Status */}
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">Current Status</p>
              <div className="flex items-center space-x-2">
                <Badge className={getStatusColor(employee.status)}>
                  <div className="flex items-center space-x-1">
                    {getStatusIcon(employee.status)}
                    <span className="capitalize">{employee.status}</span>
                  </div>
                </Badge>
                <span className="text-sm text-gray-600">
                  {employee.name} ({employee.employee_id})
                </span>
              </div>
            </div>

            {/* New Status Selection */}
            <div>
              <Label htmlFor="status">New Status</Label>
              <Select value={newStatus} onValueChange={setNewStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Select new status" />
                </SelectTrigger>
                <SelectContent>
                  {statusOptions.map((status) => {
                    const Icon = status.icon;
                    return (
                      <SelectItem key={status.value} value={status.value}>
                        <div className="flex items-center space-x-2">
                          <Icon className="h-4 w-4" />
                          <span>{status.label}</span>
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            {/* Effective Date */}
            <div>
              <Label htmlFor="effectiveDate">Effective Date</Label>
              <Input
                id="effectiveDate"
                type="date"
                value={effectiveDate}
                onChange={(e) => setEffectiveDate(e.target.value)}
              />
            </div>

            {/* Reason (required for resigned/terminated) */}
            {(newStatus === 'resigned' || newStatus === 'terminated') && (
              <div>
                <Label htmlFor="reason">
                  Reason for {newStatus === 'resigned' ? 'Resignation' : 'Termination'} *
                </Label>
                <Textarea
                  id="reason"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder={`Please provide the reason for ${newStatus === 'resigned' ? 'resignation' : 'termination'}`}
                  rows={3}
                />
              </div>
            )}

            {/* Warning Message */}
            {(newStatus === 'resigned' || newStatus === 'terminated') && (
              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex items-start space-x-2">
                  <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-yellow-800">
                      Status Change Warning
                    </p>
                    <p className="text-sm text-yellow-700">
                      Changing status to "{newStatus}" will affect the employee's access and payroll calculations.
                      This action can be reversed if needed.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex space-x-2 pt-4">
              <Button variant="outline" onClick={resetForm} className="flex-1">
                Cancel
              </Button>
              <Button
                onClick={handleStatusChange}
                disabled={updating || !newStatus}
                className="flex-1"
              >
                {updating ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    Updating...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Update Status
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default EmployeeStatusManager;