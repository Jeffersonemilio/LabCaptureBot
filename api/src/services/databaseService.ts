import { pool } from '../config/database';
import { Case, CaseMessage, CaseFile } from '@labcapturebot/shared/types';
import { NotFoundError } from '../utils/errors';

export class DatabaseService {
  // Cases
  async createCase(
    telegramUserId: number,
    telegramChatId: number
  ): Promise<Case> {
    const result = await pool.query<Case>(
      `INSERT INTO cases (telegram_user_id, telegram_chat_id)
       VALUES ($1, $2)
       RETURNING *`,
      [telegramUserId, telegramChatId]
    );
    return result.rows[0];
  }

  async getCaseById(caseId: string): Promise<Case | null> {
    const result = await pool.query<Case>(
      'SELECT * FROM cases WHERE id = $1',
      [caseId]
    );
    return result.rows[0] || null;
  }

  async getActiveCaseByUserId(telegramUserId: number): Promise<Case | null> {
    const result = await pool.query<Case>(
      `SELECT * FROM cases
       WHERE telegram_user_id = $1 AND status = 'open'
       ORDER BY created_at DESC
       LIMIT 1`,
      [telegramUserId]
    );
    return result.rows[0] || null;
  }

  async closeCase(
    caseId: string,
    closedBy: 'user' | 'admin' | 'timeout' | 'auto'
  ): Promise<Case> {
    const result = await pool.query<Case>(
      `UPDATE cases
       SET status = 'closed', closed_at = NOW(), closed_by = $2
       WHERE id = $1
       RETURNING *`,
      [caseId, closedBy]
    );

    if (result.rows.length === 0) {
      throw new NotFoundError('Case not found');
    }

    return result.rows[0];
  }

  async getOldOpenCases(minutesOld: number): Promise<Case[]> {
    const result = await pool.query<Case>(
      `SELECT * FROM cases
       WHERE status = 'open'
       AND created_at < NOW() - INTERVAL '${minutesOld} minutes'`,
    );
    return result.rows;
  }

  // Messages
  async addMessage(
    caseId: string,
    type: 'text' | 'command',
    content: string,
    telegramMessageId: number,
    telegramUserId: number
  ): Promise<CaseMessage> {
    const result = await pool.query<CaseMessage>(
      `INSERT INTO case_messages
       (case_id, type, content, telegram_message_id, telegram_user_id)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [caseId, type, content, telegramMessageId, telegramUserId]
    );
    return result.rows[0];
  }

  async getMessagesByCase(caseId: string): Promise<CaseMessage[]> {
    const result = await pool.query<CaseMessage>(
      `SELECT * FROM case_messages
       WHERE case_id = $1
       ORDER BY created_at ASC`,
      [caseId]
    );
    return result.rows;
  }

  async getMessagesCount(caseId: string): Promise<number> {
    const result = await pool.query<{ count: string }>(
      'SELECT COUNT(*) as count FROM case_messages WHERE case_id = $1',
      [caseId]
    );
    return parseInt(result.rows[0].count, 10);
  }

  // Files
  async addFile(
    caseId: string,
    fileType: 'image' | 'document' | 'video' | 'audio' | 'voice' | 'video_note' | 'sticker',
    minioBucket: string,
    minioObjectKey: string,
    telegramFileId: string,
    telegramMessageId: number,
    originalFilename?: string,
    fileSize?: number,
    mimeType?: string
  ): Promise<CaseFile> {
    const result = await pool.query<CaseFile>(
      `INSERT INTO case_files
       (case_id, file_type, minio_bucket, minio_object_key, telegram_file_id,
        telegram_message_id, original_filename, file_size, mime_type)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [
        caseId,
        fileType,
        minioBucket,
        minioObjectKey,
        telegramFileId,
        telegramMessageId,
        originalFilename,
        fileSize,
        mimeType,
      ]
    );
    return result.rows[0];
  }

  async getFilesByCase(caseId: string): Promise<CaseFile[]> {
    const result = await pool.query<CaseFile>(
      `SELECT * FROM case_files
       WHERE case_id = $1
       ORDER BY created_at ASC`,
      [caseId]
    );
    return result.rows;
  }

  async getFilesCount(caseId: string): Promise<number> {
    const result = await pool.query<{ count: string }>(
      'SELECT COUNT(*) as count FROM case_files WHERE case_id = $1',
      [caseId]
    );
    return parseInt(result.rows[0].count, 10);
  }
}

export const databaseService = new DatabaseService();
