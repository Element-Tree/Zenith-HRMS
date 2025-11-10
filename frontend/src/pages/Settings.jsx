import React, { useState, useEffect } from "react";
import axios from "axios";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
  Building2,
  User,
  Bell,
  Shield,
  Palette,
  Database,
  Mail,
  Download,
  Upload,
  Save,
  Settings as SettingsIcon,
  Calendar as CalendarIcon,
  Lock
} from "lucide-react";
import { toast } from "sonner";
import WorkingDaysHolidaysSettings from "@/components/WorkingDaysHolidaysSettings";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const Settings = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [backupInfo, setBackupInfo] = useState(null);
  const [downloading, setDownloading] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const fileInputRef = React.useRef(null);
  const [companySettings, setCompanySettings] = useState({
    company_name: 'PayrollPro Company',
    address: '123 Business District, Mumbai, Maharashtra - 400001',
    phone: '+91 22 1234 5678',
    email: 'hr@payrollpro.com',
    website: 'www.payrollpro.com',
    logo_url: null,
    pan: 'ABCDE1234F',
    tan: 'MUMB12345A',
    gstin: '27ABCDE1234F1Z5',
    cin: 'U74999MH2020PTC123456',
    pf_registration: 'MAHA/MUM/1234567',
    esi_registration: 'ESI123456789',
    pt_registration: 'PT123456789'
  });

  const [payrollSettings, setPayrollSettings] = useState({
    financial_year_start: 'april',
    salary_cycle: 'monthly',
    pay_date: 1,
    working_days_per_week: 5,
    working_hours_per_day: 8,
    overtime_calculation: 'enabled',
    auto_calculate_tax: true,
    include_weekends: false,
    leave_encashment: true
  });

  const [notificationSettings, setNotificationSettings] = useState({
    email_notifications: true,
    sms_notifications: false,
    payroll_reminders: true,
    compliance_alerts: true,
    birthday_reminders: true,
    leave_notifications: true,
    loan_reminders: true
  });

  const [securitySettings, setSecuritySettings] = useState({
    two_factor_auth: false,
    password_policy: 'medium',
    session_timeout: 30,
    audit_logging: true,
    data_encryption: true,
    backup_frequency: 'daily'
  });

  const [uiSettings, setUiSettings] = useState({
    theme: 'light',
    language: 'english',
    date_format: 'dd/mm/yyyy',
    currency_format: 'inr',
    timezone: 'ist'
  });

  const [passwordData, setPasswordData] = useState({
    current_password: '',
    new_password: '',
    confirm_password: ''
  });
  const [changingPassword, setChangingPassword] = useState(false);

  useEffect(() => {
    fetchSettings();
    fetchNotificationSettings();
    fetchBackupInfo();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await axios.get(`${API}/settings`);
      const settings = response.data;
      
      setCompanySettings(settings.company_settings);
      setPayrollSettings(settings.payroll_settings);
      
      // Load UI settings from localStorage as fallback
      const savedUiSettings = localStorage.getItem('uiSettings');
      if (savedUiSettings) {
        setUiSettings(JSON.parse(savedUiSettings));
      }
      
      const savedNotificationSettings = localStorage.getItem('notificationSettings');
      if (savedNotificationSettings) {
        setNotificationSettings(JSON.parse(savedNotificationSettings));
      }
      
      const savedSecuritySettings = localStorage.getItem('securitySettings');
      if (savedSecuritySettings) {
        setSecuritySettings(JSON.parse(savedSecuritySettings));
      }
      
      toast.success('Settings loaded successfully');
    } catch (error) {
      console.error('Error loading settings:', error);
      toast.error('Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const fetchNotificationSettings = async () => {
    try {
      const response = await axios.get(`${API}/notification-settings`);
      setNotificationSettings(response.data);
    } catch (error) {
      console.error('Error fetching notification settings:', error);
      // Fall back to default settings if API fails
    }
  };

  const fetchBackupInfo = async () => {
    try {
      const response = await axios.get(`${API}/backup/info`);
      setBackupInfo(response.data);
    } catch (error) {
      console.error('Error fetching backup info:', error);
    }
  };

  const handleDownloadBackup = async () => {
    setDownloading(true);
    try {
      const response = await axios.get(`${API}/backup/download`, {
        responseType: 'blob'
      });
      
      // Create download link
      const blob = new Blob([response.data], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `payroll_backup_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      toast.success('Backup downloaded successfully!');
      await fetchBackupInfo();
    } catch (error) {
      console.error('Error downloading backup:', error);
      toast.error('Failed to download backup');
    } finally {
      setDownloading(false);
    }
  };

  const handleRestoreBackup = async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    
    if (!file.name.endsWith('.json')) {
      toast.error('Please select a valid JSON backup file');
      return;
    }
    
    if (!window.confirm('⚠️ WARNING: This will restore all data from the backup file. Current data may be affected. Are you sure you want to continue?')) {
      event.target.value = null;
      return;
    }
    
    setRestoring(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await axios.post(`${API}/backup/restore`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      toast.success(`Backup restored successfully! ${response.data.stats.total_documents} documents restored.`);
      await fetchBackupInfo();
      
      // Optionally reload the page to reflect changes
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    } catch (error) {
      console.error('Error restoring backup:', error);
      toast.error(error.response?.data?.detail || 'Failed to restore backup');
    } finally {
      setRestoring(false);
      event.target.value = null;
    }
  };

  const handleCompanySettingChange = (field, value) => {
    setCompanySettings(prev => ({ ...prev, [field]: value }));
  };

  const handlePayrollSettingChange = (field, value) => {
    setPayrollSettings(prev => ({ ...prev, [field]: value }));
  };

  const handleNotificationChange = (field, value) => {
    setNotificationSettings(prev => ({ ...prev, [field]: value }));
  };

  const handleSecurityChange = (field, value) => {
    setSecuritySettings(prev => ({ ...prev, [field]: value }));
  };

  const handleUiChange = (field, value) => {
    setUiSettings(prev => ({ ...prev, [field]: value }));
  };

  const saveSettings = async () => {
    setSaving(true);
    try {
      const settingsData = {
        company_settings: companySettings,
        payroll_settings: payrollSettings
      };
      
      await axios.put(`${API}/settings`, settingsData);
      
      // Save notification settings to backend
      await axios.put(`${API}/notification-settings`, notificationSettings);
      
      // Save other settings to localStorage
      localStorage.setItem('securitySettings', JSON.stringify(securitySettings));
      localStorage.setItem('uiSettings', JSON.stringify(uiSettings));
      
      toast.success('Settings saved successfully');
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('Failed to save settings. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const testNotifications = async () => {
    try {
      const response = await axios.post(`${API}/test-notifications`);
      toast.success(response.data.message);
    } catch (error) {
      console.error('Error creating test notifications:', error);
      toast.error('Failed to create test notifications');
    }
  };

  const exportSettings = () => {
    const allSettings = {
      company: companySettings,
      payroll: payrollSettings,
      notifications: notificationSettings,
      security: securitySettings,
      ui: uiSettings
    };
    
    const dataStr = JSON.stringify(allSettings, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'payroll-settings.json';
    link.click();
    
    toast.success('Settings exported successfully');
  };

  const importSettings = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
          try {
            const settings = JSON.parse(e.target.result);
            if (settings.company) setCompanySettings(settings.company);
            if (settings.payroll) setPayrollSettings(settings.payroll);
            if (settings.notifications) setNotificationSettings(settings.notifications);
            if (settings.security) setSecuritySettings(settings.security);
            if (settings.ui) setUiSettings(settings.ui);
            toast.success('Settings imported successfully');
          } catch (error) {
            toast.error('Invalid settings file');
          }
        };
        reader.readAsText(file);
      }
    };
    input.click();
  };

  const handleLogoUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) { // 2MB limit
        toast.error('Logo file size should be less than 2MB');
        return;
      }
      
      if (!file.type.startsWith('image/')) {
        toast.error('Please select a valid image file');
        return;
      }
      
      const reader = new FileReader();
      reader.onload = (e) => {
        setCompanySettings(prev => ({
          ...prev,
          logo_url: e.target.result
        }));
        toast.success('Logo uploaded successfully');
      };
      reader.readAsDataURL(file);
    }
  };

  const removeLogo = () => {
    setCompanySettings(prev => ({
      ...prev,
      logo_url: null
    }));
    toast.success('Logo removed successfully');
  };

  const handlePasswordChange = (field, value) => {
    setPasswordData(prev => ({ ...prev, [field]: value }));
  };

  const changePassword = async () => {
    if (!passwordData.current_password || !passwordData.new_password || !passwordData.confirm_password) {
      toast.error('All password fields are required');
      return;
    }

    if (passwordData.new_password !== passwordData.confirm_password) {
      toast.error('New password and confirm password do not match');
      return;
    }

    if (passwordData.new_password.length < 6) {
      toast.error('New password must be at least 6 characters long');
      return;
    }

    setChangingPassword(true);
    try {
      await axios.post(`${API}/auth/change-password`, {
        current_password: passwordData.current_password,
        new_password: passwordData.new_password
      });
      
      setPasswordData({
        current_password: '',
        new_password: '',
        confirm_password: ''
      });
      
      toast.success('Password changed successfully');
    } catch (error) {
      console.error('Error changing password:', error);
      toast.error(error.response?.data?.detail || 'Failed to change password');
    } finally {
      setChangingPassword(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-10 bg-gray-200 rounded-lg w-64"></div>
        <div className="h-96 bg-gray-200 rounded-lg"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="settings">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
            Settings
          </h1>
          <p className="text-gray-500 dark:text-gray-400">
            Configure your payroll system preferences
          </p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={importSettings}>
            <Upload className="w-4 h-4 mr-2" />
            Import
          </Button>
          <Button variant="outline" onClick={exportSettings}>
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
          <Button 
            onClick={saveSettings} 
            disabled={saving}
            data-testid="save-settings-btn"
          >
            <Save className="w-4 h-4 mr-2" />
            {saving ? 'Saving...' : 'Save All'}
          </Button>
        </div>
      </div>

      {/* Tabs Navigation - Text with Underline */}
      <Tabs defaultValue="company" className="w-full">
        <div className="border-b border-gray-200 dark:border-gray-700 mb-6">
          <TabsList className="flex justify-start space-x-8 overflow-x-auto bg-transparent h-auto p-0">
            <TabsTrigger 
              value="company" 
              className="relative pb-3 text-sm font-medium transition-all duration-500 ease-in-out data-[state=active]:text-blue-600 data-[state=inactive]:text-gray-600 dark:data-[state=active]:text-blue-400 dark:data-[state=inactive]:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 border-b-2 border-transparent data-[state=active]:border-blue-600 dark:data-[state=active]:border-blue-400 rounded-none bg-transparent"
            >
              <Building2 className="h-4 w-4 inline mr-2" />
              Company
            </TabsTrigger>
            <TabsTrigger 
              value="payroll" 
              className="relative pb-3 text-sm font-medium transition-all duration-500 ease-in-out data-[state=active]:text-blue-600 data-[state=inactive]:text-gray-600 dark:data-[state=active]:text-blue-400 dark:data-[state=inactive]:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 border-b-2 border-transparent data-[state=active]:border-blue-600 dark:data-[state=active]:border-blue-400 rounded-none bg-transparent"
            >
              <SettingsIcon className="h-4 w-4 inline mr-2" />
              Payroll
            </TabsTrigger>
            <TabsTrigger 
              value="attendance" 
              className="relative pb-3 text-sm font-medium transition-all duration-500 ease-in-out data-[state=active]:text-blue-600 data-[state=inactive]:text-gray-600 dark:data-[state=active]:text-blue-400 dark:data-[state=inactive]:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 border-b-2 border-transparent data-[state=active]:border-blue-600 dark:data-[state=active]:border-blue-400 rounded-none bg-transparent"
            >
              <CalendarIcon className="h-4 w-4 inline mr-2" />
              Attendance
            </TabsTrigger>
            <TabsTrigger 
              value="notifications" 
              className="relative pb-3 text-sm font-medium transition-all duration-500 ease-in-out data-[state=active]:text-blue-600 data-[state=inactive]:text-gray-600 dark:data-[state=active]:text-blue-400 dark:data-[state=inactive]:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 border-b-2 border-transparent data-[state=active]:border-blue-600 dark:data-[state=active]:border-blue-400 rounded-none bg-transparent"
            >
              <Bell className="h-4 w-4 inline mr-2" />
              Notifications
            </TabsTrigger>
            <TabsTrigger 
              value="security" 
              className="relative pb-3 text-sm font-medium transition-all duration-500 ease-in-out data-[state=active]:text-blue-600 data-[state=inactive]:text-gray-600 dark:data-[state=active]:text-blue-400 dark:data-[state=inactive]:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 border-b-2 border-transparent data-[state=active]:border-blue-600 dark:data-[state=active]:border-blue-400 rounded-none bg-transparent"
            >
              <Lock className="h-4 w-4 inline mr-2" />
              Security
            </TabsTrigger>
            <TabsTrigger 
              value="advanced" 
              className="relative pb-3 text-sm font-medium transition-all duration-500 ease-in-out data-[state=active]:text-blue-600 data-[state=inactive]:text-gray-600 dark:data-[state=active]:text-blue-400 dark:data-[state=inactive]:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 border-b-2 border-transparent data-[state=active]:border-blue-600 dark:data-[state=active]:border-blue-400 rounded-none bg-transparent"
            >
              <Database className="h-4 w-4 inline mr-2" />
              Advanced
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Company Information Tab */}
        <TabsContent value="company" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
        {/* Company Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Building2 className="h-5 w-5" />
              <span>Company Information</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Company Name</Label>
              <Input
                value={companySettings.company_name}
                onChange={(e) => handleCompanySettingChange('company_name', e.target.value)}
                data-testid="company-name-input"
              />
            </div>
            
            <div>
              <Label>Address</Label>
              <Textarea
                value={companySettings.address}
                onChange={(e) => handleCompanySettingChange('address', e.target.value)}
                rows={3}
                data-testid="company-address-input"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Phone</Label>
                <Input
                  value={companySettings.phone}
                  onChange={(e) => handleCompanySettingChange('phone', e.target.value)}
                  data-testid="company-phone-input"
                />
              </div>
              <div>
                <Label>Email</Label>
                <Input
                  value={companySettings.email}
                  onChange={(e) => handleCompanySettingChange('email', e.target.value)}
                  data-testid="company-email-input"
                />
              </div>
            </div>
            
            <div>
              <Label>Website</Label>
              <Input
                value={companySettings.website}
                onChange={(e) => handleCompanySettingChange('website', e.target.value)}
              />
            </div>
            
            <div>
              <Label>Company Logo</Label>
              <div className="space-y-3">
                {companySettings.logo_url ? (
                  <div className="flex items-center space-x-4 p-3 border rounded-lg">
                    <img 
                      src={companySettings.logo_url} 
                      alt="Company Logo" 
                      className="w-16 h-16 object-contain border rounded"
                    />
                    <div className="flex-1">
                      <p className="text-sm text-gray-600">Logo uploaded successfully</p>
                      <div className="flex space-x-2 mt-2">
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => document.getElementById('logo-upload').click()}
                        >
                          Change Logo
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          onClick={removeLogo}
                        >
                          Remove
                        </Button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                    <Upload className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                    <p className="text-sm text-gray-600 mb-2">Upload company logo</p>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => document.getElementById('logo-upload').click()}
                    >
                      Choose File
                    </Button>
                    <p className="text-xs text-gray-500 mt-1">PNG, JPG up to 2MB</p>
                  </div>
                )}
                <input
                  id="logo-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleLogoUpload}
                  className="hidden"
                />
              </div>
            </div>
            
            <Separator />
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>PAN Number</Label>
                <Input
                  value={companySettings.pan}
                  onChange={(e) => handleCompanySettingChange('pan', e.target.value)}
                />
              </div>
              <div>
                <Label>TAN Number</Label>
                <Input
                  value={companySettings.tan}
                  onChange={(e) => handleCompanySettingChange('tan', e.target.value)}
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>GSTIN</Label>
                <Input
                  value={companySettings.gstin}
                  onChange={(e) => handleCompanySettingChange('gstin', e.target.value)}
                />
              </div>
              <div>
                <Label>CIN</Label>
                <Input
                  value={companySettings.cin}
                  onChange={(e) => handleCompanySettingChange('cin', e.target.value)}
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>PF Registration</Label>
                <Input
                  value={companySettings.pf_registration}
                  onChange={(e) => handleCompanySettingChange('pf_registration', e.target.value)}
                />
              </div>
              <div>
                <Label>ESI Registration</Label>
                <Input
                  value={companySettings.esi_registration}
                  onChange={(e) => handleCompanySettingChange('esi_registration', e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>
          </div>
        </TabsContent>

        {/* Payroll Configuration Tab */}
        <TabsContent value="payroll" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <SettingsIcon className="h-5 w-5" />
                <span>Payroll Configuration</span>
              </CardTitle>
            </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Financial Year Start</Label>
              <Select value={payrollSettings.financial_year_start} onValueChange={(value) => handlePayrollSettingChange('financial_year_start', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="april">April</SelectItem>
                  <SelectItem value="january">January</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Salary Cycle</Label>
                <Select value={payrollSettings.salary_cycle} onValueChange={(value) => handlePayrollSettingChange('salary_cycle', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="bi-weekly">Bi-weekly</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Pay Date</Label>
                <Input
                  type="number"
                  min="1"
                  max="31"
                  value={payrollSettings.pay_date}
                  onChange={(e) => handlePayrollSettingChange('pay_date', parseInt(e.target.value))}
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Working Days/Week</Label>
                <Input
                  type="number"
                  min="1"
                  max="7"
                  value={payrollSettings.working_days_per_week}
                  onChange={(e) => handlePayrollSettingChange('working_days_per_week', parseInt(e.target.value))}
                />
              </div>
              <div>
                <Label>Working Hours/Day</Label>
                <Input
                  type="number"
                  min="1"
                  max="24"
                  value={payrollSettings.working_hours_per_day}
                  onChange={(e) => handlePayrollSettingChange('working_hours_per_day', parseInt(e.target.value))}
                />
              </div>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Auto Calculate Tax</Label>
                <Switch 
                  checked={payrollSettings.auto_calculate_tax}
                  onCheckedChange={(checked) => handlePayrollSettingChange('auto_calculate_tax', checked)}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <Label>Include Weekends</Label>
                <Switch 
                  checked={payrollSettings.include_weekends}
                  onCheckedChange={(checked) => handlePayrollSettingChange('include_weekends', checked)}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <Label>Leave Encashment</Label>
                <Switch 
                  checked={payrollSettings.leave_encashment}
                  onCheckedChange={(checked) => handlePayrollSettingChange('leave_encashment', checked)}
                />
              </div>
            </div>
          </CardContent>
        </Card>
        </TabsContent>

        {/* Attendance & Working Days Tab */}
        <TabsContent value="attendance" className="space-y-6">
          <WorkingDaysHolidaysSettings />
        </TabsContent>

        {/* Notifications Tab */}
        <TabsContent value="notifications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Bell className="h-5 w-5" />
                <span>Notification Preferences</span>
              </CardTitle>
            </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Email Notifications</Label>
                <Switch 
                  checked={notificationSettings.email_notifications}
                  onCheckedChange={(checked) => handleNotificationChange('email_notifications', checked)}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <Label>SMS Notifications</Label>
                <Switch 
                  checked={notificationSettings.sms_notifications}
                  onCheckedChange={(checked) => handleNotificationChange('sms_notifications', checked)}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <Label>Payroll Reminders</Label>
                <Switch 
                  checked={notificationSettings.payroll_reminders}
                  onCheckedChange={(checked) => handleNotificationChange('payroll_reminders', checked)}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <Label>Compliance Alerts</Label>
                <Switch 
                  checked={notificationSettings.compliance_alerts}
                  onCheckedChange={(checked) => handleNotificationChange('compliance_alerts', checked)}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <Label>Birthday Reminders</Label>
                <Switch 
                  checked={notificationSettings.birthday_reminders}
                  onCheckedChange={(checked) => handleNotificationChange('birthday_reminders', checked)}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <Label>Leave Notifications</Label>
                <Switch 
                  checked={notificationSettings.leave_notifications}
                  onCheckedChange={(checked) => handleNotificationChange('leave_notifications', checked)}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <Label>Loan Reminders</Label>
                <Switch 
                  checked={notificationSettings.loan_reminders}
                  onCheckedChange={(checked) => handleNotificationChange('loan_reminders', checked)}
                />
              </div>
            </div>
            
            <div className="pt-4 border-t">
              <Button 
                onClick={testNotifications}
                variant="outline"
                className="w-full"
              >
                <Bell className="w-4 h-4 mr-2" />
                Test Notifications
              </Button>
            </div>
          </CardContent>
        </Card>
        </TabsContent>

        {/* Security & Privacy Tab */}
        <TabsContent value="security" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Shield className="h-5 w-5" />
                  <span>Security Settings</span>
                </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Two-Factor Authentication</Label>
              <Switch 
                checked={securitySettings.two_factor_auth}
                onCheckedChange={(checked) => handleSecurityChange('two_factor_auth', checked)}
              />
            </div>
            
            <div>
              <Label>Password Policy</Label>
              <Select value={securitySettings.password_policy} onValueChange={(value) => handleSecurityChange('password_policy', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low (6+ characters)</SelectItem>
                  <SelectItem value="medium">Medium (8+ chars, mixed case)</SelectItem>
                  <SelectItem value="high">High (12+ chars, mixed case, special)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label>Session Timeout (minutes)</Label>
              <Input
                type="number"
                min="5"
                max="480"
                value={securitySettings.session_timeout}
                onChange={(e) => handleSecurityChange('session_timeout', parseInt(e.target.value))}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <Label>Audit Logging</Label>
              <Switch 
                checked={securitySettings.audit_logging}
                onCheckedChange={(checked) => handleSecurityChange('audit_logging', checked)}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <Label>Data Encryption</Label>
              <Switch 
                checked={securitySettings.data_encryption}
                onCheckedChange={(checked) => handleSecurityChange('data_encryption', checked)}
              />
            </div>
            
            <div>
              <Label>Backup Frequency</Label>
              <Select value={securitySettings.backup_frequency} onValueChange={(value) => handleSecurityChange('backup_frequency', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="hourly">Hourly</SelectItem>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Change Password */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Shield className="h-5 w-5" />
              <span>Change Password</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="current_password">Current Password</Label>
              <Input
                id="current_password"
                type="password"
                value={passwordData.current_password}
                onChange={(e) => handlePasswordChange('current_password', e.target.value)}
                placeholder="Enter current password"
              />
            </div>
            
            <div>
              <Label htmlFor="new_password">New Password</Label>
              <Input
                id="new_password"
                type="password"
                value={passwordData.new_password}
                onChange={(e) => handlePasswordChange('new_password', e.target.value)}
                placeholder="Enter new password (min 6 characters)"
              />
            </div>
            
            <div>
              <Label htmlFor="confirm_password">Confirm New Password</Label>
              <Input
                id="confirm_password"
                type="password"
                value={passwordData.confirm_password}
                onChange={(e) => handlePasswordChange('confirm_password', e.target.value)}
                placeholder="Confirm new password"
              />
            </div>
            
            <Button 
              onClick={changePassword}
              disabled={changingPassword || !passwordData.current_password || !passwordData.new_password || !passwordData.confirm_password}
              className="w-full"
            >
              {changingPassword ? 'Changing Password...' : 'Change Password'}
            </Button>
          </CardContent>
        </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Palette className="h-5 w-5" />
                  <span>User Interface</span>
                </CardTitle>
              </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Theme</Label>
              <Select value={uiSettings.theme} onValueChange={(value) => handleUiChange('theme', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="light">Light</SelectItem>
                  <SelectItem value="dark">Dark</SelectItem>
                  <SelectItem value="auto">Auto</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label>Language</Label>
              <Select value={uiSettings.language} onValueChange={(value) => handleUiChange('language', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="english">English</SelectItem>
                  <SelectItem value="hindi">Hindi</SelectItem>
                  <SelectItem value="marathi">Marathi</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label>Date Format</Label>
              <Select value={uiSettings.date_format} onValueChange={(value) => handleUiChange('date_format', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="dd/mm/yyyy">DD/MM/YYYY</SelectItem>
                  <SelectItem value="mm/dd/yyyy">MM/DD/YYYY</SelectItem>
                  <SelectItem value="yyyy-mm-dd">YYYY-MM-DD</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label>Currency Format</Label>
              <Select value={uiSettings.currency_format} onValueChange={(value) => handleUiChange('currency_format', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="inr">Indian Rupee (₹)</SelectItem>
                  <SelectItem value="usd">US Dollar ($)</SelectItem>
                  <SelectItem value="eur">Euro (€)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label>Timezone</Label>
              <Select value={uiSettings.timezone} onValueChange={(value) => handleUiChange('timezone', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ist">IST (UTC+5:30)</SelectItem>
                  <SelectItem value="utc">UTC (UTC+0:00)</SelectItem>
                  <SelectItem value="pst">PST (UTC-8:00)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
          </div>
        </TabsContent>

        {/* Advanced Settings Tab */}
        <TabsContent value="advanced" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Database className="h-5 w-5" />
                <span>Data Management & Backup</span>
              </CardTitle>
            </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <h4 className="font-medium text-yellow-800 mb-2">Backup & Restore</h4>
              <p className="text-sm text-yellow-700 mb-3">
                Regular backups help protect your payroll data.
                {backupInfo && (
                  <span className="block mt-1">
                    <strong>Total Documents:</strong> {backupInfo.total_documents.toLocaleString()}
                  </span>
                )}
              </p>
              {backupInfo && (
                <div className="text-xs text-yellow-600 mb-3 grid grid-cols-2 gap-2">
                  <div>Employees: {backupInfo.collections.employees || 0}</div>
                  <div>Payslips: {backupInfo.collections.payslips || 0}</div>
                  <div>Leaves: {backupInfo.collections.leave_requests || 0}</div>
                  <div>Loans: {backupInfo.collections.loans || 0}</div>
                </div>
              )}
              <div className="flex space-x-2">
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={handleDownloadBackup}
                  disabled={downloading}
                >
                  <Download className="w-4 h-4 mr-2" />
                  {downloading ? 'Downloading...' : 'Download Backup'}
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json"
                  onChange={handleRestoreBackup}
                  className="hidden"
                />
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={restoring}
                >
                  <Upload className="w-4 h-4 mr-2" />
                  {restoring ? 'Restoring...' : 'Restore Backup'}
                </Button>
              </div>
            </div>
            
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <h4 className="font-medium text-red-800 mb-2">Data Cleanup</h4>
              <p className="text-sm text-red-700 mb-3">
                Remove old attendance records and archived employee data
              </p>
              <Button size="sm" variant="destructive">
                Clean Old Data
              </Button>
            </div>
          </CardContent>
        </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Settings;