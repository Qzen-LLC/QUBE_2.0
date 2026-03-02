'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, AlertTriangle, CheckCircle } from 'lucide-react';

export default function ExecutiveTestPage() {
  const [testData, setTestData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const testExecutiveMetrics = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/executive-metrics');
      const data = await response.json();
      
      if (response.ok) {
        setTestData(data);
      } else {
        setError(`API Error: ${data.error || 'Unknown error'}`);
      }
    } catch (err) {
      setError(`Network Error: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const testTestEndpoint = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/test-executive-metrics');
      const data = await response.json();
      
      if (response.ok) {
        setTestData(data);
      } else {
        setError(`Test API Error: ${data.error || 'Unknown error'}`);
      }
    } catch (err) {
      setError(`Network Error: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Executive Dashboard Test</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Test Executive Metrics API</h2>
            <p className="text-gray-600 mb-4">Test the actual executive metrics endpoint</p>
            <Button 
              onClick={testExecutiveMetrics}
              disabled={loading}
              className="w-full"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Test Real API
            </Button>
          </Card>

          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Test Mock Data</h2>
            <p className="text-gray-600 mb-4">Test with mock data structure</p>
            <Button 
              onClick={testTestEndpoint}
              disabled={loading}
              className="w-full"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Test Mock API
            </Button>
          </Card>
        </div>

        {error && (
          <Card className="p-6 mb-6 border-red-200 bg-red-50">
            <div className="flex items-center mb-4">
              <AlertTriangle className="w-6 h-6 text-red-500 mr-2" />
              <h3 className="text-lg font-semibold text-red-800">Error</h3>
            </div>
            <p className="text-red-700">{error}</p>
          </Card>
        )}

        {testData && (
          <Card className="p-6">
            <div className="flex items-center mb-4">
              <CheckCircle className="w-6 h-6 text-green-500 mr-2" />
              <h3 className="text-lg font-semibold text-gray-900">Test Results</h3>
            </div>
            
            <div className="space-y-4">
              {testData.user && (
                <div>
                  <h4 className="font-semibold text-gray-700 mb-2">User Information:</h4>
                  <pre className="bg-gray-100 p-3 rounded text-sm overflow-auto">
                    {JSON.stringify(testData.user, null, 2)}
                  </pre>
                </div>
              )}

              {testData.testMetrics && (
                <div>
                  <h4 className="font-semibold text-gray-700 mb-2">Test Metrics Structure:</h4>
                  <pre className="bg-gray-100 p-3 rounded text-sm overflow-auto max-h-96">
                    {JSON.stringify(testData.testMetrics, null, 2)}
                  </pre>
                </div>
              )}

              {testData.portfolio && (
                <div>
                  <h4 className="font-semibold text-gray-700 mb-2">Real Metrics Data:</h4>
                  <pre className="bg-gray-100 p-3 rounded text-sm overflow-auto max-h-96">
                    {JSON.stringify(testData, null, 2)}
                  </pre>
                </div>
              )}

              {testData.message && (
                <div className="bg-green-50 p-3 rounded">
                  <p className="text-green-800">{testData.message}</p>
                </div>
              )}
            </div>
          </Card>
        )}
      </div>
    </div>
  );
} 