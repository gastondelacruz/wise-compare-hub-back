import { Test, TestingModule } from '@nestjs/testing';
import { ProductsController } from './products.controller';
import { SearchProductsUseCase } from '@contexts/product/application/ports/input/search-products-use-case';
import { GetRecentSearchesUseCase } from '@contexts/product/application/ports/input/get-recent-searches-use-case';
import {
  SearchProductsResponseDto as ApplicationSearchResponseDto,
  ProductSearchResultDto,
  PriceRangeDto,
  OffersSummaryDto,
  BadgesDto,
} from '@contexts/product/application/dto/search-products-response.dto';
import { RecentSearch } from '@contexts/product/domain/models/recent-search.entity';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';

describe('ProductsController', () => {
  let controller: ProductsController;
  let mockSearchUseCase: jest.Mocked<SearchProductsUseCase>;
  let mockGetRecentSearchesUseCase: jest.Mocked<GetRecentSearchesUseCase>;

  beforeEach(async () => {
    mockSearchUseCase = {
      execute: jest.fn(),
    };
    mockGetRecentSearchesUseCase = {
      execute: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProductsController],
      providers: [
        {
          provide: 'SearchProductsUseCase',
          useValue: mockSearchUseCase,
        },
        {
          provide: 'GetRecentSearchesUseCase',
          useValue: mockGetRecentSearchesUseCase,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .compile();

    controller = module.get<ProductsController>(ProductsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('search', () => {
    it('should search products and return response', async () => {
      const products = [
        new ProductSearchResultDto(
          'macbook-pro',
          'MacBook Pro',
          'Laptops',
          'https://example.com/image.jpg',
          new PriceRangeDto(1899, 2199, 'USD'),
          new OffersSummaryDto(8, 1899, 2),
          new BadgesDto(true, false, true),
        ),
      ];
      const response = new ApplicationSearchResponseDto('macbook', 1, products);
      mockSearchUseCase.execute.mockResolvedValue(response);

      const result = await controller.search({ q: 'macbook' }, undefined);

      expect(result.query).toBe('macbook');
      expect(result.total).toBe(1);
      expect(result.products).toHaveLength(1);
    });

    it('should pass userId to use case when user is authenticated', async () => {
      const userId = 'user-123';
      const products = [
        new ProductSearchResultDto(
          'macbook-pro',
          'MacBook Pro',
          'Laptops',
          'https://example.com/image.jpg',
          new PriceRangeDto(1899, 2199, 'USD'),
          new OffersSummaryDto(8, 1899, 2),
          new BadgesDto(true, false, true),
        ),
      ];
      const response = new ApplicationSearchResponseDto('macbook', 1, products);
      mockSearchUseCase.execute.mockResolvedValue(response);

      await controller.search({ q: 'macbook' }, userId);

      expect(mockSearchUseCase.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          q: 'macbook',
          userId: userId,
        }),
      );
    });
  });

  describe('getRecentSearches', () => {
    it('should return recent searches for authenticated user', async () => {
      const userId = 'user-123';
      const recentSearches = [
        new RecentSearch('laptop', userId),
        new RecentSearch('mouse', userId),
      ];
      mockGetRecentSearchesUseCase.execute.mockResolvedValue(recentSearches);

      const result = await controller.getRecentSearches(userId);

      expect(result).toHaveLength(2);
      expect(result[0].searchTerm).toBe('laptop');
      expect(result[1].searchTerm).toBe('mouse');
      expect(mockGetRecentSearchesUseCase.execute).toHaveBeenCalledWith(userId);
    });

    it('should return global recent searches when userId is undefined', async () => {
      const recentSearches = [
        new RecentSearch('laptop'),
        new RecentSearch('keyboard'),
      ];
      mockGetRecentSearchesUseCase.execute.mockResolvedValue(recentSearches);

      const result = await controller.getRecentSearches(undefined);

      expect(result).toHaveLength(2);
      expect(result[0].searchTerm).toBe('laptop');
      expect(result[1].searchTerm).toBe('keyboard');
      expect(mockGetRecentSearchesUseCase.execute).toHaveBeenCalledWith(
        undefined,
      );
    });

    it('should return empty array when no searches found', async () => {
      mockGetRecentSearchesUseCase.execute.mockResolvedValue([]);

      const result = await controller.getRecentSearches(undefined);

      expect(result).toEqual([]);
    });
  });
});
