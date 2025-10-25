// Utility to get fresh S3 URLs
export async function getS3Url(s3Key: string): Promise<string> {
  try {
    const response = await fetch('/api/s3/generate-url', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ s3Key }),
    });
    
    if (!response.ok) {
      throw new Error('Failed to generate URL');
    }
    
    const data = await response.json();
    return data.presignedUrl;
  } catch (error) {
    console.error('Failed to get S3 URL:', error);
    // Fallback to placeholder image
    return '/api/placeholder/400/300?text=Image+Not+Available';
  }
}

// Check if a string is an S3 key (not a full URL)
export function isS3Key(filepath: string): boolean {
  return !filepath.startsWith('http') && !filepath.startsWith('data:') && !filepath.startsWith('/');
}
