import { z } from 'zod';

export const OpenCaseRequestSchema = z.object({
  telegram_user_id: z.number(),
  telegram_chat_id: z.number(),
  telegram_message_id: z.number(),
});

export const AddMessageRequestSchema = z.object({
  type: z.enum(['text', 'command']),
  content: z.string(),
  telegram: z.object({
    message_id: z.number(),
    user_id: z.number(),
    chat_id: z.number(),
    timestamp: z.number(),
  }),
});

export const CloseCaseRequestSchema = z.object({
  closed_by: z.enum(['user', 'admin', 'timeout', 'auto']),
  telegram_message_id: z.number().optional(),
});

export const GetActiveCaseQuerySchema = z.object({
  telegram_user_id: z.string().transform(Number),
});
