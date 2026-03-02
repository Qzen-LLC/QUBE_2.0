import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth-gateway';
import prisma from '@/utils/db';

export const POST = withAuth(async (req: Request, { auth }) => {
  // Only allow in development
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Not available in production' }, { status: 403 });
  }

  try {
    // auth context is provided by withAuth wrapper

    const { role = 'USER' } = await req.json();

    console.log('Creating user with Clerk ID:', auth.userId!, 'Role:', role);

    // Check if user already exists
    let userRecord = await prisma.user.findUnique({
      where: { clerkId: auth.userId! },
    });

    if (userRecord) {
      // Update existing user
      userRecord = await prisma.user.update({
        where: { clerkId: auth.userId! },
        data: { role: role as any },
      });
      console.log('User updated:', userRecord.email);
    } else {
      // Create new user
      userRecord = await prisma.user.create({
        data: {
          clerkId: auth.userId!,
          email: auth.user?.email || '',
          firstName: auth.user?.firstName || null,
          lastName: auth.user?.lastName || null,
          role: role as any,
        },
      });
      console.log('User created:', userRecord.email);
    }

    return NextResponse.json({
      success: true,
      user: {
        id: userRecord.id,
        email: userRecord.email,
        role: userRecord.role,
        clerkId: userRecord.clerkId,
      },
    });

  } catch (error) {
    console.error('Error creating user:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}, { requireUser: true });