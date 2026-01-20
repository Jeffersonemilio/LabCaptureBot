import { app } from './app';
import { config } from './config/env';
import { initDatabase, closeDatabase } from './config/database';
import { initMinIO } from './config/minio';
import { caseService } from './services/caseService';
import { logger } from './utils/logger';

async function main() {
  try {
    logger.info('Starting LabCaptureBot API...');

    // Initialize database
    await initDatabase();

    // Initialize MinIO
    await initMinIO();

    // Start auto-close job
    caseService.startAutoCloseJob();

    // Start server
    const server = app.listen(config.PORT, () => {
      logger.info(`API server listening on port ${config.PORT}`);
      logger.info(`Environment: ${config.NODE_ENV}`);
    });

    // Graceful shutdown
    const shutdown = async (signal: string) => {
      logger.info(`Received ${signal}, shutting down gracefully...`);

      caseService.stopAutoCloseJob();

      server.close(async () => {
        logger.info('HTTP server closed');
        await closeDatabase();
        process.exit(0);
      });

      // Force shutdown after 10 seconds
      setTimeout(() => {
        logger.error('Forced shutdown after timeout');
        process.exit(1);
      }, 10000);
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
  } catch (error) {
    logger.error('Failed to start API server', { error });
    process.exit(1);
  }
}

main();
