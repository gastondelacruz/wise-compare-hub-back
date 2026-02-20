import { Test, TestingModule } from '@nestjs/testing';
import { MercadoLibreOffersFetchHandler } from './mercado-libre-offers-fetch.handler';
import { OffersFetchRequested } from '@contexts/offer/domain/events/offers-fetch-requested.event';
import { CanonicalProductId } from '@contexts/product/domain/models/canonical-product-id.vo';
import { VendorId } from '@contexts/vendor/domain/models/vendor-id.vo';
import { IngestOffersUseCase } from '@contexts/offer/application/ports/input/ingest-offers-use-case';
import { ProductRepository } from '@contexts/product/application/ports/output/product.repository';

describe('MercadoLibreOffersFetchHandler', () => {
  let handler: MercadoLibreOffersFetchHandler;
  let ingestOffersUseCase: jest.Mocked<IngestOffersUseCase>;
  let productRepository: jest.Mocked<ProductRepository>;

  beforeEach(async () => {
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

    ingestOffersUseCase.execute.mockResolvedValue(undefined);
    productRepository.findByCanonicalProductId.mockResolvedValue([]);

    // Act
    await handler.handle(event);

    // Assert - Handler should delegate to IngestOffersUseCase
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
    expect(ingestOffersUseCase.execute).not.toHaveBeenCalled();
  });

  it('should be idempotent - multiple calls with same event should produce same result', async () => {
    // Arrange
    const canonicalProductId = new CanonicalProductId('test-product');
    const vendorId = new VendorId('mercadolibre');
    const event = new OffersFetchRequested(canonicalProductId, vendorId);

    ingestOffersUseCase.execute.mockResolvedValue(undefined);
    productRepository.findByCanonicalProductId.mockResolvedValue([]);

    // Act - Call multiple times
    await handler.handle(event);
    await handler.handle(event);
    await handler.handle(event);

    // Assert
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

  it('should handle ingestion errors gracefully', async () => {
    // Arrange
    const canonicalProductId = new CanonicalProductId('test-product');
    const vendorId = new VendorId('mercadolibre');
    const event = new OffersFetchRequested(canonicalProductId, vendorId);

    ingestOffersUseCase.execute.mockRejectedValue(new Error('Ingestion error'));

    // Act & Assert - Should not throw (safe to retry)
    await expect(handler.handle(event)).resolves.not.toThrow();
  });
});
