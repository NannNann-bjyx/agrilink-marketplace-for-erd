# CloudFront CDN Setup Guide

## Overview
This guide shows how to add AWS CloudFront CDN to your S3 image storage for better global performance.

## Benefits
- **Faster Loading**: Images served from nearest edge location
- **Reduced S3 Costs**: Fewer direct S3 requests
- **Better Caching**: Automatic cache management
- **Global Performance**: Users worldwide get fast access

## Setup Steps

### 1. Create CloudFront Distribution

1. Go to AWS CloudFront Console
2. Click "Create Distribution"
3. Configure:

**Origin Settings:**
- Origin Domain: `your-bucket-name.s3.amazonaws.com`
- Origin Path: (leave empty)
- Origin Access: "Restrict Bucket Access" = Yes
- Origin Access Control: Create new OAC
- Viewer Protocol Policy: "Redirect HTTP to HTTPS"
- Allowed HTTP Methods: "GET, HEAD, OPTIONS, PUT, POST, PATCH, DELETE"

**Cache Settings:**
- Cache Policy: "CachingOptimized"
- TTL Settings:
  - Default TTL: 86400 (1 day)
  - Maximum TTL: 31536000 (1 year)
  - Minimum TTL: 0

**Distribution Settings:**
- Price Class: "Use All Edge Locations"
- Alternate Domain Names: (optional) `images.yourapp.com`
- SSL Certificate: "Default CloudFront Certificate"

### 2. Update S3 Bucket Policy

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "AllowCloudFrontServicePrincipal",
      "Effect": "Allow",
      "Principal": {
        "Service": "cloudfront.amazonaws.com"
      },
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::your-bucket-name/*",
      "Condition": {
        "StringEquals": {
          "AWS:SourceArn": "arn:aws:cloudfront::account-id:distribution/distribution-id"
        }
      }
    }
  ]
}
```

### 3. Update Your Code

#### Environment Variables
```bash
# Add to .env.local
AWS_CLOUDFRONT_DOMAIN=your-distribution-id.cloudfront.net
```

#### Update S3 Upload Service
```typescript
// src/lib/s3-upload.ts
export class S3UploadService {
  private cloudfrontDomain: string;

  constructor() {
    this.cloudfrontDomain = process.env.AWS_CLOUDFRONT_DOMAIN || '';
  }

  // Generate CDN URL instead of presigned URL
  generateCdnUrl(s3Key: string): string {
    if (this.cloudfrontDomain) {
      return `https://${this.cloudfrontDomain}/${s3Key}`;
    }
    // Fallback to presigned URL
    return this.generatePresignedUrl(s3Key);
  }
}
```

#### Update Image Components
```typescript
// src/components/S3Image.tsx
export function S3Image({ src, alt, className, fallback }: S3ImageProps) {
  const [imageUrl, setImageUrl] = useState<string>(src);

  useEffect(() => {
    const loadImage = async () => {
      if (!isS3Key(src)) {
        setImageUrl(src);
        return;
      }

      // Use CDN URL directly (no API call needed!)
      const cdnUrl = `https://${process.env.NEXT_PUBLIC_CLOUDFRONT_DOMAIN}/${src}`;
      setImageUrl(cdnUrl);
    };

    loadImage();
  }, [src]);

  return <img src={imageUrl} alt={alt} className={className} />;
}
```

## Performance Comparison

### Before CDN:
- S3 Direct: 200-500ms globally
- Presigned URL generation: 100-300ms
- Total: 300-800ms

### After CDN:
- CDN Edge: 10-50ms globally
- No presigned URL needed: 0ms
- Total: 10-50ms

## Cost Benefits

### S3 Costs (per month):
- 10,000 requests: $0.40
- 100,000 requests: $4.00
- 1,000,000 requests: $40.00

### CloudFront Costs (per month):
- 10,000 requests: $0.085
- 100,000 requests: $0.85
- 1,000,000 requests: $8.50

**Savings: ~80% on request costs!**

## Cache Invalidation

When you update an image:
```bash
# Invalidate specific file
aws cloudfront create-invalidation \
  --distribution-id YOUR_DISTRIBUTION_ID \
  --paths "/profiles/user123.jpg"

# Invalidate all files (expensive!)
aws cloudfront create-invalidation \
  --distribution-id YOUR_DISTRIBUTION_ID \
  --paths "/*"
```

## Monitoring

CloudFront provides detailed metrics:
- Cache hit ratio
- Request count by region
- Error rates
- Bandwidth usage

## Security

- Images are served over HTTPS
- No direct S3 access needed
- Can add custom headers
- Can restrict by geographic location
