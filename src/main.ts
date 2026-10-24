import { Logger, LogLevel, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import type { NextFunction, Request, Response } from 'express';
import { AppModule, ObserveInstrument } from './app.module.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    instrument: ObserveInstrument,
    logger: getLogLevels(),
  });
  const requestLogger = new Logger('HTTP');
  app.useGlobalPipes(new ValidationPipe());
  app.use((request: Request, response: Response, next: NextFunction) => {
    const startedAt = Date.now();
    response.on('finish', () => {
      requestLogger.log(
        `${request.method} ${request.path} ${response.statusCode} ${Date.now() - startedAt}ms`,
      );
    });
    next();
  });
  await app.listen(process.env.PORT ?? 3000);
}

function getLogLevels(): LogLevel[] {
  const levels: LogLevel[] = ['error', 'warn', 'log'];
  if (process.env.NODE_ENV !== 'production') {
    levels.push('debug');
  }
  return levels;
}

await bootstrap();
