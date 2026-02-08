import { Test, TestingModule } from '@nestjs/testing';
import { OffersController } from './offers.controller';
import { GetOffersUseCase } from '@contexts/offer/application/ports/input/get-offers-use-case';
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
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';

describe('OffersController', () => {
  let controller: OffersController;
  let mockGetOffersUseCase: jest.Mocked<GetOffersUseCase>;

  beforeEach(async () => {
    mockGetOffersUseCase = {
      execute: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [OffersController],
      providers: [
        {
          provide: 'GetOffersUseCase',
          useValue: mockGetOffersUseCase,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .compile();

    controller = module.get<OffersController>(OffersController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
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

    it('should return empty offers when no offers found', async () => {
      const response = new ApplicationGetOffersResponseDto(
        'canonical-1',
        'Product',
        'https://example.com/image.jpg',
        new SummaryDto(0, 0, 0),
        [],
      );
      mockGetOffersUseCase.execute.mockResolvedValue(response);

      const result = await controller.getOffers('canonical-1', {}, undefined);

      expect(result.offers).toHaveLength(0);
      expect(mockGetOffersUseCase.execute).toHaveBeenCalledWith(
        'canonical-1',
        undefined,
        undefined,
        undefined,
        undefined,
      );
    });
  });
});
