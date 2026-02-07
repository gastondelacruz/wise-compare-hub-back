import { ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';
import { AllExceptionsFilter } from './all-exceptions.filter';
import { InvalidCredentialsError } from '@contexts/auth/domain/exceptions/invalid-credentials.error';
import { InvalidTokenError } from '@contexts/auth/domain/exceptions/invalid-token.error';
import { ProductNotFoundError } from '@contexts/product/domain/exceptions/product-not-found.error';

describe('AllExceptionsFilter', () => {
  let filter: AllExceptionsFilter;
  let mockArgumentsHost: jest.Mocked<ArgumentsHost>;
  let mockResponse: {
    status: jest.Mock;
    json: jest.Mock;
  };

  beforeEach(() => {
    filter = new AllExceptionsFilter();

    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };

    mockArgumentsHost = {
      switchToHttp: jest.fn().mockReturnValue({
        getResponse: jest.fn().mockReturnValue(mockResponse),
      }),
    } as unknown as jest.Mocked<ArgumentsHost>;
  });

  describe('Domain exceptions', () => {
    it('should handle ProductNotFoundError with 404', () => {
      const error = new ProductNotFoundError('product-123');

      filter.catch(error, mockArgumentsHost);

      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.NOT_FOUND);
      expect(mockResponse.json).toHaveBeenCalledWith({
        statusCode: HttpStatus.NOT_FOUND,
        message: 'Product with ID product-123 not found',
        error: 'Not Found',
      });
    });

    it('should handle InvalidCredentialsError with 401', () => {
      const error = new InvalidCredentialsError();

      filter.catch(error, mockArgumentsHost);

      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.UNAUTHORIZED);
      expect(mockResponse.json).toHaveBeenCalledWith({
        statusCode: HttpStatus.UNAUTHORIZED,
        message: 'Invalid credentials',
        error: 'Unauthorized',
      });
    });

    it('should handle InvalidTokenError with 401', () => {
      const error = new InvalidTokenError();

      filter.catch(error, mockArgumentsHost);

      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.UNAUTHORIZED);
      expect(mockResponse.json).toHaveBeenCalledWith({
        statusCode: HttpStatus.UNAUTHORIZED,
        message: 'Invalid or expired token',
        error: 'Unauthorized',
      });
    });
  });

  describe('Validation errors from Value Objects', () => {
    it('should handle "cannot be empty" errors with 400', () => {
      const error = new Error('Email cannot be empty');

      filter.catch(error, mockArgumentsHost);

      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
      expect(mockResponse.json).toHaveBeenCalledWith({
        statusCode: HttpStatus.BAD_REQUEST,
        message: 'Email cannot be empty',
        error: 'Bad Request',
      });
    });

    it('should handle "Invalid email format" errors with 400', () => {
      const error = new Error('Invalid email format');

      filter.catch(error, mockArgumentsHost);

      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
      expect(mockResponse.json).toHaveBeenCalledWith({
        statusCode: HttpStatus.BAD_REQUEST,
        message: 'Invalid email format',
        error: 'Bad Request',
      });
    });

    it('should handle "Invalid format" errors with 400', () => {
      const error = new Error('Invalid format');

      filter.catch(error, mockArgumentsHost);

      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
      expect(mockResponse.json).toHaveBeenCalledWith({
        statusCode: HttpStatus.BAD_REQUEST,
        message: 'Invalid format',
        error: 'Bad Request',
      });
    });
  });

  describe('NestJS HTTP exceptions', () => {
    it('should handle HttpException', () => {
      const httpException = new HttpException(
        'Custom message',
        HttpStatus.BAD_REQUEST,
      );

      filter.catch(httpException, mockArgumentsHost);

      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
      // HttpException.getResponse() returns the response object directly
      expect(mockResponse.json).toHaveBeenCalledWith(
        httpException.getResponse(),
      );
    });
  });

  describe('Unknown errors', () => {
    it('should handle unknown errors with 500', () => {
      const error = new Error('Unexpected error');
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      filter.catch(error, mockArgumentsHost);

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Unhandled exception:',
        error,
      );
      expect(mockResponse.status).toHaveBeenCalledWith(
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
      expect(mockResponse.json).toHaveBeenCalledWith({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Internal server error',
        error: 'Internal Server Error',
      });

      consoleErrorSpy.mockRestore();
    });

    it('should handle non-Error objects with 500', () => {
      const unknownError = { someProperty: 'value' };
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      filter.catch(unknownError, mockArgumentsHost);

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Unhandled exception:',
        unknownError,
      );
      expect(mockResponse.status).toHaveBeenCalledWith(
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
      expect(mockResponse.json).toHaveBeenCalledWith({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Internal server error',
        error: 'Internal Server Error',
      });

      consoleErrorSpy.mockRestore();
    });
  });
});
