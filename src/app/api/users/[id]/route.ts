import { prismaClient } from '@/utils/db';
import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth-gateway';

export const GET = withAuth(async (
  req: Request,
  { params, auth }: { params: Promise<{ id: string }>, auth: any }
) => {
  try {
    const { id } = await params;
    
    if (!id) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    // Fetch user by ID
    const user = await prismaClient.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({ user });
  } catch (error) {
    console.error('Error fetching user:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}, { requireUser: true });
