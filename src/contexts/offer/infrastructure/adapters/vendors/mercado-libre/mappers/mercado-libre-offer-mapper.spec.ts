import { MercadoLibreOfferMapper } from './mercado-libre-offer-mapper';
import { MercadoLibreItem } from '../types/mercado-libre-api.types';
import { CanonicalProductId } from '@contexts/product/domain/models/canonical-product-id.vo';
import { Offer } from '@contexts/offer/domain/models/offer.entity';
import { Vendor } from '@contexts/vendor/domain/models/vendor.entity';
import { VendorId } from '@contexts/vendor/domain/models/vendor-id.vo';

describe('MercadoLibreOfferMapper', () => {
  let mapper: MercadoLibreOfferMapper;
  let mercadoLibreVendor: Vendor;

  beforeEach(() => {
    mercadoLibreVendor = new Vendor(
      new VendorId('mercadolibre'),
      'MercadoLibre',
      true,
      'https://cdn.wisecompare.com/vendors/mercadolibre.svg',
      true,
    );
    mapper = new MercadoLibreOfferMapper(mercadoLibreVendor);
  });

  it('should map MercadoLibre items to Offers', () => {
    // Arrange
    const canonicalProductId = new CanonicalProductId('test-product');
    const items: MercadoLibreItem[] = [
      {
        id: 'MLA111',
        title: 'Test Product',
        price: 1000,
        currency_id: 'ARS',
        shipping: { free_shipping: true },
        seller: { id: 123456 },
        condition: 'new',
      },
    ];

    // Act
    const offers = mapper.mapItemsToOffers(items, canonicalProductId);

    // Assert
    expect(offers).toHaveLength(1);
    expect(offers[0]).toBeInstanceOf(Offer);
    expect(offers[0].id.value).toBe('MLA111');
    expect(offers[0].price.basePrice).toBe(1000);
    expect(offers[0].vendor.id.value).toBe('mercadolibre');
  });

  it('should map rating when available', () => {
    // Arrange
    const canonicalProductId = new CanonicalProductId('test-product');
    const items: MercadoLibreItem[] = [
      {
        id: 'MLA111',
        title: 'Test Product',
        price: 1000,
        currency_id: 'ARS',
        seller: {
          id: 123456,
          reputation: {
            transactions: {
              ratings: {
                average: 4.5,
              },
            },
          },
        },
        condition: 'new',
      },
    ];

    // Act
    const offers = mapper.mapItemsToOffers(items, canonicalProductId);

    // Assert
    expect(offers[0].rating?.value).toBe(4.5);
  });

  it('should not include rating when not available', () => {
    // Arrange
    const canonicalProductId = new CanonicalProductId('test-product');
    const items: MercadoLibreItem[] = [
      {
        id: 'MLA111',
        title: 'Test Product',
        price: 1000,
        currency_id: 'ARS',
        seller: { id: 123456 },
        condition: 'new',
      },
    ];

    // Act
    const offers = mapper.mapItemsToOffers(items, canonicalProductId);

    // Assert
    expect(offers[0].rating).toBeUndefined();
  });

  it('should map items with invalid prices using default price', () => {
    // Arrange
    const canonicalProductId = new CanonicalProductId('test-product');
    const items: MercadoLibreItem[] = [
      {
        id: 'MLA111',
        title: 'Valid Product',
        price: 1000,
        currency_id: 'ARS',
        condition: 'new',
      },
      {
        id: 'MLA222',
        title: 'Product with invalid price',
        price: -100, // Invalid price - will use default price of 1
        currency_id: 'ARS',
        condition: 'new',
      },
    ];

    // Act
    const offers = mapper.mapItemsToOffers(items, canonicalProductId);

    // Assert
    // Both items should be mapped (invalid price uses default price of 1)
    expect(offers.length).toBe(2);
    expect(offers[0].id.value).toBe('MLA111');
    expect(offers[0].price.basePrice).toBe(1000);
    expect(offers[1].id.value).toBe('MLA222');
    expect(offers[1].price.basePrice).toBe(1); // Default price for invalid prices
  });

  it('should set shipping cost to 0 for free shipping', () => {
    // Arrange
    const canonicalProductId = new CanonicalProductId('test-product');
    const items: MercadoLibreItem[] = [
      {
        id: 'MLA111',
        title: 'Test Product',
        price: 1000,
        currency_id: 'ARS',
        shipping: { free_shipping: true },
        condition: 'new',
      },
    ];

    // Act
    const offers = mapper.mapItemsToOffers(items, canonicalProductId);

    // Assert
    expect(offers[0].price.shipping).toBe(0);
  });
});
