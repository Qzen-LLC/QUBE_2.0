'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, Shield, Plus } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface Incident {
  id: string;
  title: string;
  incidentType: string;
  severity: string;
  status: string;
  reportedAt: string;
  resolvedAt?: string;
  assignedTo?: string;
}

interface Props {
  organizationId: string;
  isDarkMode: boolean;
  onUpdate: () => void;
}

export default function IncidentManagementTab({ organizationId, isDarkMode, onUpdate }: Props) {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchIncidents();
  }, [organizationId]);

  const fetchIncidents = async () => {
    try {
      const response = await fetch(`/api/oversight/incidents?organizationId=${organizationId}`);
      if (response.ok) {
        const data = await response.json();
        setIncidents(data);
      }
    } catch (error) {
      console.error('Error fetching incidents:', error);
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

  const openIncidents = incidents.filter(i => i.status !== 'RESOLVED').length;

  return (
    <div className="space-y-6">
      <Card className={isDarkMode ? 'bg-gray-800 border-gray-700' : ''}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className={isDarkMode ? 'text-white' : ''}>
              <div className="flex items-center">
                <Shield className="mr-2 h-5 w-5" />
                Incident Management
              </div>
            </CardTitle>
            <div className="flex items-center gap-2">
              <Badge variant="destructive">{openIncidents} Open</Badge>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Report Incident
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {incidents.length === 0 ? (
            <div className="text-center py-8">
              <Shield className={`mx-auto h-12 w-12 ${isDarkMode ? 'text-gray-600' : 'text-gray-400'}`} />
              <p className={`mt-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                No incidents reported.
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className={isDarkMode ? 'border-gray-700' : ''}>
                  <TableHead className={isDarkMode ? 'text-gray-300' : ''}>Title</TableHead>
                  <TableHead className={isDarkMode ? 'text-gray-300' : ''}>Type</TableHead>
                  <TableHead className={isDarkMode ? 'text-gray-300' : ''}>Severity</TableHead>
                  <TableHead className={isDarkMode ? 'text-gray-300' : ''}>Status</TableHead>
                  <TableHead className={isDarkMode ? 'text-gray-300' : ''}>Reported</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {incidents.map((incident) => (
                  <TableRow key={incident.id} className={isDarkMode ? 'border-gray-700' : ''}>
                    <TableCell className={isDarkMode ? 'text-white font-medium' : 'font-medium'}>
                      {incident.title}
                    </TableCell>
                    <TableCell className={isDarkMode ? 'text-gray-300' : ''}>
                      <Badge variant="outline">{incident.incidentType}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={
                        incident.severity === 'CRITICAL' ? 'destructive' :
                        incident.severity === 'HIGH' ? 'destructive' : 'secondary'
                      }>
                        {incident.severity}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={incident.status === 'RESOLVED' ? 'default' : 'secondary'}
                        className={incident.status === 'RESOLVED' ? 'bg-green-600' : ''}>
                        {incident.status}
                      </Badge>
                    </TableCell>
                    <TableCell className={isDarkMode ? 'text-gray-300' : ''}>
                      {new Date(incident.reportedAt).toLocaleDateString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
