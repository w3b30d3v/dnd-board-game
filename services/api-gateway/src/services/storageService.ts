/**
 * Storage Service
 * Handles file uploads to S3/MinIO for permanent storage of AI-generated images
 */

import {
  S3Client,
  PutObjectCommand,
  HeadBucketCommand,
  CreateBucketCommand,
} from '@aws-sdk/client-s3';
import { config } from '../config.js';

// Initialize S3 client
const s3Client = new S3Client({
  endpoint: config.storage.endpoint,
  region: config.storage.region,
  credentials: {
    accessKeyId: config.storage.accessKey,
    secretAccessKey: config.storage.secretKey,
  },
  forcePathStyle: true, // Required for MinIO
});

// Track bucket initialization
let bucketsInitialized = false;

/**
 * Ensure the required buckets exist
 */
async function ensureBucketsExist(): Promise<void> {
  if (bucketsInitialized) return;

  const buckets = [config.storage.bucketAssets, config.storage.bucketMedia];

  for (const bucket of buckets) {
    try {
      await s3Client.send(new HeadBucketCommand({ Bucket: bucket }));
      console.log(`[Storage] Bucket "${bucket}" exists`);
    } catch (error: unknown) {
      // Bucket doesn't exist, create it
      if (error && typeof error === 'object' && 'name' in error && error.name === 'NotFound') {
        try {
          await s3Client.send(new CreateBucketCommand({ Bucket: bucket }));
          console.log(`[Storage] Created bucket "${bucket}"`);
        } catch (createError) {
          console.error(`[Storage] Failed to create bucket "${bucket}":`, createError);
        }
      } else {
        // Other error (e.g., connection refused) - log but don't fail
        console.warn(`[Storage] Could not check bucket "${bucket}":`, error);
      }
    }
  }

  bucketsInitialized = true;
}

/**
 * Download an image from a URL and return as Buffer
 */
async function downloadImage(url: string): Promise<Buffer> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to download image: ${response.status} ${response.statusText}`);
  }
  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

/**
 * Get content type from URL or default to image/png
 */
function getContentType(url: string): string {
  const extension = url.split('.').pop()?.toLowerCase().split('?')[0];
  const contentTypes: Record<string, string> = {
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    gif: 'image/gif',
    webp: 'image/webp',
    svg: 'image/svg+xml',
  };
  return contentTypes[extension || ''] || 'image/png';
}

/**
 * Generate a unique filename for storage
 */
function generateFilename(prefix: string, extension: string = 'png'): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  return `${prefix}/${timestamp}-${random}.${extension}`;
}

/**
 * Upload an image from a URL to permanent storage
 * Downloads the image and re-uploads to S3/MinIO
 *
 * @param sourceUrl - The temporary URL to download from (e.g., NanoBanana CDN)
 * @param category - Category prefix for organizing files (e.g., 'characters', 'npcs', 'locations')
 * @param identifier - Optional identifier to include in filename (e.g., character ID)
 * @returns The permanent public URL
 */
export async function uploadImageFromUrl(
  sourceUrl: string,
  category: string,
  identifier?: string
): Promise<string> {
  // Ensure buckets exist
  await ensureBucketsExist();

  // Download the image
  const imageBuffer = await downloadImage(sourceUrl);

  // Determine content type and extension
  const contentType = getContentType(sourceUrl);
  const extension = contentType.split('/')[1] || 'png';

  // Generate filename
  const prefix = identifier ? `${category}/${identifier}` : category;
  const filename = generateFilename(prefix, extension);

  // Upload to S3/MinIO/R2
  // Note: R2 doesn't support ACL - public access is configured via bucket settings or custom domains
  await s3Client.send(
    new PutObjectCommand({
      Bucket: config.storage.bucketMedia,
      Key: filename,
      Body: imageBuffer,
      ContentType: contentType,
    })
  );

  // Return the public URL
  const publicUrl = `${config.storage.publicUrl}/${config.storage.bucketMedia}/${filename}`;
  console.log(`[Storage] Uploaded image to ${publicUrl}`);

  return publicUrl;
}

/**
 * Upload multiple images from URLs to permanent storage
 *
 * @param sources - Array of {url, category, identifier} objects
 * @returns Array of permanent public URLs (in same order)
 */
export async function uploadImagesFromUrls(
  sources: Array<{ url: string; category: string; identifier?: string }>
): Promise<string[]> {
  const results = await Promise.all(
    sources.map(({ url, category, identifier }) =>
      uploadImageFromUrl(url, category, identifier).catch((error) => {
        console.error(`[Storage] Failed to upload image from ${url}:`, error);
        // Return original URL as fallback if upload fails
        return url;
      })
    )
  );
  return results;
}

/**
 * Upload a raw buffer to storage
 *
 * @param buffer - The image buffer
 * @param category - Category prefix
 * @param contentType - MIME type
 * @param identifier - Optional identifier
 * @returns The permanent public URL
 */
export async function uploadBuffer(
  buffer: Buffer,
  category: string,
  contentType: string = 'image/png',
  identifier?: string
): Promise<string> {
  await ensureBucketsExist();

  const extension = contentType.split('/')[1] || 'png';
  const prefix = identifier ? `${category}/${identifier}` : category;
  const filename = generateFilename(prefix, extension);

  await s3Client.send(
    new PutObjectCommand({
      Bucket: config.storage.bucketMedia,
      Key: filename,
      Body: buffer,
      ContentType: contentType,
    })
  );

  return `${config.storage.publicUrl}/${config.storage.bucketMedia}/${filename}`;
}

/**
 * Check if storage is configured and accessible
 */
export async function checkStorageHealth(): Promise<{
  healthy: boolean;
  endpoint: string;
  bucket: string;
  error?: string;
}> {
  try {
    await s3Client.send(
      new HeadBucketCommand({ Bucket: config.storage.bucketMedia })
    );
    return {
      healthy: true,
      endpoint: config.storage.endpoint,
      bucket: config.storage.bucketMedia,
    };
  } catch (error) {
    return {
      healthy: false,
      endpoint: config.storage.endpoint,
      bucket: config.storage.bucketMedia,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

export default {
  uploadImageFromUrl,
  uploadImagesFromUrls,
  uploadBuffer,
  checkStorageHealth,
};
