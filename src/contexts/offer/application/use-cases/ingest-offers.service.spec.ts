import { Test, TestingModule } from '@nestjs/testing';
import { IngestOffersService } from './ingest-offers.service';
import { ProductRepository } from '@contexts/product/application/ports/output/product.repository';
import { OfferRepository } from '@contexts/offer/application/ports/output/offer.repository';
import { VendorOfferProvider } from '@contexts/offer/application/ports/output/vendor-offer-provider';
import { CanonicalProductId } from '@contexts/product/domain/models/canonical-product-id.vo';
import { Product } from '@contexts/product/domain/models/product.entity';
import { ProductId } from '@contexts/product/domain/models/product-id.vo';
import { Offer } from '@contexts/offer/domain/models/offer.entity';
import { OfferId } from '@contexts/offer/domain/models/offer-id.vo';
import { Vendor } from '@contexts/vendor/domain/models/vendor.entity';
import { VendorId } from '@contexts/vendor/domain/models/vendor-id.vo';
import { Price } from '@contexts/product/domain/models/price.vo';
import { DeliveryDays } from '@contexts/product/domain/models/delivery-days.vo';
import { Rating } from '@contexts/product/domain/models/rating.vo';

describe('IngestOffersService', () => {
  let service: IngestOffersService;
  let productRepository: jest.Mocked<ProductRepository>;
  let offerRepository: jest.Mocked<OfferRepository>;
  let vendorProviders: jest.Mocked<VendorOfferProvider>[];

  const createMockOffer = (
    id: string,
    productId: string,
    vendorId: string,
  ): Offer => {
    return new Offer(
      new OfferId(id),
      new ProductId(productId),
      new Vendor(
        new VendorId(vendorId),
        'Test Vendor',
        false,
        'https://example.com/logo.svg',
        true,
      ),
      new Price(1000, 0),
      new DeliveryDays(5),
      `https://www.mercadolibre.com.ar/product/${id}`,
      new Rating(4.5),
    );
  };

  beforeEach(async () => {
    const mockProductRepository = {
      findByCanonicalProductId: jest.fn(),
      save: jest.fn(),
    };

    const mockOfferRepository = {
      findByProductIds: jest.fn(),
      save: jest.fn(),
      deleteByProductIdAndVendorId: jest.fn(),
    };

    const mockProvider1: jest.Mocked<VendorOfferProvider> = {
      fetchOffers: jest.fn(),
    };

    const mockProvider2: jest.Mocked<VendorOfferProvider> = {
      fetchOffers: jest.fn(),
    };

    vendorProviders = [mockProvider1, mockProvider2];

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        IngestOffersService,
        {
          provide: 'ProductRepository',
          useValue: mockProductRepository,
        },
        {
          provide: 'OfferRepository',
          useValue: mockOfferRepository,
        },
        {
          provide: 'VendorOfferProviders',
          useValue: vendorProviders,
        },
      ],
    }).compile();

    service = module.get<IngestOffersService>(IngestOffersService);
    productRepository = module.get('ProductRepository');
    offerRepository = module.get('OfferRepository');
  });

  it('should create product if it does not exist', async () => {
    // Arrange
    const canonicalProductId = new CanonicalProductId('test-product');
    const offers = [createMockOffer('offer-1', 'prod-1', 'mercadolibre')];

    productRepository.findByCanonicalProductId.mockResolvedValue([]);
    vendorProviders[0].fetchOffers.mockResolvedValue(offers);
    vendorProviders[1].fetchOffers.mockResolvedValue([]);

    // Act
    await service.execute(
      canonicalProductId,
      'Test Product',
      'Electronics',
      'https://example.com/image.jpg',
    );

    // Assert
    expect(productRepository.findByCanonicalProductId).toHaveBeenCalledWith(
      canonicalProductId,
    );
    expect(productRepository.save).toHaveBeenCalled();
    const savedProduct = productRepository.save.mock.calls[0][0];
    expect(savedProduct).toBeInstanceOf(Product);
    expect(savedProduct.canonicalProductId.value).toBe('test-product');
    expect(savedProduct.name).toBe('Test Product');
    expect(savedProduct.category).toBe('Electronics');
  });

  it('should use existing product if it exists', async () => {
    // Arrange
    const canonicalProductId = new CanonicalProductId('existing-product');
    const existingProduct = new Product(
      new ProductId('prod-existing'),
      canonicalProductId,
      'Existing Product',
      'Electronics',
      'https://example.com/existing.jpg',
    );

    productRepository.findByCanonicalProductId.mockResolvedValue([
      existingProduct,
    ]);
    vendorProviders[0].fetchOffers.mockResolvedValue([]);
    vendorProviders[1].fetchOffers.mockResolvedValue([]);

    // Act
    await service.execute(
      canonicalProductId,
      'Test Product',
      'Electronics',
      'https://example.com/image.jpg',
    );

    // Assert
    expect(productRepository.findByCanonicalProductId).toHaveBeenCalledWith(
      canonicalProductId,
    );
    expect(productRepository.save).not.toHaveBeenCalled();
  });

  it('should call all vendor providers', async () => {
    // Arrange
    const canonicalProductId = new CanonicalProductId('test-product');
    const existingProduct = new Product(
      new ProductId('prod-1'),
      canonicalProductId,
      'Test Product',
      'Electronics',
      'https://example.com/image.jpg',
    );
    const offers1 = [createMockOffer('offer-1', 'prod-1', 'mercadolibre')];
    const offers2 = [createMockOffer('offer-2', 'prod-1', 'amazon')];

    productRepository.findByCanonicalProductId.mockResolvedValue([
      existingProduct,
    ]);
    vendorProviders[0].fetchOffers.mockResolvedValue(offers1);
    vendorProviders[1].fetchOffers.mockResolvedValue(offers2);

    // Act
    await service.execute(
      canonicalProductId,
      'Test Product',
      'Electronics',
      'https://example.com/image.jpg',
    );

    // Assert
    expect(vendorProviders[0].fetchOffers).toHaveBeenCalledWith(
      canonicalProductId,
    );
    expect(vendorProviders[1].fetchOffers).toHaveBeenCalledWith(
      canonicalProductId,
    );
  });

  it('should combine offers from all providers', async () => {
    // Arrange
    const canonicalProductId = new CanonicalProductId('test-product');
    const existingProduct = new Product(
      new ProductId('prod-1'),
      canonicalProductId,
      'Test Product',
      'Electronics',
      'https://example.com/image.jpg',
    );
    const offers1 = [
      createMockOffer('offer-1', 'prod-1', 'mercadolibre'),
      createMockOffer('offer-2', 'prod-1', 'mercadolibre'),
    ];
    const offers2 = [createMockOffer('offer-3', 'prod-1', 'amazon')];

    productRepository.findByCanonicalProductId.mockResolvedValue([
      existingProduct,
    ]);
    vendorProviders[0].fetchOffers.mockResolvedValue(offers1);
    vendorProviders[1].fetchOffers.mockResolvedValue(offers2);

    // Act
    await service.execute(
      canonicalProductId,
      'Test Product',
      'Electronics',
      'https://example.com/image.jpg',
    );

    // Assert
    expect(offerRepository.save).toHaveBeenCalledTimes(3);
  });

  it('should delete previous offers for same vendors before saving new ones', async () => {
    // Arrange
    const canonicalProductId = new CanonicalProductId('test-product');
    const existingProduct = new Product(
      new ProductId('prod-1'),
      canonicalProductId,
      'Test Product',
      'Electronics',
      'https://example.com/image.jpg',
    );
    const newOffers = [
      createMockOffer('new-offer-1', 'prod-1', 'mercadolibre'),
      createMockOffer('new-offer-2', 'prod-1', 'mercadolibre'),
    ];

    productRepository.findByCanonicalProductId.mockResolvedValue([
      existingProduct,
    ]);
    vendorProviders[0].fetchOffers.mockResolvedValue(newOffers);
    vendorProviders[1].fetchOffers.mockResolvedValue([]);

    // Act
    await service.execute(
      canonicalProductId,
      'Test Product',
      'Electronics',
      'https://example.com/image.jpg',
    );

    // Assert
    expect(offerRepository.deleteByProductIdAndVendorId).toHaveBeenCalledWith(
      existingProduct.id,
      new VendorId('mercadolibre'),
    );
    expect(offerRepository.save).toHaveBeenCalledTimes(2);
  });

  it('should handle multiple vendors correctly', async () => {
    // Arrange
    const canonicalProductId = new CanonicalProductId('test-product');
    const existingProduct = new Product(
      new ProductId('prod-1'),
      canonicalProductId,
      'Test Product',
      'Electronics',
      'https://example.com/image.jpg',
    );
    const mercadolibreOffers = [
      createMockOffer('offer-1', 'prod-1', 'mercadolibre'),
    ];
    const amazonOffers = [createMockOffer('offer-2', 'prod-1', 'amazon')];

    productRepository.findByCanonicalProductId.mockResolvedValue([
      existingProduct,
    ]);
    vendorProviders[0].fetchOffers.mockResolvedValue(mercadolibreOffers);
    vendorProviders[1].fetchOffers.mockResolvedValue(amazonOffers);

    // Act
    await service.execute(
      canonicalProductId,
      'Test Product',
      'Electronics',
      'https://example.com/image.jpg',
    );

    // Assert
    expect(offerRepository.deleteByProductIdAndVendorId).toHaveBeenCalledWith(
      existingProduct.id,
      new VendorId('mercadolibre'),
    );
    expect(offerRepository.deleteByProductIdAndVendorId).toHaveBeenCalledWith(
      existingProduct.id,
      new VendorId('amazon'),
    );
    expect(offerRepository.save).toHaveBeenCalledTimes(2);
  });

  it('should handle empty offers from all providers', async () => {
    // Arrange
    const canonicalProductId = new CanonicalProductId('test-product');
    const existingProduct = new Product(
      new ProductId('prod-1'),
      canonicalProductId,
      'Test Product',
      'Electronics',
      'https://example.com/image.jpg',
    );

    productRepository.findByCanonicalProductId.mockResolvedValue([
      existingProduct,
    ]);
    vendorProviders[0].fetchOffers.mockResolvedValue([]);
    vendorProviders[1].fetchOffers.mockResolvedValue([]);

    // Act
    await service.execute(
      canonicalProductId,
      'Test Product',
      'Electronics',
      'https://example.com/image.jpg',
    );

    // Assert
    expect(offerRepository.save).not.toHaveBeenCalled();
  });

  it('should fail gracefully if a provider throws an error', async () => {
    // Arrange
    const canonicalProductId = new CanonicalProductId('test-product');
    const existingProduct = new Product(
      new ProductId('prod-1'),
      canonicalProductId,
      'Test Product',
      'Electronics',
      'https://example.com/image.jpg',
    );
    const offers = [createMockOffer('offer-1', 'prod-1', 'mercadolibre')];

    productRepository.findByCanonicalProductId.mockResolvedValue([
      existingProduct,
    ]);
    vendorProviders[0].fetchOffers.mockRejectedValue(
      new Error('Provider error'),
    );
    vendorProviders[1].fetchOffers.mockResolvedValue(offers);

    // Act
    await service.execute(
      canonicalProductId,
      'Test Product',
      'Electronics',
      'https://example.com/image.jpg',
    );

    // Assert
    expect(vendorProviders[0].fetchOffers).toHaveBeenCalled();
    expect(vendorProviders[1].fetchOffers).toHaveBeenCalled();
    expect(offerRepository.save).toHaveBeenCalledTimes(1);
  });
});
