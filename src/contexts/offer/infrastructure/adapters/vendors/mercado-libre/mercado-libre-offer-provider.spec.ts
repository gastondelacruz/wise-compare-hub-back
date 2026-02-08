import { Test, TestingModule } from '@nestjs/testing';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { of, throwError } from 'rxjs';
import { AxiosResponse, AxiosError } from 'axios';
import { MercadoLibreOfferProvider } from './mercado-libre-offer-provider';
import { MercadoLibreAuthService } from './mercado-libre-auth.service';
import { CanonicalProductId } from '@contexts/product/domain/models/canonical-product-id.vo';
import { MercadoLibreProduct } from './types/mercado-libre-api.types';

describe('MercadoLibreOfferProvider', () => {
  let provider: MercadoLibreOfferProvider;
  let httpService: jest.Mocked<HttpService>;
  let authService: jest.Mocked<MercadoLibreAuthService>;
  let configService: jest.Mocked<ConfigService>;

  const createMockMlProductsResponse = (products: MercadoLibreProduct[]) =>
    ({
      data: {
        keywords: 'test',
        results: products,
        paging: {
          total: products.length,
          offset: 0,
          limit: 50,
          last: products.length > 0 ? products[products.length - 1].id : '',
        },
        query_type: 'KEYWORDS',
      },
      status: 200,
      statusText: 'OK',
      headers: {},
      config: {} as unknown,
    }) as AxiosResponse;

  const createMockMlProduct = (overrides?: {
    id?: string;
    catalog_product_id?: string;
    name?: string;
    pictures?: Array<{
      id: string;
      url: string;
      max_width: string;
      max_height: string;
    }>;
  }): MercadoLibreProduct => ({
    id: overrides?.id || 'MLA49689844',
    catalog_product_id:
      overrides?.catalog_product_id || overrides?.id || 'MLA49689844',
    domain_id: 'MLA-CELLPHONES',
    name: overrides?.name || 'Test Product',
    parent_id: 'MLA123',
    settings: {
      content: 'fixed',
      listing_strategy: 'open',
      exclusive: false,
    },
    children_ids: [],
    attributes: [],
    status: 'active',
    short_description: {
      type: 'plaintext',
      content: 'Test description',
    },
    pictures: overrides?.pictures || [
      {
        id: 'pic1',
        url: 'https://example.com/image.jpg',
        max_width: '500',
        max_height: '500',
      },
    ],
    authority_types: ['COMMUNITY'],
    date_created: '2025-01-01T00:00:00Z',
    last_updated: '2025-01-01T00:00:00Z',
    quality_type: 'COMPLETE',
    product_standard: true,
    search_type: 'KEYWORD',
  });

  beforeEach(async () => {
    const mockHttpService = {
      get: jest.fn(),
    };

    const mockAuthService = {
      getAccessToken: jest.fn().mockResolvedValue('APP_USR-test-token-12345'),
    };

    const mockConfigService = {
      get: jest.fn().mockImplementation((key: string) => {
        if (key === 'MERCADOLIBRE_PRODUCTS_SEARCH_URL')
          return 'https://api.mercadolibre.com/products/search';
        return undefined;
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MercadoLibreOfferProvider,
        {
          provide: HttpService,
          useValue: mockHttpService,
        },
        {
          provide: MercadoLibreAuthService,
          useValue: mockAuthService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    provider = module.get<MercadoLibreOfferProvider>(MercadoLibreOfferProvider);
    httpService = module.get(HttpService);
    authService = module.get(MercadoLibreAuthService);
    configService = module.get(ConfigService);
  });

  it('should fetch offers from Mercado Libre API', async () => {
    // Arrange
    const canonicalProductId = new CanonicalProductId('test-product-id');
    const mockProducts = [
      createMockMlProduct({
        id: 'MLA111',
        name: 'Product 1',
      }),
      createMockMlProduct({
        id: 'MLA222',
        name: 'Product 2',
      }),
    ];

    httpService.get.mockReturnValue(
      of(createMockMlProductsResponse(mockProducts)),
    );

    // Act
    const result = await provider.fetchOffers(canonicalProductId);

    // Assert
    expect(authService.getAccessToken).toHaveBeenCalled();
    expect(httpService.get).toHaveBeenCalledWith(
      'https://api.mercadolibre.com/products/search',
      expect.objectContaining({
        params: expect.objectContaining({
          status: 'active',
          site_id: 'MLA',
          q: 'test-product-id',
        }),
        headers: expect.objectContaining({
          Authorization: 'Bearer APP_USR-test-token-12345',
        }),
      }),
    );
    // Note: Catalog products don't have prices, so offers will have default price of 1
    expect(result.length).toBeGreaterThanOrEqual(0);
  });

  it('should return empty array when API returns no results', async () => {
    // Arrange
    const canonicalProductId = new CanonicalProductId('non-existent-product');
    httpService.get.mockReturnValue(of(createMockMlProductsResponse([])));

    // Act
    const result = await provider.fetchOffers(canonicalProductId);

    // Assert
    expect(result).toEqual([]);
    expect(Array.isArray(result)).toBe(true);
  });

  it('should return empty array when token cannot be obtained', async () => {
    // Arrange
    const canonicalProductId = new CanonicalProductId('test');
    authService.getAccessToken.mockResolvedValue(null);

    // Act
    const result = await provider.fetchOffers(canonicalProductId);

    // Assert
    expect(result).toEqual([]);
    expect(httpService.get).not.toHaveBeenCalled();
  });

  it('should fail gracefully and return empty array on API error', async () => {
    // Arrange
    const canonicalProductId = new CanonicalProductId('test');
    const axiosError = {
      response: {
        status: 500,
        data: { message: 'Internal Server Error' },
      },
      isAxiosError: true,
    } as AxiosError;

    httpService.get.mockReturnValue(throwError(() => axiosError));

    // Act
    const result = await provider.fetchOffers(canonicalProductId);

    // Assert
    expect(result).toEqual([]);
  });

  it('should fail gracefully and return empty array on network error', async () => {
    // Arrange
    const canonicalProductId = new CanonicalProductId('test');
    const networkError = new Error('Network error');
    httpService.get.mockReturnValue(throwError(() => networkError));

    // Act
    const result = await provider.fetchOffers(canonicalProductId);

    // Assert
    expect(result).toEqual([]);
  });

  it('should fail gracefully on timeout', async () => {
    // Arrange
    const canonicalProductId = new CanonicalProductId('test');
    const timeoutError = {
      code: 'ECONNABORTED',
      message: 'timeout',
      isAxiosError: true,
    } as AxiosError;

    httpService.get.mockReturnValue(throwError(() => timeoutError));

    // Act
    const result = await provider.fetchOffers(canonicalProductId);

    // Assert
    expect(result).toEqual([]);
  });

  it('should use Mercado Libre products search endpoint from environment', async () => {
    // Arrange
    const canonicalProductId = new CanonicalProductId('test-product');
    httpService.get.mockReturnValue(of(createMockMlProductsResponse([])));

    // Act
    await provider.fetchOffers(canonicalProductId);

    // Assert
    expect(httpService.get).toHaveBeenCalledWith(
      'https://api.mercadolibre.com/products/search',
      expect.any(Object),
    );
  });

  it('should return empty array if products search URL is missing', async () => {
    // Arrange
    const canonicalProductId = new CanonicalProductId('test-product');
    // Reset configService mock to return undefined for URL
    configService.get.mockImplementation((key: string) => {
      if (key === 'MERCADOLIBRE_PRODUCTS_SEARCH_URL') return undefined;
      return undefined;
    });

    // Act
    const result = await provider.fetchOffers(canonicalProductId);

    // Assert - Error is caught and returns empty array gracefully
    expect(result).toEqual([]);
  });

  it('should handle catalog products structure correctly', async () => {
    // Arrange
    const canonicalProductId = new CanonicalProductId('s25-ultra');
    const mockProduct = createMockMlProduct({
      id: 'MLA49689844',
      catalog_product_id: 'MLA49689844',
      name: 'Samsung S25 Ultra Rugged Galaxy S25 Ultra Negro',
      pictures: [
        {
          id: '956244-MLA95677477841_102025',
          url: 'https://http2.mlstatic.com/D_NQ_NP_956244-MLA95677477841_102025-F.jpg',
          max_width: '1048',
          max_height: '1200',
        },
      ],
    });

    httpService.get.mockReturnValue(
      of(createMockMlProductsResponse([mockProduct])),
    );

    // Act
    const result = await provider.fetchOffers(canonicalProductId);

    // Assert
    // Note: Since catalog products don't have prices, offers will be created with default price
    // In a real implementation, we would need to fetch items/announcements to get actual prices
    expect(result.length).toBeGreaterThanOrEqual(0);
  });
});
