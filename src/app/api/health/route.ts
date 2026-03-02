import { NextResponse } from 'next/server';
import { prismaClient as prisma } from '@/utils/db';


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