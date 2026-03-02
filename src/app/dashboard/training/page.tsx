'use client';

import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  GraduationCap,
  BookOpen,
  Award,
  TrendingUp,
  Users,
  Loader2,
  AlertCircle
} from "lucide-react";
import { useUserClient } from '@/hooks/useAuthClient';
import { useRouter } from 'next/navigation';
import { useUserData } from '@/contexts/UserContext';
import TrainingProgramsTab from '@/components/training/TrainingProgramsTab';
import MyTrainingTab from '@/components/training/MyTrainingTab';
import CompetencyMatrixTab from '@/components/training/CompetencyMatrixTab';
import TeamProgressTab from '@/components/training/TeamProgressTab';

interface TrainingStats {
  totalPrograms: number;
  completedPrograms: number;
  inProgressPrograms: number;
  certificatesEarned: number;
  teamCompletionRate: number;
}

export default function TrainingPage() {
  const { user } = useUserClient();
  const { userData } = useUserData();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<TrainingStats | null>(null);
  const [activeTab, setActiveTab] = useState('my-training');
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
  }, [userData, user]);

  const fetchStats = async () => {
    if (!userData?.organizationId || !user) {
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`/api/training/stats?organizationId=${userData.organizationId}&userId=${user.id}`);
      if (!response.ok) {
        const errorData = await response.json();
        console.error('API Error:', errorData);
        throw new Error(`Failed to fetch stats: ${errorData.error || response.statusText}`);
      }
      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error('Error fetching training stats:', error);
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

  if (!userData?.organizationId || !user) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardHeader>
            <CardTitle>Organization Required</CardTitle>
            <CardDescription>
              You need to be part of an organization to access training programs.
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
          AI Training & Competency
        </h1>
        <p className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>
          Build AI literacy and competencies across your organization
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={BookOpen}
          label="Total Programs"
          value={stats?.totalPrograms || 0}
          isDarkMode={isDarkMode}
        />
        <StatCard
          icon={GraduationCap}
          label="Completed"
          value={stats?.completedPrograms || 0}
          isDarkMode={isDarkMode}
          color="green"
        />
        <StatCard
          icon={TrendingUp}
          label="In Progress"
          value={stats?.inProgressPrograms || 0}
          isDarkMode={isDarkMode}
          color="blue"
        />
        <StatCard
          icon={Award}
          label="Certificates"
          value={stats?.certificatesEarned || 0}
          isDarkMode={isDarkMode}
          color="purple"
        />
      </div>

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className={`grid w-full grid-cols-4 ${isDarkMode ? 'bg-gray-800' : ''}`}>
          <TabsTrigger value="my-training">My Training</TabsTrigger>
          <TabsTrigger value="programs">All Programs</TabsTrigger>
          <TabsTrigger value="competency">Competency Matrix</TabsTrigger>
          <TabsTrigger value="team">Team Progress</TabsTrigger>
        </TabsList>

        <TabsContent value="my-training" className="space-y-4">
          <MyTrainingTab
            organizationId={userData.organizationId}
            userId={user.id}
            isDarkMode={isDarkMode}
            onUpdate={fetchStats}
          />
        </TabsContent>

        <TabsContent value="programs" className="space-y-4">
          <TrainingProgramsTab
            organizationId={userData.organizationId}
            userId={user.id}
            isDarkMode={isDarkMode}
            onUpdate={fetchStats}
          />
        </TabsContent>

        <TabsContent value="competency" className="space-y-4">
          <CompetencyMatrixTab
            organizationId={userData.organizationId}
            userId={user.id}
            isDarkMode={isDarkMode}
          />
        </TabsContent>

        <TabsContent value="team" className="space-y-4">
          <TeamProgressTab
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
  value: number;
  isDarkMode: boolean;
  color?: 'blue' | 'green' | 'purple';
}

function StatCard({ icon: Icon, label, value, isDarkMode, color = 'blue' }: StatCardProps) {
  const colorClasses = {
    blue: 'text-blue-600',
    green: 'text-green-600',
    purple: 'text-purple-600'
  };

  return (
    <Card className={isDarkMode ? 'bg-gray-800 border-gray-700' : ''}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className={`text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              {label}
            </p>
            <p className={`text-2xl font-bold mt-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              {value}
            </p>
          </div>
          <Icon className={`h-8 w-8 ${colorClasses[color]}`} />
        </div>
      </CardContent>
    </Card>
  );
}
