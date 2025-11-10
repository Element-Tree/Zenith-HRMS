import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Building2,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Users,
  FileText,
  DollarSign,
  ArrowLeft,
  Edit,
  Loader2,
  AlertCircle
} from 'lucide-react';
import { toast } from 'sonner';
import { formatDate } from '@/lib/utils';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const CompanyDetails = () => {
  const { companyId } = useParams();
  const navigate = useNavigate();
  const [company, setCompany] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchCompanyDetails();
  }, [companyId]);

  const fetchCompanyDetails = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${BACKEND_URL}/api/super-admin/companies/${companyId}`);
      setCompany(response.data);
    } catch (error) {
      console.error('Error fetching company details:', error);
      setError(error.response?.data?.detail || 'Failed to load company details');
      toast.error('Failed to load company details');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto">
        <Card>
          <CardContent className="p-12 text-center">
            <AlertCircle className="h-16 w-16 mx-auto text-red-500 mb-4" />
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
              Error Loading Company
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">{error}</p>
            <Button onClick={() => navigate('/super-admin/companies')} variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Companies
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            onClick={() => navigate('/super-admin/companies')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              {company?.company_name}
            </h1>
            <p className="mt-1 text-gray-600 dark:text-gray-400">
              Company Details
            </p>
          </div>
        </div>
        <Link to={`/super-admin/companies/${companyId}/edit`}>
          <Button className="bg-emerald-600 hover:bg-emerald-700">
            <Edit className="h-4 w-4 mr-2" />
            Edit Company
          </Button>
        </Link>
      </div>

      {/* Status Badge */}
      <div>
        <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
          company?.status === 'active'
            ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
            : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-400'
        }`}>
          {company?.status}
        </span>
      </div>

      {/* Company Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Building2 className="h-5 w-5 mr-2" />
            Company Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="text-sm text-gray-600 dark:text-gray-400">Company Name</label>
                <p className="text-lg font-medium text-gray-900 dark:text-white">
                  {company?.company_name}
                </p>
              </div>

              <div className="flex items-start space-x-3">
                <Mail className="h-5 w-5 text-gray-400 mt-0.5" />
                <div>
                  <label className="text-sm text-gray-600 dark:text-gray-400">Email</label>
                  <p className="text-gray-900 dark:text-white">{company?.contact_email}</p>
                </div>
              </div>

              {company?.phone && (
                <div className="flex items-start space-x-3">
                  <Phone className="h-5 w-5 text-gray-400 mt-0.5" />
                  <div>
                    <label className="text-sm text-gray-600 dark:text-gray-400">Phone</label>
                    <p className="text-gray-900 dark:text-white">{company.phone}</p>
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-4">
              {company?.address && (
                <div className="flex items-start space-x-3">
                  <MapPin className="h-5 w-5 text-gray-400 mt-0.5" />
                  <div>
                    <label className="text-sm text-gray-600 dark:text-gray-400">Address</label>
                    <p className="text-gray-900 dark:text-white">{company.address}</p>
                  </div>
                </div>
              )}

              <div className="flex items-start space-x-3">
                <Calendar className="h-5 w-5 text-gray-400 mt-0.5" />
                <div>
                  <label className="text-sm text-gray-600 dark:text-gray-400">Created On</label>
                  <p className="text-gray-900 dark:text-white">
                    {formatDate(company?.created_at)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Employees</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
                  {company?.statistics?.employee_count || 0}
                </p>
              </div>
              <div className="p-3 rounded-full bg-emerald-100 dark:bg-emerald-900/30">
                <Users className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Users</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
                  {company?.statistics?.user_count || 0}
                </p>
              </div>
              <div className="p-3 rounded-full bg-blue-100 dark:bg-blue-900/30">
                <Users className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Payroll Runs</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
                  {company?.statistics?.payroll_runs || 0}
                </p>
              </div>
              <div className="p-3 rounded-full bg-amber-100 dark:bg-amber-900/30">
                <DollarSign className="h-6 w-6 text-amber-600 dark:text-amber-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Subscription Info */}
      {company?.subscription_info && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <FileText className="h-5 w-5 mr-2" />
              Subscription
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-sm text-gray-600 dark:text-gray-400">Plan</label>
                <p className="text-lg font-medium text-gray-900 dark:text-white capitalize">
                  {company.subscription_info.plan}
                </p>
              </div>
              <div>
                <label className="text-sm text-gray-600 dark:text-gray-400">Status</label>
                <p className="text-lg font-medium text-gray-900 dark:text-white capitalize">
                  {company.subscription_info.status}
                </p>
              </div>
              <div>
                <label className="text-sm text-gray-600 dark:text-gray-400">Start Date</label>
                <p className="text-lg font-medium text-gray-900 dark:text-white">
                  {formatDate(company.subscription_info.start_date)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default CompanyDetails;
