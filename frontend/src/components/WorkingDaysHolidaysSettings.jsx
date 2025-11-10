import React, { useState, useEffect } from "react";
import axios from "axios";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
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
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Calendar,
  Download,
  Upload,
  Plus,
  Trash2,
  Edit,
  Save,
  FileSpreadsheet
} from "lucide-react";
import { toast } from "sonner";
import { formatDate } from "@/lib/utils";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const WorkingDaysHolidaysSettings = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [workingDaysConfig, setWorkingDaysConfig] = useState({
    saturday_policy: "alternate",
    off_saturdays: [1, 3],
    sunday_off: true
  });
  const [holidays, setHolidays] = useState([]);
  const [showAddHolidayDialog, setShowAddHolidayDialog] = useState(false);
  const [editingHoliday, setEditingHoliday] = useState(null);
  const [newHoliday, setNewHoliday] = useState({
    date: "",
    name: ""
  });
  const [importingHolidays, setImportingHolidays] = useState(false);
  const fileInputRef = React.useRef(null);

  useEffect(() => {
    fetchSettings();
    fetchHolidays();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await axios.get(`${API}/settings`);
      if (response.data.working_days_config) {
        setWorkingDaysConfig(response.data.working_days_config);
      }
    } catch (error) {
      console.error("Error fetching settings:", error);
      toast.error("Failed to load working days settings");
    } finally {
      setLoading(false);
    }
  };

  const fetchHolidays = async () => {
    try {
      const response = await axios.get(`${API}/holidays`);
      setHolidays(response.data);
    } catch (error) {
      console.error("Error fetching holidays:", error);
      toast.error("Failed to load holidays");
    }
  };

  const handleSaveWorkingDays = async () => {
    setSaving(true);
    try {
      // First get current settings
      const currentSettings = await axios.get(`${API}/settings`);
      
      // Update with new working_days_config
      const updatedSettings = {
        ...currentSettings.data,
        working_days_config: workingDaysConfig
      };

      await axios.put(`${API}/settings`, updatedSettings);
      toast.success("Working days settings saved successfully!");
    } catch (error) {
      console.error("Error saving working days settings:", error);
      toast.error("Failed to save working days settings");
    } finally {
      setSaving(false);
    }
  };

  const handleSaturdayPolicyChange = (policy) => {
    let offSaturdays = [1, 3]; // Default
    
    if (policy === "all_working") {
      offSaturdays = [];
    } else if (policy === "all_off") {
      offSaturdays = [1, 2, 3, 4, 5];
    } else if (policy === "alternate") {
      offSaturdays = [1, 3];
    }
    
    setWorkingDaysConfig({
      ...workingDaysConfig,
      saturday_policy: policy,
      off_saturdays: offSaturdays
    });
  };

  const handleOffSaturdayToggle = (saturdayNumber) => {
    const newOffSaturdays = workingDaysConfig.off_saturdays.includes(saturdayNumber)
      ? workingDaysConfig.off_saturdays.filter(s => s !== saturdayNumber)
      : [...workingDaysConfig.off_saturdays, saturdayNumber].sort();
    
    setWorkingDaysConfig({
      ...workingDaysConfig,
      saturday_policy: "custom",
      off_saturdays: newOffSaturdays
    });
  };

  const handleAddHoliday = async () => {
    if (!newHoliday.date || !newHoliday.name) {
      toast.error("Date and holiday name are required");
      return;
    }

    try {
      if (editingHoliday) {
        // Update existing holiday
        await axios.put(`${API}/holidays/${editingHoliday.id}`, newHoliday);
        toast.success("Holiday updated successfully!");
      } else {
        // Add new holiday
        await axios.post(`${API}/holidays`, newHoliday);
        toast.success("Holiday added successfully!");
      }
      fetchHolidays();
      setShowAddHolidayDialog(false);
      setEditingHoliday(null);
      setNewHoliday({ date: "", name: "" });
    } catch (error) {
      console.error("Error saving holiday:", error);
      toast.error(error.response?.data?.detail || "Failed to save holiday");
    }
  };

  const handleEditHoliday = (holiday) => {
    setEditingHoliday(holiday);
    setNewHoliday({
      date: holiday.date,
      name: holiday.name
    });
    setShowAddHolidayDialog(true);
  };

  const handleDeleteHoliday = async (holidayId) => {
    if (!confirm("Are you sure you want to delete this holiday?")) return;

    try {
      await axios.delete(`${API}/holidays/${holidayId}`);
      toast.success("Holiday deleted successfully!");
      fetchHolidays();
    } catch (error) {
      console.error("Error deleting holiday:", error);
      toast.error("Failed to delete holiday");
    }
  };

  const handleDownloadTemplate = async () => {
    try {
      const response = await axios.get(`${API}/holidays/export?template=true`, {
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'holidays_template.xlsx');
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      toast.success("Template downloaded successfully!");
    } catch (error) {
      console.error("Error downloading template:", error);
      toast.error("Failed to download template");
    }
  };

  const handleImportHolidays = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setImportingHolidays(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await axios.post(`${API}/holidays/import`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      toast.success(`Import completed! Imported: ${response.data.imported}, Skipped: ${response.data.skipped}, Errors: ${response.data.errors}`);
      
      if (response.data.errors > 0) {
        console.log("Import errors:", response.data.details.error_items);
      }
      
      fetchHolidays();
    } catch (error) {
      console.error("Error importing holidays:", error);
      toast.error(error.response?.data?.detail || "Failed to import holidays");
    } finally {
      setImportingHolidays(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  if (loading) {
    return <div className="p-6 text-gray-900 dark:text-gray-100">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Working Days Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Calendar className="h-5 w-5" />
            <span>Working Days Configuration</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Saturday Policy */}
          <div className="space-y-4">
            <Label className="text-base font-semibold text-gray-900 dark:text-gray-100">Saturday Working Policy</Label>
            <RadioGroup 
              value={workingDaysConfig.saturday_policy} 
              onValueChange={handleSaturdayPolicyChange}
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="all_working" id="all_working" />
                <Label htmlFor="all_working" className="font-normal cursor-pointer text-gray-700 dark:text-gray-300">
                  All Saturdays Working
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="all_off" id="all_off" />
                <Label htmlFor="all_off" className="font-normal cursor-pointer text-gray-700 dark:text-gray-300">
                  All Saturdays Off
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="alternate" id="alternate" />
                <Label htmlFor="alternate" className="font-normal cursor-pointer text-gray-700 dark:text-gray-300">
                  Alternate Saturdays (1st & 3rd OFF)
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="custom" id="custom" />
                <Label htmlFor="custom" className="font-normal cursor-pointer text-gray-700 dark:text-gray-300">
                  Custom Pattern
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Custom Saturday Selection */}
          {workingDaysConfig.saturday_policy === "custom" && (
            <div className="space-y-3 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
              <Label className="text-sm font-medium text-gray-900 dark:text-gray-100">Select which Saturdays are OFF:</Label>
              <div className="flex flex-wrap gap-4">
                {[1, 2, 3, 4, 5].map((num) => (
                  <div key={num} className="flex items-center space-x-2">
                    <Checkbox
                      id={`saturday-${num}`}
                      checked={workingDaysConfig.off_saturdays.includes(num)}
                      onCheckedChange={() => handleOffSaturdayToggle(num)}
                    />
                    <Label htmlFor={`saturday-${num}`} className="font-normal cursor-pointer text-gray-700 dark:text-gray-300">
                      {num === 1 ? "1st" : num === 2 ? "2nd" : num === 3 ? "3rd" : num === 4 ? "4th" : "5th"} Saturday
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Sunday Policy */}
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label className="text-base font-semibold">Sunday Policy</Label>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {workingDaysConfig.sunday_off 
                  ? "Sundays are holidays (non-working days)" 
                  : "Sundays are working days"}
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <Label htmlFor="sunday_off" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {workingDaysConfig.sunday_off ? "Holiday" : "Working Day"}
              </Label>
              <Switch
                id="sunday_off"
                checked={workingDaysConfig.sunday_off}
                onCheckedChange={(checked) =>
                  setWorkingDaysConfig({ ...workingDaysConfig, sunday_off: checked })
                }
              />
            </div>
          </div>

          {/* Save Button */}
          <div className="flex justify-end">
            <Button onClick={handleSaveWorkingDays} disabled={saving}>
              <Save className="w-4 h-4 mr-2" />
              {saving ? "Saving..." : "Save Working Days Settings"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Holidays Management */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <FileSpreadsheet className="h-5 w-5" />
              <span>Holidays Management</span>
            </div>
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm" onClick={handleDownloadTemplate}>
                <Download className="w-4 h-4 mr-2" />
                Download Template
              </Button>
              <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} disabled={importingHolidays}>
                <Upload className="w-4 h-4 mr-2" />
                {importingHolidays ? "Importing..." : "Import from Excel"}
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls"
                onChange={handleImportHolidays}
                style={{ display: 'none' }}
              />
              <Button size="sm" onClick={() => setShowAddHolidayDialog(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Add Holiday
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border border-gray-200 dark:border-gray-700">
            <Table>
              <TableHeader>
                <TableRow className="border-b border-gray-200 dark:border-gray-700">
                  <TableHead className="text-gray-700 dark:text-gray-300">Date</TableHead>
                  <TableHead className="text-gray-700 dark:text-gray-300">Holiday Name</TableHead>
                  <TableHead className="text-right text-gray-700 dark:text-gray-300">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {holidays.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center text-gray-500 dark:text-gray-400 py-8">
                      No holidays added yet. Add holidays manually or import from Excel.
                    </TableCell>
                  </TableRow>
                ) : (
                  holidays.map((holiday) => (
                    <TableRow key={holiday.id} className="border-b border-gray-200 dark:border-gray-700">
                      <TableCell className="font-medium text-gray-800 dark:text-gray-300">
                        {new Date(holiday.date).toLocaleDateString('en-IN', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric'
                        })}
                      </TableCell>
                      <TableCell className="text-gray-800 dark:text-gray-300">{holiday.name}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditHoliday(holiday)}
                          >
                            <Edit className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteHoliday(holiday.id)}
                          >
                            <Trash2 className="w-4 h-4 text-red-600 dark:text-red-400" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Add/Edit Holiday Dialog */}
      <Dialog open={showAddHolidayDialog} onOpenChange={(open) => {
        setShowAddHolidayDialog(open);
        if (!open) {
          setEditingHoliday(null);
          setNewHoliday({ date: "", name: "" });
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingHoliday ? 'Edit Holiday' : 'Add Holiday'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="holiday_date" className="text-gray-900 dark:text-gray-100">Date *</Label>
              <Input
                id="holiday_date"
                type="date"
                value={newHoliday.date}
                onChange={(e) => setNewHoliday({ ...newHoliday, date: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="holiday_name" className="text-gray-900 dark:text-gray-100">Holiday Name *</Label>
              <Input
                id="holiday_name"
                placeholder="e.g., Republic Day"
                value={newHoliday.name}
                onChange={(e) => setNewHoliday({ ...newHoliday, name: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddHolidayDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddHoliday}>
              {editingHoliday ? 'Update Holiday' : 'Add Holiday'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default WorkingDaysHolidaysSettings;
