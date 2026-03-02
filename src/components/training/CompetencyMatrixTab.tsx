'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Target, TrendingUp } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface Competency {
  id: string;
  framework: string;
  category: string;
  competency: string;
  requiredLevel: string;
  currentLevel?: string;
  assessmentDate?: string;
  gap: number;
}

interface Props {
  organizationId: string;
  userId: string;
  isDarkMode: boolean;
}

const LEVEL_SCORE: Record<string, number> = {
  'NONE': 0,
  'BEGINNER': 1,
  'INTERMEDIATE': 2,
  'ADVANCED': 3,
  'EXPERT': 4
};

const LEVEL_COLOR: Record<number, string> = {
  0: 'bg-red-100 text-red-800',
  1: 'bg-yellow-100 text-yellow-800',
  2: 'bg-blue-100 text-blue-800',
  3: 'bg-green-100 text-green-800',
  4: 'bg-purple-100 text-purple-800'
};

export default function CompetencyMatrixTab({ organizationId, userId, isDarkMode }: Props) {
  const [competencies, setCompetencies] = useState<Competency[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCompetencies();
  }, [organizationId, userId]);

  const fetchCompetencies = async () => {
    try {
      const response = await fetch(`/api/training/competency-matrix?organizationId=${organizationId}&userId=${userId}`);
      if (response.ok) {
        const data = await response.json();
        setCompetencies(data);
      }
    } catch (error) {
      console.error('Error fetching competencies:', error);
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

  const overallProgress = competencies.length > 0
    ? Math.round((competencies.filter(c => c.gap === 0).length / competencies.length) * 100)
    : 0;

  const gapAreas = competencies.filter(c => c.gap > 0).length;

  return (
    <div className="space-y-6">
      {/* Summary Card */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className={isDarkMode ? 'bg-gray-800 border-gray-700' : ''}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  Overall Competency
                </p>
                <p className={`text-2xl font-bold mt-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  {overallProgress}%
                </p>
              </div>
              <Target className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card className={isDarkMode ? 'bg-gray-800 border-gray-700' : ''}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  Gap Areas
                </p>
                <p className={`text-2xl font-bold mt-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  {gapAreas}
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Competency Matrix Table */}
      <Card className={isDarkMode ? 'bg-gray-800 border-gray-700' : ''}>
        <CardHeader>
          <CardTitle className={isDarkMode ? 'text-white' : ''}>Competency Matrix</CardTitle>
          <CardDescription className={isDarkMode ? 'text-gray-400' : ''}>
            Track your AI competencies against required levels for your role
          </CardDescription>
        </CardHeader>
        <CardContent>
          {competencies.length === 0 ? (
            <div className="text-center py-8">
              <Target className={`mx-auto h-12 w-12 ${isDarkMode ? 'text-gray-600' : 'text-gray-400'}`} />
              <p className={`mt-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                No competency requirements defined yet.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className={isDarkMode ? 'border-gray-700' : ''}>
                    <TableHead className={isDarkMode ? 'text-gray-300' : ''}>Category</TableHead>
                    <TableHead className={isDarkMode ? 'text-gray-300' : ''}>Competency</TableHead>
                    <TableHead className={isDarkMode ? 'text-gray-300' : ''}>Required Level</TableHead>
                    <TableHead className={isDarkMode ? 'text-gray-300' : ''}>Current Level</TableHead>
                    <TableHead className={isDarkMode ? 'text-gray-300' : ''}>Gap</TableHead>
                    <TableHead className={isDarkMode ? 'text-gray-300' : ''}>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {competencies.map((comp) => {
                    const currentScore = LEVEL_SCORE[comp.currentLevel || 'NONE'];
                    const requiredScore = LEVEL_SCORE[comp.requiredLevel];
                    const isMet = currentScore >= requiredScore;

                    return (
                      <TableRow key={comp.id} className={isDarkMode ? 'border-gray-700' : ''}>
                        <TableCell className={isDarkMode ? 'text-gray-300' : ''}>
                          <Badge variant="outline">{comp.category}</Badge>
                        </TableCell>
                        <TableCell className={isDarkMode ? 'text-white' : 'font-medium'}>
                          {comp.competency}
                        </TableCell>
                        <TableCell>
                          <Badge className={LEVEL_COLOR[requiredScore]}>
                            {comp.requiredLevel}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className={LEVEL_COLOR[currentScore]}>
                            {comp.currentLevel || 'NONE'}
                          </Badge>
                        </TableCell>
                        <TableCell className={isDarkMode ? 'text-gray-300' : ''}>
                          {comp.gap > 0 ? `${comp.gap} level${comp.gap > 1 ? 's' : ''}` : '-'}
                        </TableCell>
                        <TableCell>
                          <Badge variant={isMet ? 'default' : 'secondary'} className={isMet ? 'bg-green-600' : ''}>
                            {isMet ? 'Met' : 'Gap'}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
