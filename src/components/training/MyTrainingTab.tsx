'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, Award, Calendar, TrendingUp, Download } from "lucide-react";

interface MyTraining {
  id: string;
  program: {
    id: string;
    title: string;
    category: string;
    level: string;
  };
  status: string;
  progress: number;
  score?: number;
  startedAt: string;
  completedAt?: string;
  certificateUrl?: string;
}

interface Props {
  organizationId: string;
  userId: string;
  isDarkMode: boolean;
  onUpdate: () => void;
}

export default function MyTrainingTab({ organizationId, userId, isDarkMode, onUpdate }: Props) {
  const [trainings, setTrainings] = useState<MyTraining[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMyTrainings();
  }, [organizationId, userId]);

  const fetchMyTrainings = async () => {
    try {
      const response = await fetch(`/api/training/my-training?organizationId=${organizationId}&userId=${userId}`);
      if (response.ok) {
        const data = await response.json();
        setTrainings(data);
      }
    } catch (error) {
      console.error('Error fetching my trainings:', error);
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

  const inProgress = trainings.filter(t => t.status === 'IN_PROGRESS');
  const completed = trainings.filter(t => t.status === 'COMPLETED');

  return (
    <div className="space-y-6">
      {/* In Progress */}
      {inProgress.length > 0 && (
        <Card className={isDarkMode ? 'bg-gray-800 border-gray-700' : ''}>
          <CardHeader>
            <CardTitle className={isDarkMode ? 'text-white' : ''}>
              <div className="flex items-center">
                <TrendingUp className="mr-2 h-5 w-5" />
                In Progress ({inProgress.length})
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {inProgress.map((training) => (
                <div
                  key={training.id}
                  className={`p-4 rounded-lg border ${
                    isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'
                  }`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                        {training.program.title}
                      </h3>
                      <div className="flex gap-2 mt-1">
                        <Badge variant="outline" className="text-xs">
                          {training.program.level}
                        </Badge>
                        <Badge className="text-xs">
                          {training.program.category.replace('_', ' ')}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>Progress</span>
                      <span className={isDarkMode ? 'text-white' : 'text-gray-900'}>
                        {training.progress}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full transition-all"
                        style={{ width: `${training.progress}%` }}
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between mt-3">
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4 mr-1" />
                      Started: {new Date(training.startedAt).toLocaleDateString()}
                    </div>
                    <Button size="sm">Continue</Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Completed */}
      {completed.length > 0 && (
        <Card className={isDarkMode ? 'bg-gray-800 border-gray-700' : ''}>
          <CardHeader>
            <CardTitle className={isDarkMode ? 'text-white' : ''}>
              <div className="flex items-center">
                <Award className="mr-2 h-5 w-5" />
                Completed ({completed.length})
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {completed.map((training) => (
                <div
                  key={training.id}
                  className={`p-4 rounded-lg border ${
                    isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                        {training.program.title}
                      </h3>
                      <div className="flex gap-2 mt-1">
                        <Badge variant="outline" className="text-xs">
                          {training.program.level}
                        </Badge>
                        <Badge className="text-xs">
                          {training.program.category.replace('_', ' ')}
                        </Badge>
                      </div>

                      {training.score !== undefined && (
                        <p className={`mt-2 text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                          Score: <span className="font-semibold">{training.score}%</span>
                        </p>
                      )}

                      <div className="flex items-center text-sm text-muted-foreground mt-2">
                        <Calendar className="h-4 w-4 mr-1" />
                        Completed: {training.completedAt ? new Date(training.completedAt).toLocaleDateString() : 'N/A'}
                      </div>
                    </div>

                    {training.certificateUrl && (
                      <Button size="sm" variant="outline">
                        <Download className="h-4 w-4 mr-1" />
                        Certificate
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {trainings.length === 0 && (
        <Card className={isDarkMode ? 'bg-gray-800 border-gray-700' : ''}>
          <CardContent className="p-12 text-center">
            <Award className={`mx-auto h-12 w-12 ${isDarkMode ? 'text-gray-600' : 'text-gray-400'}`} />
            <p className={`mt-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              You haven't started any training programs yet.
            </p>
            <p className={`text-sm mt-2 ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>
              Browse available programs to get started.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
