import { ArgumentsHost, Catch, ExceptionFilter, HttpException, Logger } from '@nestjs/common';
import type { Request, Response } from 'express';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const context = host.switchToHttp();
    const request = context.getRequest<Request>();
    const response = context.getResponse<Response>();
    const status = exception instanceof HttpException ? exception.getStatus() : 500;
    const exceptionResponse = exception instanceof HttpException ? exception.getResponse() : 'Internal server error';
    const message = typeof exceptionResponse === 'string' ? exceptionResponse : (exceptionResponse as { message?: unknown }).message ?? 'Internal server error';
    if (status >= 500) this.logger.error(`${request.method} ${request.url}`, exception instanceof Error ? exception.stack : undefined);
    response.status(status).json({ statusCode: status, timestamp: new Date().toISOString(), path: request.url, message });
  }
}