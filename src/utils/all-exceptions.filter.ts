import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { Request, Response } from 'express';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const context = host.switchToHttp();
    const request = context.getRequest<Request>();
    const response = context.getResponse<Response>();

    const statusCode =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;
    const { message, errors } = this.describe(exception);

    if (statusCode >= 500) {
      this.logger.error(
        `${request.method} ${request.url}`,
        exception instanceof Error ? exception.stack : undefined,
      );
    }

    response.status(statusCode).json({
      success: false,
      statusCode,
      message,
      ...(errors ? { errors } : {}),
      path: request.url,
      timestamp: new Date().toISOString(),
    });
  }

  private describe(exception: unknown): { message: string; errors?: string[] } {
    if (!(exception instanceof HttpException)) {
      return { message: 'Internal server error' };
    }
    const body = exception.getResponse();
    if (typeof body === 'string') return { message: body };

    const { message, errors } = body as {
      message?: string | string[];
      errors?: string[];
    };
    return {
      message: Array.isArray(message)
        ? message.join(', ')
        : (message ?? exception.message),
      errors,
    };
  }
}
