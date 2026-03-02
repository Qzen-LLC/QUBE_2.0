import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth-gateway';

import { del } from '@vercel/blob';

export const DELETE = withAuth(async (
  request: Request,
  { auth }: { auth: any }
) => {
  try {
    // Check authentication
    // auth context is provided by withAuth wrapper

    const { fileUrl } = await request.json();

    if (!fileUrl) {
      return NextResponse.json({ error: 'File URL is required' }, { status: 400 });
    }

    // Delete from Vercel Blob
    await del(fileUrl);

    return NextResponse.json({
      success: true,
      message: 'File deleted successfully'
    });

  } catch (error) {
    console.error('File deletion error:', error);
    return NextResponse.json(
      { error: 'Failed to delete file' },
      { status: 500 }
    );
  }
}, { requireUser: true });