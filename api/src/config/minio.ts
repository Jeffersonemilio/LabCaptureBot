import * as Minio from 'minio';
import { config } from './env';
import { logger } from '../utils/logger';

export const minioClient = new Minio.Client({
  endPoint: config.MINIO_ENDPOINT,
  port: config.MINIO_PORT,
  useSSL: config.MINIO_USE_SSL,
  accessKey: config.MINIO_ACCESS_KEY,
  secretKey: config.MINIO_SECRET_KEY,
});

export async function initMinIO(): Promise<void> {
  try {
    const bucketExists = await minioClient.bucketExists(config.MINIO_BUCKET);

    if (!bucketExists) {
      await minioClient.makeBucket(config.MINIO_BUCKET, 'us-east-1');
      logger.info(`MinIO bucket created: ${config.MINIO_BUCKET}`);
    } else {
      logger.info(`MinIO bucket exists: ${config.MINIO_BUCKET}`);
    }

    logger.info('MinIO initialized successfully');
  } catch (error) {
    logger.error('Failed to initialize MinIO', { error });
    throw error;
  }
}
