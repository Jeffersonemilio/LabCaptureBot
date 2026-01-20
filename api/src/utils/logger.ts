import winston from 'winston';
import { config } from '../config/env';

export const logger = winston.createLogger({
  level: config.LOG_LEVEL,
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.printf(({ timestamp, level, message, ...meta }) => {
          let log = `${timestamp} [${level}] ${message}`;
          if (Object.keys(meta).length > 0) {
            log += ` ${JSON.stringify(meta)}`;
          }
          return log;
        })
      ),
    }),
  ],
});
