import { Request, Response, NextFunction } from 'express';
import { caseService } from '../services/caseService';
import { NotFoundError } from '../utils/errors';
import {
  OpenCaseRequestSchema,
  AddMessageRequestSchema,
  CloseCaseRequestSchema,
} from '../types/requests';

export class CasesController {
  async openCase(req: Request, res: Response, next: NextFunction) {
    try {
      const data = OpenCaseRequestSchema.parse(req.body);

      const result = await caseService.openCase(
        data.telegram_user_id,
        data.telegram_chat_id
      );

      return res.status(201).json(result);
    } catch (error) {
      return next(error);
    }
  }

  async addMessage(req: Request, res: Response, next: NextFunction) {
    try {
      const { caseId } = req.params;
      const data = AddMessageRequestSchema.parse(req.body);

      const result = await caseService.addMessage(
        caseId,
        data.type,
        data.content,
        data.telegram.message_id,
        data.telegram.user_id
      );

      return res.status(201).json(result);
    } catch (error) {
      return next(error);
    }
  }

  async addFile(req: Request, res: Response, next: NextFunction) {
    try {
      const { caseId } = req.params;

      if (!req.file) {
        throw new NotFoundError('No file uploaded');
      }

      const fileType = req.body.file_type as 'image' | 'document' | 'video' | 'audio' | 'voice' | 'video_note' | 'sticker';
      const telegramFileId = req.body.telegram_file_id;
      const telegramMessageId = parseInt(req.body.telegram_message_id, 10);
      const mimeType = req.body.mime_type || req.file.mimetype;

      const result = await caseService.addFile(
        caseId,
        fileType,
        req.file.buffer,
        telegramFileId,
        telegramMessageId,
        req.file.originalname,
        mimeType
      );

      return res.status(201).json(result);
    } catch (error) {
      return next(error);
    }
  }

  async closeCase(req: Request, res: Response, next: NextFunction) {
    try {
      const { caseId } = req.params;
      const data = CloseCaseRequestSchema.parse(req.body);

      const result = await caseService.closeCase(caseId, data.closed_by);

      return res.status(200).json(result);
    } catch (error) {
      return next(error);
    }
  }

  async getActiveCase(req: Request, res: Response, next: NextFunction) {
    try {
      const telegramUserId = parseInt(
        req.query.telegram_user_id as string,
        10
      );

      const result = await caseService.getActiveCase(telegramUserId);

      if (!result) {
        return res.status(404).json({
          error: 'no_active_case',
          message: 'No active case found for this user',
        });
      }

      return res.status(200).json(result);
    } catch (error) {
      return next(error);
    }
  }
}

export const casesController = new CasesController();
