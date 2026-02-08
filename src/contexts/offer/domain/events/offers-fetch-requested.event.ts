import { CanonicalProductId } from '@contexts/product/domain/models/canonical-product-id.vo';
import { VendorId } from '@contexts/vendor/domain/models/vendor-id.vo';
import { randomUUID } from 'crypto';

/**
 * Domain event that signals the intent to fetch offers for a product from a vendor.
 * This event decouples the HTTP request from the ingestion process.
 */
export class OffersFetchRequested {
  public readonly id: string;
  public readonly occurredAt: Date;
  public readonly eventType: string;

  constructor(
    public readonly canonicalProductId: CanonicalProductId,
    public readonly vendorId: VendorId,
  ) {
    this.id = randomUUID();
    this.occurredAt = new Date();
    this.eventType = 'OffersFetchRequested';
  }
}
