import { GetProductOffersService } from './get-product-offers.service';
import { ProductRepository } from '../ports/output/product.repository';
import { OfferRepository } from '@contexts/offer/application/ports/output/offer.repository';
import { Product } from '@contexts/product/domain/models/product.entity';
import { ProductId } from '@contexts/product/domain/models/product-id.vo';
import { CanonicalProductId } from '@contexts/product/domain/models/canonical-product-id.vo';
import { Offer } from '@contexts/offer/domain/models/offer.entity';
import { OfferId } from '@contexts/offer/domain/models/offer-id.vo';
import { Vendor } from '@contexts/vendor/domain/models/vendor.entity';
import { VendorId } from '@contexts/vendor/domain/models/vendor-id.vo';
import { Price } from '@contexts/product/domain/models/price.vo';
import { DeliveryDays } from '@contexts/product/domain/models/delivery-days.vo';
import { Rating } from '@contexts/product/domain/models/rating.vo';
import { ProductNotFoundError } from '@contexts/product/domain/exceptions/product-not-found.error';

describe('GetProductOffersService', () => {
  let service: GetProductOffersService;
  let mockProductRepository: jest.Mocked<ProductRepository>;
  let mockOfferRepository: jest.Mocked<OfferRepository>;

  const createProduct = (
    id: string,
    canonicalId: string,
    name: string,
  ): Product => {
    return new Product(
      new ProductId(id),
      new CanonicalProductId(canonicalId),
      name,
      'Laptops',
      'https://example.com/image.jpg',
    );
  };

  const createVendor = (
    id: string,
    name: string,
    isOfficial: boolean,
  ): Vendor => {
    return new Vendor(
      new VendorId(id),
      name,
      isOfficial,
      `https://cdn.wisecompare.com/vendors/${id}.svg`,
      true,
    );
  };

  const createOffer = (
    id: string,
    productId: string,
    vendorId: string,
    vendorName: string,
    basePrice: number,
    shipping: number,
    deliveryDays: number,
    rating?: number,
  ): Offer => {
    return new Offer(
      new OfferId(id),
      new ProductId(productId),
      createVendor(vendorId, vendorName, false),
      new Price(basePrice, shipping),
      new DeliveryDays(deliveryDays),
      `https://www.mercadolibre.com.ar/product/${id}`,
      rating ? new Rating(rating) : undefined,
    );
  };

  beforeEach(() => {
    mockProductRepository = {
      findAll: jest.fn(),
      findById: jest.fn(),
      findByCanonicalProductId: jest.fn(),
      findBySearchTerm: jest.fn(),
    };
    mockOfferRepository = {
      findByProductIds: jest.fn(),
    };
    service = new GetProductOffersService(
      mockProductRepository,
      mockOfferRepository,
    );
  });

  it('should throw ProductNotFoundError when canonical product not found', async () => {
    mockProductRepository.findByCanonicalProductId.mockResolvedValue([]);

    await expect(service.execute('nonexistent-canonical-id')).rejects.toThrow(
      ProductNotFoundError,
    );
  });

  it('should return offers for canonical product', async () => {
    const products = [
      createProduct('prod-1', 'canonical-1', 'MacBook Pro'),
      createProduct('prod-2', 'canonical-1', 'MacBook Pro'),
    ];
    mockProductRepository.findByCanonicalProductId.mockResolvedValue(products);

    const offers = [
      createOffer('offer-1', 'prod-1', 'amazon', 'Amazon', 1899, 0, 1, 4.6),
      createOffer('offer-2', 'prod-2', 'bestbuy', 'Best Buy', 1999, 10, 3, 4.3),
    ];
    mockOfferRepository.findByProductIds.mockResolvedValue(offers);

    const result = await service.execute('canonical-1');

    expect(result.canonicalProductId).toBe('canonical-1');
    expect(result.name).toBe('MacBook Pro');
    expect(result.offers).toHaveLength(2);
    expect(result.summary.offersCount).toBe(2);
    expect(result.summary.bestPrice).toBe(1899);
    expect(result.summary.fastestDeliveryDays).toBe(1);
  });

  it('should calculate flags correctly', async () => {
    const products = [createProduct('prod-1', 'canonical-1', 'Product')];
    mockProductRepository.findByCanonicalProductId.mockResolvedValue(products);

    const offers = [
      createOffer('offer-1', 'prod-1', 'amazon', 'Amazon', 1899, 0, 1, 4.6),
      createOffer('offer-2', 'prod-1', 'bestbuy', 'Best Buy', 1999, 10, 3, 4.3),
    ];
    mockOfferRepository.findByProductIds.mockResolvedValue(offers);

    const result = await service.execute('canonical-1');

    expect(result.offers[0].flags.isBestPrice).toBe(true);
    expect(result.offers[0].flags.isFastestDelivery).toBe(true);
    expect(result.offers[1].flags.isBestPrice).toBe(false);
    expect(result.offers[1].flags.isFastestDelivery).toBe(false);
  });

  it('should filter offers by vendors', async () => {
    const products = [createProduct('prod-1', 'canonical-1', 'Product')];
    mockProductRepository.findByCanonicalProductId.mockResolvedValue(products);

    const offers = [
      createOffer('offer-1', 'prod-1', 'amazon', 'Amazon', 1899, 0, 1),
      createOffer('offer-2', 'prod-1', 'bestbuy', 'Best Buy', 1999, 10, 3),
      createOffer('offer-3', 'prod-1', 'newegg', 'Newegg', 1950, 0, 2),
    ];
    mockOfferRepository.findByProductIds.mockResolvedValue(offers);

    const result = await service.execute('canonical-1', undefined, [
      'amazon',
      'bestbuy',
    ]);

    expect(result.offers).toHaveLength(2);
    expect(result.offers[0].vendor.id).toBe('amazon');
    expect(result.offers[1].vendor.id).toBe('bestbuy');
  });

  it('should sort by price (default)', async () => {
    const products = [createProduct('prod-1', 'canonical-1', 'Product')];
    mockProductRepository.findByCanonicalProductId.mockResolvedValue(products);

    const offers = [
      createOffer('offer-1', 'prod-1', 'amazon', 'Amazon', 1999, 0, 1),
      createOffer('offer-2', 'prod-1', 'bestbuy', 'Best Buy', 1899, 10, 3),
    ];
    mockOfferRepository.findByProductIds.mockResolvedValue(offers);

    const result = await service.execute('canonical-1', 'price');

    expect(result.offers[0].pricing.total).toBe(1909); // 1899 + 10 shipping
    expect(result.offers[1].pricing.total).toBe(1999);
  });

  it('should sort by delivery', async () => {
    const products = [createProduct('prod-1', 'canonical-1', 'Product')];
    mockProductRepository.findByCanonicalProductId.mockResolvedValue(products);

    const offers = [
      createOffer('offer-1', 'prod-1', 'amazon', 'Amazon', 1899, 0, 3),
      createOffer('offer-2', 'prod-1', 'bestbuy', 'Best Buy', 1999, 10, 1),
    ];
    mockOfferRepository.findByProductIds.mockResolvedValue(offers);

    const result = await service.execute('canonical-1', 'delivery');

    expect(result.offers[0].delivery.days).toBe(1);
    expect(result.offers[1].delivery.days).toBe(3);
  });

  it('should sort by rating', async () => {
    const products = [createProduct('prod-1', 'canonical-1', 'Product')];
    mockProductRepository.findByCanonicalProductId.mockResolvedValue(products);

    const offers = [
      createOffer('offer-1', 'prod-1', 'amazon', 'Amazon', 1899, 0, 1, 4.3),
      createOffer('offer-2', 'prod-1', 'bestbuy', 'Best Buy', 1999, 10, 3, 4.6),
    ];
    mockOfferRepository.findByProductIds.mockResolvedValue(offers);

    const result = await service.execute('canonical-1', 'rating');

    expect(result.offers[0].rating?.score).toBe(4.6);
    expect(result.offers[1].rating?.score).toBe(4.3);
  });

  it('should handle offers without rating', async () => {
    const products = [createProduct('prod-1', 'canonical-1', 'Product')];
    mockProductRepository.findByCanonicalProductId.mockResolvedValue(products);

    const offers = [
      createOffer('offer-1', 'prod-1', 'amazon', 'Amazon', 1899, 0, 1),
    ];
    mockOfferRepository.findByProductIds.mockResolvedValue(offers);

    const result = await service.execute('canonical-1');

    expect(result.offers[0].rating).toBeUndefined();
  });
});
