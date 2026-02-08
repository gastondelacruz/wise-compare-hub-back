import { OffersFetchRequested } from './offers-fetch-requested.event';
import { CanonicalProductId } from '@contexts/product/domain/models/canonical-product-id.vo';
import { VendorId } from '@contexts/vendor/domain/models/vendor-id.vo';

describe('OffersFetchRequested', () => {
  it('should create an event with canonicalProductId and vendorId', () => {
    // Arrange
    const canonicalProductId = new CanonicalProductId('test-product');
    const vendorId = new VendorId('mercadolibre');

    // Act
    const event = new OffersFetchRequested(canonicalProductId, vendorId);

    // Assert
    expect(event.canonicalProductId).toBe(canonicalProductId);
    expect(event.vendorId).toBe(vendorId);
    expect(event.canonicalProductId.value).toBe('test-product');
    expect(event.vendorId.value).toBe('mercadolibre');
  });

  it('should have a timestamp when created', () => {
    // Arrange
    const canonicalProductId = new CanonicalProductId('test-product');
    const vendorId = new VendorId('mercadolibre');
    const beforeCreation = Date.now();

    // Act
    const event = new OffersFetchRequested(canonicalProductId, vendorId);
    const afterCreation = Date.now();

    // Assert
    expect(event.occurredAt).toBeInstanceOf(Date);
    expect(event.occurredAt.getTime()).toBeGreaterThanOrEqual(beforeCreation);
    expect(event.occurredAt.getTime()).toBeLessThanOrEqual(afterCreation);
  });

  it('should have a unique event id', () => {
    // Arrange
    const canonicalProductId = new CanonicalProductId('test-product');
    const vendorId = new VendorId('mercadolibre');

    // Act
    const event1 = new OffersFetchRequested(canonicalProductId, vendorId);
    const event2 = new OffersFetchRequested(canonicalProductId, vendorId);

    // Assert
    expect(event1.id).toBeDefined();
    expect(event2.id).toBeDefined();
    expect(event1.id).not.toBe(event2.id);
  });

  it('should have event type name', () => {
    // Arrange
    const canonicalProductId = new CanonicalProductId('test-product');
    const vendorId = new VendorId('mercadolibre');

    // Act
    const event = new OffersFetchRequested(canonicalProductId, vendorId);

    // Assert
    expect(event.eventType).toBe('OffersFetchRequested');
  });
});
