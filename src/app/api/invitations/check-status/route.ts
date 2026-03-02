import { NextResponse } from 'next/server';
import prisma from '@/utils/db';

export async function POST(req: Request) {
  try {
    const { email, organizationId } = await req.json();

    if (!email || !organizationId) {
      return NextResponse.json({ error: 'Email and organizationId are required' }, { status: 400 });
    }

    // Find the invitation for this email and organization
    const invitation = await prisma.invitation.findFirst({
      where: {
        email,
        organizationId,
      },
      select: {
        id: true,
        status: true,
        acceptedAt: true,
      },
    });

    if (!invitation) {
      return NextResponse.json({ error: 'Invitation not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      status: invitation.status,
      acceptedAt: invitation.acceptedAt,
    });

  } catch (error) {
    console.error('Error checking invitation status:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 