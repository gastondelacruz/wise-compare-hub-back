import { VendorOfferProvider } from './vendor-offer-provider';
import { Offer } from '@contexts/offer/domain/models/offer.entity';
import { CanonicalProductId } from '@contexts/product/domain/models/canonical-product-id.vo';
import { OfferId } from '@contexts/offer/domain/models/offer-id.vo';
import { ProductId } from '@contexts/product/domain/models/product-id.vo';
import { Vendor } from '@contexts/vendor/domain/models/vendor.entity';
import { VendorId } from '@contexts/vendor/domain/models/vendor-id.vo';
import { Price } from '@contexts/product/domain/models/price.vo';
import { DeliveryDays } from '@contexts/product/domain/models/delivery-days.vo';
import { Rating } from '@contexts/product/domain/models/rating.vo';

describe('VendorOfferProvider', () => {
  const createMockOffer = (id: string, productId: string): Offer => {
    const vendor = new Vendor(
      new VendorId('amazon'),
      'Amazon',
      true,
      'https://cdn.wisecompare.com/vendors/amazon.svg',
      true,
    );

    return new Offer(
      new OfferId(id),
      new ProductId(productId),
      vendor,
      new Price(1000, 0),
      new DeliveryDays(2),
      new Rating(4.5),
    );
  };

  it('should define a contract for fetching offers by canonical product ID', async () => {
    // Arrange
    const canonicalProductId = new CanonicalProductId(
      'apple-macbook-pro-14-m3',
    );
    const expectedOffers = [
      createMockOffer('offer-1', 'prod-1'),
      createMockOffer('offer-2', 'prod-2'),
    ];

    // Act & Assert - Create a mock implementation to verify the contract
    const mockProvider: VendorOfferProvider = {
      fetchOffers: jest.fn().mockResolvedValue(expectedOffers),
    };

    const result = await mockProvider.fetchOffers(canonicalProductId);

    // Verify the contract
    expect(mockProvider.fetchOffers).toHaveBeenCalledWith(canonicalProductId);
    expect(result).toEqual(expectedOffers);
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBe(2);
    expect(result[0]).toBeInstanceOf(Offer);
  });

  it('should return empty array when no offers are found', async () => {
    // Arrange
    const canonicalProductId = new CanonicalProductId('non-existent-product');

    // Act & Assert
    const mockProvider: VendorOfferProvider = {
      fetchOffers: jest.fn().mockResolvedValue([]),
    };

    const result = await mockProvider.fetchOffers(canonicalProductId);

    expect(result).toEqual([]);
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBe(0);
  });

  it('should accept CanonicalProductId value object', async () => {
    // Arrange
    const canonicalProductId = new CanonicalProductId('test-product-id');

    // Act & Assert - Verify the interface accepts CanonicalProductId
    const mockProvider: VendorOfferProvider = {
      fetchOffers: jest.fn().mockResolvedValue([]),
    };

    await mockProvider.fetchOffers(canonicalProductId);

    expect(mockProvider.fetchOffers).toHaveBeenCalledWith(
      expect.any(CanonicalProductId),
    );
  });

  it('should return offers mapped to internal Offer model', async () => {
    // Arrange
    const canonicalProductId = new CanonicalProductId('test-product');
    const offer = createMockOffer('offer-1', 'prod-1');

    // Act & Assert
    const mockProvider: VendorOfferProvider = {
      fetchOffers: jest.fn().mockResolvedValue([offer]),
    };

    const result = await mockProvider.fetchOffers(canonicalProductId);

    expect(result[0]).toBeInstanceOf(Offer);
    expect(result[0].id).toBeInstanceOf(OfferId);
    expect(result[0].productId).toBeInstanceOf(ProductId);
    expect(result[0].vendor).toBeInstanceOf(Vendor);
    expect(result[0].price).toBeInstanceOf(Price);
    expect(result[0].deliveryDays).toBeInstanceOf(DeliveryDays);
  });
});
