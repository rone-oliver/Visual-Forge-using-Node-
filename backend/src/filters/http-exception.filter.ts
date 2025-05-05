import { ExceptionFilter, Catch, ArgumentsHost, HttpException, Logger } from '@nestjs/common';
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

    if (typeof exceptionResponse === 'object' && 'success' in exceptionResponse) {
      response.status(status).json(exceptionResponse);
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