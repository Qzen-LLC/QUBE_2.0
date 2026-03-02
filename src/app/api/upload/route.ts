import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth-gateway';

import { put } from '@vercel/blob';
import { prismaClient } from '@/utils/db';
import { v4 as uuidv4 } from 'uuid';

export const POST = withAuth(async (
  request: Request,
  { auth }: { auth: any }
) => {
  try {
    // Check authentication
    // auth context is provided by withAuth wrapper

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const useCaseId = formData.get('useCaseId') as string;
    const frameworkType = formData.get('frameworkType') as string; // 'eu-ai-act', 'iso-42001', 'uae-ai'

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    if (!useCaseId) {
      return NextResponse.json({ error: 'Use case ID is required' }, { status: 400 });
    }

    if (!frameworkType) {
      return NextResponse.json({ error: 'Framework type is required' }, { status: 400 });
    }

    // Validate file size (10MB limit)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return NextResponse.json({ error: 'File too large. Maximum size is 10MB.' }, { status: 400 });
    }

    // Validate file type
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain',
      'image/png',
      'image/jpeg',
      'image/jpg',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ];

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ 
        error: 'Invalid file type. Allowed types: PDF, DOC, DOCX, TXT, PNG, JPG, JPEG, XLS, XLSX' 
      }, { status: 400 });
    }

    // Get user data from database
    const userRecord = await prismaClient.user.findUnique({
      where: { clerkId: auth.userId! },
      include: { organization: true }
    });

    if (!userRecord) {
      return NextResponse.json({ error: 'User not found in database' }, { status: 404 });
    }

    // Get use case data
    const useCase = await prismaClient.useCase.findUnique({
      where: { id: useCaseId }
    });

    if (!useCase) {
      return NextResponse.json({ error: 'Use case not found' }, { status: 404 });
    }

    // Build directory path based on user type and organization
    let directoryPath: string;
    
    if (userRecord.organizationId) {
      // Organization user
      directoryPath = `evidence/${userRecord.organizationId}/${useCaseId}/${frameworkType}`;
    } else {
      // Individual user
      directoryPath = `evidence/individual/${userRecord.id}/${useCaseId}/${frameworkType}`;
    }

    // Generate unique filename
    const fileExtension = file.name.split('.').pop();
    const fileName = `${uuidv4()}.${fileExtension}`;
    const fullPath = `${directoryPath}/${fileName}`;

    // Upload to Vercel Blob
    const blob = await put(fullPath, file, {
      access: 'public',
      addRandomSuffix: true,
    });

    // Return the URL that can be used to access the file
    const fileUrl = blob.url;

    return NextResponse.json({
      success: true,
      url: fileUrl,
      filename: file.name,
      size: file.size,
      type: file.type,
      path: fullPath
    });

  } catch (error) {
    console.error('File upload error:', error);
    return NextResponse.json(
      { error: 'Failed to upload file' },
      { status: 500 }
    );
  }
}, { requireUser: true });