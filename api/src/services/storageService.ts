import { minioClient } from '../config/minio';
import { config } from '../config/env';
import { logger } from '../utils/logger';
import { v4 as uuidv4 } from 'uuid';
import { Readable } from 'stream';

export class StorageService {
  /**
   * Upload file to MinIO
   */
  async uploadFile(
    caseId: string,
    fileType: 'image' | 'document' | 'video',
    fileBuffer: Buffer,
    originalFilename?: string
  ): Promise<{ objectKey: string; bucket: string }> {
    const extension = this.getFileExtension(originalFilename);
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
   * Get file extension from filename
   */
  private getFileExtension(filename?: string): string {
    if (!filename) return '';
    const match = filename.match(/\.[^.]+$/);
    return match ? match[0] : '';
  }
}

export const storageService = new StorageService();
