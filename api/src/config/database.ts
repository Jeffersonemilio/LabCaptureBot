import { Pool } from 'pg';
import { config } from './env';
import { logger } from '../utils/logger';

export const pool = new Pool({
  connectionString: config.DATABASE_URL,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

pool.on('error', (err) => {
  logger.error('Unexpected database error', { error: err });
});

export async function initDatabase(): Promise<void> {
  try {
    const client = await pool.connect();
    logger.info('Database connected successfully');
    client.release();
  } catch (error) {
    logger.error('Failed to connect to database', { error });
    throw error;
  }
}

export async function closeDatabase(): Promise<void> {
  await pool.end();
  logger.info('Database connection closed');
}
