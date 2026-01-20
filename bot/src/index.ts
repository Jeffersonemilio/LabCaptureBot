import { bot } from './bot';
import { config } from './config/env';
import { logger } from './utils/logger';

async function main() {
  try {
    logger.info('Starting LabCaptureBot Telegram Bot...');
    logger.info(`Environment: ${config.NODE_ENV}`);
    logger.info(`API Base URL: ${config.API_BASE_URL}`);

    // Launch bot
    await bot.launch();

    logger.info('Bot started successfully');

    // Enable graceful stop
    process.once('SIGINT', () => {
      logger.info('Received SIGINT, stopping bot...');
      bot.stop('SIGINT');
    });

    process.once('SIGTERM', () => {
      logger.info('Received SIGTERM, stopping bot...');
      bot.stop('SIGTERM');
    });
  } catch (error) {
    logger.error('Failed to start bot', { error });
    process.exit(1);
  }
}

main();
