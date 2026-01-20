import { Telegraf, Context } from 'telegraf';
import { message } from 'telegraf/filters';
import { apiClient } from '../services/apiClient';
import { caseManager } from '../services/caseManager';
import { logger } from '../utils/logger';

export function setupCommandHandlers(bot: Telegraf) {
  // Handler para /caso - Abrir novo caso
  bot.command('caso', async (ctx: Context) => {
    try {
      const userId = ctx.from?.id;
      const chatId = ctx.chat?.id;
      const messageId = ctx.message?.message_id;

      if (!userId || !chatId || !messageId) {
        return;
      }

      logger.info('Opening new case', { userId, chatId });

      // Abrir novo caso na API (auto-fecha caso anterior se existir)
      const response = await apiClient.openCase({
        telegram_user_id: userId,
        telegram_chat_id: chatId,
        telegram_message_id: messageId,
      });

      // Salvar case_id em memória
      caseManager.setActive(userId, response.case_id);

      await ctx.reply(
        `✅ Caso aberto com sucesso!\n\n` +
          `📋 ID: ${response.case_id.substring(0, 8)}...\n` +
          `📸 Envie imagens e mensagens que serão registradas.\n` +
          `🔚 Use /fim para fechar o caso.`
      );

      logger.info('Case opened successfully', {
        userId,
        caseId: response.case_id,
      });
    } catch (error: any) {
      logger.error('Failed to open case', { error, userId: ctx.from?.id });
      await ctx.reply(
        '❌ Erro ao abrir caso. Tente novamente em alguns instantes.'
      );
    }
  });

  // Handler para /fim - Fechar caso
  bot.command('fim', async (ctx: Context) => {
    try {
      const userId = ctx.from?.id;
      const messageId = ctx.message?.message_id;

      if (!userId || !messageId) {
        return;
      }

      const caseId = caseManager.getActive(userId);

      if (!caseId) {
        await ctx.reply('❌ Você não tem nenhum caso aberto.');
        return;
      }

      logger.info('Closing case', { userId, caseId });

      // Fechar caso na API
      const response = await apiClient.closeCase(caseId, {
        closed_by: 'user',
        telegram_message_id: messageId,
      });

      // Remover da memória
      caseManager.remove(userId);

      await ctx.reply(
        `✅ Caso fechado com sucesso!\n\n` +
          `📊 Resumo:\n` +
          `   • Mensagens: ${response.summary.messages_count}\n` +
          `   • Arquivos: ${response.summary.files_count}\n\n` +
          `Use /caso para iniciar um novo registro.`
      );

      logger.info('Case closed successfully', { userId, caseId });
    } catch (error: any) {
      logger.error('Failed to close case', { error, userId: ctx.from?.id });
      await ctx.reply(
        '❌ Erro ao fechar caso. Tente novamente em alguns instantes.'
      );
    }
  });

  // Handler para /start
  bot.command('start', async (ctx: Context) => {
    await ctx.reply(
      `🤖 Bem-vindo ao LabCaptureBot!\n\n` +
        `Este bot permite registrar casos laboratoriais com imagens e anotações.\n\n` +
        `📝 Comandos:\n` +
        `   • /caso - Iniciar novo caso\n` +
        `   • /fim - Fechar caso atual\n` +
        `   • /status - Ver caso atual\n\n` +
        `Como usar:\n` +
        `1. Envie /caso para começar\n` +
        `2. Envie imagens e mensagens\n` +
        `3. Envie /fim para finalizar`
    );
  });

  // Handler para /status
  bot.command('status', async (ctx: Context) => {
    const userId = ctx.from?.id;

    if (!userId) {
      return;
    }

    const caseId = caseManager.getActive(userId);

    if (caseId) {
      await ctx.reply(
        `📋 Você tem um caso aberto\n` +
          `ID: ${caseId.substring(0, 8)}...\n\n` +
          `Use /fim para fechar o caso.`
      );
    } else {
      await ctx.reply(
        `📋 Nenhum caso aberto\n\n` + `Use /caso para iniciar um novo registro.`
      );
    }
  });
}
