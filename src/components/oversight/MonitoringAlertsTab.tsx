'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, AlertTriangle, CheckCircle, Bell } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface MonitoringAlert {
  id: string;
  alertType: string;
  severity: string;
  message: string;
  source: string;
  status: string;
  createdAt: string;
  acknowledgedAt?: string;
}

interface Props {
  organizationId: string;
  isDarkMode: boolean;
  onUpdate: () => void;
}

export default function MonitoringAlertsTab({ organizationId, isDarkMode, onUpdate }: Props) {
  const [alerts, setAlerts] = useState<MonitoringAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchAlerts();
  }, [organizationId]);

  const fetchAlerts = async () => {
    try {
      const response = await fetch(`/api/oversight/alerts?organizationId=${organizationId}`);
      if (response.ok) {
        const data = await response.json();
        setAlerts(data);
      }
    } catch (error) {
      console.error('Error fetching alerts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAcknowledge = async (id: string) => {
    try {
      const response = await fetch(`/api/oversight/alerts/${id}/acknowledge`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      if (!response.ok) throw new Error('Failed to acknowledge alert');

      await fetchAlerts();
      onUpdate();
      toast({
        title: "Success",
        description: "Alert acknowledged successfully.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to acknowledge alert.",
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  const activeAlerts = alerts.filter(a => a.status === 'ACTIVE');
  const criticalAlerts = activeAlerts.filter(a => a.severity === 'CRITICAL');

  return (
    <div className="space-y-6">
      <Card className={isDarkMode ? 'bg-gray-800 border-gray-700' : ''}>
        <CardHeader>
          <CardTitle className={isDarkMode ? 'text-white' : ''}>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Bell className="mr-2 h-5 w-5" />
                Monitoring Alerts
              </div>
              <div className="flex gap-2">
                <Badge variant="destructive">{criticalAlerts.length} Critical</Badge>
                <Badge>{activeAlerts.length} Active</Badge>
              </div>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {alerts.length === 0 ? (
              <div className="text-center py-8">
                <AlertTriangle className={`mx-auto h-12 w-12 ${isDarkMode ? 'text-gray-600' : 'text-gray-400'}`} />
                <p className={`mt-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  No alerts at this time.
                </p>
              </div>
            ) : (
              alerts.map((alert) => (
                <Card key={alert.id} className={`${isDarkMode ? 'bg-gray-700 border-gray-600' : ''} ${
                  alert.severity === 'CRITICAL' ? 'border-red-500' : ''
                }`}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant={
                            alert.severity === 'CRITICAL' ? 'destructive' :
                            alert.severity === 'HIGH' ? 'destructive' :
                            alert.severity === 'MEDIUM' ? 'default' : 'secondary'
                          }>
                            {alert.severity}
                          </Badge>
                          <Badge variant="outline">{alert.alertType}</Badge>
                          {alert.status === 'ACKNOWLEDGED' && (
                            <CheckCircle className="h-4 w-4 text-green-600" />
                          )}
                        </div>
                        <p className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                          {alert.message}
                        </p>
                        <p className={`text-xs mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                          Source: {alert.source} • {new Date(alert.createdAt).toLocaleString()}
                        </p>
                      </div>
                      {alert.status === 'ACTIVE' && (
                        <Button size="sm" variant="outline" onClick={() => handleAcknowledge(alert.id)}>
                          Acknowledge
                        </Button>
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
