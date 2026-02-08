import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { of, throwError } from 'rxjs';
import { AxiosResponse } from 'axios';
import { MercadoLibreAuthService } from './mercado-libre-auth.service';

describe('MercadoLibreAuthService', () => {
  let service: MercadoLibreAuthService;
  let httpService: jest.Mocked<HttpService>;
  let configService: jest.Mocked<ConfigService>;

  beforeEach(async () => {
    const mockHttpService = {
      post: jest.fn(),
    };

    const mockConfigService = {
      get: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MercadoLibreAuthService,
        {
          provide: HttpService,
          useValue: mockHttpService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<MercadoLibreAuthService>(MercadoLibreAuthService);
    httpService = module.get(HttpService);
    configService = module.get(ConfigService);
  });

  it('should obtain access token from Mercado Libre OAuth endpoint', async () => {
    // Arrange
    configService.get.mockImplementation((key: string) => {
      if (key === 'MERCADOLIBRE_CLIENT_ID') return 'test-client-id';
      if (key === 'MERCADOLIBRE_CLIENT_SECRET') return 'test-client-secret';
      if (key === 'MERCADOLIBRE_OAUTH_TOKEN_URL')
        return 'https://api.mercadolibre.com/oauth/token';
      return undefined;
    });

    const mockResponse: AxiosResponse = {
      data: {
        access_token: 'APP_USR-test-token-12345',
        token_type: 'Bearer',
        expires_in: 21600,
        scope: 'read',
        user_id: 123456,
      },
      status: 200,
      statusText: 'OK',
      headers: {},
      config: {} as unknown,
    };

    httpService.post.mockReturnValue(of(mockResponse));

    // Act
    const token = await service.getAccessToken();

    // Assert
    expect(token).toBe('APP_USR-test-token-12345');
    expect(httpService.post).toHaveBeenCalledWith(
      expect.any(String),
      expect.stringContaining('grant_type=client_credentials'),
      expect.objectContaining({
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      }),
    );
  });

  it('should cache token and return cached token if still valid', async () => {
    // Arrange
    configService.get.mockImplementation((key: string) => {
      if (key === 'MERCADOLIBRE_CLIENT_ID') return 'test-client-id';
      if (key === 'MERCADOLIBRE_CLIENT_SECRET') return 'test-client-secret';
      if (key === 'MERCADOLIBRE_OAUTH_TOKEN_URL')
        return 'https://api.mercadolibre.com/oauth/token';
      return undefined;
    });

    const mockResponse: AxiosResponse = {
      data: {
        access_token: 'APP_USR-cached-token',
        token_type: 'Bearer',
        expires_in: 21600,
        scope: 'read',
        user_id: 123456,
      },
      status: 200,
      statusText: 'OK',
      headers: {},
      config: {} as unknown,
    };

    httpService.post.mockReturnValue(of(mockResponse));

    // Act - First call
    const token1 = await service.getAccessToken();
    // Second call should use cache
    const token2 = await service.getAccessToken();

    // Assert
    expect(token1).toBe('APP_USR-cached-token');
    expect(token2).toBe('APP_USR-cached-token');
    expect(httpService.post).toHaveBeenCalledTimes(1);
  });

  it('should return null if credentials are missing', async () => {
    // Arrange
    configService.get.mockImplementation((key: string) => {
      if (key === 'MERCADOLIBRE_OAUTH_TOKEN_URL')
        return 'https://api.mercadolibre.com/oauth/token';
      return undefined;
    });

    // Act
    const token = await service.getAccessToken();

    // Assert
    expect(token).toBeNull();
    expect(httpService.post).not.toHaveBeenCalled();
  });

  it('should return null if OAuth token URL is missing', async () => {
    // Arrange
    configService.get.mockImplementation((key: string) => {
      if (key === 'MERCADOLIBRE_CLIENT_ID') return 'test-client-id';
      if (key === 'MERCADOLIBRE_CLIENT_SECRET') return 'test-client-secret';
      return undefined;
    });

    // Act
    const token = await service.getAccessToken();

    // Assert - Error is caught and returns null gracefully
    expect(token).toBeNull();
  });

  it('should return null on API error', async () => {
    // Arrange
    configService.get.mockImplementation((key: string) => {
      if (key === 'MERCADOLIBRE_CLIENT_ID') return 'test-client-id';
      if (key === 'MERCADOLIBRE_CLIENT_SECRET') return 'test-client-secret';
      if (key === 'MERCADOLIBRE_OAUTH_TOKEN_URL')
        return 'https://api.mercadolibre.com/oauth/token';
      return undefined;
    });

    httpService.post.mockReturnValue(throwError(() => new Error('API Error')));

    // Act
    const token = await service.getAccessToken();

    // Assert
    expect(token).toBeNull();
  });

  it('should return null if response does not contain access_token', async () => {
    // Arrange
    configService.get.mockImplementation((key: string) => {
      if (key === 'MERCADOLIBRE_CLIENT_ID') return 'test-client-id';
      if (key === 'MERCADOLIBRE_CLIENT_SECRET') return 'test-client-secret';
      if (key === 'MERCADOLIBRE_OAUTH_TOKEN_URL')
        return 'https://api.mercadolibre.com/oauth/token';
      return undefined;
    });

    const mockResponse: AxiosResponse = {
      data: {
        error: 'invalid_client',
        error_description: 'Invalid client credentials',
      },
      status: 401,
      statusText: 'Unauthorized',
      headers: {},
      config: {} as unknown,
    };

    httpService.post.mockReturnValue(of(mockResponse));

    // Act
    const token = await service.getAccessToken();

    // Assert
    expect(token).toBeNull();
  });

  it('should clear token cache', () => {
    // Arrange
    service['cachedToken'] = 'test-token';
    service['tokenExpiresAt'] = Date.now() + 10000;

    // Act
    service.clearTokenCache();

    // Assert
    expect(service['cachedToken']).toBeNull();
    expect(service['tokenExpiresAt']).toBe(0);
  });
});
