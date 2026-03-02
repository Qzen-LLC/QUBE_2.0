import { Storage } from '@google-cloud/storage';
import { v4 as uuidv4 } from 'uuid';

// Initialize Google Cloud Storage
const storage = process.env.GCP_PROJECT_ID
  ? new Storage({
      projectId: process.env.GCP_PROJECT_ID,
    })
  : null;

const bucket = storage && process.env.GCP_STORAGE_BUCKET
  ? storage.bucket(process.env.GCP_STORAGE_BUCKET)
  : null;

export async function uploadToGCS(
  file: Buffer,
  filename: string,
  mimetype: string
): Promise<string> {
  if (!bucket) {
    throw new Error('Google Cloud Storage is not configured');
  }

  const uniqueFilename = `${uuidv4()}-${filename}`;
  const blob = bucket.file(`evidence/${uniqueFilename}`);

  await blob.save(file, {
    metadata: {
      contentType: mimetype,
    },
    resumable: false, // For files under 10MB
  });

  // Make file publicly accessible
  await blob.makePublic();

  return `https://storage.googleapis.com/${process.env.GCP_STORAGE_BUCKET}/evidence/${uniqueFilename}`;
}

export async function deleteFromGCS(fileUrl: string): Promise<void> {
  if (!bucket) {
    throw new Error('Google Cloud Storage is not configured');
  }

  // Extract filename from URL
  const urlParts = fileUrl.split('/');
  const filename = urlParts.slice(-2).join('/'); // evidence/filename.ext

  try {
    await bucket.file(filename).delete();
  } catch (error) {
    console.error('Error deleting file from GCS:', error);
    throw error;
  }
}

export async function getSignedUploadUrl(
  filename: string,
  contentType: string
): Promise<{ uploadUrl: string; fileUrl: string }> {
  if (!bucket) {
    throw new Error('Google Cloud Storage is not configured');
  }

  const uniqueFilename = `${uuidv4()}-${filename}`;
  const blob = bucket.file(`evidence/${uniqueFilename}`);

  // Generate a signed URL for uploading
  const [uploadUrl] = await blob.getSignedUrl({
    version: 'v4',
    action: 'write',
    expires: Date.now() + 15 * 60 * 1000, // 15 minutes
    contentType,
  });

  const fileUrl = `https://storage.googleapis.com/${process.env.GCP_STORAGE_BUCKET}/evidence/${uniqueFilename}`;

  return { uploadUrl, fileUrl };
}