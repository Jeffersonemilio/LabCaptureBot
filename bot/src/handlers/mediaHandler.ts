import { Telegraf, Context } from 'telegraf';
import { message } from 'telegraf/filters';
import { apiClient } from '../services/apiClient';
import { caseManager } from '../services/caseManager';
import { logger } from '../utils/logger';
import axios from 'axios';

export function setupMediaHandlers(bot: Telegraf) {
  // Handler para fotos
  bot.on(message('photo'), async (ctx: Context) => {
    try {
      const userId = ctx.from?.id;
      const messageId = ctx.message?.message_id;
      const photos = ctx.message && 'photo' in ctx.message ? ctx.message.photo : [];

      if (!userId || !messageId || photos.length === 0) {
        return;
      }

      const caseId = caseManager.getActive(userId);

      if (!caseId) {
        await ctx.reply(
          '⚠️ Nenhum caso aberto.\n\nUse /caso para iniciar um novo registro.'
        );
        return;
      }

      // Pegar a foto de maior resolução
      const largestPhoto = photos[photos.length - 1];
      const fileId = largestPhoto.file_id;

      logger.info('Processing photo', { userId, caseId, fileId });

      // Baixar arquivo do Telegram
      const fileUrl = await ctx.telegram.getFileLink(fileId);
      const response = await axios.get(fileUrl.href, {
        responseType: 'arraybuffer',
      });

      const fileBuffer = Buffer.from(response.data);

      // Enviar para API
      await apiClient.addFile(caseId, fileBuffer, {
        file_type: 'image',
        telegram_file_id: fileId,
        telegram_message_id: messageId,
        telegram_user_id: userId,
      });

      await (ctx.react as any)('✅');

      logger.info('Photo added to case', {
        userId,
        caseId,
        fileSize: fileBuffer.length,
      });
    } catch (error: any) {
      logger.error('Failed to process photo', { error, userId: ctx.from?.id });
      await ctx.reply('❌ Erro ao processar imagem. Tente novamente.');
    }
  });

  // Handler para documentos
  bot.on(message('document'), async (ctx: Context) => {
    try {
      const userId = ctx.from?.id;
      const messageId = ctx.message?.message_id;
      const document = ctx.message && 'document' in ctx.message ? ctx.message.document : null;

      if (!userId || !messageId || !document) {
        return;
      }

      const caseId = caseManager.getActive(userId);

      if (!caseId) {
        await ctx.reply(
          '⚠️ Nenhum caso aberto.\n\nUse /caso para iniciar um novo registro.'
        );
        return;
      }

      const fileId = document.file_id;

      logger.info('Processing document', { userId, caseId, fileId });

      // Baixar arquivo do Telegram
      const fileUrl = await ctx.telegram.getFileLink(fileId);
      const response = await axios.get(fileUrl.href, {
        responseType: 'arraybuffer',
      });

      const fileBuffer = Buffer.from(response.data);

      // Enviar para API
      await apiClient.addFile(caseId, fileBuffer, {
        file_type: 'document',
        telegram_file_id: fileId,
        telegram_message_id: messageId,
        telegram_user_id: userId,
      });

      await (ctx.react as any)('✅');

      logger.info('Document added to case', {
        userId,
        caseId,
        fileSize: fileBuffer.length,
      });
    } catch (error: any) {
      logger.error('Failed to process document', {
        error,
        userId: ctx.from?.id,
      });
      await ctx.reply('❌ Erro ao processar documento. Tente novamente.');
    }
  });

  // Handler para vídeos
  bot.on(message('video'), async (ctx: Context) => {
    try {
      const userId = ctx.from?.id;
      const messageId = ctx.message?.message_id;
      const video = ctx.message && 'video' in ctx.message ? ctx.message.video : null;

      if (!userId || !messageId || !video) {
        return;
      }

      const caseId = caseManager.getActive(userId);

      if (!caseId) {
        await ctx.reply(
          '⚠️ Nenhum caso aberto.\n\nUse /caso para iniciar um novo registro.'
        );
        return;
      }

      const fileId = video.file_id;

      logger.info('Processing video', { userId, caseId, fileId });

      // Baixar arquivo do Telegram
      const fileUrl = await ctx.telegram.getFileLink(fileId);
      const response = await axios.get(fileUrl.href, {
        responseType: 'arraybuffer',
      });

      const fileBuffer = Buffer.from(response.data);

      // Enviar para API
      await apiClient.addFile(caseId, fileBuffer, {
        file_type: 'video',
        telegram_file_id: fileId,
        telegram_message_id: messageId,
        telegram_user_id: userId,
      });

      await (ctx.react as any)('✅');

      logger.info('Video added to case', {
        userId,
        caseId,
        fileSize: fileBuffer.length,
      });
    } catch (error: any) {
      logger.error('Failed to process video', { error, userId: ctx.from?.id });
      await ctx.reply('❌ Erro ao processar vídeo. Tente novamente.');
    }
  });
}
