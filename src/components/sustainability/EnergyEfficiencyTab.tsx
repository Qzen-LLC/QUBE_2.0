'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Zap, TrendingUp, Award } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface EnergyMetric {
  useCaseId: string;
  useCaseName?: string;
  energyPerInference: number;
  totalInferences: number;
  totalEnergy: number;
  efficiency: 'HIGH' | 'MEDIUM' | 'LOW';
}

interface Props {
  organizationId: string;
  isDarkMode: boolean;
}

export default function EnergyEfficiencyTab({ organizationId, isDarkMode }: Props) {
  const [metrics, setMetrics] = useState<EnergyMetric[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMetrics();
  }, [organizationId]);

  const fetchMetrics = async () => {
    try {
      const response = await fetch(`/api/sustainability/energy-efficiency?organizationId=${organizationId}`);
      if (response.ok) {
        const data = await response.json();
        setMetrics(data);
      }
    } catch (error) {
      console.error('Error fetching energy metrics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  const totalEnergy = metrics.reduce((sum, m) => sum + m.totalEnergy, 0);
  const highEfficiency = metrics.filter(m => m.efficiency === 'HIGH').length;

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className={isDarkMode ? 'bg-gray-800 border-gray-700' : ''}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  Total Energy
                </p>
                <p className={`text-2xl font-bold mt-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  {totalEnergy.toFixed(2)} kWh
                </p>
              </div>
              <Zap className="h-8 w-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>

        <Card className={isDarkMode ? 'bg-gray-800 border-gray-700' : ''}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  High Efficiency
                </p>
                <p className={`text-2xl font-bold mt-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  {highEfficiency} / {metrics.length}
                </p>
              </div>
              <Award className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card className={isDarkMode ? 'bg-gray-800 border-gray-700' : ''}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  Avg Efficiency
                </p>
                <p className={`text-2xl font-bold mt-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  {metrics.length > 0 ? Math.round((highEfficiency / metrics.length) * 100) : 0}%
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Energy Efficiency Table */}
      <Card className={isDarkMode ? 'bg-gray-800 border-gray-700' : ''}>
        <CardHeader>
          <CardTitle className={isDarkMode ? 'text-white' : ''}>Energy Efficiency by Use Case</CardTitle>
          <CardDescription className={isDarkMode ? 'text-gray-400' : ''}>
            Monitor energy consumption and optimize for efficiency
          </CardDescription>
        </CardHeader>
        <CardContent>
          {metrics.length === 0 ? (
            <div className="text-center py-8">
              <Zap className={`mx-auto h-12 w-12 ${isDarkMode ? 'text-gray-600' : 'text-gray-400'}`} />
              <p className={`mt-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                No energy efficiency data available yet.
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className={isDarkMode ? 'border-gray-700' : ''}>
                  <TableHead className={isDarkMode ? 'text-gray-300' : ''}>Use Case</TableHead>
                  <TableHead className={isDarkMode ? 'text-gray-300' : ''}>Energy/Inference</TableHead>
                  <TableHead className={isDarkMode ? 'text-gray-300' : ''}>Total Inferences</TableHead>
                  <TableHead className={isDarkMode ? 'text-gray-300' : ''}>Total Energy</TableHead>
                  <TableHead className={isDarkMode ? 'text-gray-300' : ''}>Efficiency</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {metrics.map((metric) => (
                  <TableRow key={metric.useCaseId} className={isDarkMode ? 'border-gray-700' : ''}>
                    <TableCell className={isDarkMode ? 'text-white font-medium' : 'font-medium'}>
                      {metric.useCaseName || metric.useCaseId}
                    </TableCell>
                    <TableCell className={isDarkMode ? 'text-gray-300' : ''}>
                      {metric.energyPerInference.toFixed(4)} kWh
                    </TableCell>
                    <TableCell className={isDarkMode ? 'text-gray-300' : ''}>
                      {metric.totalInferences.toLocaleString()}
                    </TableCell>
                    <TableCell className={isDarkMode ? 'text-gray-300' : ''}>
                      {metric.totalEnergy.toFixed(2)} kWh
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={metric.efficiency === 'HIGH' ? 'default' : 'secondary'}
                        className={
                          metric.efficiency === 'HIGH'
                            ? 'bg-green-600'
                            : metric.efficiency === 'MEDIUM'
                            ? 'bg-yellow-600'
                            : 'bg-red-600'
                        }
                      >
                        {metric.efficiency}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
