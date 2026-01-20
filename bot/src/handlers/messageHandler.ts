import { Telegraf, Context } from 'telegraf';
import { message } from 'telegraf/filters';
import { apiClient } from '../services/apiClient';
import { caseManager } from '../services/caseManager';
import { logger } from '../utils/logger';

export function setupMessageHandlers(bot: Telegraf) {
  // Handler para mensagens de texto (que não sejam comandos)
  bot.on(message('text'), async (ctx: Context) => {
    try {
      const userId = ctx.from?.id;
      const chatId = ctx.chat?.id;
      const messageId = ctx.message?.message_id;
      const text = 'text' in ctx.message ? ctx.message.text : '';

      if (!userId || !chatId || !messageId || !text) {
        return;
      }

      // Ignorar comandos (já tratados em commandHandler)
      if (text.startsWith('/')) {
        return;
      }

      const caseId = caseManager.getActive(userId);

      if (!caseId) {
        await ctx.reply(
          '⚠️ Nenhum caso aberto.\n\nUse /caso para iniciar um novo registro.'
        );
        return;
      }

      logger.info('Adding text message to case', {
        userId,
        caseId,
        messageLength: text.length,
      });

      // Enviar mensagem para API
      await apiClient.addMessage(caseId, {
        type: 'text',
        content: text,
        telegram: {
          message_id: messageId,
          user_id: userId,
          chat_id: chatId,
          timestamp: Math.floor(Date.now() / 1000),
        },
      });

      // Confirmar recebimento (opcional, pode comentar se quiser silencioso)
      await ctx.react('👍');

      logger.debug('Message added to case', { userId, caseId });
    } catch (error: any) {
      logger.error('Failed to add message', { error, userId: ctx.from?.id });
      await ctx.reply('❌ Erro ao registrar mensagem. Tente novamente.');
    }
  });
}
