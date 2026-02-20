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
        url: 'https://www.mercadolibre.com.ar/test-product/p/MLA111',
        shipping: { free_shipping: true },
        seller: { id: 123456 },
        condition: 'new',
      },
    ];

    // Act
    const result = mapper.mapItemsToOffers(items, canonicalProductId);

    // Assert
    expect(result.offers).toHaveLength(1);
    expect(result.offers[0]).toBeInstanceOf(Offer);
    expect(result.offers[0].id.value).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/,
    );
    expect(result.offers[0].price.basePrice).toBe(1000);
    expect(result.offers[0].vendor.id.value).toBe('mercadolibre');
    expect(result.offers[0].url).toBe(
      'https://www.mercadolibre.com.ar/test-product/p/MLA111',
    );
  });

  it('should extract productImageUrl from the first item with a picture_url', () => {
    // Arrange
    const canonicalProductId = new CanonicalProductId('test-product');
    const imageUrl = 'https://http2.mlstatic.com/D_NQ_NP_product.jpg';
    const items: MercadoLibreItem[] = [
      {
        id: 'MLA111',
        title: 'Test Product',
        price: 1000,
        currency_id: 'ARS',
        url: 'https://www.mercadolibre.com.ar/test-product/p/MLA111',
        picture_url: imageUrl,
        condition: 'new',
      },
    ];

    // Act
    const result = mapper.mapItemsToOffers(items, canonicalProductId);

    // Assert
    expect(result.productImageUrl).toBe(imageUrl);
  });

  it('should return productImageUrl as undefined when no item has a picture_url', () => {
    // Arrange
    const canonicalProductId = new CanonicalProductId('test-product');
    const items: MercadoLibreItem[] = [
      {
        id: 'MLA111',
        title: 'Test Product',
        price: 1000,
        currency_id: 'ARS',
        url: 'https://www.mercadolibre.com.ar/test-product/p/MLA111',
        condition: 'new',
      },
    ];

    // Act
    const result = mapper.mapItemsToOffers(items, canonicalProductId);

    // Assert
    expect(result.productImageUrl).toBeUndefined();
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
        url: 'https://www.mercadolibre.com.ar/test-product/p/MLA111',
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
    const result = mapper.mapItemsToOffers(items, canonicalProductId);

    // Assert
    expect(result.offers[0].rating?.value).toBe(4.5);
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
        url: 'https://www.mercadolibre.com.ar/test-product/p/MLA111',
        seller: { id: 123456 },
        condition: 'new',
      },
    ];

    // Act
    const result = mapper.mapItemsToOffers(items, canonicalProductId);

    // Assert
    expect(result.offers[0].rating).toBeUndefined();
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
        url: 'https://www.mercadolibre.com.ar/valid-product/p/MLA111',
        condition: 'new',
      },
      {
        id: 'MLA222',
        title: 'Product with invalid price',
        price: -100,
        currency_id: 'ARS',
        url: 'https://www.mercadolibre.com.ar/invalid-product/p/MLA222',
        condition: 'new',
      },
    ];

    // Act
    const result = mapper.mapItemsToOffers(items, canonicalProductId);

    // Assert
    expect(result.offers.length).toBe(2);
    const prices = result.offers
      .map((o) => o.price.basePrice)
      .sort((a, b) => a - b);
    expect(prices).toEqual([1, 1000]);
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
        url: 'https://www.mercadolibre.com.ar/test-product/p/MLA111',
        shipping: { free_shipping: true },
        condition: 'new',
      },
    ];

    // Act
    const result = mapper.mapItemsToOffers(items, canonicalProductId);

    // Assert
    expect(result.offers[0].price.shipping).toBe(0);
  });
});
