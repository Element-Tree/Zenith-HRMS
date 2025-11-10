import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
  FolderOpen,
  FileText,
  Download,
  Upload,
  Eye,
  Calendar,
  Shield,
  Award,
  CreditCard,
  User,
  Building2,
  Search,
  Filter,
  Trash2
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

const EmployeeDocuments = () => {
  const { user } = useAuth();
  const [documents, setDocuments] = useState([]);
  const [filteredDocuments, setFilteredDocuments] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [selectedDocument, setSelectedDocument] = useState(null);

  useEffect(() => {
    fetchDocuments();
  }, []);

  useEffect(() => {
    filterDocuments();
  }, [documents, searchTerm, filterCategory]);

  const fetchDocuments = () => {
    // Mock documents data - DISABLED FOR PRODUCTION
    // TODO: Implement real document management API
    const mockDocuments = [];
    
    // Uncomment below for development/demo only
    /*
    const mockDocuments = [
      {
        id: '1',
        name: 'Employment Contract',
        category: 'Employment',
        type: 'PDF',
        size: '2.5 MB',
        uploaded_date: '2024-01-15',
        uploaded_by: 'HR Department',
        description: 'Official employment agreement and terms',
        url: '#',
        status: 'active'
      },
      // ... rest of mock documents
    ];
    */
    
    setDocuments(mockDocuments);
  };

  const filterDocuments = () => {
    let filtered = documents;

    if (searchTerm) {
      filtered = filtered.filter(doc =>
        doc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doc.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (filterCategory !== 'all') {
      filtered = filtered.filter(doc => doc.category === filterCategory);
    }

    setFilteredDocuments(filtered);
  };

  const handleDownload = (document) => {
    // Mock download - in real implementation, this would trigger actual file download
    toast.success(`Downloading ${document.name}`);
  };

  const handleDelete = (document) => {
    // Show confirmation dialog
    if (window.confirm(`Are you sure you want to delete "${document.name}"?`)) {
      // Remove document from state (in real implementation, this would call API)
      const updatedDocuments = documents.filter(doc => doc.id !== document.id);
      setDocuments(updatedDocuments);
      toast.success(`Deleted ${document.name}`);
    }
  };

  const handlePreview = (document) => {
    setSelectedDocument(document);
  };

  const getDocumentIcon = (category) => {
    const icons = {
      Employment: Shield,
      Identity: User,
      Banking: CreditCard,
      Education: Award,
      Experience: Building2,
      Medical: FileText,
      Tax: Calendar
    };
    const Icon = icons[category] || FileText;
    return <Icon className="h-5 w-5 text-blue-600 dark:text-blue-400" />;
  };

  const getStatusBadge = (status) => {
    const badgeClasses = {
      active: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border dark:border-emerald-500/30',
      verified: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border dark:border-blue-500/30',
      pending: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400 border dark:border-yellow-500/30',
      expired: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border dark:border-red-500/30'
    };
    
    return (
      <Badge className={badgeClasses[status] || 'border dark:border-gray-600'}>
        {status}
      </Badge>
    );
  };

  const getCategoryStats = () => {
    const stats = {};
    documents.forEach(doc => {
      stats[doc.category] = (stats[doc.category] || 0) + 1;
    });
    return stats;
  };

  const categoryStats = getCategoryStats();
  const categories = ['Employment', 'Identity', 'Banking', 'Education', 'Experience', 'Medical', 'Tax'];

  return (
    <div className="space-y-6">
      {/* Warning Banner - Document Management Not Implemented */}
      {documents.length === 0 && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-semibold text-blue-800 dark:text-blue-300">
                Document Management System
              </h3>
              <p className="text-sm text-blue-700 dark:text-blue-400 mt-1">
                Document upload and management functionality requires backend API implementation. This feature is currently under development.
              </p>
            </div>
          </div>
        </div>
      )}


      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">My Documents</h1>
          <p className="text-gray-500">View and manage your employment documents</p>
        </div>
        <Button className="flex items-center space-x-2">
          <Upload className="h-4 w-4" />
          <span>Upload Document</span>
        </Button>
      </div>

      {/* Document Categories Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
        {categories.map((category) => (
          <Card key={category} className="hover:shadow-md transition-shadow cursor-pointer">
            <CardContent className="p-4 text-center">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-2">
                {getDocumentIcon(category)}
              </div>
              <p className="text-sm font-medium text-gray-700">{category}</p>
              <p className="text-lg font-bold text-blue-600">{categoryStats[category] || 0}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search documents..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex items-center space-x-2">
              <Filter className="h-4 w-4 text-gray-500" />
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="px-3 py-2 border dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 dark:text-gray-200"
              >
                <option value="all">All Categories</option>
                {categories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Documents Table */}
      <Card>
        <CardHeader>
          <CardTitle>Document List</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto border border-gray-200 dark:border-gray-700 rounded-lg">
            <Table>
              <TableHeader>
                <TableRow className="border-b border-gray-200 dark:border-gray-700">
                  <TableHead className="text-gray-700 dark:text-gray-300">Document</TableHead>
                  <TableHead className="text-gray-700 dark:text-gray-300">Category</TableHead>
                  <TableHead className="text-gray-700 dark:text-gray-300">Type</TableHead>
                  <TableHead className="text-gray-700 dark:text-gray-300">Size</TableHead>
                  <TableHead className="text-gray-700 dark:text-gray-300">Uploaded</TableHead>
                  <TableHead className="text-gray-700 dark:text-gray-300">Status</TableHead>
                  <TableHead className="text-gray-700 dark:text-gray-300">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDocuments.map((document) => (
                  <TableRow key={document.id} className="border-b border-gray-200 dark:border-gray-700">
                    <TableCell>
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-blue-100 dark:bg-blue-500/20 rounded-lg flex items-center justify-center">
                          {getDocumentIcon(document.category)}
                        </div>
                        <div>
                          <p className="font-medium dark:text-gray-200">{document.name}</p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">{document.description}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="dark:text-gray-300">{document.category}</TableCell>
                    <TableCell>
                      <Badge className="border dark:border-gray-600 dark:text-gray-300" variant="outline">{document.type}</Badge>
                    </TableCell>
                    <TableCell className="dark:text-gray-300">{document.size}</TableCell>
                    <TableCell>
                      <div>
                        <p className="dark:text-gray-300">{format(new Date(document.uploaded_date), 'dd MMM yyyy')}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">by {document.uploaded_by}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(document.status)}
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handlePreview(document)}
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl">
                            <DialogHeader>
                              <DialogTitle>Document Preview</DialogTitle>
                            </DialogHeader>
                            {selectedDocument && (
                              <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Document Name</p>
                                    <p className="font-semibold dark:text-gray-200">{selectedDocument.name}</p>
                                  </div>
                                  <div>
                                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Category</p>
                                    <p className="dark:text-gray-200">{selectedDocument.category}</p>
                                  </div>
                                  <div>
                                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">File Type</p>
                                    <p className="dark:text-gray-200">{selectedDocument.type}</p>
                                  </div>
                                  <div>
                                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">File Size</p>
                                    <p className="dark:text-gray-200">{selectedDocument.size}</p>
                                  </div>
                                  <div>
                                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Uploaded Date</p>
                                    <p className="dark:text-gray-200">{format(new Date(selectedDocument.uploaded_date), 'dd MMM yyyy')}</p>
                                  </div>
                                  <div>
                                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Uploaded By</p>
                                    <p className="dark:text-gray-200">{selectedDocument.uploaded_by}</p>
                                  </div>
                                </div>
                                
                                <div>
                                  <p className="text-sm font-medium text-gray-500">Description</p>
                                  <p>{selectedDocument.description}</p>
                                </div>

                                <div>
                                  <p className="text-sm font-medium text-gray-500">Status</p>
                                  <div className="mt-1">
                                    {getStatusBadge(selectedDocument.status)}
                                  </div>
                                </div>

                                {/* Mock PDF Viewer */}
                                <div className="bg-gray-100 rounded-lg p-8 text-center">
                                  <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                                  <p className="text-gray-600">Document Preview</p>
                                  <p className="text-sm text-gray-500 mt-2">
                                    {selectedDocument.name} - {selectedDocument.type}
                                  </p>
                                </div>
                              </div>
                            )}
                          </DialogContent>
                        </Dialog>

                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDownload(document)}
                        >
                          <Download className="w-4 h-4" />
                        </Button>
                        
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(document)}
                          className="hover:bg-red-50 hover:text-red-600"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {filteredDocuments.length === 0 && (
            <div className="text-center py-8">
              <FolderOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No documents found</h3>
              <p className="text-gray-500">
                {searchTerm || filterCategory !== 'all'
                  ? 'Try adjusting your search or filter criteria'
                  : 'Your documents will appear here once uploaded'}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Document Upload Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>Document Upload Guidelines</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold mb-3">Required Documents</h3>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                  <span>Identity Proof (Aadhar/Passport)</span>
                </li>
                <li className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                  <span>PAN Card</span>
                </li>
                <li className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                  <span>Educational Certificates</span>
                </li>
                <li className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                  <span>Bank Account Details</span>
                </li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold mb-3">Upload Guidelines</h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>• Maximum file size: 10MB</li>
                <li>• Supported formats: PDF, JPG, PNG</li>
                <li>• Files must be clear and readable</li>
                <li>• Original documents preferred</li>
                <li>• Ensure all details are visible</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default EmployeeDocuments;