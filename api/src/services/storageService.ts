import { minioClient } from '../config/minio';
import { config } from '../config/env';
import { logger } from '../utils/logger';
import { v4 as uuidv4 } from 'uuid';
import { Readable } from 'stream';

export class StorageService {
  private readonly MIME_TO_EXT: Record<string, string> = {
    'image/jpeg': '.jpg',
    'image/jpg': '.jpg',
    'image/png': '.png',
    'image/gif': '.gif',
    'image/webp': '.webp',
    'image/bmp': '.bmp',
    'video/mp4': '.mp4',
    'video/quicktime': '.mov',
    'video/x-msvideo': '.avi',
    'video/mpeg': '.mpeg',
    'application/pdf': '.pdf',
    'application/zip': '.zip',
    'application/x-rar-compressed': '.rar',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '.docx',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': '.xlsx',
    'text/plain': '.txt',
  };

  /**
   * Upload file to MinIO
   */
  async uploadFile(
    caseId: string,
    fileType: 'image' | 'document' | 'video',
    fileBuffer: Buffer,
    originalFilename?: string,
    mimeType?: string
  ): Promise<{ objectKey: string; bucket: string }> {
    const extension = this.getFileExtension(originalFilename, mimeType, fileType);
    const objectKey = `cases/${caseId}/${fileType}s/${uuidv4()}${extension}`;

    try {
      const stream = Readable.from(fileBuffer);

      await minioClient.putObject(
        config.MINIO_BUCKET,
        objectKey,
        stream,
        fileBuffer.length
      );

      logger.info('File uploaded to MinIO', {
        bucket: config.MINIO_BUCKET,
        objectKey,
      });

      return {
        bucket: config.MINIO_BUCKET,
        objectKey,
      };
    } catch (error) {
      logger.error('Failed to upload file to MinIO', { error, objectKey });
      throw error;
    }
  }

  /**
   * Generate presigned URL for downloading file
   */
  async getPresignedUrl(
    bucket: string,
    objectKey: string,
    expirySeconds: number = 3600
  ): Promise<string> {
    try {
      const url = await minioClient.presignedGetObject(
        bucket,
        objectKey,
        expirySeconds
      );
      return url;
    } catch (error) {
      logger.error('Failed to generate presigned URL', { error, objectKey });
      throw error;
    }
  }

  /**
   * Delete file from MinIO
   */
  async deleteFile(bucket: string, objectKey: string): Promise<void> {
    try {
      await minioClient.removeObject(bucket, objectKey);
      logger.info('File deleted from MinIO', { bucket, objectKey });
    } catch (error) {
      logger.error('Failed to delete file from MinIO', { error, objectKey });
      throw error;
    }
  }

  /**
   * Get file extension from filename, MIME type, or file type
   */
  private getFileExtension(
    filename?: string,
    mimeType?: string,
    fileType?: string
  ): string {
    // 1. Try to extract from filename
    if (filename) {
      const match = filename.match(/\.[^.]+$/);
      if (match) return match[0];
    }

    // 2. Try to map from MIME type
    if (mimeType && this.MIME_TO_EXT[mimeType]) {
      return this.MIME_TO_EXT[mimeType];
    }

    // 3. Fallback based on fileType
    if (fileType === 'image') return '.jpg';
    if (fileType === 'video') return '.mp4';
    if (fileType === 'document') return '.pdf';

    return '';
  }
}

export const storageService = new StorageService();
