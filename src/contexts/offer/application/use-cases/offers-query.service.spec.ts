import { Test, TestingModule } from '@nestjs/testing';
import { OffersQueryService } from './offers-query.service';
import { ProductRepository } from '../ports/output/product.repository';
import { OfferRepository } from '../ports/output/offer.repository';
import { Product } from '@contexts/product/domain/models/product.entity';
import { ProductId } from '@contexts/product/domain/models/product-id.vo';
import { CanonicalProductId } from '@contexts/product/domain/models/canonical-product-id.vo';
import { Offer } from '@contexts/offer/domain/models/offer.entity';
import { OfferId } from '@contexts/offer/domain/models/offer-id.vo';
import { Vendor } from '@contexts/vendor/domain/models/vendor.entity';
import { VendorId } from '@contexts/vendor/domain/models/vendor-id.vo';
import { Price } from '@contexts/product/domain/models/price.vo';
import { DeliveryDays } from '@contexts/product/domain/models/delivery-days.vo';
import { ProductNotFoundError } from '@contexts/product/domain/exceptions/product-not-found.error';

describe('OffersQueryService', () => {
  let service: OffersQueryService;
  let productRepository: jest.Mocked<ProductRepository>;
  let offerRepository: jest.Mocked<OfferRepository>;

  const createProduct = (
    id: string,
    canonicalId: string,
    name: string,
    category: string,
    imageUrl: string,
  ): Product => {
    return new Product(
      new ProductId(id),
      new CanonicalProductId(canonicalId),
      name,
      category,
      imageUrl,
    );
  };

  const createOffer = (
    id: string,
    productId: ProductId,
    vendorId: string,
    price: number,
    deliveryDays: number,
  ): Offer => {
    return new Offer(
      new OfferId(id),
      productId,
      new Vendor(
        new VendorId(vendorId),
        'Test Vendor',
        true,
        'https://example.com/logo.svg',
        true,
      ),
      new Price(price, 0),
      new DeliveryDays(deliveryDays),
      `https://www.mercadolibre.com.ar/product/${id}`,
    );
  };

  beforeEach(async () => {
    const mockProductRepository = {
      findByCanonicalProductId: jest.fn(),
    };

    const mockOfferRepository = {
      findByProductIds: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OffersQueryService,
        {
          provide: 'ProductRepository',
          useValue: mockProductRepository,
        },
        {
          provide: 'OfferRepository',
          useValue: mockOfferRepository,
        },
      ],
    }).compile();

    service = module.get<OffersQueryService>(OffersQueryService);
    productRepository = module.get('ProductRepository');
    offerRepository = module.get('OfferRepository');
  });

  it('should throw ProductNotFoundError when product does not exist', async () => {
    productRepository.findByCanonicalProductId.mockResolvedValue([]);

    await expect(service.execute('non-existent-product')).rejects.toThrow(
      ProductNotFoundError,
    );
  });

  it('should return empty offers when no offers exist', async () => {
    const product = createProduct(
      'prod-1',
      'canonical-1',
      'Test Product',
      'Electronics',
      'https://example.com/image.jpg',
    );
    productRepository.findByCanonicalProductId.mockResolvedValue([product]);
    offerRepository.findByProductIds.mockResolvedValue([]);

    const result = await service.execute('canonical-1');

    expect(result.offers).toHaveLength(0);
    expect(result.summary.offersCount).toBe(0);
    expect(result.canonicalProductId).toBe('canonical-1');
    expect(result.name).toBe('Test Product');
  });

  it('should return offers when they exist', async () => {
    const product = createProduct(
      'prod-1',
      'canonical-1',
      'Test Product',
      'Electronics',
      'https://example.com/image.jpg',
    );
    const offer1 = createOffer('offer-1', product.id, 'amazon', 1000, 5);
    const offer2 = createOffer('offer-2', product.id, 'bestbuy', 1200, 3);

    productRepository.findByCanonicalProductId.mockResolvedValue([product]);
    offerRepository.findByProductIds.mockResolvedValue([offer1, offer2]);

    const result = await service.execute('canonical-1');

    expect(result.offers).toHaveLength(2);
    expect(result.summary.offersCount).toBe(2);
    expect(result.summary.bestPrice).toBe(1000);
    expect(result.summary.fastestDeliveryDays).toBe(3);
  });

  it('should filter offers by vendors when vendors parameter is provided', async () => {
    const product = createProduct(
      'prod-1',
      'canonical-1',
      'Test Product',
      'Electronics',
      'https://example.com/image.jpg',
    );
    const offer1 = createOffer('offer-1', product.id, 'amazon', 1000, 5);
    const offer2 = createOffer('offer-2', product.id, 'bestbuy', 1200, 3);

    productRepository.findByCanonicalProductId.mockResolvedValue([product]);
    offerRepository.findByProductIds.mockResolvedValue([offer1, offer2]);

    const result = await service.execute('canonical-1', undefined, ['amazon']);

    expect(result.offers).toHaveLength(1);
    expect(result.offers[0].vendor.id).toBe('amazon');
  });

  it('should sort offers by price by default', async () => {
    const product = createProduct(
      'prod-1',
      'canonical-1',
      'Test Product',
      'Electronics',
      'https://example.com/image.jpg',
    );
    const offer1 = createOffer('offer-1', product.id, 'amazon', 1200, 5);
    const offer2 = createOffer('offer-2', product.id, 'bestbuy', 1000, 3);

    productRepository.findByCanonicalProductId.mockResolvedValue([product]);
    offerRepository.findByProductIds.mockResolvedValue([offer1, offer2]);

    const result = await service.execute('canonical-1');

    expect(result.offers[0].pricing.total).toBe(1000);
    expect(result.offers[1].pricing.total).toBe(1200);
  });

  it('should sort offers by delivery when sort=delivery', async () => {
    const product = createProduct(
      'prod-1',
      'canonical-1',
      'Test Product',
      'Electronics',
      'https://example.com/image.jpg',
    );
    const offer1 = createOffer('offer-1', product.id, 'amazon', 1000, 5);
    const offer2 = createOffer('offer-2', product.id, 'bestbuy', 1200, 3);

    productRepository.findByCanonicalProductId.mockResolvedValue([product]);
    offerRepository.findByProductIds.mockResolvedValue([offer1, offer2]);

    const result = await service.execute('canonical-1', 'delivery');

    expect(result.offers[0].delivery.days).toBe(3);
    expect(result.offers[1].delivery.days).toBe(5);
  });
});
