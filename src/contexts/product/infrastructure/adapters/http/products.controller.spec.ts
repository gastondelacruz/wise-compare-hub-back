import { Test, TestingModule } from '@nestjs/testing';
import { ProductsController } from './products.controller';
import { SearchProductsUseCase } from '@contexts/product/application/ports/input/search-products-use-case';
import { GetProductOffersUseCase } from '@contexts/product/application/ports/input/get-product-offers-use-case';
import {
  SearchProductsResponseDto as ApplicationSearchResponseDto,
  ProductSearchResultDto,
  PriceRangeDto,
  OffersSummaryDto,
  BadgesDto,
} from '@contexts/product/application/dto/search-products-response.dto';
import {
  GetProductOffersResponseDto as ApplicationGetOffersResponseDto,
  SummaryDto,
  OfferDto,
  VendorDto,
  PricingDto,
  DeliveryDto,
  RatingDto,
  FlagsDto,
  CtaDto,
} from '@contexts/product/application/dto/get-product-offers-response.dto';

describe('ProductsController', () => {
  let controller: ProductsController;
  let mockSearchUseCase: jest.Mocked<SearchProductsUseCase>;
  let mockGetOffersUseCase: jest.Mocked<GetProductOffersUseCase>;

  beforeEach(async () => {
    mockSearchUseCase = {
      execute: jest.fn(),
    };
    mockGetOffersUseCase = {
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
          provide: 'GetProductOffersUseCase',
          useValue: mockGetOffersUseCase,
        },
      ],
    }).compile();

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

      const result = await controller.search({ q: 'macbook' });

      expect(result.query).toBe('macbook');
      expect(result.total).toBe(1);
      expect(result.products).toHaveLength(1);
    });
  });

  describe('getOffers', () => {
    it('should return offers for canonical product', async () => {
      const offers = [
        new OfferDto(
          'offer-1',
          new VendorDto('amazon', 'Amazon', true),
          new PricingDto(1899, 0, 1899, 'USD'),
          new DeliveryDto(1),
          new RatingDto(4.6),
          new FlagsDto(true, true),
          new CtaDto('https://amazon.com/product/xyz', 'View offer'),
        ),
      ];
      const response = new ApplicationGetOffersResponseDto(
        'canonical-1',
        'MacBook Pro',
        'https://example.com/image.jpg',
        new SummaryDto(1, 1899, 1),
        offers,
      );
      mockGetOffersUseCase.execute.mockResolvedValue(response);

      const result = await controller.getOffers('canonical-1', {}, undefined);

      expect(result.canonicalProductId).toBe('canonical-1');
      expect(result.name).toBe('MacBook Pro');
      expect(result.offers).toHaveLength(1);
      expect(result.offers[0].offerId).toBe('offer-1');
      expect(mockGetOffersUseCase.execute).toHaveBeenCalledWith(
        'canonical-1',
        undefined,
        undefined,
        undefined,
        undefined,
      );
    });

    it('should pass query parameters to use case', async () => {
      const response = new ApplicationGetOffersResponseDto(
        'canonical-1',
        'Product',
        'https://example.com/image.jpg',
        new SummaryDto(0, 0, 0),
        [],
      );
      mockGetOffersUseCase.execute.mockResolvedValue(response);

      await controller.getOffers(
        'canonical-1',
        {
          sort: 'delivery',
          vendors: ['amazon', 'bestbuy'],
          preferences: true,
        },
        'user-123',
      );

      expect(mockGetOffersUseCase.execute).toHaveBeenCalledWith(
        'canonical-1',
        'delivery',
        ['amazon', 'bestbuy'],
        true,
        'user-123',
      );
    });
  });
});
