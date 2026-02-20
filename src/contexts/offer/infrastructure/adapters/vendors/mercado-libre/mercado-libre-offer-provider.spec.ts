import { Test, TestingModule } from '@nestjs/testing';
import { MercadoLibreOfferProvider } from './mercado-libre-offer-provider';
import { CanonicalProductId } from '@contexts/product/domain/models/canonical-product-id.vo';
import { MercadoLibreItem } from './types/mercado-libre-api.types';

describe('MercadoLibreOfferProvider', () => {
  let provider: MercadoLibreOfferProvider;

  const createMockMercadoLibreItem = (
    overrides?: Partial<MercadoLibreItem>,
  ): MercadoLibreItem => ({
    id: overrides?.id || 'MLA123456',
    title: overrides?.title || 'Test Product',
    price: overrides?.price ?? 10000,
    currency_id: 'ARS',
    url:
      overrides?.url ||
      'https://www.mercadolibre.com.ar/test-product/p/MLA123456',
    picture_url: overrides?.picture_url || 'https://example.com/image.jpg',
    condition: 'new',
    shipping: {
      free_shipping: overrides?.shipping?.free_shipping ?? false,
    },
    seller: {
      id: 0,
      reputation: {
        transactions: {
          ratings: {
            average:
              overrides?.seller?.reputation?.transactions?.ratings?.average ??
              4.5,
          },
        },
      },
    },
  });

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [MercadoLibreOfferProvider],
    }).compile();

    provider = module.get<MercadoLibreOfferProvider>(MercadoLibreOfferProvider);

    // Mock the scraper's scrapeTopOffers method
    jest
      .spyOn(provider['scraper'], 'scrapeTopOffers')
      .mockImplementation(jest.fn());
  });

  afterEach(async () => {
    // Close any browser instance to prevent hanging tests
    await provider.onApplicationShutdown();
  });

  it('should be defined', () => {
    expect(provider).toBeDefined();
  });

  it('should fetch offers from Mercado Libre scraper', async () => {
    // Arrange
    const canonicalProductId = new CanonicalProductId('test-product');
    const mockItems = [
      createMockMercadoLibreItem({ id: 'MLA111', price: 5000 }),
      createMockMercadoLibreItem({ id: 'MLA222', price: 7000 }),
      createMockMercadoLibreItem({ id: 'MLA333', price: 6000 }),
    ];

    jest
      .spyOn(provider['scraper'], 'scrapeTopOffers')
      .mockResolvedValue(mockItems);

    // Act
    const result = await provider.fetchOffers(canonicalProductId);

    // Assert
    expect(provider['scraper'].scrapeTopOffers).toHaveBeenCalled();
    expect(result.length).toBe(3);
    expect(result[0].price.basePrice).toBe(5000);
  });

  it('should return empty array when scraper returns no results', async () => {
    // Arrange
    const canonicalProductId = new CanonicalProductId('non-existent-product');
    jest.spyOn(provider['scraper'], 'scrapeTopOffers').mockResolvedValue([]);

    // Act
    const result = await provider.fetchOffers(canonicalProductId);

    // Assert
    expect(result).toEqual([]);
    expect(Array.isArray(result)).toBe(true);
  });

  it('should fail gracefully and return empty array on scraper error', async () => {
    // Arrange
    const canonicalProductId = new CanonicalProductId('test-product');
    jest
      .spyOn(provider['scraper'], 'scrapeTopOffers')
      .mockRejectedValue(new Error('Scraper error'));

    // Act
    const result = await provider.fetchOffers(canonicalProductId);

    // Assert
    expect(result).toEqual([]);
  });

  it('should map scraped items to offers correctly', async () => {
    // Arrange
    const canonicalProductId = new CanonicalProductId('laptop');
    const mockItems = [
      createMockMercadoLibreItem({
        id: 'MLA001',
        title: 'Laptop HP',
        price: 45000,
        shipping: { free_shipping: true },
        seller: {
          id: 123,
          reputation: {
            transactions: { ratings: { average: 4.8 } },
          },
        },
      }),
    ];

    jest
      .spyOn(provider['scraper'], 'scrapeTopOffers')
      .mockResolvedValue(mockItems);

    // Act
    const result = await provider.fetchOffers(canonicalProductId);

    // Assert
    expect(result.length).toBe(1);
    expect(result[0].vendor.name).toBe('MercadoLibre');
    expect(result[0].price.basePrice).toBe(45000);
    expect(result[0].price.shipping).toBe(0); // Free shipping
    expect(result[0].rating?.value).toBe(4.8);
    expect(result[0].url).toBe(
      'https://www.mercadolibre.com.ar/test-product/p/MLA123456',
    );
  });

  it('should handle items with paid shipping', async () => {
    // Arrange
    const canonicalProductId = new CanonicalProductId('product');
    const mockItems = [
      createMockMercadoLibreItem({
        price: 10000,
        shipping: { free_shipping: false },
      }),
    ];

    jest
      .spyOn(provider['scraper'], 'scrapeTopOffers')
      .mockResolvedValue(mockItems);

    // Act
    const result = await provider.fetchOffers(canonicalProductId);

    // Assert
    expect(result[0].price.shipping).toBe(50); // Default shipping cost
  });

  it('should handle items with zero price by using default price', async () => {
    // Arrange
    const canonicalProductId = new CanonicalProductId('product');
    // Note: Scraper should never return items with price 0 due to its filtering logic
    // But for robustness, mapper uses default price of 1 for invalid prices
    const mockItems = [
      createMockMercadoLibreItem({ id: 'MLA001', price: 5000 }),
      createMockMercadoLibreItem({ id: 'MLA002', price: 0 }), // Invalid - uses default price
      createMockMercadoLibreItem({ id: 'MLA003', price: 7000 }),
    ];

    jest
      .spyOn(provider['scraper'], 'scrapeTopOffers')
      .mockResolvedValue(mockItems);

    // Act
    const result = await provider.fetchOffers(canonicalProductId);

    // Assert - All items should be included (invalid prices use default price of 1)
    expect(result.length).toBe(3);
    // Offer IDs are internally generated UUIDs, not MercadoLibre IDs
    const prices = result.map((o) => o.price.basePrice).sort((a, b) => a - b);
    expect(prices).toEqual([1, 5000, 7000]);
    expect(result.find((o) => o.price.basePrice === 1)).toBeDefined();
  });

  it('should handle items with no seller rating', async () => {
    // Arrange
    const canonicalProductId = new CanonicalProductId('product');
    // Create item without rating by using minimal seller object
    const mockItems: MercadoLibreItem[] = [
      {
        id: 'MLA001',
        title: 'Test Product',
        price: 5000,
        currency_id: 'ARS',
        url: 'https://www.mercadolibre.com.ar/test-product/p/MLA001',
        condition: 'new',
        seller: { id: 123 },
      },
    ];

    jest
      .spyOn(provider['scraper'], 'scrapeTopOffers')
      .mockResolvedValue(mockItems);

    // Act
    const result = await provider.fetchOffers(canonicalProductId);

    // Assert
    expect(result.length).toBe(1);
    // When seller has no reputation data, rating should be undefined
    expect(result[0].rating).toBeUndefined();
  });

  it('should handle network/scraping errors gracefully', async () => {
    // Arrange
    const canonicalProductId = new CanonicalProductId('test');
    const networkError = new Error('Network timeout');
    jest
      .spyOn(provider['scraper'], 'scrapeTopOffers')
      .mockRejectedValue(networkError);

    // Act
    const result = await provider.fetchOffers(canonicalProductId);

    // Assert
    expect(result).toEqual([]);
  });

  it('should close browser on application shutdown', async () => {
    // Arrange - Mock the scraper's closeBrowser method
    const closeBrowserSpy = jest
      .spyOn(provider['scraper'], 'closeBrowser')
      .mockResolvedValue();

    // Act
    await provider.onApplicationShutdown();

    // Assert - Scraper's closeBrowser should be called
    expect(closeBrowserSpy).toHaveBeenCalled();
  });

  it('should return offers for multiple search queries independently', async () => {
    // Arrange
    const product1 = new CanonicalProductId('laptop');
    const product2 = new CanonicalProductId('mouse');

    const mockItems1 = [
      createMockMercadoLibreItem({ id: 'MLA001', price: 50000 }),
    ];
    const mockItems2 = [
      createMockMercadoLibreItem({ id: 'MLA002', price: 500 }),
    ];

    const scrapeTopOffersSpy = jest.spyOn(
      provider['scraper'],
      'scrapeTopOffers',
    );
    scrapeTopOffersSpy
      .mockResolvedValueOnce(mockItems1)
      .mockResolvedValueOnce(mockItems2);

    // Act
    const result1 = await provider.fetchOffers(product1);
    const result2 = await provider.fetchOffers(product2);

    // Assert
    expect(scrapeTopOffersSpy).toHaveBeenCalledTimes(2);
    expect(result1[0].price.basePrice).toBe(50000);
    expect(result2[0].price.basePrice).toBe(500);
  });
});
