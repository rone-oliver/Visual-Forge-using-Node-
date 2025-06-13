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

    if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
      // If the exception response is already a structured object, pass it along.
      // We can add a timestamp for consistency, unless it's a 'success' response
      // that might have its own format.
      if ('success' in exceptionResponse) {
        response.status(status).json(exceptionResponse);
      } else {
        response.status(status).json({
          ...(exceptionResponse as object),
          timestamp: new Date().toISOString(),
        });
      }
    } else {
      // If the exception response is a simple string, create a standard error object.
      response.status(status).json({
        statusCode: status,
        timestamp: new Date().toISOString(),
          message: message,
      });
    }
  }
}