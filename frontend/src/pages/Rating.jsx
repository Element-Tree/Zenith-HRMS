import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Star, Edit, RotateCcw, Save, Loader2, Search, User } from 'lucide-react';
import { toast } from 'sonner';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { getRatingColor } from '@/lib/utils'; // Assuming you'll move/reuse getRatingColor

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const RatingManagement = () => {
  const [employees, setEmployees] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [currentRating, setCurrentRating] = useState(null);
  const [ratingFactors, setRatingFactors] = useState({
    manualAdjustment: 0,
    performanceNotes: '',
    // Add other editable factors if needed
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Placeholder: Fetch employees for selection
  useEffect(() => {
    // TODO: Fetch employees (id, name) for the dropdown/search
    // Example:
    // const fetchEmps = async () => {
    //   try {
    //     const response = await axios.get(`${API}/employees?fields=employee_id,name`);
    //     setEmployees(response.data);
    //   } catch (error) {
    //     toast.error('Failed to load employees');
    //   }
    // };
    // fetchEmps();
    setEmployees([
      { employee_id: 'EMP001', name: 'Alice Smith' },
      { employee_id: 'EMP002', name: 'Bob Johnson' },
      { employee_id: 'EMP003', name: 'Charlie Brown' },
    ]); // Dummy data
  }, []);

  // Placeholder: Fetch rating details when an employee is selected
  useEffect(() => {
    if (selectedEmployee) {
      setIsLoading(true);
      // TODO: Fetch rating details for selectedEmployee.employee_id
      // Example:
      // const fetchRating = async () => {
      //   try {
      //     const response = await axios.get(`${API}/ratings/${selectedEmployee.employee_id}`); // Adjust API endpoint
      //     setCurrentRating(response.data.rating); // Assuming structure { rating: { value: 4.2, factors: {...} } }
      //     setRatingFactors({
      //        manualAdjustment: response.data.rating.factors.manualAdjustment || 0,
      //        performanceNotes: response.data.rating.factors.performanceNotes || '',
      //     });
      //   } catch (error) {
      //     toast.error(`Failed to load rating for ${selectedEmployee.name}`);
      //     setCurrentRating(null);
      //   } finally {
      //      setIsLoading(false);
      //   }
      // };
      // fetchRating();
      // Dummy data:
      setTimeout(() => {
        setCurrentRating({ value: 4.25, calculated: 4.15, manual: 0.10 }); // Example rating structure
        setRatingFactors({ manualAdjustment: 0.10, performanceNotes: "Good progress this quarter." });
        setIsLoading(false);
      }, 500);
    } else {
      setCurrentRating(null);
      setRatingFactors({ manualAdjustment: 0, performanceNotes: '' });
    }
  }, [selectedEmployee]);

  const handleEmployeeSelect = (employeeId) => {
    const employee = employees.find(emp => emp.employee_id === employeeId);
    setSelectedEmployee(employee);
  };

  const handleFactorChange = (field, value) => {
    setRatingFactors(prev => ({ ...prev, [field]: value }));
  };

  const handleSaveChanges = async () => {
    if (!selectedEmployee) return;
    setIsSaving(true);
    // TODO: Implement API call to save/update rating factors
    // Example:
    // try {
    //   await axios.put(`${API}/ratings/${selectedEmployee.employee_id}`, { factors: ratingFactors }); // Adjust API endpoint and payload
    //   toast.success('Rating updated successfully!');
    //   // Optionally re-fetch rating
    // } catch (error) {
    //   toast.error('Failed to save rating changes');
    // } finally {
    //   setIsSaving(false);
    // }
    console.log("Saving changes for:", selectedEmployee.employee_id, ratingFactors);
    setTimeout(() => { // Simulate API call
      toast.success("Rating factors updated (simulation)");
      setIsSaving(false);
      // Refresh simulated data - in reality, you'd fetch again or update state based on response
      setCurrentRating(prev => ({
        ...prev,
        value: (prev?.calculated || 4.0) + parseFloat(ratingFactors.manualAdjustment || 0),
        manual: parseFloat(ratingFactors.manualAdjustment || 0)
      }))
    }, 1000);
  };

  const handleResetRating = async () => {
    if (!selectedEmployee) return;
    setIsSaving(true); // Reuse saving state for loading indicator
    // TODO: Implement API call to reset rating
    // Example:
    // try {
    //   await axios.post(`${API}/ratings/${selectedEmployee.employee_id}/reset`); // Adjust API endpoint
    //   toast.success('Rating reset successfully!');
    //   // Re-fetch rating details
    //   // const fetchRating = async () => { ... }; fetchRating();
    // } catch (error) {
    //   toast.error('Failed to reset rating');
    // } finally {
    //   setIsSaving(false);
    // }
    console.log("Resetting rating for:", selectedEmployee.employee_id);
     setTimeout(() => { // Simulate API call
      toast.success("Rating reset to baseline (simulation)");
      setCurrentRating({ value: 4.0, calculated: 4.0, manual: 0 }); // Reset to baseline
      setRatingFactors({ manualAdjustment: 0, performanceNotes: '' });
      setIsSaving(false);
    }, 1000);
  };

  const filteredEmployees = employees.filter(emp =>
    emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.employee_id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Determine rating color
  const ratingValue = currentRating?.value ?? 0;
  const colors = getRatingColor(ratingValue); // Use the utility function

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
        Employee Rating Management
      </h1>

      <Card>
        <CardHeader>
          <CardTitle>Select Employee</CardTitle>
          <CardDescription>Choose an employee to view or manage their performance rating.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="relative flex-grow">
               <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
               <Input
                 placeholder="Search by name or ID..."
                 value={searchTerm}
                 onChange={(e) => setSearchTerm(e.target.value)}
                 className="pl-10 w-full"
               />
            </div>
            <Select onValueChange={handleEmployeeSelect} value={selectedEmployee?.employee_id || ""}>
              <SelectTrigger className="w-[300px]">
                <SelectValue placeholder="Select an employee..." />
              </SelectTrigger>
              <SelectContent>
                {filteredEmployees.length > 0 ? (
                  filteredEmployees.map(emp => (
                    <SelectItem key={emp.employee_id} value={emp.employee_id}>
                       <div className="flex items-center gap-2">
                         <User className="h-4 w-4 text-gray-500" />
                         <span>{emp.name} ({emp.employee_id})</span>
                       </div>
                    </SelectItem>
                  ))
                ) : (
                  <div className="p-4 text-sm text-gray-500 text-center">No employees found</div>
                )}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {selectedEmployee && (
        <Card>
          <CardHeader>
            <CardTitle>Rating Details for {selectedEmployee.name}</CardTitle>
            <CardDescription>View, adjust, or reset the performance rating.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {isLoading ? (
              <div className="flex justify-center items-center h-40">
                <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
              </div>
            ) : currentRating ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Rating Display */}
                <div className={`p-6 rounded-lg border flex flex-col items-center justify-center bg-gradient-to-br ${colors.bg} ${colors.border}`}>
                   <div className={`text-6xl font-bold ${colors.text}`}>{ratingValue.toFixed(2)}</div>
                   <div className="flex items-center space-x-1 mt-3">
                     {[1, 2, 3, 4, 5].map((star) => (
                       <Star
                         key={star}
                         className={`h-6 w-6 ${star <= Math.round(ratingValue) ? colors.star : colors.starInactive}`}
                       />
                     ))}
                   </div>
                   <p className={`mt-2 font-semibold ${colors.text}`}>{colors.label} {colors.emoji}</p>
                   <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                     (Calculated: {currentRating.calculated?.toFixed(2)}, Manual: {currentRating.manual?.toFixed(2)})
                   </p>
                </div>

                {/* Editable Factors */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg">Adjust Rating</h3>
                   <div>
                    <Label htmlFor="manualAdjustment">Manual Adjustment (+/-)</Label>
                    <Input
                      id="manualAdjustment"
                      type="number"
                      step="0.01"
                      value={ratingFactors.manualAdjustment}
                      onChange={(e) => handleFactorChange('manualAdjustment', e.target.value)}
                      placeholder="e.g., 0.1 or -0.05"
                    />
                     <p className="text-xs text-gray-500 mt-1">Apply a positive or negative adjustment to the calculated rating.</p>
                  </div>
                   <div>
                    <Label htmlFor="performanceNotes">Performance Notes (Optional)</Label>
                    <textarea
                      id="performanceNotes"
                      value={ratingFactors.performanceNotes}
                      onChange={(e) => handleFactorChange('performanceNotes', e.target.value)}
                      placeholder="Add any notes regarding this adjustment or overall performance..."
                      rows={3}
                      className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 focus:ring-primary focus:border-primary"
                    />
                  </div>
                   {/* Add more editable fields here if necessary */}
                </div>
              </div>
            ) : (
              <div className="text-center py-10 text-gray-500">
                No rating data available for this employee.
              </div>
            )}
          </CardContent>
          {selectedEmployee && currentRating && !isLoading && (
            <CardFooter className="flex justify-end gap-3 border-t pt-4">
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" disabled={isSaving}>
                    <RotateCcw className="w-4 h-4 mr-2" />
                    Reset Rating
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Reset Rating Confirmation</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to reset the rating for <strong>{selectedEmployee.name}</strong> to the baseline (e.g., 4.0)? This will remove any manual adjustments and recalculate based on standard factors. This action cannot be undone immediately.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                       onClick={handleResetRating}
                       className="bg-red-600 hover:bg-red-700"
                    >
                      Confirm Reset
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>

              <Button onClick={handleSaveChanges} disabled={isSaving}>
                {isSaving ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Save className="w-4 h-4 mr-2" />
                )}
                Save Changes
              </Button>
            </CardFooter>
          )}
        </Card>
      )}
    </div>
  );
};

export default RatingManagement;