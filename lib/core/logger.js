/**
 * HAZOOM OS v2 — Logging Module
 * Structured logging with Winston
 */

import winston from 'winston';
import config from './config.js';

const { combine, timestamp, errors, json, printf, colorize } = winston.format;

// Custom console format for development
const consoleFormat = printf(({ level, message, timestamp, stack, ...meta }) => {
  const metaStr = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
  return `${timestamp} [${level}]: ${stack || message}${metaStr}`;
});

// Create logger instance
const logger = winston.createLogger({
  level: config.logging.level,
  format: combine(
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    errors({ stack: true })
  ),
  defaultMeta: { service: 'hazoom-os' },
  transports: [
    // Console transport
    new winston.transports.Console({
      format: config.server.isProduction
        ? json()
        : combine(colorize(), consoleFormat)
    }),

    // File transport for errors
    new winston.transports.File({
      filename: 'error.log',
      level: 'error',
      dirname: config.logging.dir,
      maxsize: 5242880,
      maxFiles: 5
    }),

    // Combined log file
    new winston.transports.File({
      filename: 'combined.log',
      dirname: config.logging.dir,
      maxsize: 5242880,
      maxFiles: 5
    })
  ]
});

// Request logging middleware
export const requestLogger = (req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    const logData = {
      method: req.method,
      url: req.url,
      status: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip,
      userAgent: req.get('user-agent')
    };

    if (res.statusCode >= 400) {
      logger.warn('Request failed', logData);
    } else {
      logger.info('Request completed', logData);
    }
  });

  next();
};

export default logger;