import { Telegraf } from 'telegraf';
import { config } from './config/env';
import { setupCommandHandlers } from './handlers/commandHandler';
import { setupMessageHandlers } from './handlers/messageHandler';
import { setupMediaHandlers } from './handlers/mediaHandler';

export const bot = new Telegraf(config.TELEGRAM_BOT_TOKEN);

// Setup handlers
setupCommandHandlers(bot);
setupMessageHandlers(bot);
setupMediaHandlers(bot);

// Error handling
bot.catch((err, ctx) => {
  console.error('Bot error', err);
  ctx.reply('❌ Ocorreu um erro inesperado. Tente novamente.');
});
