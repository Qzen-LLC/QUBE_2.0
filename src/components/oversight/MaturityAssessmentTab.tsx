'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, TrendingUp, Target } from "lucide-react";

interface MaturityAssessment {
  id: string;
  dimension: string;
  level: number;
  targetLevel: number;
  score: number;
  assessmentDate: string;
  recommendations: string[];
}

interface Props {
  organizationId: string;
  isDarkMode: boolean;
  onUpdate: () => void;
}

const MATURITY_LEVELS = [
  { level: 1, label: 'Initial', description: 'Ad hoc and chaotic' },
  { level: 2, label: 'Developing', description: 'Repeatable but informal' },
  { level: 3, label: 'Defined', description: 'Documented and standardized' },
  { level: 4, label: 'Managed', description: 'Measured and controlled' },
  { level: 5, label: 'Optimizing', description: 'Continuous improvement' },
];

export default function MaturityAssessmentTab({ organizationId, isDarkMode, onUpdate }: Props) {
  const [assessments, setAssessments] = useState<MaturityAssessment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAssessments();
  }, [organizationId]);

  const fetchAssessments = async () => {
    try {
      const response = await fetch(`/api/oversight/maturity?organizationId=${organizationId}`);
      if (response.ok) {
        const data = await response.json();
        setAssessments(data);
      }
    } catch (error) {
      console.error('Error fetching maturity assessments:', error);
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

  const averageScore = assessments.length > 0
    ? Math.round(assessments.reduce((sum, a) => sum + a.score, 0) / assessments.length)
    : 0;

  const overallLevel = Math.round(
    assessments.reduce((sum, a) => sum + a.level, 0) / Math.max(assessments.length, 1)
  );

  return (
    <div className="space-y-6">
      {/* Overall Maturity */}
      <Card className={isDarkMode ? 'bg-gray-800 border-gray-700' : ''}>
        <CardHeader>
          <CardTitle className={isDarkMode ? 'text-white' : ''}>
            <div className="flex items-center">
              <Target className="mr-2 h-5 w-5" />
              Governance Maturity Assessment
            </div>
          </CardTitle>
          <CardDescription className={isDarkMode ? 'text-gray-400' : ''}>
            Measure your AI governance maturity across key dimensions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div className={`p-6 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-blue-50'}`}>
              <p className={`text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-blue-600'}`}>
                Overall Maturity Level
              </p>
              <p className={`text-3xl font-bold mt-2 ${isDarkMode ? 'text-white' : 'text-blue-900'}`}>
                Level {overallLevel}
              </p>
              <p className={`text-sm mt-1 ${isDarkMode ? 'text-gray-400' : 'text-blue-700'}`}>
                {MATURITY_LEVELS[overallLevel - 1]?.label}
              </p>
            </div>
            <div className={`p-6 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-green-50'}`}>
              <p className={`text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-green-600'}`}>
                Average Score
              </p>
              <p className={`text-3xl font-bold mt-2 ${isDarkMode ? 'text-white' : 'text-green-900'}`}>
                {averageScore}%
              </p>
              <p className={`text-sm mt-1 ${isDarkMode ? 'text-gray-400' : 'text-green-700'}`}>
                Across all dimensions
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Maturity Levels Reference */}
      <Card className={isDarkMode ? 'bg-gray-800 border-gray-700' : ''}>
        <CardHeader>
          <CardTitle className={isDarkMode ? 'text-white' : ''}>Maturity Levels</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {MATURITY_LEVELS.map((level) => (
              <div key={level.level} className={`flex items-center gap-4 p-3 rounded-lg ${
                isDarkMode ? 'bg-gray-700' : 'bg-gray-50'
              }`}>
                <Badge variant={overallLevel >= level.level ? 'default' : 'outline'}
                  className={overallLevel >= level.level ? 'bg-green-600' : ''}>
                  Level {level.level}
                </Badge>
                <div className="flex-1">
                  <p className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    {level.label}
                  </p>
                  <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    {level.description}
                  </p>
                </div>
                {overallLevel === level.level && (
                  <Badge variant="secondary">Current Level</Badge>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Dimension Assessments */}
      <Card className={isDarkMode ? 'bg-gray-800 border-gray-700' : ''}>
        <CardHeader>
          <CardTitle className={isDarkMode ? 'text-white' : ''}>Maturity by Dimension</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {assessments.length === 0 ? (
              <div className="text-center py-8">
                <TrendingUp className={`mx-auto h-12 w-12 ${isDarkMode ? 'text-gray-600' : 'text-gray-400'}`} />
                <p className={`mt-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  No maturity assessments completed yet.
                </p>
                <Button className="mt-4">
                  Start Assessment
                </Button>
              </div>
            ) : (
              assessments.map((assessment) => (
                <Card key={assessment.id} className={isDarkMode ? 'bg-gray-700 border-gray-600' : ''}>
                  <CardContent className="p-4">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <h3 className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                          {assessment.dimension}
                        </h3>
                        <div className="flex gap-2">
                          <Badge>Level {assessment.level}</Badge>
                          <Badge variant="outline">Target: {assessment.targetLevel}</Badge>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>
                            Maturity Score
                          </span>
                          <span className={isDarkMode ? 'text-white' : 'text-gray-900'}>
                            {assessment.score}%
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full"
                            style={{ width: `${assessment.score}%` }}
                          />
                        </div>
                      </div>

                      {assessment.recommendations.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-600">
                          <p className={`text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                            Recommendations:
                          </p>
                          <ul className="list-disc list-inside space-y-1">
                            {assessment.recommendations.map((rec, idx) => (
                              <li key={idx} className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                {rec}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
