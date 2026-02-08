import { Test, TestingModule } from '@nestjs/testing';
import { RequestOffersFetchService } from './request-offers-fetch.service';
import { EventBus } from '../ports/output/event-bus';
import { VendorRepository } from '@contexts/vendor/application/ports/output/vendor.repository';
import { Vendor } from '@contexts/vendor/domain/models/vendor.entity';
import { VendorId } from '@contexts/vendor/domain/models/vendor-id.vo';

describe('RequestOffersFetchService', () => {
  let service: RequestOffersFetchService;
  let eventBus: jest.Mocked<EventBus>;
  let vendorRepository: jest.Mocked<VendorRepository>;

  const createVendor = (
    id: string,
    name: string,
    isOfficial: boolean,
    logoUrl: string,
    enabled: boolean,
  ): Vendor => {
    return new Vendor(new VendorId(id), name, isOfficial, logoUrl, enabled);
  };

  beforeEach(async () => {
    const mockEventBus = {
      publish: jest.fn(),
    };

    const mockVendorRepository = {
      findAll: jest.fn(),
      findByEnabled: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RequestOffersFetchService,
        {
          provide: 'EventBus',
          useValue: mockEventBus,
        },
        {
          provide: 'VendorRepository',
          useValue: mockVendorRepository,
        },
      ],
    }).compile();

    service = module.get<RequestOffersFetchService>(RequestOffersFetchService);
    eventBus = module.get('EventBus');
    vendorRepository = module.get('VendorRepository');
  });

  it('should emit OffersFetchRequested events for all enabled vendors', async () => {
    const enabledVendors = [
      createVendor('mercadolibre', 'MercadoLibre', true, 'logo.svg', true),
      createVendor('amazon', 'Amazon', true, 'logo.svg', true),
    ];
    vendorRepository.findByEnabled.mockResolvedValue(enabledVendors);

    await service.execute('canonical-product-1');

    expect(vendorRepository.findByEnabled).toHaveBeenCalledWith(true);
    expect(eventBus.publish).toHaveBeenCalledTimes(2);
    expect(eventBus.publish).toHaveBeenCalledWith(
      expect.objectContaining({
        canonicalProductId: expect.objectContaining({
          value: 'canonical-product-1',
        }),
        vendorId: expect.objectContaining({ value: 'mercadolibre' }),
        eventType: 'OffersFetchRequested',
      }),
    );
    expect(eventBus.publish).toHaveBeenCalledWith(
      expect.objectContaining({
        canonicalProductId: expect.objectContaining({
          value: 'canonical-product-1',
        }),
        vendorId: expect.objectContaining({ value: 'amazon' }),
        eventType: 'OffersFetchRequested',
      }),
    );
  });

  it('should not emit events when no enabled vendors exist', async () => {
    vendorRepository.findByEnabled.mockResolvedValue([]);

    await service.execute('canonical-product-1');

    expect(vendorRepository.findByEnabled).toHaveBeenCalledWith(true);
    expect(eventBus.publish).not.toHaveBeenCalled();
  });
});
