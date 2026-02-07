import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';
import { InvalidCredentialsError } from '@contexts/auth/domain/exceptions/invalid-credentials.error';
import { InvalidTokenError } from '@contexts/auth/domain/exceptions/invalid-token.error';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    // Domain exceptions - Map to HTTP status codes
    if (exception instanceof InvalidCredentialsError) {
      response.status(HttpStatus.UNAUTHORIZED).json({
        statusCode: HttpStatus.UNAUTHORIZED,
        message: exception.message,
        error: 'Unauthorized',
      });
      return;
    }

    if (exception instanceof InvalidTokenError) {
      response.status(HttpStatus.UNAUTHORIZED).json({
        statusCode: HttpStatus.UNAUTHORIZED,
        message: exception.message,
        error: 'Unauthorized',
      });
      return;
    }

    // Validation errors from Value Objects
    if (
      exception instanceof Error &&
      (exception.message.includes('cannot be empty') ||
        exception.message.includes('Invalid email format') ||
        exception.message.includes('Invalid format'))
    ) {
      response.status(HttpStatus.BAD_REQUEST).json({
        statusCode: HttpStatus.BAD_REQUEST,
        message: exception.message,
        error: 'Bad Request',
      });
      return;
    }

    // NestJS HTTP exceptions (from ValidationPipe, etc.)
    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const exceptionResponse = exception.getResponse();
      response.status(status).json(exceptionResponse);
      return;
    }

    // Unknown/unexpected errors
    console.error('Unhandled exception:', exception);
    response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      message: 'Internal server error',
      error: 'Internal Server Error',
    });
  }
}
