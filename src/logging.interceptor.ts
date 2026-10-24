import {
  CallHandler,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Injectable,
  Logger,
  NestInterceptor,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse<Response>();
    const startedAt = Date.now();

    return next.handle().pipe(
      tap({
        next: () => {
          const duration = Date.now() - startedAt;
          this.logger.log(
            `${request.method} ${request.path} ${response.statusCode} ${duration}ms`,
          );
        },
        error: (error: unknown) => {
          const duration = Date.now() - startedAt;
          const status =
            error instanceof HttpException
              ? error.getStatus()
              : response.statusCode || HttpStatus.INTERNAL_SERVER_ERROR;
          this.logger.log(
            `${request.method} ${request.path} ${status} ${duration}ms`,
          );
        },
      }),
    );
  }
}
