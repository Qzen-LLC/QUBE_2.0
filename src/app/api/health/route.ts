import { NextResponse } from 'next/server';
import { prismaClient as prisma } from '@/utils/db';
import { isMCPAvailable } from '@/lib/architect/engine/mcp-cost-explorer-client';
import { isMLflowAvailable } from '@/lib/architect/engine/mlflow-client';


export async function GET() {
  const startTime = Date.now();
  const services: Record<string, string> = {};
  const errors: string[] = [];

  // Check database connection
  try {
    await prisma.$queryRaw`SELECT 1`;
    services.database = 'connected';
  } catch (error) {
    services.database = 'disconnected';
    errors.push(`Database: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }

  // Check MCP Cost Explorer reachability (non-blocking)
  if (process.env.MCP_COST_EXPLORER_URL) {
    try {
      const mcpAvailable = await isMCPAvailable();
      services.mcp = mcpAvailable ? 'connected' : 'unreachable';
    } catch {
      services.mcp = 'unreachable';
    }
  } else {
    services.mcp = 'not_configured';
  }

  // Check MLflow reachability (non-blocking, reads config from DB)
  try {
    const mlflowConfig = await prisma.productionConfiguration.findFirst({
      where: { mlflowEnabled: true },
      select: { mlflowTrackingUrl: true, mlflowAuthUsername: true, mlflowAuthPassword: true },
    });
    if (mlflowConfig?.mlflowTrackingUrl) {
      const mlflowAvailable = await isMLflowAvailable({
        trackingUrl: mlflowConfig.mlflowTrackingUrl,
        authUsername: mlflowConfig.mlflowAuthUsername,
        authPassword: mlflowConfig.mlflowAuthPassword,
      });
      services.mlflow = mlflowAvailable ? 'connected' : 'unreachable';
    } else {
      services.mlflow = 'not_configured';
    }
  } catch {
    services.mlflow = 'not_configured';
  }

  // Check environment variables
  const requiredEnvVars = [
    'DATABASE_URL',
  ];

  const missingEnvVars = requiredEnvVars.filter((varName) => !process.env[varName]);
  if (missingEnvVars.length > 0) {
    errors.push(`Missing environment variables: ${missingEnvVars.join(', ')}`);
  }

  const responseTime = Date.now() - startTime;
  const isHealthy = errors.length === 0;

  return NextResponse.json(
    {
      status: isHealthy ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      responseTime: `${responseTime}ms`,
      services,
      ...(errors.length > 0 && { errors }),
      environment: process.env.NODE_ENV || 'development',
      version: process.env.npm_package_version || 'unknown',
    },
    { status: isHealthy ? 200 : 503 }
  );
}