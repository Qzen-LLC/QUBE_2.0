'use client';

import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  Eye,
  TrendingUp,
  AlertTriangle,
  FileText,
  Activity,
  Shield,
  Loader2
} from "lucide-react";
import { useUserClient } from '@/hooks/useAuthClient';
import { useRouter } from 'next/navigation';
import { useUserData } from '@/contexts/UserContext';
import GovernanceKPIsTab from '@/components/oversight/GovernanceKPIsTab';
import AuditManagementTab from '@/components/oversight/AuditManagementTab';
import MonitoringAlertsTab from '@/components/oversight/MonitoringAlertsTab';
import IncidentManagementTab from '@/components/oversight/IncidentManagementTab';
import MaturityAssessmentTab from '@/components/oversight/MaturityAssessmentTab';

interface OversightStats {
  totalKPIs: number;
  kpisOnTrack: number;
  activeAlerts: number;
  criticalAlerts: number;
  openIncidents: number;
  pendingAudits: number;
  maturityScore: number;
}

export default function OversightPage() {
  const { user } = useUserClient();
  const { userData } = useUserData();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<OversightStats | null>(null);
  const [activeTab, setActiveTab] = useState('kpis');
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
      const response = await fetch(`/api/oversight/stats?organizationId=${userData.organizationId}`);
      if (!response.ok) {
        const errorData = await response.json();
        console.error('API Error:', errorData);
        throw new Error(`Failed to fetch stats: ${errorData.error || response.statusText}`);
      }
      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error('Error fetching oversight stats:', error);
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
              You need to be part of an organization to access oversight features.
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
          Governance Oversight & Monitoring
        </h1>
        <p className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>
          Monitor, audit, and ensure continuous governance effectiveness
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={TrendingUp}
          label="KPIs On Track"
          value={`${stats?.kpisOnTrack || 0}/${stats?.totalKPIs || 0}`}
          isDarkMode={isDarkMode}
          color="green"
        />
        <StatCard
          icon={AlertTriangle}
          label="Active Alerts"
          value={stats?.activeAlerts || 0}
          badge={stats?.criticalAlerts ? `${stats.criticalAlerts} Critical` : undefined}
          isDarkMode={isDarkMode}
          color="red"
        />
        <StatCard
          icon={Shield}
          label="Open Incidents"
          value={stats?.openIncidents || 0}
          isDarkMode={isDarkMode}
          color="yellow"
        />
        <StatCard
          icon={Activity}
          label="Maturity Score"
          value={`${stats?.maturityScore || 0}%`}
          isDarkMode={isDarkMode}
          color="blue"
        />
      </div>

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className={`grid w-full grid-cols-5 ${isDarkMode ? 'bg-gray-800' : ''}`}>
          <TabsTrigger value="kpis">Governance KPIs</TabsTrigger>
          <TabsTrigger value="alerts">Monitoring & Alerts</TabsTrigger>
          <TabsTrigger value="incidents">Incidents</TabsTrigger>
          <TabsTrigger value="audits">Audits</TabsTrigger>
          <TabsTrigger value="maturity">Maturity</TabsTrigger>
        </TabsList>

        <TabsContent value="kpis" className="space-y-4">
          <GovernanceKPIsTab
            organizationId={userData.organizationId}
            isDarkMode={isDarkMode}
            onUpdate={fetchStats}
          />
        </TabsContent>

        <TabsContent value="alerts" className="space-y-4">
          <MonitoringAlertsTab
            organizationId={userData.organizationId}
            isDarkMode={isDarkMode}
            onUpdate={fetchStats}
          />
        </TabsContent>

        <TabsContent value="incidents" className="space-y-4">
          <IncidentManagementTab
            organizationId={userData.organizationId}
            isDarkMode={isDarkMode}
            onUpdate={fetchStats}
          />
        </TabsContent>

        <TabsContent value="audits" className="space-y-4">
          <AuditManagementTab
            organizationId={userData.organizationId}
            isDarkMode={isDarkMode}
            onUpdate={fetchStats}
          />
        </TabsContent>

        <TabsContent value="maturity" className="space-y-4">
          <MaturityAssessmentTab
            organizationId={userData.organizationId}
            isDarkMode={isDarkMode}
            onUpdate={fetchStats}
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
  badge?: string;
  isDarkMode: boolean;
  color?: 'blue' | 'green' | 'yellow' | 'red';
}

function StatCard({ icon: Icon, label, value, badge, isDarkMode, color = 'blue' }: StatCardProps) {
  const colorClasses = {
    blue: 'text-blue-600',
    green: 'text-green-600',
    yellow: 'text-yellow-600',
    red: 'text-red-600'
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
            {badge && (
              <Badge variant="destructive" className="mt-2 text-xs">
                {badge}
              </Badge>
            )}
          </div>
          <Icon className={`h-8 w-8 ${colorClasses[color]}`} />
        </div>
      </CardContent>
    </Card>
  );
}
