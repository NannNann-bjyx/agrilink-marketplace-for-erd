import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { randomUUID } from 'crypto';

export interface UploadedFile {
  filename: string;
  filepath: string;
  originalName: string;
  size: number;
  mimeType: string;
}

/**
 * Upload a base64 image to the filesystem and return the file path
 */
export async function uploadBase64Image(
  base64Data: string,
  folder: 'verification' | 'profiles' | 'storefronts' | 'products',
  originalName?: string
): Promise<UploadedFile> {
  try {
    // Extract the base64 data and mime type
    const matches = base64Data.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    if (!matches || matches.length !== 3) {
      throw new Error('Invalid base64 data format');
    }

    const mimeType = matches[1];
    const base64String = matches[2];
    
    // Validate mime type
    if (!mimeType.startsWith('image/')) {
      throw new Error('File must be an image');
    }

    // Convert base64 to buffer
    const buffer = Buffer.from(base64String, 'base64');
    
    // Generate unique filename
    const fileExtension = mimeType.split('/')[1] || 'jpg';
    const uniqueId = randomUUID();
    const filename = `${uniqueId}.${fileExtension}`;
    
    // Create directory if it doesn't exist
    const uploadDir = join(process.cwd(), 'public', 'uploads', folder);
    await mkdir(uploadDir, { recursive: true });
    
    // Write file to filesystem
    const filepath = join(uploadDir, filename);
    await writeFile(filepath, buffer);
    
    // Return file information
    const uploadedFile: UploadedFile = {
      filename,
      filepath: `/uploads/${folder}/${filename}`, // Public URL path
      originalName: originalName || `upload.${fileExtension}`,
      size: buffer.length,
      mimeType
    };
    
    console.log('✅ File uploaded successfully:', {
      folder,
      filename,
      size: buffer.length,
      mimeType
    });
    
    return uploadedFile;
  } catch (error) {
    console.error('❌ File upload failed:', error);
    throw new Error(`Failed to upload file: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Upload multiple base64 images
 */
export async function uploadMultipleBase64Images(
  base64DataArray: string[],
  folder: 'verification' | 'profiles' | 'storefronts' | 'products',
  originalNames?: string[]
): Promise<UploadedFile[]> {
  const uploadPromises = base64DataArray.map((base64Data, index) => 
    uploadBase64Image(base64Data, folder, originalNames?.[index])
  );
  
  return Promise.all(uploadPromises);
}

/**
 * Delete a file from the filesystem
 */
export async function deleteFile(filepath: string): Promise<void> {
  try {
    const { unlink } = await import('fs/promises');
    const fullPath = join(process.cwd(), 'public', filepath);
    await unlink(fullPath);
    console.log('✅ File deleted successfully:', filepath);
  } catch (error) {
    console.error('❌ File deletion failed:', error);
    // Don't throw error for file deletion failures
  }
}
