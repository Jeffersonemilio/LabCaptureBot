import { Request, Response } from 'express';
import { pool } from '../config/database';
import { minioClient } from '../config/minio';
import { config } from '../config/env';

export class HealthController {
  async check(_req: Request, res: Response) {
    const health = {
      status: 'ok',
      timestamp: new Date().toISOString(),
      services: {
        database: 'unknown',
        minio: 'unknown',
      },
    };

    // Check database
    try {
      await pool.query('SELECT 1');
      health.services.database = 'connected';
    } catch (error) {
      health.services.database = 'disconnected';
      health.status = 'degraded';
    }

    // Check MinIO
    try {
      await minioClient.bucketExists(config.MINIO_BUCKET);
      health.services.minio = 'connected';
    } catch (error) {
      health.services.minio = 'disconnected';
      health.status = 'degraded';
    }

    const statusCode = health.status === 'ok' ? 200 : 503;
    res.status(statusCode).json(health);
  }
}

export const healthController = new HealthController();
