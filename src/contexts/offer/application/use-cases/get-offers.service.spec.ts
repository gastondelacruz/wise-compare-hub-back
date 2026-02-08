import { Test, TestingModule } from '@nestjs/testing';
import { GetOffersService } from './get-offers.service';
import { OffersQueryUseCase } from '../ports/input/offers-query-use-case';
import { RequestOffersFetchUseCase } from '../ports/input/request-offers-fetch-use-case';
import {
  GetProductOffersResponseDto,
  SummaryDto,
  OfferDto,
  VendorDto,
  PricingDto,
  DeliveryDto,
  RatingDto,
  FlagsDto,
  CtaDto,
} from '@contexts/product/application/dto/get-product-offers-response.dto';

describe('GetOffersService', () => {
  let service: GetOffersService;
  let offersQueryUseCase: jest.Mocked<OffersQueryUseCase>;
  let requestOffersFetchUseCase: jest.Mocked<RequestOffersFetchUseCase>;

  beforeEach(async () => {
    const mockOffersQueryUseCase = {
      execute: jest.fn(),
    };

    const mockRequestOffersFetchUseCase = {
      execute: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetOffersService,
        {
          provide: 'OffersQueryUseCase',
          useValue: mockOffersQueryUseCase,
        },
        {
          provide: 'RequestOffersFetchUseCase',
          useValue: mockRequestOffersFetchUseCase,
        },
      ],
    }).compile();

    service = module.get<GetOffersService>(GetOffersService);
    offersQueryUseCase = module.get('OffersQueryUseCase');
    requestOffersFetchUseCase = module.get('RequestOffersFetchUseCase');
  });

  it('should return offers when they exist', async () => {
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
    const response = new GetProductOffersResponseDto(
      'canonical-1',
      'MacBook Pro',
      'https://example.com/image.jpg',
      new SummaryDto(1, 1899, 1),
      offers,
    );
    offersQueryUseCase.execute.mockResolvedValue(response);

    const result = await service.execute('canonical-1');

    expect(result).toEqual(response);
    expect(offersQueryUseCase.execute).toHaveBeenCalledWith(
      'canonical-1',
      undefined,
      undefined,
      undefined,
      undefined,
    );
    // Should not request fetch when offers exist
    expect(requestOffersFetchUseCase.execute).not.toHaveBeenCalled();
  });

  it('should request offers fetch when no offers found', async () => {
    const response = new GetProductOffersResponseDto(
      'canonical-1',
      'Product',
      'https://example.com/image.jpg',
      new SummaryDto(0, 0, 0),
      [],
    );
    offersQueryUseCase.execute.mockResolvedValue(response);
    requestOffersFetchUseCase.execute.mockResolvedValue(undefined);

    const result = await service.execute('canonical-1');

    expect(result).toEqual(response);
    expect(offersQueryUseCase.execute).toHaveBeenCalled();
    expect(requestOffersFetchUseCase.execute).toHaveBeenCalledWith(
      'canonical-1',
    );
  });

  it('should pass all parameters to query use case', async () => {
    const response = new GetProductOffersResponseDto(
      'canonical-1',
      'Product',
      'https://example.com/image.jpg',
      new SummaryDto(0, 0, 0),
      [],
    );
    offersQueryUseCase.execute.mockResolvedValue(response);
    requestOffersFetchUseCase.execute.mockResolvedValue(undefined);

    await service.execute(
      'canonical-1',
      'delivery',
      ['amazon', 'bestbuy'],
      true,
      'user-123',
    );

    expect(offersQueryUseCase.execute).toHaveBeenCalledWith(
      'canonical-1',
      'delivery',
      ['amazon', 'bestbuy'],
      true,
      'user-123',
    );
  });
});
