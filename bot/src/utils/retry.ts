import { logger } from './logger';

export interface RetryOptions {
  maxAttempts?: number;
  initialDelayMs?: number;
  maxDelayMs?: number;
  backoffMultiplier?: number;
}

const DEFAULT_OPTIONS: Required<RetryOptions> = {
  maxAttempts: 3,
  initialDelayMs: 1000,
  maxDelayMs: 10000,
  backoffMultiplier: 2,
};

export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  let lastError: Error | undefined;
  let delay = opts.initialDelayMs;

  for (let attempt = 1; attempt <= opts.maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error: any) {
      lastError = error;

      if (attempt === opts.maxAttempts) {
        logger.error('Max retry attempts reached', {
          attempts: attempt,
          error: error.message,
        });
        break;
      }

      logger.warn('Retry attempt failed', {
        attempt,
        maxAttempts: opts.maxAttempts,
        delayMs: delay,
        error: error.message,
      });

      await sleep(delay);
      delay = Math.min(delay * opts.backoffMultiplier, opts.maxDelayMs);
    }
  }

  throw lastError;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
