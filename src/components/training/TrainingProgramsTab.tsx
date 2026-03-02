'use client';

import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, BookOpen, Clock, Award, CheckCircle, Play } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface TrainingProgram {
  id: string;
  title: string;
  description?: string;
  category: string;
  level: string;
  duration?: number;
  isRequired: boolean;
  passingScore?: number;
  targetRoles: string[];
  isActive: boolean;
  userCompletion?: {
    status: string;
    progress: number;
    score?: number;
  };
}

interface Props {
  organizationId: string;
  userId: string;
  isDarkMode: boolean;
  onUpdate: () => void;
}

const CATEGORY_COLORS: Record<string, string> = {
  AI_FUNDAMENTALS: 'bg-blue-100 text-blue-800',
  ETHICS: 'bg-purple-100 text-purple-800',
  TECHNICAL: 'bg-green-100 text-green-800',
  GOVERNANCE: 'bg-yellow-100 text-yellow-800',
  COMPLIANCE: 'bg-red-100 text-red-800',
  LEADERSHIP: 'bg-indigo-100 text-indigo-800',
};

const LEVEL_LABELS: Record<string, string> = {
  BEGINNER: 'Beginner',
  INTERMEDIATE: 'Intermediate',
  ADVANCED: 'Advanced',
  EXPERT: 'Expert'
};

export default function TrainingProgramsTab({ organizationId, userId, isDarkMode, onUpdate }: Props) {
  const [programs, setPrograms] = useState<TrainingProgram[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('ALL');
  const { toast } = useToast();

  useEffect(() => {
    fetchPrograms();
  }, [organizationId, userId]);

  const fetchPrograms = async () => {
    try {
      const response = await fetch(`/api/training/programs?organizationId=${organizationId}&userId=${userId}`);
      if (response.ok) {
        const data = await response.json();
        setPrograms(data);
      }
    } catch (error) {
      console.error('Error fetching programs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEnroll = async (programId: string) => {
    try {
      const response = await fetch('/api/training/enroll', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ programId, userId, organizationId })
      });

      if (!response.ok) throw new Error('Failed to enroll');

      await fetchPrograms();
      onUpdate();
      toast({
        title: "Success",
        description: "Successfully enrolled in the training program.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to enroll in the program. Please try again.",
        variant: "destructive"
      });
    }
  };

  const filteredPrograms = programs.filter(program => {
    if (filter === 'ALL') return true;
    if (filter === 'REQUIRED') return program.isRequired;
    if (filter === 'IN_PROGRESS') return program.userCompletion?.status === 'IN_PROGRESS';
    if (filter === 'COMPLETED') return program.userCompletion?.status === 'COMPLETED';
    return program.category === filter;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card className={isDarkMode ? 'bg-gray-800 border-gray-700' : ''}>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-2">
            <Button
              variant={filter === 'ALL' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter('ALL')}
            >
              All Programs
            </Button>
            <Button
              variant={filter === 'REQUIRED' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter('REQUIRED')}
            >
              Required
            </Button>
            <Button
              variant={filter === 'IN_PROGRESS' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter('IN_PROGRESS')}
            >
              In Progress
            </Button>
            <Button
              variant={filter === 'COMPLETED' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter('COMPLETED')}
            >
              Completed
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Programs List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredPrograms.length === 0 ? (
          <Card className={`col-span-full ${isDarkMode ? 'bg-gray-800 border-gray-700' : ''}`}>
            <CardContent className="p-12 text-center">
              <BookOpen className={`mx-auto h-12 w-12 ${isDarkMode ? 'text-gray-600' : 'text-gray-400'}`} />
              <p className={`mt-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                No training programs found.
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredPrograms.map((program) => (
            <Card key={program.id} className={isDarkMode ? 'bg-gray-800 border-gray-700' : ''}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className={`text-lg ${isDarkMode ? 'text-white' : ''}`}>
                      {program.title}
                    </CardTitle>
                    {program.isRequired && (
                      <Badge variant="destructive" className="mt-2">Required</Badge>
                    )}
                  </div>
                  {program.userCompletion?.status === 'COMPLETED' && (
                    <CheckCircle className="h-6 w-6 text-green-600" />
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    {program.description}
                  </p>

                  <div className="flex flex-wrap gap-2">
                    <Badge className={CATEGORY_COLORS[program.category] || 'bg-gray-100 text-gray-800'}>
                      {program.category.replace('_', ' ')}
                    </Badge>
                    <Badge variant="outline">
                      {LEVEL_LABELS[program.level]}
                    </Badge>
                  </div>

                  {program.duration && (
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Clock className="h-4 w-4 mr-1" />
                      {program.duration} minutes
                    </div>
                  )}

                  {program.passingScore && (
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Award className="h-4 w-4 mr-1" />
                      Passing Score: {program.passingScore}%
                    </div>
                  )}

                  {program.userCompletion && (
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>Progress</span>
                        <span className={isDarkMode ? 'text-white' : 'text-gray-900'}>
                          {program.userCompletion.progress}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full"
                          style={{ width: `${program.userCompletion.progress}%` }}
                        />
                      </div>
                      {program.userCompletion.score !== undefined && (
                        <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                          Score: {program.userCompletion.score}%
                        </p>
                      )}
                    </div>
                  )}

                  <Button
                    className="w-full"
                    variant={program.userCompletion ? "outline" : "default"}
                    onClick={() => handleEnroll(program.id)}
                    disabled={program.userCompletion?.status === 'COMPLETED'}
                  >
                    {program.userCompletion ? (
                      program.userCompletion.status === 'COMPLETED' ? (
                        <>
                          <CheckCircle className="mr-2 h-4 w-4" />
                          Completed
                        </>
                      ) : (
                        <>
                          <Play className="mr-2 h-4 w-4" />
                          Continue
                        </>
                      )
                    ) : (
                      <>
                        <Play className="mr-2 h-4 w-4" />
                        Start Training
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
