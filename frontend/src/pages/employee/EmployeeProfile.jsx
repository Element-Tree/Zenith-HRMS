import React, { useState, useRef, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  User,
  Camera,
  Upload,
  Trash2,
  Save,
  Edit,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Building2,
  CreditCard,
  Loader2
} from 'lucide-react';
import { toast } from 'sonner';
import axios from 'axios';
import ImageCropperDialog from '@/components/ImageCropperDialog';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const EmployeeProfile = () => {
  const { user } = useAuth();
  const context = useOutletContext();
  const employeeData = context?.employeeData;
  const refreshEmployeeData = context?.refreshEmployeeData;
  
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [cropperOpen, setCropperOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const fileInputRef = useRef(null);
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    marital_status: '',
    emergency_contact_name: '',
    emergency_contact_phone: '',
    blood_group: '',
    bank_info: {
      bank_name: '',
      account_number: '',
      ifsc_code: '',
      branch: ''
    }
  });

  // Update form data when employeeData changes
  React.useEffect(() => {
    if (employeeData) {
      setFormData({
        name: employeeData?.name || '',
        email: employeeData?.email || '',
        phone: employeeData?.phone || '',
        address: employeeData?.address || '',
        marital_status: employeeData?.marital_status || '',
        emergency_contact_name: employeeData?.emergency_contact_name || '',
        emergency_contact_phone: employeeData?.emergency_contact_phone || '',
        blood_group: employeeData?.blood_group || '',
        bank_info: {
          bank_name: employeeData?.bank_info?.bank_name || '',
          account_number: employeeData?.bank_info?.account_number || '',
          ifsc_code: employeeData?.bank_info?.ifsc_code || '',
          branch: employeeData?.bank_info?.branch || ''
        }
      });
    }
  }, [employeeData]);

  const handleInputChange = (field, value) => {
    if (field.includes('bank_')) {
      const bankField = field.replace('bank_', '');
      setFormData(prev => ({
        ...prev,
        bank_info: {
          ...prev.bank_info,
          [bankField]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: value
      }));
    }
  };

  const handlePhotoUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select a valid image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size must be less than 5MB');
      return;
    }

    // Read file as data URL for cropper
    const reader = new FileReader();
    reader.onload = () => {
      setSelectedImage(reader.result);
      setCropperOpen(true);
    };
    reader.readAsDataURL(file);
  };

  const handleCropComplete = async (croppedImageBase64) => {
    setUploadingPhoto(true);
    
    try {
      // Send base64 image to backend
      const response = await axios.post(`${API}/employees/upload-photo-base64`, {
        employee_id: user.employee_id,
        photo_base64: croppedImageBase64
      });

      toast.success('Profile photo updated successfully');
      
      // Refresh employee data to show new photo
      if (refreshEmployeeData) {
        await refreshEmployeeData();
      }
      
    } catch (error) {
      console.error('Error uploading photo:', error);
      toast.error('Failed to upload photo. Please try again.');
    } finally {
      setUploadingPhoto(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemovePhoto = async () => {
    try {
      setUploadingPhoto(true);
      await axios.delete(`${API}/employees/${user.employee_id}/photo`);
      toast.success('Profile photo removed');
      
      if (refreshEmployeeData) {
        await refreshEmployeeData();
      }
    } catch (error) {
      console.error('Error removing photo:', error);
      toast.error('Failed to remove photo');
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await axios.put(`${API}/employees/${user.employee_id}`, formData);
      toast.success('Profile updated successfully');
      setEditing(false);
      
      if (refreshEmployeeData) {
        refreshEmployeeData();
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    // Reset form data to original values
    if (employeeData) {
      setFormData({
        name: employeeData?.name || '',
        email: employeeData?.email || '',
        phone: employeeData?.phone || '',
        address: employeeData?.address || '',
        marital_status: employeeData?.marital_status || '',
        emergency_contact_name: employeeData?.emergency_contact_name || '',
        emergency_contact_phone: employeeData?.emergency_contact_phone || '',
        blood_group: employeeData?.blood_group || '',
        bank_info: {
          bank_name: employeeData?.bank_info?.bank_name || '',
          account_number: employeeData?.bank_info?.account_number || '',
          ifsc_code: employeeData?.bank_info?.ifsc_code || '',
          branch: employeeData?.bank_info?.branch || ''
        }
      });
    }
    setEditing(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">My Profile</h1>
          <p className="text-gray-500">Manage your personal information and preferences</p>
        </div>
        <div className="flex space-x-2">
          {!editing ? (
            <Button onClick={() => setEditing(true)} className="flex items-center space-x-2">
              <Edit className="h-4 w-4" />
              <span>Edit Profile</span>
            </Button>
          ) : (
            <div className="flex space-x-2">
              <Button variant="outline" onClick={handleCancel}>
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={saving}>
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Save Changes
                  </>
                )}
              </Button>
            </div>
          )}
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Profile Photo Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Camera className="h-5 w-5" />
              <span>Profile Photo</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <Avatar className="h-32 w-32 mx-auto">
              <AvatarImage src={employeeData?.photo_url} alt="Profile photo" />
              <AvatarFallback className="text-2xl bg-blue-600 text-white">
                {employeeData?.name?.split(' ').map(n => n[0]).join('') || user?.username?.slice(0,2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            
            <div className="space-y-2">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handlePhotoUpload}
                accept="image/*"
                className="hidden"
              />
              
              <Button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingPhoto}
                className="w-full"
                size="sm"
              >
                {uploadingPhoto ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-2" />
                    {employeeData?.photo_url ? 'Change Photo' : 'Upload Photo'}
                  </>
                )}
              </Button>
              
              {employeeData?.photo_url && (
                <Button
                  variant="outline"
                  onClick={handleRemovePhoto}
                  disabled={uploadingPhoto}
                  className="w-full"
                  size="sm"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Remove Photo
                </Button>
              )}
            </div>
            
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Supported: JPG, PNG, GIF. Max size: 5MB
            </p>
          </CardContent>
        </Card>

        {/* Personal Information */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <User className="h-5 w-5" />
              <span>Personal Information</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Basic Info */}
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="name" className="block text-sm font-bold !text-gray-900 dark:!text-gray-200 mb-1.5" style={{color: '#111827', fontWeight: 600}}>Full Name</label>
                <Input
                  id="name"
                  value={editing ? formData.name : employeeData?.name || ''}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  disabled={!editing}
                />
              </div>
              <div>
                <label htmlFor="email" className="block text-sm font-bold !text-gray-900 dark:!text-gray-200 mb-1.5" style={{color: '#111827', fontWeight: 600}}>Email Address</label>
                <Input
                  id="email"
                  type="email"
                  value={employeeData?.email || ''}
                  disabled={true}
                  className="bg-gray-50 dark:bg-gray-800 cursor-not-allowed dark:text-gray-400"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Email can only be updated by admin</p>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="phone" className="block text-sm font-bold !text-gray-900 dark:!text-gray-200 mb-1.5" style={{color: '#111827', fontWeight: 600}}>Phone Number</label>
                <Input
                  id="phone"
                  value={editing ? formData.phone : employeeData?.phone || ''}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  disabled={!editing}
                />
              </div>
              <div>
                <label htmlFor="marital_status" className="block text-sm font-bold !text-gray-900 dark:!text-gray-200 mb-1.5" style={{color: '#111827', fontWeight: 600}}>Marital Status</label>
                {editing ? (
                  <Select value={formData.marital_status} onValueChange={(value) => handleInputChange('marital_status', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="single">Single</SelectItem>
                      <SelectItem value="married">Married</SelectItem>
                      <SelectItem value="divorced">Divorced</SelectItem>
                      <SelectItem value="widowed">Widowed</SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  <Input value={employeeData?.marital_status || ''} disabled />
                )}
              </div>
            </div>

            <div>
              <label htmlFor="address" className="block text-sm font-bold !text-gray-900 dark:!text-gray-200 mb-1.5" style={{color: '#111827', fontWeight: 600}}>Address</label>
              <Textarea
                id="address"
                value={editing ? formData.address : employeeData?.address || ''}
                onChange={(e) => handleInputChange('address', e.target.value)}
                disabled={!editing}
                rows={3}
              />
            </div>

            {/* Emergency Contact */}
            <div className="border-t pt-4">
              <h3 className="font-semibold mb-3 text-gray-900 dark:text-gray-100">Emergency Contact & Medical Information</h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="emergency_contact_name" className="block text-sm font-bold !text-gray-900 dark:!text-gray-200 mb-1.5" style={{color: '#111827', fontWeight: 600}}>Emergency Contact Name</label>
                  <Input
                    id="emergency_contact_name"
                    value={editing ? formData.emergency_contact_name : employeeData?.emergency_contact_name || ''}
                    onChange={(e) => handleInputChange('emergency_contact_name', e.target.value)}
                    disabled={!editing}
                  />
                </div>
                <div>
                  <label htmlFor="emergency_contact_phone" className="block text-sm font-bold !text-gray-900 dark:!text-gray-200 mb-1.5" style={{color: '#111827', fontWeight: 600}}>Emergency Contact Phone</label>
                  <Input
                    id="emergency_contact_phone"
                    value={editing ? formData.emergency_contact_phone : employeeData?.emergency_contact_phone || ''}
                    onChange={(e) => handleInputChange('emergency_contact_phone', e.target.value)}
                    disabled={!editing}
                  />
                </div>
              </div>
              <div className="grid md:grid-cols-2 gap-4 mt-4">
                <div>
                  <label htmlFor="blood_group" className="block text-sm font-bold !text-gray-900 dark:!text-gray-200 mb-1.5" style={{color: '#111827', fontWeight: 600}}>Blood Group</label>
                  {editing ? (
                    <Select value={formData.blood_group} onValueChange={(value) => handleInputChange('blood_group', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select blood group" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="A+">A RhD positive (A+)</SelectItem>
                        <SelectItem value="A-">A RhD negative (A-)</SelectItem>
                        <SelectItem value="B+">B RhD positive (B+)</SelectItem>
                        <SelectItem value="B-">B RhD negative (B-)</SelectItem>
                        <SelectItem value="O+">O RhD positive (O+)</SelectItem>
                        <SelectItem value="O-">O RhD negative (O-)</SelectItem>
                        <SelectItem value="AB+">AB RhD positive (AB+)</SelectItem>
                        <SelectItem value="AB-">AB RhD negative (AB-)</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <Input value={employeeData?.blood_group || ''} disabled />
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Employment Details */}
      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Building2 className="h-5 w-5" />
              <span>Employment Details</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-gray-500">Employee ID</p>
                <p className="font-semibold">{employeeData?.employee_id}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Status</p>
                <Badge variant={employeeData?.status === 'active' ? 'default' : 'secondary'}>
                  {employeeData?.status}
                </Badge>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-gray-500">Department</p>
                <p className="font-semibold">{employeeData?.department}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Designation</p>
                <p className="font-semibold">{employeeData?.designation}</p>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-gray-500">Date of Joining</p>
                <p className="font-semibold">
                  {employeeData?.date_of_joining ? 
                    new Date(employeeData.date_of_joining).toLocaleDateString() : 
                    'Not available'
                  }
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Work Location</p>
                <p className="font-semibold">{employeeData?.work_location}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Bank Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <CreditCard className="h-5 w-5" />
              <span>Bank Information</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="bank_name" className="block text-sm font-bold !text-gray-900 dark:!text-gray-200 mb-1.5" style={{color: '#111827', fontWeight: 600}}>Bank Name</label>
                <Input
                  id="bank_name"
                  value={editing ? formData.bank_info.bank_name : employeeData?.bank_info?.bank_name || ''}
                  onChange={(e) => handleInputChange('bank_bank_name', e.target.value)}
                  disabled={!editing}
                />
              </div>
              <div>
                <label htmlFor="branch" className="block text-sm font-bold !text-gray-900 dark:!text-gray-200 mb-1.5" style={{color: '#111827', fontWeight: 600}}>Branch</label>
                <Input
                  id="branch"
                  value={editing ? formData.bank_info.branch : employeeData?.bank_info?.branch || ''}
                  onChange={(e) => handleInputChange('bank_branch', e.target.value)}
                  disabled={!editing}
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="account_number" className="block text-sm font-bold !text-gray-900 dark:!text-gray-200 mb-1.5" style={{color: '#111827', fontWeight: 600}}>Account Number</label>
                <Input
                  id="account_number"
                  value={editing ? formData.bank_info.account_number : employeeData?.bank_info?.account_number || ''}
                  onChange={(e) => handleInputChange('bank_account_number', e.target.value)}
                  disabled={!editing}
                />
              </div>
              <div>
                <label htmlFor="ifsc_code" className="block text-sm font-bold !text-gray-900 dark:!text-gray-200 mb-1.5" style={{color: '#111827', fontWeight: 600}}>IFSC Code</label>
                <Input
                  id="ifsc_code"
                  value={editing ? formData.bank_info.ifsc_code : employeeData?.bank_info?.ifsc_code || ''}
                  onChange={(e) => handleInputChange('bank_ifsc_code', e.target.value.toUpperCase())}
                  disabled={!editing}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Image Cropper Dialog */}
      <ImageCropperDialog
        open={cropperOpen}
        onClose={() => {
          setCropperOpen(false);
          setSelectedImage(null);
          if (fileInputRef.current) {
            fileInputRef.current.value = '';
          }
        }}
        imageSrc={selectedImage}
        onCropComplete={handleCropComplete}
      />
    </div>
  );
};

export default EmployeeProfile;