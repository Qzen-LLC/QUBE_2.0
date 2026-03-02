'use client';

import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, FileText, Download, TrendingDown, Leaf } from "lucide-react";

interface ImpactReport {
  period: string;
  totalEmissions: number;
  emissionsChange: number;
  energyConsumption: number;
  useCasesAnalyzed: number;
  topEmitters: Array<{
    name: string;
    emissions: number;
    percentage: number;
  }>;
  recommendations: string[];
}

interface Props {
  organizationId: string;
  isDarkMode: boolean;
}

export default function ImpactReportTab({ organizationId, isDarkMode }: Props) {
  const [report, setReport] = useState<ImpactReport | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReport();
  }, [organizationId]);

  const fetchReport = async () => {
    try {
      const response = await fetch(`/api/sustainability/impact-report?organizationId=${organizationId}`);
      if (response.ok) {
        const data = await response.json();
        setReport(data);
      }
    } catch (error) {
      console.error('Error fetching impact report:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    try {
      const response = await fetch(`/api/sustainability/impact-report/export?organizationId=${organizationId}`);
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `sustainability-report-${new Date().toISOString().split('T')[0]}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      console.error('Error exporting report:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!report) {
    return (
      <Card className={isDarkMode ? 'bg-gray-800 border-gray-700' : ''}>
        <CardContent className="p-12 text-center">
          <FileText className={`mx-auto h-12 w-12 ${isDarkMode ? 'text-gray-600' : 'text-gray-400'}`} />
          <p className={`mt-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            No impact report data available yet.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Report Header */}
      <Card className={isDarkMode ? 'bg-gray-800 border-gray-700' : ''}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className={isDarkMode ? 'text-white' : ''}>
                <div className="flex items-center space-x-2">
                  <Leaf className="h-5 w-5" />
                  <span>Environmental Impact Report</span>
                </div>
              </CardTitle>
              <CardDescription className={isDarkMode ? 'text-gray-400' : ''}>
                Period: {report.period}
              </CardDescription>
            </div>
            <Button onClick={handleExport}>
              <Download className="mr-2 h-4 w-4" />
              Export Report
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className={isDarkMode ? 'bg-gray-800 border-gray-700' : ''}>
          <CardContent className="p-6">
            <p className={`text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Total CO₂ Emissions
            </p>
            <p className={`text-2xl font-bold mt-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              {report.totalEmissions.toFixed(2)} kg
            </p>
            <div className="flex items-center mt-1">
              <TrendingDown className={`h-4 w-4 ${report.emissionsChange < 0 ? 'text-green-600' : 'text-red-600'}`} />
              <span className={`text-xs ml-1 ${report.emissionsChange < 0 ? 'text-green-600' : 'text-red-600'}`}>
                {Math.abs(report.emissionsChange).toFixed(1)}% {report.emissionsChange < 0 ? 'decrease' : 'increase'}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className={isDarkMode ? 'bg-gray-800 border-gray-700' : ''}>
          <CardContent className="p-6">
            <p className={`text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Energy Consumption
            </p>
            <p className={`text-2xl font-bold mt-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              {report.energyConsumption.toFixed(2)} kWh
            </p>
          </CardContent>
        </Card>

        <Card className={isDarkMode ? 'bg-gray-800 border-gray-700' : ''}>
          <CardContent className="p-6">
            <p className={`text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Use Cases Analyzed
            </p>
            <p className={`text-2xl font-bold mt-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              {report.useCasesAnalyzed}
            </p>
          </CardContent>
        </Card>

        <Card className={isDarkMode ? 'bg-gray-800 border-gray-700' : ''}>
          <CardContent className="p-6">
            <p className={`text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Carbon Intensity
            </p>
            <p className={`text-2xl font-bold mt-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              {(report.totalEmissions / report.useCasesAnalyzed).toFixed(2)} kg/UC
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Top Emitters */}
      <Card className={isDarkMode ? 'bg-gray-800 border-gray-700' : ''}>
        <CardHeader>
          <CardTitle className={isDarkMode ? 'text-white' : ''}>Top Emitters</CardTitle>
          <CardDescription className={isDarkMode ? 'text-gray-400' : ''}>
            Use cases with the highest carbon footprint
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {report.topEmitters.map((emitter, index) => (
              <div key={index}>
                <div className="flex justify-between items-center mb-2">
                  <span className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    {emitter.name}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      {emitter.emissions.toFixed(2)} kg CO₂
                    </span>
                    <Badge variant="secondary">{emitter.percentage.toFixed(0)}%</Badge>
                  </div>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-red-600 h-2 rounded-full"
                    style={{ width: `${emitter.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recommendations */}
      <Card className={isDarkMode ? 'bg-gray-800 border-gray-700' : ''}>
        <CardHeader>
          <CardTitle className={isDarkMode ? 'text-white' : ''}>Recommendations</CardTitle>
          <CardDescription className={isDarkMode ? 'text-gray-400' : ''}>
            Actions to reduce environmental impact
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            {report.recommendations.map((rec, index) => (
              <li key={index} className="flex items-start">
                <Badge variant="outline" className="mr-2 mt-0.5">{index + 1}</Badge>
                <span className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  {rec}
                </span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
