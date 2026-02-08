import { Test, TestingModule } from '@nestjs/testing';
import { SearchProductsService } from './search-products.service';
import { SearchProductsQuery } from '../dto/search-products-query';
import { ProductRepository } from '../ports/output/product.repository';
import { OfferRepository } from '../ports/output/offer.repository';
import { RecentSearchRepository } from '../ports/output/recent-search.repository';
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
import { RecentSearch } from '@contexts/product/domain/models/recent-search.entity';

describe('SearchProductsService', () => {
  let service: SearchProductsService;
  let mockProductRepository: jest.Mocked<ProductRepository>;
  let mockOfferRepository: jest.Mocked<OfferRepository>;
  let mockRecentSearchRepository: jest.Mocked<RecentSearchRepository>;

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

  const createVendor = (id: string, name: string): Vendor => {
    return new Vendor(
      new VendorId(id),
      name,
      false,
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
      createVendor(vendorId, vendorName),
      new Price(basePrice, shipping),
      new DeliveryDays(deliveryDays),
      rating ? new Rating(rating) : undefined,
    );
  };

  beforeEach(async () => {
    mockProductRepository = {
      findAll: jest.fn(),
      findById: jest.fn(),
      findByCanonicalProductId: jest.fn(),
      findBySearchTerm: jest.fn(),
    };
    mockOfferRepository = {
      findByProductIds: jest.fn(),
    };
    mockRecentSearchRepository = {
      findByUserId: jest.fn(),
      findGlobal: jest.fn(),
      save: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SearchProductsService,
        {
          provide: 'ProductRepository',
          useValue: mockProductRepository,
        },
        {
          provide: 'OfferRepository',
          useValue: mockOfferRepository,
        },
        {
          provide: 'RecentSearchRepository',
          useValue: mockRecentSearchRepository,
        },
      ],
    }).compile();

    service = module.get<SearchProductsService>(SearchProductsService);
  });

  it('should return empty results when no products match search term', async () => {
    mockProductRepository.findBySearchTerm.mockResolvedValue([]);
    mockOfferRepository.findByProductIds.mockResolvedValue([]);

    const query = new SearchProductsQuery('nonexistent');
    const result = await service.execute(query);

    expect(result.total).toBe(0);
    expect(result.products).toHaveLength(0);
    expect(result.query).toBe('nonexistent');
  });

  it('should return products grouped by canonicalProductId', async () => {
    const products = [
      createProduct('prod-1', 'macbook-pro', 'MacBook Pro'),
      createProduct('prod-2', 'macbook-pro', 'MacBook Pro'),
    ];
    mockProductRepository.findBySearchTerm.mockResolvedValue(products);

    const offers = [
      createOffer('offer-1', 'prod-1', 'amazon', 'Amazon', 1899, 0, 2, 4.5),
      createOffer('offer-2', 'prod-2', 'bestbuy', 'Best Buy', 1999, 10, 5, 4.3),
    ];
    mockOfferRepository.findByProductIds.mockResolvedValue(offers);

    const query = new SearchProductsQuery('macbook');
    const result = await service.execute(query);

    expect(result.total).toBe(1);
    expect(result.products).toHaveLength(1);
    expect(result.products[0].canonicalProductId).toBe('macbook-pro');
    expect(result.products[0].offersSummary.offersCount).toBe(2);
  });

  it('should calculate price range correctly', async () => {
    const products = [createProduct('prod-1', 'macbook-pro', 'MacBook Pro')];
    mockProductRepository.findBySearchTerm.mockResolvedValue(products);

    const offers = [
      createOffer('offer-1', 'prod-1', 'amazon', 'Amazon', 1899, 0, 2),
      createOffer('offer-2', 'prod-1', 'bestbuy', 'Best Buy', 1999, 10, 5),
      createOffer('offer-3', 'prod-1', 'newegg', 'Newegg', 2100, 0, 3),
    ];
    mockOfferRepository.findByProductIds.mockResolvedValue(offers);

    const query = new SearchProductsQuery('macbook');
    const result = await service.execute(query);

    expect(result.products[0].priceRange.min).toBe(1899);
    expect(result.products[0].priceRange.max).toBe(2100);
    expect(result.products[0].offersSummary.bestPrice).toBe(1899);
  });

  it('should filter offers by minPrice', async () => {
    const products = [createProduct('prod-1', 'macbook-pro', 'MacBook Pro')];
    mockProductRepository.findBySearchTerm.mockResolvedValue(products);

    const offers = [
      createOffer('offer-1', 'prod-1', 'amazon', 'Amazon', 1500, 0, 2),
      createOffer('offer-2', 'prod-1', 'bestbuy', 'Best Buy', 2000, 0, 5),
    ];
    mockOfferRepository.findByProductIds.mockResolvedValue(offers);

    const query = new SearchProductsQuery('macbook', 'relevance', 1800);
    const result = await service.execute(query);

    expect(result.products[0].offersSummary.offersCount).toBe(1);
    expect(result.products[0].offersSummary.bestPrice).toBe(2000);
  });

  it('should filter offers by maxPrice', async () => {
    const products = [createProduct('prod-1', 'macbook-pro', 'MacBook Pro')];
    mockProductRepository.findBySearchTerm.mockResolvedValue(products);

    const offers = [
      createOffer('offer-1', 'prod-1', 'amazon', 'Amazon', 1500, 0, 2),
      createOffer('offer-2', 'prod-1', 'bestbuy', 'Best Buy', 2000, 0, 5),
    ];
    mockOfferRepository.findByProductIds.mockResolvedValue(offers);

    const query = new SearchProductsQuery(
      'macbook',
      'relevance',
      undefined,
      1800,
    );
    const result = await service.execute(query);

    expect(result.products[0].offersSummary.offersCount).toBe(1);
    expect(result.products[0].offersSummary.bestPrice).toBe(1500);
  });

  it('should filter offers by vendors', async () => {
    const products = [createProduct('prod-1', 'macbook-pro', 'MacBook Pro')];
    mockProductRepository.findBySearchTerm.mockResolvedValue(products);

    const offers = [
      createOffer('offer-1', 'prod-1', 'amazon', 'Amazon', 1899, 0, 2),
      createOffer('offer-2', 'prod-1', 'bestbuy', 'Best Buy', 1999, 0, 5),
      createOffer('offer-3', 'prod-1', 'newegg', 'Newegg', 2100, 0, 3),
    ];
    mockOfferRepository.findByProductIds.mockResolvedValue(offers);

    const query = new SearchProductsQuery(
      'macbook',
      'relevance',
      undefined,
      undefined,
      ['amazon', 'bestbuy'],
    );
    const result = await service.execute(query);

    expect(result.products[0].offersSummary.offersCount).toBe(2);
  });

  it('should calculate badges correctly', async () => {
    const products = [
      createProduct('prod-1', 'macbook-pro', 'MacBook Pro'),
      createProduct('prod-2', 'iphone-15', 'iPhone 15'),
    ];
    mockProductRepository.findBySearchTerm.mockResolvedValue(products);

    const offers = [
      createOffer('offer-1', 'prod-1', 'amazon', 'Amazon', 1899, 0, 2, 4.5),
      createOffer('offer-2', 'prod-2', 'bestbuy', 'Best Buy', 1999, 0, 1, 4.8),
    ];
    mockOfferRepository.findByProductIds.mockResolvedValue(offers);

    const query = new SearchProductsQuery('apple');
    const result = await service.execute(query);

    // macbook-pro should have isBestPrice=true (1899 < 1999)
    const macbook = result.products.find(
      (p) => p.canonicalProductId === 'macbook-pro',
    );
    expect(macbook?.badges.isBestPrice).toBe(true);
    expect(macbook?.badges.isFastestDelivery).toBe(false);

    // iphone-15 should have isFastestDelivery=true (1 < 2)
    const iphone = result.products.find(
      (p) => p.canonicalProductId === 'iphone-15',
    );
    expect(iphone?.badges.isFastestDelivery).toBe(true);
    expect(iphone?.badges.isBestPrice).toBe(false);
  });

  it('should mark product as popular when offersCount >= 5', async () => {
    const products = [createProduct('prod-1', 'macbook-pro', 'MacBook Pro')];
    mockProductRepository.findBySearchTerm.mockResolvedValue(products);

    const offers = Array.from({ length: 5 }, (_, i) =>
      createOffer(
        `offer-${i}`,
        'prod-1',
        `vendor-${i}`,
        `Vendor ${i}`,
        1900 + i,
        0,
        2,
      ),
    );
    mockOfferRepository.findByProductIds.mockResolvedValue(offers);

    const query = new SearchProductsQuery('macbook');
    const result = await service.execute(query);

    expect(result.products[0].badges.isPopular).toBe(true);
  });

  it('should sort by price_asc', async () => {
    const products = [
      createProduct('prod-1', 'product-a', 'Product A'),
      createProduct('prod-2', 'product-b', 'Product B'),
    ];
    mockProductRepository.findBySearchTerm.mockResolvedValue(products);

    const offers = [
      createOffer('offer-1', 'prod-1', 'amazon', 'Amazon', 2000, 0, 2),
      createOffer('offer-2', 'prod-2', 'bestbuy', 'Best Buy', 1500, 0, 5),
    ];
    mockOfferRepository.findByProductIds.mockResolvedValue(offers);

    const query = new SearchProductsQuery('product', 'price_asc');
    const result = await service.execute(query);

    expect(result.products[0].canonicalProductId).toBe('product-b');
    expect(result.products[0].offersSummary.bestPrice).toBe(1500);
    expect(result.products[1].canonicalProductId).toBe('product-a');
    expect(result.products[1].offersSummary.bestPrice).toBe(2000);
  });

  it('should sort by price_desc', async () => {
    const products = [
      createProduct('prod-1', 'product-a', 'Product A'),
      createProduct('prod-2', 'product-b', 'Product B'),
    ];
    mockProductRepository.findBySearchTerm.mockResolvedValue(products);

    const offers = [
      createOffer('offer-1', 'prod-1', 'amazon', 'Amazon', 2000, 0, 2),
      createOffer('offer-2', 'prod-2', 'bestbuy', 'Best Buy', 1500, 0, 5),
    ];
    mockOfferRepository.findByProductIds.mockResolvedValue(offers);

    const query = new SearchProductsQuery('product', 'price_desc');
    const result = await service.execute(query);

    expect(result.products[0].canonicalProductId).toBe('product-a');
    expect(result.products[1].canonicalProductId).toBe('product-b');
  });

  it('should sort by rating', async () => {
    const products = [
      createProduct('prod-1', 'product-a', 'Product A'),
      createProduct('prod-2', 'product-b', 'Product B'),
    ];
    mockProductRepository.findBySearchTerm.mockResolvedValue(products);

    const offers = [
      createOffer('offer-1', 'prod-1', 'amazon', 'Amazon', 2000, 0, 2, 4.0),
      createOffer('offer-2', 'prod-2', 'bestbuy', 'Best Buy', 1500, 0, 5, 4.8),
    ];
    mockOfferRepository.findByProductIds.mockResolvedValue(offers);

    const query = new SearchProductsQuery('product', 'rating');
    const result = await service.execute(query);

    expect(result.products[0].canonicalProductId).toBe('product-b');
    expect(result.products[1].canonicalProductId).toBe('product-a');
  });

  it('should save search when search term is provided and user is authenticated', async () => {
    const userId = 'user-123';
    const products = [createProduct('prod-1', 'macbook-pro', 'MacBook Pro')];
    mockProductRepository.findBySearchTerm.mockResolvedValue(products);
    mockOfferRepository.findByProductIds.mockResolvedValue([]);

    const query = new SearchProductsQuery(
      'macbook',
      'relevance',
      undefined,
      undefined,
      undefined,
      userId,
    );
    await service.execute(query);

    expect(mockRecentSearchRepository.save).toHaveBeenCalledTimes(1);
    const savedSearch = mockRecentSearchRepository.save.mock.calls[0][0];
    expect(savedSearch).toBeInstanceOf(RecentSearch);
    expect(savedSearch.searchTerm).toBe('macbook');
    expect(savedSearch.userId).toBe(userId);
  });

  it('should save global search when search term is provided and user is not authenticated', async () => {
    const products = [createProduct('prod-1', 'macbook-pro', 'MacBook Pro')];
    mockProductRepository.findBySearchTerm.mockResolvedValue(products);
    mockOfferRepository.findByProductIds.mockResolvedValue([]);

    const query = new SearchProductsQuery('macbook');
    await service.execute(query);

    expect(mockRecentSearchRepository.save).toHaveBeenCalledTimes(1);
    const savedSearch = mockRecentSearchRepository.save.mock.calls[0][0];
    expect(savedSearch).toBeInstanceOf(RecentSearch);
    expect(savedSearch.searchTerm).toBe('macbook');
    expect(savedSearch.userId).toBeUndefined();
  });

  it('should not save search when search term is not provided', async () => {
    mockProductRepository.findAll.mockResolvedValue([]);
    mockOfferRepository.findByProductIds.mockResolvedValue([]);

    const query = new SearchProductsQuery();
    await service.execute(query);

    expect(mockRecentSearchRepository.save).not.toHaveBeenCalled();
  });

  it('should not save search when no products found', async () => {
    mockProductRepository.findBySearchTerm.mockResolvedValue([]);
    mockOfferRepository.findByProductIds.mockResolvedValue([]);

    const query = new SearchProductsQuery('nonexistent');
    await service.execute(query);

    expect(mockRecentSearchRepository.save).not.toHaveBeenCalled();
  });
});
