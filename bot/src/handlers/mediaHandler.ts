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

      // Enviar para API com mime_type (Telegram sempre usa JPEG para fotos)
      await apiClient.addFile(caseId, fileBuffer, {
        file_type: 'image',
        telegram_file_id: fileId,
        telegram_message_id: messageId,
        telegram_user_id: userId,
        mime_type: 'image/jpeg',
      });

      // Tentar reagir, mas não falhar se não funcionar
      try {
        await (ctx.react as any)('✅');
      } catch (error) {
        // Silently ignore reaction errors
        logger.debug('Could not add reaction', { error });
      }

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
      const mimeType = document.mime_type;
      const fileName = document.file_name;

      logger.info('Processing document', { userId, caseId, fileId, fileName });

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
        mime_type: mimeType,
        file_name: fileName,
      });

      // Tentar reagir, mas não falhar se não funcionar
      try {
        await (ctx.react as any)('✅');
      } catch (error) {
        logger.debug('Could not add reaction', { error });
      }

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
      const mimeType = video.mime_type;
      const fileName = video.file_name;

      logger.info('Processing video', { userId, caseId, fileId, fileName });

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
        mime_type: mimeType,
        file_name: fileName,
      });

      // Tentar reagir, mas não falhar se não funcionar
      try {
        await (ctx.react as any)('✅');
      } catch (error) {
        logger.debug('Could not add reaction', { error });
      }

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

  // Handler para áudios
  bot.on(message('audio'), async (ctx: Context) => {
    try {
      const userId = ctx.from?.id;
      const messageId = ctx.message?.message_id;
      const audio = ctx.message && 'audio' in ctx.message ? ctx.message.audio : null;

      if (!userId || !messageId || !audio) {
        return;
      }

      const caseId = caseManager.getActive(userId);

      if (!caseId) {
        await ctx.reply(
          '⚠️ Nenhum caso aberto.\n\nUse /caso para iniciar um novo registro.'
        );
        return;
      }

      const fileId = audio.file_id;
      const mimeType = audio.mime_type;
      const fileName = audio.file_name || `audio_${Date.now()}.mp3`;

      logger.info('Processing audio', { userId, caseId, fileId, fileName });

      // Baixar arquivo do Telegram
      const fileUrl = await ctx.telegram.getFileLink(fileId);
      const response = await axios.get(fileUrl.href, {
        responseType: 'arraybuffer',
      });

      const fileBuffer = Buffer.from(response.data);

      // Enviar para API
      await apiClient.addFile(caseId, fileBuffer, {
        file_type: 'audio',
        telegram_file_id: fileId,
        telegram_message_id: messageId,
        telegram_user_id: userId,
        mime_type: mimeType,
        file_name: fileName,
      });

      // Tentar reagir, mas não falhar se não funcionar
      try {
        await (ctx.react as any)('✅');
      } catch (error) {
        logger.debug('Could not add reaction', { error });
      }

      logger.info('Audio added to case', {
        userId,
        caseId,
        fileSize: fileBuffer.length,
      });
    } catch (error: any) {
      logger.error('Failed to process audio', { error, userId: ctx.from?.id });
      await ctx.reply('❌ Erro ao processar áudio. Tente novamente.');
    }
  });

  // Handler para voice notes (mensagens de voz)
  bot.on(message('voice'), async (ctx: Context) => {
    try {
      const userId = ctx.from?.id;
      const messageId = ctx.message?.message_id;
      const voice = ctx.message && 'voice' in ctx.message ? ctx.message.voice : null;

      if (!userId || !messageId || !voice) {
        return;
      }

      const caseId = caseManager.getActive(userId);

      if (!caseId) {
        await ctx.reply(
          '⚠️ Nenhum caso aberto.\n\nUse /caso para iniciar um novo registro.'
        );
        return;
      }

      const fileId = voice.file_id;
      const mimeType = voice.mime_type;
      const fileName = `voice_${Date.now()}.ogg`;

      logger.info('Processing voice note', { userId, caseId, fileId });

      // Baixar arquivo do Telegram
      const fileUrl = await ctx.telegram.getFileLink(fileId);
      const response = await axios.get(fileUrl.href, {
        responseType: 'arraybuffer',
      });

      const fileBuffer = Buffer.from(response.data);

      // Enviar para API
      await apiClient.addFile(caseId, fileBuffer, {
        file_type: 'voice',
        telegram_file_id: fileId,
        telegram_message_id: messageId,
        telegram_user_id: userId,
        mime_type: mimeType,
        file_name: fileName,
      });

      // Tentar reagir, mas não falhar se não funcionar
      try {
        await (ctx.react as any)('✅');
      } catch (error) {
        logger.debug('Could not add reaction', { error });
      }

      logger.info('Voice note added to case', {
        userId,
        caseId,
        fileSize: fileBuffer.length,
      });
    } catch (error: any) {
      logger.error('Failed to process voice note', { error, userId: ctx.from?.id });
      await ctx.reply('❌ Erro ao processar mensagem de voz. Tente novamente.');
    }
  });

  // Handler para video notes (vídeos circulares)
  bot.on(message('video_note'), async (ctx: Context) => {
    try {
      const userId = ctx.from?.id;
      const messageId = ctx.message?.message_id;
      const videoNote = ctx.message && 'video_note' in ctx.message ? ctx.message.video_note : null;

      if (!userId || !messageId || !videoNote) {
        return;
      }

      const caseId = caseManager.getActive(userId);

      if (!caseId) {
        await ctx.reply(
          '⚠️ Nenhum caso aberto.\n\nUse /caso para iniciar um novo registro.'
        );
        return;
      }

      const fileId = videoNote.file_id;
      const fileName = `video_note_${Date.now()}.mp4`;

      logger.info('Processing video note', { userId, caseId, fileId });

      // Baixar arquivo do Telegram
      const fileUrl = await ctx.telegram.getFileLink(fileId);
      const response = await axios.get(fileUrl.href, {
        responseType: 'arraybuffer',
      });

      const fileBuffer = Buffer.from(response.data);

      // Enviar para API
      await apiClient.addFile(caseId, fileBuffer, {
        file_type: 'video_note',
        telegram_file_id: fileId,
        telegram_message_id: messageId,
        telegram_user_id: userId,
        mime_type: 'video/mp4',
        file_name: fileName,
      });

      // Tentar reagir, mas não falhar se não funcionar
      try {
        await (ctx.react as any)('✅');
      } catch (error) {
        logger.debug('Could not add reaction', { error });
      }

      logger.info('Video note added to case', {
        userId,
        caseId,
        fileSize: fileBuffer.length,
      });
    } catch (error: any) {
      logger.error('Failed to process video note', { error, userId: ctx.from?.id });
      await ctx.reply('❌ Erro ao processar vídeo circular. Tente novamente.');
    }
  });

  // Handler para stickers
  bot.on(message('sticker'), async (ctx: Context) => {
    try {
      const userId = ctx.from?.id;
      const messageId = ctx.message?.message_id;
      const sticker = ctx.message && 'sticker' in ctx.message ? ctx.message.sticker : null;

      if (!userId || !messageId || !sticker) {
        return;
      }

      const caseId = caseManager.getActive(userId);

      if (!caseId) {
        await ctx.reply(
          '⚠️ Nenhum caso aberto.\n\nUse /caso para iniciar um novo registro.'
        );
        return;
      }

      const fileId = sticker.file_id;
      const isAnimated = sticker.is_animated;
      const isVideo = sticker.is_video;
      const fileName = `sticker_${Date.now()}.${isVideo ? 'webm' : isAnimated ? 'tgs' : 'webp'}`;

      logger.info('Processing sticker', { userId, caseId, fileId, isAnimated, isVideo });

      // Baixar arquivo do Telegram
      const fileUrl = await ctx.telegram.getFileLink(fileId);
      const response = await axios.get(fileUrl.href, {
        responseType: 'arraybuffer',
      });

      const fileBuffer = Buffer.from(response.data);

      // Enviar para API
      await apiClient.addFile(caseId, fileBuffer, {
        file_type: 'sticker',
        telegram_file_id: fileId,
        telegram_message_id: messageId,
        telegram_user_id: userId,
        mime_type: isVideo ? 'video/webm' : isAnimated ? 'application/x-tgsticker' : 'image/webp',
        file_name: fileName,
      });

      // Tentar reagir, mas não falhar se não funcionar
      try {
        await (ctx.react as any)('✅');
      } catch (error) {
        logger.debug('Could not add reaction', { error });
      }

      logger.info('Sticker added to case', {
        userId,
        caseId,
        fileSize: fileBuffer.length,
      });
    } catch (error: any) {
      logger.error('Failed to process sticker', { error, userId: ctx.from?.id });
      await ctx.reply('❌ Erro ao processar sticker. Tente novamente.');
    }
  });
}
