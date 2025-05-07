import { ExceptionFilter, Catch, ArgumentsHost, HttpException, Logger, HttpStatus } from '@nestjs/common';
import { Response } from 'express';

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger('HttpException');

  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const status = exception.getStatus();
    const exceptionResponse = exception.getResponse();
    const message = exception.message;

    this.logger.error(`HTTP Exception: ${status} - ${message}`);

    if (typeof exceptionResponse === 'object') {
      if ('success' in exceptionResponse) {
        response.status(status).json(exceptionResponse);
        return;
      }

      // Handle blocked user case specifically
      if (status === HttpStatus.FORBIDDEN && 'isBlocked' in exceptionResponse) {
        response.status(status).json({
          ...exceptionResponse,
          timestamp: new Date().toISOString(),
        });
        return;
      }
    } else {
      response
        .status(status)
        .json({
          statusCode: status,
          timestamp: new Date().toISOString(),
          message: message,
        });
    }
  }
}