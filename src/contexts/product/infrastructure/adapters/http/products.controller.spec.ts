import { Test, TestingModule } from '@nestjs/testing';
import { ProductsController } from './products.controller';
import { SearchProductsUseCase } from '@contexts/product/application/ports/input/search-products-use-case';
import { SearchProductsQuery } from '@contexts/product/application/dto/search-products-query';
import {
  SearchProductsResponseDto as ApplicationResponseDto,
  ProductSearchResultDto,
  PriceRangeDto,
  OffersSummaryDto,
  BadgesDto,
} from '@contexts/product/application/dto/search-products-response.dto';

describe('ProductsController', () => {
  let controller: ProductsController;
  let mockSearchUseCase: jest.Mocked<SearchProductsUseCase>;

  beforeEach(async () => {
    mockSearchUseCase = {
      execute: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProductsController],
      providers: [
        {
          provide: 'SearchProductsUseCase',
          useValue: mockSearchUseCase,
        },
      ],
    }).compile();

    controller = module.get<ProductsController>(ProductsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

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
    const response = new ApplicationResponseDto('macbook', 1, products);
    mockSearchUseCase.execute.mockResolvedValue(response);

    const result = await controller.search({ q: 'macbook' });

    expect(result.query).toBe('macbook');
    expect(result.total).toBe(1);
    expect(result.products).toHaveLength(1);
    expect(result.products[0].canonicalProductId).toBe('macbook-pro');
    expect(mockSearchUseCase.execute).toHaveBeenCalledWith(
      expect.any(SearchProductsQuery),
    );
  });

  it('should pass query parameters to use case', async () => {
    const response = new ApplicationResponseDto(undefined, 0, []);
    mockSearchUseCase.execute.mockResolvedValue(response);

    await controller.search({
      q: 'iphone',
      sort: 'price_asc',
      minPrice: 1000,
      maxPrice: 2000,
      vendors: ['amazon', 'bestbuy'],
    });

    expect(mockSearchUseCase.execute).toHaveBeenCalledWith(
      expect.objectContaining({
        q: 'iphone',
        sort: 'price_asc',
        minPrice: 1000,
        maxPrice: 2000,
        vendors: ['amazon', 'bestbuy'],
      }),
    );
  });
});
