/**
 * Storage Service for AI Service
 * Handles file uploads to S3/R2 for permanent storage of AI-generated images
 */

import {
  S3Client,
  PutObjectCommand,
  HeadBucketCommand,
  CreateBucketCommand,
} from '@aws-sdk/client-s3';
import { logger } from './logger.js';

// S3/R2 configuration from environment
const config = {
  endpoint: process.env.S3_ENDPOINT || 'http://localhost:9000',
  accessKey: process.env.S3_ACCESS_KEY || '',
  secretKey: process.env.S3_SECRET_KEY || '',
  bucketMedia: process.env.S3_BUCKET_MEDIA || 'dnd-media',
  region: process.env.S3_REGION || 'us-east-1',
  publicUrl: process.env.S3_PUBLIC_URL || process.env.S3_ENDPOINT || 'http://localhost:9000',
};

// Check if storage is enabled
export const STORAGE_ENABLED = !!config.accessKey;

// Initialize S3 client only if configured
const s3Client = STORAGE_ENABLED
  ? new S3Client({
      endpoint: config.endpoint,
      region: config.region,
      credentials: {
        accessKeyId: config.accessKey,
        secretAccessKey: config.secretKey,
      },
      forcePathStyle: true, // Required for MinIO/R2
    })
  : null;

// Track bucket initialization
let bucketsInitialized = false;

/**
 * Ensure the required buckets exist
 */
async function ensureBucketsExist(): Promise<void> {
  if (bucketsInitialized || !s3Client) return;

  try {
    await s3Client.send(new HeadBucketCommand({ Bucket: config.bucketMedia }));
    logger.info({ bucket: config.bucketMedia }, 'Storage bucket exists');
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'name' in error && error.name === 'NotFound') {
      try {
        await s3Client.send(new CreateBucketCommand({ Bucket: config.bucketMedia }));
        logger.info({ bucket: config.bucketMedia }, 'Created storage bucket');
      } catch (createError) {
        logger.error({ error: createError }, 'Failed to create storage bucket');
      }
    } else {
      logger.warn({ error }, 'Could not check storage bucket');
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
 * Downloads the image and re-uploads to S3/R2
 *
 * @param sourceUrl - The temporary URL to download from
 * @param category - Category prefix for organizing files
 * @param identifier - Optional identifier to include in filename
 * @returns The permanent public URL
 */
export async function uploadImageFromUrl(
  sourceUrl: string,
  category: string,
  identifier?: string
): Promise<string> {
  if (!s3Client) {
    throw new Error('Storage not configured');
  }

  await ensureBucketsExist();

  // Download the image
  const imageBuffer = await downloadImage(sourceUrl);

  // Determine content type and extension
  const contentType = getContentType(sourceUrl);
  const extension = contentType.split('/')[1] || 'png';

  // Generate filename
  const prefix = identifier ? `${category}/${identifier}` : category;
  const filename = generateFilename(prefix, extension);

  // Upload to S3/R2 (no ACL - R2 uses bucket settings)
  await s3Client.send(
    new PutObjectCommand({
      Bucket: config.bucketMedia,
      Key: filename,
      Body: imageBuffer,
      ContentType: contentType,
    })
  );

  // Return the public URL
  const publicUrl = `${config.publicUrl}/${config.bucketMedia}/${filename}`;
  logger.info({ publicUrl }, 'Uploaded image to permanent storage');

  return publicUrl;
}

/**
 * Upload a video from a URL to permanent storage
 */
export async function uploadVideoFromUrl(
  sourceUrl: string,
  category: string,
  identifier?: string
): Promise<string> {
  if (!s3Client) {
    throw new Error('Storage not configured');
  }

  await ensureBucketsExist();

  // Download the video
  const response = await fetch(sourceUrl);
  if (!response.ok) {
    throw new Error(`Failed to download video: ${response.status}`);
  }
  const arrayBuffer = await response.arrayBuffer();
  const videoBuffer = Buffer.from(arrayBuffer);

  // Generate filename
  const prefix = identifier ? `${category}/${identifier}` : category;
  const filename = generateFilename(prefix, 'mp4');

  // Upload to R2
  await s3Client.send(
    new PutObjectCommand({
      Bucket: config.bucketMedia,
      Key: filename,
      Body: videoBuffer,
      ContentType: 'video/mp4',
    })
  );

  const publicUrl = `${config.publicUrl}/${config.bucketMedia}/${filename}`;
  logger.info({ publicUrl }, 'Uploaded video to permanent storage');

  return publicUrl;
}

/**
 * Upload audio buffer to permanent storage
 */
export async function uploadAudioBuffer(
  audioBuffer: Buffer,
  category: string,
  identifier?: string,
  contentType: string = 'audio/mpeg'
): Promise<string> {
  if (!s3Client) {
    throw new Error('Storage not configured');
  }

  await ensureBucketsExist();

  // Determine extension from content type
  const extensionMap: Record<string, string> = {
    'audio/mpeg': 'mp3',
    'audio/mp3': 'mp3',
    'audio/wav': 'wav',
    'audio/ogg': 'ogg',
  };
  const extension = extensionMap[contentType] || 'mp3';

  // Generate filename
  const prefix = identifier ? `${category}/${identifier}` : category;
  const filename = generateFilename(prefix, extension);

  // Upload to R2
  await s3Client.send(
    new PutObjectCommand({
      Bucket: config.bucketMedia,
      Key: filename,
      Body: audioBuffer,
      ContentType: contentType,
    })
  );

  const publicUrl = `${config.publicUrl}/${config.bucketMedia}/${filename}`;
  logger.info({ publicUrl }, 'Uploaded audio to permanent storage');

  return publicUrl;
}

export default {
  uploadImageFromUrl,
  uploadVideoFromUrl,
  uploadAudioBuffer,
  STORAGE_ENABLED,
};
