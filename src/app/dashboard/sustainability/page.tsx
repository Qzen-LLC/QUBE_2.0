'use client';

import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  Leaf,
  TrendingDown,
  Zap,
  Cloud,
  Loader2,
  AlertCircle
} from "lucide-react";
import { useUserClient } from '@/hooks/useAuthClient';
import { useRouter } from 'next/navigation';
import { useUserData } from '@/contexts/UserContext';
import CarbonFootprintTab from '@/components/sustainability/CarbonFootprintTab';
import EnergyEfficiencyTab from '@/components/sustainability/EnergyEfficiencyTab';
import SustainabilityGoalsTab from '@/components/sustainability/SustainabilityGoalsTab';
import ImpactReportTab from '@/components/sustainability/ImpactReportTab';

interface SustainabilityStats {
  totalEmissions: number;
  averageEmissions: number;
  energyConsumption: number;
  useCasesTracked: number;
  emissionsTrend: number; // percentage change
  topEmitters: Array<{
    useCaseId: string;
    useCaseName: string;
    emissions: number;
  }>;
}

export default function SustainabilityPage() {
  const { user } = useUserClient();
  const { userData } = useUserData();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<SustainabilityStats | null>(null);
  const [activeTab, setActiveTab] = useState('footprint');
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Check for dark mode
  useEffect(() => {
    const checkDarkMode = () => {
      const isDark = document.documentElement.classList.contains('dark') ||
                    document.body.classList.contains('dark');
      setIsDarkMode(isDark);
    };

    checkDarkMode();
    const observer = new MutationObserver(checkDarkMode);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    fetchStats();
  }, [userData]);

  const fetchStats = async () => {
    if (!userData?.organizationId) {
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`/api/sustainability/stats?organizationId=${userData.organizationId}`);
      if (!response.ok) {
        const errorData = await response.json();
        console.error('API Error:', errorData);
        throw new Error(`Failed to fetch stats: ${errorData.error || response.statusText}`);
      }
      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error('Error fetching sustainability stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!userData?.organizationId) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardHeader>
            <CardTitle>Organization Required</CardTitle>
            <CardDescription>
              You need to be part of an organization to access sustainability tracking.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <h1 className={`text-3xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
          Sustainable AI
        </h1>
        <p className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>
          Track and optimize the environmental impact of your AI systems
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={Cloud}
          label="Total CO₂ Emissions"
          value={`${(stats?.totalEmissions || 0).toFixed(2)} kg`}
          isDarkMode={isDarkMode}
          trend={stats?.emissionsTrend}
        />
        <StatCard
          icon={TrendingDown}
          label="Avg per Use Case"
          value={`${(stats?.averageEmissions || 0).toFixed(2)} kg`}
          isDarkMode={isDarkMode}
          color="green"
        />
        <StatCard
          icon={Zap}
          label="Energy Consumption"
          value={`${(stats?.energyConsumption || 0).toFixed(2)} kWh`}
          isDarkMode={isDarkMode}
          color="yellow"
        />
        <StatCard
          icon={Leaf}
          label="Use Cases Tracked"
          value={stats?.useCasesTracked || 0}
          isDarkMode={isDarkMode}
          color="blue"
        />
      </div>

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className={`grid w-full grid-cols-4 ${isDarkMode ? 'bg-gray-800' : ''}`}>
          <TabsTrigger value="footprint">Carbon Footprint</TabsTrigger>
          <TabsTrigger value="efficiency">Energy Efficiency</TabsTrigger>
          <TabsTrigger value="goals">Sustainability Goals</TabsTrigger>
          <TabsTrigger value="reports">Impact Reports</TabsTrigger>
        </TabsList>

        <TabsContent value="footprint" className="space-y-4">
          <CarbonFootprintTab
            organizationId={userData.organizationId}
            isDarkMode={isDarkMode}
            onUpdate={fetchStats}
          />
        </TabsContent>

        <TabsContent value="efficiency" className="space-y-4">
          <EnergyEfficiencyTab
            organizationId={userData.organizationId}
            isDarkMode={isDarkMode}
          />
        </TabsContent>

        <TabsContent value="goals" className="space-y-4">
          <SustainabilityGoalsTab
            organizationId={userData.organizationId}
            isDarkMode={isDarkMode}
            onUpdate={fetchStats}
          />
        </TabsContent>

        <TabsContent value="reports" className="space-y-4">
          <ImpactReportTab
            organizationId={userData.organizationId}
            isDarkMode={isDarkMode}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

interface StatCardProps {
  icon: React.ElementType;
  label: string;
  value: string | number;
  isDarkMode: boolean;
  color?: 'blue' | 'green' | 'yellow';
  trend?: number;
}

function StatCard({ icon: Icon, label, value, isDarkMode, color = 'blue', trend }: StatCardProps) {
  const colorClasses = {
    blue: 'text-blue-600',
    green: 'text-green-600',
    yellow: 'text-yellow-600'
  };

  return (
    <Card className={isDarkMode ? 'bg-gray-800 border-gray-700' : ''}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className={`text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              {label}
            </p>
            <p className={`text-2xl font-bold mt-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              {value}
            </p>
            {trend !== undefined && (
              <div className="flex items-center mt-1">
                <TrendingDown className={`h-4 w-4 ${trend < 0 ? 'text-green-600' : 'text-red-600'}`} />
                <span className={`text-xs ml-1 ${trend < 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {Math.abs(trend).toFixed(1)}% {trend < 0 ? 'decrease' : 'increase'}
                </span>
              </div>
            )}
          </div>
          <Icon className={`h-8 w-8 ${colorClasses[color]}`} />
        </div>
      </CardContent>
    </Card>
  );
}
