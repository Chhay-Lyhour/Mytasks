import {
  ClassSerializerInterceptor,
  LogLevel,
  ValidationPipe,
} from '@nestjs/common';
import { NestFactory, Reflector } from '@nestjs/core';
import { AppModule, ObserveInstrument } from './app.module.js';
import { LoggingInterceptor } from './logging.interceptor.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    instrument: ObserveInstrument,
    logger: getLogLevels(),
  });
  app.useGlobalPipes(new ValidationPipe());
  app.useGlobalInterceptors(
    new LoggingInterceptor(),
    new ClassSerializerInterceptor(app.get(Reflector)),
  );
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
