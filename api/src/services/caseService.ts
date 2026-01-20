import { databaseService } from './databaseService';
import { storageService } from './storageService';
import { config } from '../config/env';
import { logger } from '../utils/logger';
import { ConflictError, NotFoundError } from '../utils/errors';
import {
  OpenCaseResponse,
  AddMessageResponse,
  AddFileResponse,
  CloseCaseResponse,
  GetActiveCaseResponse,
} from '@labcapturebot/shared/types';

export class CaseService {
  private autoCloseInterval: NodeJS.Timeout | null = null;

  /**
   * Start auto-close job that runs periodically
   */
  startAutoCloseJob(): void {
    // Run every minute
    this.autoCloseInterval = setInterval(
      () => this.autoCloseOldCases(),
      60 * 1000
    );

    logger.info('Auto-close job started', {
      intervalMinutes: 1,
      autoCloseAfterMinutes: config.CASE_AUTO_CLOSE_MINUTES,
    });
  }

  /**
   * Stop auto-close job
   */
  stopAutoCloseJob(): void {
    if (this.autoCloseInterval) {
      clearInterval(this.autoCloseInterval);
      this.autoCloseInterval = null;
      logger.info('Auto-close job stopped');
    }
  }

  /**
   * Auto-close old cases (older than configured minutes)
   */
  private async autoCloseOldCases(): Promise<void> {
    try {
      const oldCases = await databaseService.getOldOpenCases(
        config.CASE_AUTO_CLOSE_MINUTES
      );

      if (oldCases.length === 0) {
        return;
      }

      logger.info(`Found ${oldCases.length} old cases to auto-close`);

      for (const caseItem of oldCases) {
        try {
          await databaseService.closeCase(caseItem.id, 'timeout');
          logger.info('Case auto-closed', { caseId: caseItem.id });
        } catch (error) {
          logger.error('Failed to auto-close case', {
            caseId: caseItem.id,
            error,
          });
        }
      }
    } catch (error) {
      logger.error('Auto-close job failed', { error });
    }
  }

  /**
   * Open a new case
   * If user already has an open case, close it automatically
   */
  async openCase(
    telegramUserId: number,
    telegramChatId: number
  ): Promise<OpenCaseResponse> {
    // Check if user already has an open case
    const existingCase = await databaseService.getActiveCaseByUserId(
      telegramUserId
    );

    if (existingCase) {
      // Auto-close the existing case
      await databaseService.closeCase(existingCase.id, 'auto');
      logger.info('Auto-closed existing case before opening new one', {
        oldCaseId: existingCase.id,
        telegramUserId,
      });
    }

    // Create new case
    const newCase = await databaseService.createCase(
      telegramUserId,
      telegramChatId
    );

    logger.info('Case opened', {
      caseId: newCase.id,
      telegramUserId,
    });

    return {
      case_id: newCase.id,
      created_at: newCase.created_at.toISOString(),
    };
  }

  /**
   * Add message to a case
   */
  async addMessage(
    caseId: string,
    type: 'text' | 'command',
    content: string,
    telegramMessageId: number,
    telegramUserId: number
  ): Promise<AddMessageResponse> {
    // Verify case exists and is open
    const caseItem = await databaseService.getCaseById(caseId);

    if (!caseItem) {
      throw new NotFoundError('Case not found');
    }

    if (caseItem.status === 'closed') {
      throw new ConflictError('Case is already closed');
    }

    const message = await databaseService.addMessage(
      caseId,
      type,
      content,
      telegramMessageId,
      telegramUserId
    );

    logger.info('Message added to case', {
      caseId,
      messageId: message.id,
      type,
    });

    return {
      message_id: message.id,
      created_at: message.created_at.toISOString(),
    };
  }

  /**
   * Add file to a case
   */
  async addFile(
    caseId: string,
    fileType: 'image' | 'document' | 'video',
    fileBuffer: Buffer,
    telegramFileId: string,
    telegramMessageId: number,
    originalFilename?: string,
    mimeType?: string
  ): Promise<AddFileResponse> {
    // Verify case exists and is open
    const caseItem = await databaseService.getCaseById(caseId);

    if (!caseItem) {
      throw new NotFoundError('Case not found');
    }

    if (caseItem.status === 'closed') {
      throw new ConflictError('Case is already closed');
    }

    // Upload to MinIO
    const { bucket, objectKey } = await storageService.uploadFile(
      caseId,
      fileType,
      fileBuffer,
      originalFilename
    );

    // Save file metadata to database
    const file = await databaseService.addFile(
      caseId,
      fileType,
      bucket,
      objectKey,
      telegramFileId,
      telegramMessageId,
      originalFilename,
      fileBuffer.length,
      mimeType
    );

    logger.info('File added to case', {
      caseId,
      fileId: file.id,
      fileType,
      size: fileBuffer.length,
    });

    return {
      file_id: file.id,
      minio_url: objectKey,
      created_at: file.created_at.toISOString(),
    };
  }

  /**
   * Close a case
   */
  async closeCase(
    caseId: string,
    closedBy: 'user' | 'admin' | 'timeout' | 'auto'
  ): Promise<CloseCaseResponse> {
    const closedCase = await databaseService.closeCase(caseId, closedBy);

    const [messagesCount, filesCount] = await Promise.all([
      databaseService.getMessagesCount(caseId),
      databaseService.getFilesCount(caseId),
    ]);

    logger.info('Case closed', {
      caseId,
      closedBy,
      messagesCount,
      filesCount,
    });

    return {
      case_id: closedCase.id,
      closed_at: closedCase.closed_at!.toISOString(),
      summary: {
        messages_count: messagesCount,
        files_count: filesCount,
      },
    };
  }

  /**
   * Get active case for a user
   */
  async getActiveCase(
    telegramUserId: number
  ): Promise<GetActiveCaseResponse | null> {
    const caseItem = await databaseService.getActiveCaseByUserId(
      telegramUserId
    );

    if (!caseItem) {
      return null;
    }

    return {
      case_id: caseItem.id,
      created_at: caseItem.created_at.toISOString(),
    };
  }
}

export const caseService = new CaseService();
