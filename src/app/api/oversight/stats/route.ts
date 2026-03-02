import { NextRequest, NextResponse } from 'next/server';
import { prismaClient } from '@/utils/db';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const organizationId = searchParams.get('organizationId');

    if (!organizationId) {
      return NextResponse.json({ error: 'Organization ID is required' }, { status: 400 });
    }

    // Get KPI stats
    const kpis = await prismaClient.governanceKPI.findMany({
      where: { organizationId }
    });
    const totalKPIs = kpis.length;
    const kpisOnTrack = kpis.filter(k => k.status === 'ON_TRACK').length;

    // Get alert stats
    const alerts = await prismaClient.governanceAlert.findMany({
      where: { organizationId, status: 'ACTIVE' }
    });
    const activeAlerts = alerts.length;
    const criticalAlerts = alerts.filter(a => a.severity === 'CRITICAL').length;

    // Get incident stats
    const incidents = await prismaClient.incident.findMany({
      where: { organizationId }
    });
    const openIncidents = incidents.filter(i => i.status !== 'RESOLVED').length;

    // Get audit stats
    const audits = await prismaClient.auditLog.findMany({
      where: { organizationId }
    });
    const pendingAudits = audits.filter(a => a.status === 'PLANNED' || a.status === 'IN_PROGRESS').length;

    // Get maturity score (convert level enum to numeric score)
    const maturityAssessments = await prismaClient.maturityAssessment.findMany({
      where: { organizationId },
      orderBy: { assessmentDate: 'desc' },
      take: 1
    });

    // Convert maturity level to percentage score
    const levelToScore = (level: string) => {
      switch (level) {
        case 'LEVEL_1_INITIAL': return 20;
        case 'LEVEL_2_DEVELOPING': return 40;
        case 'LEVEL_3_DEFINED': return 60;
        case 'LEVEL_4_MANAGED': return 80;
        case 'LEVEL_5_OPTIMIZING': return 100;
        default: return 0;
      }
    };

    const maturityScore = maturityAssessments.length > 0
      ? levelToScore(maturityAssessments[0].overallLevel)
      : 0;

    return NextResponse.json({
      totalKPIs,
      kpisOnTrack,
      activeAlerts,
      criticalAlerts,
      openIncidents,
      pendingAudits,
      maturityScore
    });
  } catch (error) {
    console.error('Error fetching oversight stats:', error);
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 });
  }
}
