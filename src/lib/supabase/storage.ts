import { supabase } from './client';

const BUCKET_NAME = 'message-attachments';

// ============================================
// FILE UPLOAD
// ============================================

export async function uploadFile(
  file: File,
  path: string
): Promise<{ path: string }> {
  const { data, error } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(path, file, {
      cacheControl: '3600',
      upsert: false,
    });

  if (error) throw error;

  return {
    path: data.path,
  };
}

// ============================================
// FILE DOWNLOAD
// ============================================

export async function getFileUrl(path: string): Promise<string> {
  return getSignedUrl(path);
}

export async function getSignedUrl(path: string, expiresIn: number = 3600): Promise<string> {
  const { data, error } = await supabase.storage
    .from(BUCKET_NAME)
    .createSignedUrl(path, expiresIn);

  if (error) throw error;
  return data.signedUrl;
}

// ============================================
// FILE DELETE
// ============================================

export async function deleteFile(path: string): Promise<void> {
  const { error } = await supabase.storage
    .from(BUCKET_NAME)
    .remove([path]);

  if (error) throw error;
}

// ============================================
// HELPER FUNCTIONS
// ============================================

export function generateFilePath(userId: string, fileName: string): string {
  const timestamp = Date.now();
  // Strip any directory components first to prevent path traversal
  const basename = fileName.split('/').pop()?.split('\\').pop() ?? 'file';
  const sanitizedFileName = basename.replace(/[^a-zA-Z0-9.-]/g, '_');
  return `${userId}/${timestamp}-${sanitizedFileName}`;
}

export function getFileExtension(fileName: string): string {
  return fileName.split('.').pop()?.toLowerCase() || '';
}

export function isValidFileType(fileName: string): boolean {
  const extension = getFileExtension(fileName);
  const allowedExtensions = [
    'jpg', 'jpeg', 'png', 'gif', 'webp', // Images
    'pdf', // PDFs
    'doc', 'docx', // Word documents
    'txt', // Text files
  ];
  return allowedExtensions.includes(extension);
}

export function getFileSizeMB(fileSizeBytes: number): number {
  return fileSizeBytes / (1024 * 1024);
}

export const MAX_FILE_SIZE_MB = 10;
