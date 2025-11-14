/**
 * Cloudflare R2 Integration
 * Handles file uploads, downloads, and signed URL generation
 */

import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  HeadObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import {
  R2_ACCOUNT_ID,
  R2_ACCESS_KEY_ID,
  R2_SECRET_ACCESS_KEY,
  R2_BUCKET_NAME,
  R2_PUBLIC_URL,
} from "../env";

// Initialize R2 client
function getR2Client() {
  if (!R2_ACCOUNT_ID || !R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY) {
    throw new Error("Cloudflare R2 credentials are not configured");
  }

  return new S3Client({
    region: "auto",
    endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: R2_ACCESS_KEY_ID,
      secretAccessKey: R2_SECRET_ACCESS_KEY,
    },
  });
}

/**
 * Upload a file to R2
 */
export async function uploadFile(
  key: string,
  fileData: Buffer | Uint8Array,
  contentType: string,
  metadata?: Record<string, string>
): Promise<{
  key: string;
  url: string;
  publicUrl?: string;
}> {
  if (!R2_BUCKET_NAME) {
    throw new Error("R2_BUCKET_NAME is not configured");
  }

  try {
    const client = getR2Client();

    const command = new PutObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: key,
      Body: fileData,
      ContentType: contentType,
      Metadata: metadata,
    });

    await client.send(command);

    const url = `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com/${R2_BUCKET_NAME}/${key}`;
    const publicUrl = R2_PUBLIC_URL ? `${R2_PUBLIC_URL}/${key}` : undefined;

    return {
      key,
      url,
      publicUrl,
    };
  } catch (error) {
    console.error("Error uploading to R2:", error);
    throw new Error("Failed to upload file to R2");
  }
}

/**
 * Upload a video recording to R2
 */
export async function uploadRecording(
  interviewId: string,
  videoData: Buffer | Uint8Array,
  mimeType: string = "video/webm"
): Promise<{
  key: string;
  url: string;
  publicUrl?: string;
  fileSize: number;
}> {
  const timestamp = Date.now();
  const key = `recordings/${interviewId}/${timestamp}.webm`;

  const result = await uploadFile(key, videoData, mimeType, {
    interviewId,
    uploadedAt: timestamp.toString(),
  });

  return {
    ...result,
    fileSize: videoData.byteLength,
  };
}

/**
 * Upload a document (PDF, DOCX) to R2
 */
export async function uploadDocument(
  filename: string,
  fileData: Buffer | Uint8Array,
  contentType: string
): Promise<{
  key: string;
  url: string;
  publicUrl?: string;
  fileSize: number;
}> {
  const timestamp = Date.now();
  const sanitizedFilename = filename.replace(/[^a-zA-Z0-9._-]/g, "_");
  const key = `documents/${timestamp}_${sanitizedFilename}`;

  const result = await uploadFile(key, fileData, contentType, {
    originalFilename: filename,
    uploadedAt: timestamp.toString(),
  });

  return {
    ...result,
    fileSize: fileData.byteLength,
  };
}

/**
 * Generate a presigned URL for temporary access to a private file
 */
export async function getSignedDownloadUrl(
  key: string,
  expiresIn: number = 3600 // 1 hour default
): Promise<string> {
  if (!R2_BUCKET_NAME) {
    throw new Error("R2_BUCKET_NAME is not configured");
  }

  try {
    const client = getR2Client();

    const command = new GetObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: key,
    });

    const signedUrl = await getSignedUrl(client, command, {
      expiresIn,
    });

    return signedUrl;
  } catch (error) {
    console.error("Error generating signed URL:", error);
    throw new Error("Failed to generate signed URL");
  }
}

/**
 * Generate a presigned URL for uploading directly from client
 */
export async function getSignedUploadUrl(
  key: string,
  contentType: string,
  expiresIn: number = 3600
): Promise<string> {
  if (!R2_BUCKET_NAME) {
    throw new Error("R2_BUCKET_NAME is not configured");
  }

  try {
    const client = getR2Client();

    const command = new PutObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: key,
      ContentType: contentType,
    });

    const signedUrl = await getSignedUrl(client, command, {
      expiresIn,
    });

    return signedUrl;
  } catch (error) {
    console.error("Error generating upload URL:", error);
    throw new Error("Failed to generate upload URL");
  }
}

/**
 * Delete a file from R2
 */
export async function deleteFile(key: string): Promise<void> {
  if (!R2_BUCKET_NAME) {
    throw new Error("R2_BUCKET_NAME is not configured");
  }

  try {
    const client = getR2Client();

    const command = new DeleteObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: key,
    });

    await client.send(command);
  } catch (error) {
    console.error("Error deleting from R2:", error);
    throw new Error("Failed to delete file from R2");
  }
}

/**
 * Get file metadata from R2
 */
export async function getFileMetadata(key: string): Promise<{
  size: number;
  contentType: string;
  lastModified: Date;
  metadata?: Record<string, string>;
}> {
  if (!R2_BUCKET_NAME) {
    throw new Error("R2_BUCKET_NAME is not configured");
  }

  try {
    const client = getR2Client();

    const command = new HeadObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: key,
    });

    const response = await client.send(command);

    return {
      size: response.ContentLength || 0,
      contentType: response.ContentType || "application/octet-stream",
      lastModified: response.LastModified || new Date(),
      metadata: response.Metadata,
    };
  } catch (error) {
    console.error("Error getting file metadata:", error);
    throw new Error("Failed to get file metadata");
  }
}

/**
 * Check if a file exists in R2
 */
export async function fileExists(key: string): Promise<boolean> {
  try {
    await getFileMetadata(key);
    return true;
  } catch {
    return false;
  }
}

/**
 * Generate a unique key for a recording
 */
export function generateRecordingKey(interviewId: string): string {
  const timestamp = Date.now();
  const randomSuffix = Math.random().toString(36).substring(7);
  return `recordings/${interviewId}/${timestamp}_${randomSuffix}.webm`;
}

/**
 * Generate a unique key for a document
 */
export function generateDocumentKey(filename: string): string {
  const timestamp = Date.now();
  const sanitizedFilename = filename.replace(/[^a-zA-Z0-9._-]/g, "_");
  const randomSuffix = Math.random().toString(36).substring(7);
  return `documents/${timestamp}_${randomSuffix}_${sanitizedFilename}`;
}

