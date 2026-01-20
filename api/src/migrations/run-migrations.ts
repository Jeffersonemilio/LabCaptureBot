import { readFileSync } from 'fs';
import { join } from 'path';
import { pool } from '../config/database';
import { logger } from '../utils/logger';

const migrations = [
  '001_create_cases_table.sql',
  '002_create_case_messages_table.sql',
  '003_create_case_files_table.sql',
];

async function runMigrations() {
  try {
    logger.info('Starting database migrations...');

    for (const migration of migrations) {
      const filePath = join(__dirname, '../../migrations', migration);
      const sql = readFileSync(filePath, 'utf-8');

      logger.info(`Running migration: ${migration}`);
      await pool.query(sql);
      logger.info(`Migration completed: ${migration}`);
    }

    logger.info('All migrations completed successfully');
    process.exit(0);
  } catch (error) {
    logger.error('Migration failed', { error });
    process.exit(1);
  }
}

runMigrations();
