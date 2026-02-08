import { Test, TestingModule } from '@nestjs/testing';
import { MercadoLibreOffersFetchHandler } from './mercado-libre-offers-fetch.handler';
import { OffersFetchRequested } from '@contexts/offer/domain/events/offers-fetch-requested.event';
import { CanonicalProductId } from '@contexts/product/domain/models/canonical-product-id.vo';
import { VendorId } from '@contexts/vendor/domain/models/vendor-id.vo';
import { MercadoLibreOfferProvider } from '../../vendors/mercado-libre/mercado-libre-offer-provider';
import { IngestOffersUseCase } from '@contexts/offer/application/ports/input/ingest-offers-use-case';
import { ProductRepository } from '@contexts/product/application/ports/output/product.repository';
import { Offer } from '@contexts/offer/domain/models/offer.entity';
import { OfferId } from '@contexts/offer/domain/models/offer-id.vo';
import { ProductId } from '@contexts/product/domain/models/product-id.vo';
import { Vendor } from '@contexts/vendor/domain/models/vendor.entity';
import { Price } from '@contexts/product/domain/models/price.vo';
import { DeliveryDays } from '@contexts/product/domain/models/delivery-days.vo';

describe('MercadoLibreOffersFetchHandler', () => {
  let handler: MercadoLibreOffersFetchHandler;
  let mercadoLibreProvider: jest.Mocked<MercadoLibreOfferProvider>;
  let ingestOffersUseCase: jest.Mocked<IngestOffersUseCase>;
  let productRepository: jest.Mocked<ProductRepository>;

  const createMockOffer = (id: string): Offer => {
    return new Offer(
      new OfferId(id),
      new ProductId('prod-1'),
      new Vendor(
        new VendorId('mercadolibre'),
        'MercadoLibre',
        true,
        'https://cdn.wisecompare.com/vendors/mercadolibre.svg',
        true,
      ),
      new Price(1000, 0),
      new DeliveryDays(5),
    );
  };

  beforeEach(async () => {
    const mockMercadoLibreProvider = {
      fetchOffers: jest.fn(),
    };

    const mockIngestOffersUseCase = {
      execute: jest.fn(),
    };

    const mockProductRepository = {
      findByCanonicalProductId: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MercadoLibreOffersFetchHandler,
        {
          provide: MercadoLibreOfferProvider,
          useValue: mockMercadoLibreProvider,
        },
        {
          provide: 'IngestOffersUseCase',
          useValue: mockIngestOffersUseCase,
        },
        {
          provide: 'ProductRepository',
          useValue: mockProductRepository,
        },
      ],
    }).compile();

    handler = module.get<MercadoLibreOffersFetchHandler>(
      MercadoLibreOffersFetchHandler,
    );
    mercadoLibreProvider = module.get(MercadoLibreOfferProvider);
    ingestOffersUseCase = module.get('IngestOffersUseCase');
    productRepository = module.get('ProductRepository');

    // Default: product doesn't exist
    productRepository.findByCanonicalProductId.mockResolvedValue([]);
  });

  it('should handle OffersFetchRequested event for MercadoLibre vendor', async () => {
    // Arrange
    const canonicalProductId = new CanonicalProductId('test-product');
    const vendorId = new VendorId('mercadolibre');
    const event = new OffersFetchRequested(canonicalProductId, vendorId);
    const offers = [createMockOffer('offer-1'), createMockOffer('offer-2')];

    mercadoLibreProvider.fetchOffers.mockResolvedValue(offers);
    ingestOffersUseCase.execute.mockResolvedValue(undefined);
    productRepository.findByCanonicalProductId.mockResolvedValue([]);

    // Act
    await handler.handle(event);

    // Assert
    expect(mercadoLibreProvider.fetchOffers).toHaveBeenCalledWith(
      canonicalProductId,
    );
    expect(productRepository.findByCanonicalProductId).toHaveBeenCalledWith(
      canonicalProductId,
    );
    expect(ingestOffersUseCase.execute).toHaveBeenCalledWith(
      canonicalProductId,
      'test-product', // default name from canonicalProductId
      'General', // default category
      'https://via.placeholder.com/400x300?text=Product', // default imageUrl
    );
  });

  it('should not process event for non-MercadoLibre vendors', async () => {
    // Arrange
    const canonicalProductId = new CanonicalProductId('test-product');
    const vendorId = new VendorId('amazon');
    const event = new OffersFetchRequested(canonicalProductId, vendorId);

    // Act
    await handler.handle(event);

    // Assert
    expect(mercadoLibreProvider.fetchOffers).not.toHaveBeenCalled();
    expect(ingestOffersUseCase.execute).not.toHaveBeenCalled();
  });

  it('should be idempotent - multiple calls with same event should produce same result', async () => {
    // Arrange
    const canonicalProductId = new CanonicalProductId('test-product');
    const vendorId = new VendorId('mercadolibre');
    const event = new OffersFetchRequested(canonicalProductId, vendorId);
    const offers = [createMockOffer('offer-1')];

    mercadoLibreProvider.fetchOffers.mockResolvedValue(offers);
    ingestOffersUseCase.execute.mockResolvedValue(undefined);
    productRepository.findByCanonicalProductId.mockResolvedValue([]);

    // Act - Call multiple times
    await handler.handle(event);
    await handler.handle(event);
    await handler.handle(event);

    // Assert
    expect(mercadoLibreProvider.fetchOffers).toHaveBeenCalledTimes(3);
    expect(ingestOffersUseCase.execute).toHaveBeenCalledTimes(3);
    // Each call should produce the same result (idempotent)
    expect(ingestOffersUseCase.execute).toHaveBeenNthCalledWith(
      1,
      canonicalProductId,
      'test-product', // productName
      'General', // productCategory
      'https://via.placeholder.com/400x300?text=Product', // productImageUrl
    );
  });

  it('should handle empty offers gracefully', async () => {
    // Arrange
    const canonicalProductId = new CanonicalProductId('test-product');
    const vendorId = new VendorId('mercadolibre');
    const event = new OffersFetchRequested(canonicalProductId, vendorId);

    mercadoLibreProvider.fetchOffers.mockResolvedValue([]);

    // Act
    await handler.handle(event);

    // Assert
    expect(mercadoLibreProvider.fetchOffers).toHaveBeenCalled();
    // Should not call ingest when there are no offers
    expect(ingestOffersUseCase.execute).not.toHaveBeenCalled();
  });

  it('should handle provider errors gracefully', async () => {
    // Arrange
    const canonicalProductId = new CanonicalProductId('test-product');
    const vendorId = new VendorId('mercadolibre');
    const event = new OffersFetchRequested(canonicalProductId, vendorId);

    mercadoLibreProvider.fetchOffers.mockRejectedValue(
      new Error('Provider error'),
    );

    // Act & Assert - Should not throw
    await expect(handler.handle(event)).resolves.not.toThrow();
  });

  it('should handle ingestion errors gracefully', async () => {
    // Arrange
    const canonicalProductId = new CanonicalProductId('test-product');
    const vendorId = new VendorId('mercadolibre');
    const event = new OffersFetchRequested(canonicalProductId, vendorId);
    const offers = [createMockOffer('offer-1')];

    mercadoLibreProvider.fetchOffers.mockResolvedValue(offers);
    ingestOffersUseCase.execute.mockRejectedValue(new Error('Ingestion error'));

    // Act & Assert - Should not throw (safe to retry)
    await expect(handler.handle(event)).resolves.not.toThrow();
  });
});
