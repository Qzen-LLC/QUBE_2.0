'use client';

import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  Building2,
  Users,
  Shield,
  Scale,
  Calendar,
  FileText,
  Loader2,
  Plus,
  CheckCircle,
  AlertCircle
} from "lucide-react";
import { useUserClient } from '@/hooks/useAuthClient';
import { useRouter } from 'next/navigation';
import { useUserData } from '@/contexts/UserContext';
import GovernanceStructureTab from '@/components/governance-setup/GovernanceStructureTab';
import DecisionAuthorityTab from '@/components/governance-setup/DecisionAuthorityTab';
import GovernanceCharterTab from '@/components/governance-setup/GovernanceCharterTab';
import MeetingCalendarTab from '@/components/governance-setup/MeetingCalendarTab';
import EscalationRulesTab from '@/components/governance-setup/EscalationRulesTab';
import DecisionRoutingDemo from '@/components/governance-setup/DecisionRoutingDemo';

interface SetupStatus {
  hasCharter: boolean;
  hasBodies: boolean;
  hasDecisionRights: boolean;
  hasEscalationRules: boolean;
  completionPercentage: number;
}

export default function GovernanceSetupPage() {
  const { user } = useUserClient();
  const { userData } = useUserData();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [setupStatus, setSetupStatus] = useState<SetupStatus | null>(null);
  const [activeTab, setActiveTab] = useState('charter');
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
    fetchSetupStatus();
  }, [userData]);

  const fetchSetupStatus = async () => {
    if (!userData?.organizationId) {
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`/api/governance-setup/status?organizationId=${userData.organizationId}`);
      if (!response.ok) {
        const errorData = await response.json();
        console.error('API Error:', errorData);
        throw new Error(`Failed to fetch setup status: ${errorData.error || response.statusText}`);
      }
      const data = await response.json();
      setSetupStatus(data);
    } catch (error) {
      console.error('Error fetching setup status:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (value: string) => {
    setActiveTab(value);
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
              You need to be part of an organization to access governance setup.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const completionPercentage = setupStatus?.completionPercentage || 0;

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <h1 className={`text-3xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
          Governance Operating Model
        </h1>
        <p className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>
          Configure your AI governance structure, decision rights, and oversight processes
        </p>
      </div>

      {/* Setup Progress Card */}
      <Card className={isDarkMode ? 'bg-gray-800 border-gray-700' : ''}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className={isDarkMode ? 'text-white' : ''}>Setup Progress</CardTitle>
              <CardDescription className={isDarkMode ? 'text-gray-400' : ''}>
                Complete your governance operating model configuration
              </CardDescription>
            </div>
            <Badge
              variant={completionPercentage === 100 ? "default" : "secondary"}
              className={completionPercentage === 100 ? "bg-green-600" : ""}
            >
              {completionPercentage}% Complete
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <SetupItem
              icon={FileText}
              label="Governance Charter"
              completed={setupStatus?.hasCharter || false}
              isDarkMode={isDarkMode}
            />
            <SetupItem
              icon={Building2}
              label="Governance Bodies"
              completed={setupStatus?.hasBodies || false}
              isDarkMode={isDarkMode}
            />
            <SetupItem
              icon={Scale}
              label="Decision Authority"
              completed={setupStatus?.hasDecisionRights || false}
              isDarkMode={isDarkMode}
            />
            <SetupItem
              icon={Shield}
              label="Escalation Rules"
              completed={setupStatus?.hasEscalationRules || false}
              isDarkMode={isDarkMode}
            />
          </div>
        </CardContent>
      </Card>

      {/* Main Configuration Tabs */}
      <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
        <TabsList className={`grid w-full grid-cols-6 ${isDarkMode ? 'bg-gray-800' : ''}`}>
          <TabsTrigger value="charter">Charter</TabsTrigger>
          <TabsTrigger value="structure">Structure</TabsTrigger>
          <TabsTrigger value="decision-rights">Decision Rights</TabsTrigger>
          <TabsTrigger value="escalation">Escalation</TabsTrigger>
          <TabsTrigger value="meetings">Meetings</TabsTrigger>
          <TabsTrigger value="test">Test Routing</TabsTrigger>
        </TabsList>

        <TabsContent value="charter" className="space-y-4">
          <GovernanceCharterTab
            organizationId={userData.organizationId}
            onUpdate={fetchSetupStatus}
            isDarkMode={isDarkMode}
          />
        </TabsContent>

        <TabsContent value="structure" className="space-y-4">
          <GovernanceStructureTab
            organizationId={userData.organizationId}
            onUpdate={fetchSetupStatus}
            isDarkMode={isDarkMode}
          />
        </TabsContent>

        <TabsContent value="decision-rights" className="space-y-4">
          <DecisionAuthorityTab
            organizationId={userData.organizationId}
            onUpdate={fetchSetupStatus}
            isDarkMode={isDarkMode}
          />
        </TabsContent>

        <TabsContent value="escalation" className="space-y-4">
          <EscalationRulesTab
            organizationId={userData.organizationId}
            onUpdate={fetchSetupStatus}
            isDarkMode={isDarkMode}
          />
        </TabsContent>

        <TabsContent value="meetings" className="space-y-4">
          <MeetingCalendarTab
            organizationId={userData.organizationId}
            isDarkMode={isDarkMode}
          />
        </TabsContent>

        <TabsContent value="test" className="space-y-4">
          <DecisionRoutingDemo
            organizationId={userData.organizationId}
            isDarkMode={isDarkMode}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

interface SetupItemProps {
  icon: React.ElementType;
  label: string;
  completed: boolean;
  isDarkMode: boolean;
}

function SetupItem({ icon: Icon, label, completed, isDarkMode }: SetupItemProps) {
  return (
    <div className="flex items-center justify-between p-3 rounded-lg border"
         style={{
           backgroundColor: isDarkMode ? '#1f2937' : '#f9fafb',
           borderColor: isDarkMode ? '#374151' : '#e5e7eb'
         }}>
      <div className="flex items-center space-x-3">
        <Icon className={`h-5 w-5 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`} />
        <span className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
          {label}
        </span>
      </div>
      {completed ? (
        <CheckCircle className="h-5 w-5 text-green-600" />
      ) : (
        <AlertCircle className={`h-5 w-5 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`} />
      )}
    </div>
  );
}
