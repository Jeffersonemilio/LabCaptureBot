import { z } from 'zod';

const envSchema = z.object({
  TELEGRAM_BOT_TOKEN: z.string().min(1),
  API_BASE_URL: z.string().url(),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'debug']).default('info'),
});

export type Config = z.infer<typeof envSchema>;

export const config = envSchema.parse(process.env);
