import { z } from 'zod';

const envSchema = z.object({
  // Database
  DATABASE_URL: z.string().url(),

  // MinIO
  MINIO_ENDPOINT: z.string(),
  MINIO_PORT: z.string().transform(Number),
  MINIO_USE_SSL: z.string().transform(val => val === 'true'),
  MINIO_ACCESS_KEY: z.string(),
  MINIO_SECRET_KEY: z.string(),
  MINIO_BUCKET: z.string(),

  // Server
  PORT: z.string().transform(Number).default('3000'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'debug']).default('info'),

  // Auto-close settings
  CASE_AUTO_CLOSE_MINUTES: z.string().transform(Number).default('10'),
});

export type Config = z.infer<typeof envSchema>;

export const config = envSchema.parse(process.env);
