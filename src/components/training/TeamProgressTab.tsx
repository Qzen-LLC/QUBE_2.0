'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Users, TrendingUp, Award } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface TeamMember {
  userId: string;
  userName: string;
  userEmail: string;
  role?: string;
  completedPrograms: number;
  inProgressPrograms: number;
  totalRequiredPrograms: number;
  completionRate: number;
  averageScore?: number;
}

interface Props {
  organizationId: string;
  isDarkMode: boolean;
}

export default function TeamProgressTab({ organizationId, isDarkMode }: Props) {
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTeamProgress();
  }, [organizationId]);

  const fetchTeamProgress = async () => {
    try {
      const response = await fetch(`/api/training/team-progress?organizationId=${organizationId}`);
      if (response.ok) {
        const data = await response.json();
        setTeamMembers(data);
      }
    } catch (error) {
      console.error('Error fetching team progress:', error);
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

  const overallCompletionRate = teamMembers.length > 0
    ? Math.round(teamMembers.reduce((sum, m) => sum + m.completionRate, 0) / teamMembers.length)
    : 0;

  const totalCompleted = teamMembers.reduce((sum, m) => sum + m.completedPrograms, 0);
  const totalInProgress = teamMembers.reduce((sum, m) => sum + m.inProgressPrograms, 0);

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className={isDarkMode ? 'bg-gray-800 border-gray-700' : ''}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  Team Completion Rate
                </p>
                <p className={`text-2xl font-bold mt-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  {overallCompletionRate}%
                </p>
              </div>
              <Users className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card className={isDarkMode ? 'bg-gray-800 border-gray-700' : ''}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  Completed Programs
                </p>
                <p className={`text-2xl font-bold mt-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  {totalCompleted}
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
                  In Progress
                </p>
                <p className={`text-2xl font-bold mt-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  {totalInProgress}
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Team Progress Table */}
      <Card className={isDarkMode ? 'bg-gray-800 border-gray-700' : ''}>
        <CardHeader>
          <CardTitle className={isDarkMode ? 'text-white' : ''}>Team Member Progress</CardTitle>
          <CardDescription className={isDarkMode ? 'text-gray-400' : ''}>
            Track training progress across your organization
          </CardDescription>
        </CardHeader>
        <CardContent>
          {teamMembers.length === 0 ? (
            <div className="text-center py-8">
              <Users className={`mx-auto h-12 w-12 ${isDarkMode ? 'text-gray-600' : 'text-gray-400'}`} />
              <p className={`mt-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                No team member data available yet.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className={isDarkMode ? 'border-gray-700' : ''}>
                    <TableHead className={isDarkMode ? 'text-gray-300' : ''}>Member</TableHead>
                    <TableHead className={isDarkMode ? 'text-gray-300' : ''}>Role</TableHead>
                    <TableHead className={isDarkMode ? 'text-gray-300' : ''}>Completed</TableHead>
                    <TableHead className={isDarkMode ? 'text-gray-300' : ''}>In Progress</TableHead>
                    <TableHead className={isDarkMode ? 'text-gray-300' : ''}>Required</TableHead>
                    <TableHead className={isDarkMode ? 'text-gray-300' : ''}>Avg Score</TableHead>
                    <TableHead className={isDarkMode ? 'text-gray-300' : ''}>Completion Rate</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {teamMembers.map((member) => (
                    <TableRow key={member.userId} className={isDarkMode ? 'border-gray-700' : ''}>
                      <TableCell className={isDarkMode ? 'text-white' : 'font-medium'}>
                        <div>
                          <div>{member.userName}</div>
                          <div className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                            {member.userEmail}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {member.role ? (
                          <Badge variant="outline">{member.role}</Badge>
                        ) : (
                          <span className={isDarkMode ? 'text-gray-500' : 'text-gray-400'}>-</span>
                        )}
                      </TableCell>
                      <TableCell className={isDarkMode ? 'text-gray-300' : ''}>
                        <Badge className="bg-green-100 text-green-800">
                          {member.completedPrograms}
                        </Badge>
                      </TableCell>
                      <TableCell className={isDarkMode ? 'text-gray-300' : ''}>
                        <Badge className="bg-blue-100 text-blue-800">
                          {member.inProgressPrograms}
                        </Badge>
                      </TableCell>
                      <TableCell className={isDarkMode ? 'text-gray-300' : ''}>
                        {member.totalRequiredPrograms}
                      </TableCell>
                      <TableCell className={isDarkMode ? 'text-gray-300' : ''}>
                        {member.averageScore !== undefined ? `${member.averageScore}%` : '-'}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="w-24 bg-gray-200 rounded-full h-2">
                            <div
                              className={`h-2 rounded-full ${
                                member.completionRate >= 80
                                  ? 'bg-green-600'
                                  : member.completionRate >= 50
                                  ? 'bg-blue-600'
                                  : 'bg-yellow-600'
                              }`}
                              style={{ width: `${member.completionRate}%` }}
                            />
                          </div>
                          <span className={`text-sm ${isDarkMode ? 'text-gray-300' : ''}`}>
                            {member.completionRate}%
                          </span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
