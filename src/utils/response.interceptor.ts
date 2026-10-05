import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Response } from 'express';
import { STATUS_CODES } from 'node:http';
import { map, type Observable } from 'rxjs';
import { PaginatedResult } from './pagination.js';
import { RESPONSE_MESSAGE_KEY } from './response-message.decorator.js';
import { SKIP_RESPONSE_ENVELOPE_KEY } from './skip-response-envelope.decorator.js';

@Injectable()
export class ResponseInterceptor implements NestInterceptor {
  constructor(private readonly reflector: Reflector) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const targets = [context.getHandler(), context.getClass()];

    const skip = this.reflector.getAllAndOverride<boolean>(
      SKIP_RESPONSE_ENVELOPE_KEY,
      targets,
    );
    if (skip) return next.handle();

    const customMessage = this.reflector.getAllAndOverride<string | undefined>(
      RESPONSE_MESSAGE_KEY,
      targets,
    );

    return next.handle().pipe(
      map((result: unknown) => {
        const { statusCode } = context.switchToHttp().getResponse<Response>();
        const isPage = result instanceof PaginatedResult;

        return {
          success: true,
          statusCode,
          message: customMessage ?? STATUS_CODES[statusCode] ?? 'OK',
          data: isPage ? result.data : (result ?? null),
          ...(isPage ? { meta: result.meta } : {}),
          timestamp: new Date().toISOString(),
        };
      }),
    );
  }
}
