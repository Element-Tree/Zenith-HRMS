import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, Plus, Download, Filter } from 'lucide-react';

const CustomReports = () => {
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Custom Reports</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Create and manage custom reports</p>
        </div>
        <Button className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          New Report
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Report Builder</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-16">
            <FileText className="h-20 w-20 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Custom Report Builder</h3>
            <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-md mx-auto">
              Create customized reports with drag-and-drop fields, filters, and export options.
            </p>
            <div className="flex gap-4 justify-center">
              <Button variant="outline" className="flex items-center gap-2">
                <Filter className="h-4 w-4" />
                Set Filters
              </Button>
              <Button className="flex items-center gap-2">
                <Download className="h-4 w-4" />
                Export Sample
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CustomReports;