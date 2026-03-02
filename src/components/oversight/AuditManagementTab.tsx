'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, FileText, Plus, Calendar } from "lucide-react";

interface Audit {
  id: string;
  title: string;
  auditType: string;
  scope: string;
  status: string;
  scheduledDate: string;
  completedDate?: string;
  findings?: number;
}

interface Props {
  organizationId: string;
  isDarkMode: boolean;
  onUpdate: () => void;
}

export default function AuditManagementTab({ organizationId, isDarkMode, onUpdate }: Props) {
  const [audits, setAudits] = useState<Audit[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAudits();
  }, [organizationId]);

  const fetchAudits = async () => {
    try {
      const response = await fetch(`/api/oversight/audits?organizationId=${organizationId}`);
      if (response.ok) {
        const data = await response.json();
        setAudits(data);
      }
    } catch (error) {
      console.error('Error fetching audits:', error);
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

  const pendingAudits = audits.filter(a => a.status === 'PLANNED' || a.status === 'IN_PROGRESS').length;

  return (
    <div className="space-y-6">
      <Card className={isDarkMode ? 'bg-gray-800 border-gray-700' : ''}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className={isDarkMode ? 'text-white' : ''}>
              <div className="flex items-center">
                <FileText className="mr-2 h-5 w-5" />
                Audit Management
              </div>
            </CardTitle>
            <div className="flex items-center gap-2">
              <Badge>{pendingAudits} Pending</Badge>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Schedule Audit
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {audits.length === 0 ? (
              <div className="text-center py-8">
                <FileText className={`mx-auto h-12 w-12 ${isDarkMode ? 'text-gray-600' : 'text-gray-400'}`} />
                <p className={`mt-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  No audits scheduled.
                </p>
              </div>
            ) : (
              audits.map((audit) => (
                <Card key={audit.id} className={isDarkMode ? 'bg-gray-700 border-gray-600' : ''}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                          {audit.title}
                        </h3>
                        <div className="flex gap-2 mt-2">
                          <Badge variant="outline">{audit.auditType}</Badge>
                          <Badge variant={
                            audit.status === 'COMPLETED' ? 'default' :
                            audit.status === 'IN_PROGRESS' ? 'secondary' : 'outline'
                          }
                          className={audit.status === 'COMPLETED' ? 'bg-green-600' : ''}>
                            {audit.status}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                          <div className="flex items-center">
                            <Calendar className="h-4 w-4 mr-1" />
                            {new Date(audit.scheduledDate).toLocaleDateString()}
                          </div>
                          {audit.findings !== undefined && (
                            <span>{audit.findings} findings</span>
                          )}
                        </div>
                      </div>
                      <Button variant="outline" size="sm">
                        View Details
                      </Button>
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
