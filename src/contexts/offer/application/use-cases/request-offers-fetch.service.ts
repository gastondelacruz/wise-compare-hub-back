import { Injectable, Inject } from '@nestjs/common';
import { RequestOffersFetchUseCase } from '../ports/input/request-offers-fetch-use-case';
import { EventBus } from '../ports/output/event-bus';
import { VendorRepository } from '@contexts/vendor/application/ports/output/vendor.repository';
import { OffersFetchRequested } from '@contexts/offer/domain/events/offers-fetch-requested.event';
import { CanonicalProductId } from '@contexts/product/domain/models/canonical-product-id.vo';

/**
 * Service responsible for requesting offers fetch for a product.
 * Emits OffersFetchRequested events for all enabled vendors.
 */
@Injectable()
export class RequestOffersFetchService implements RequestOffersFetchUseCase {
  constructor(
    @Inject('EventBus')
    private readonly eventBus: EventBus,
    @Inject('VendorRepository')
    private readonly vendorRepository: VendorRepository,
  ) {}

  async execute(canonicalProductId: string): Promise<void> {
    const enabledVendors = await this.vendorRepository.findByEnabled(true);
    const canonicalId = new CanonicalProductId(canonicalProductId);

    // Emit events for all enabled vendors (handlers will decide if they can process them)
    for (const vendor of enabledVendors) {
      const event = new OffersFetchRequested(canonicalId, vendor.id);
      await this.eventBus.publish(event);
    }
  }
}
