import { Injectable, Logger } from '@nestjs/common';
import { OfferRepository } from '@contexts/offer/application/ports/output/offer.repository';
import { Offer } from '@contexts/offer/domain/models/offer.entity';
import { ProductId } from '@contexts/product/domain/models/product-id.vo';
import { VendorId } from '@contexts/vendor/domain/models/vendor-id.vo';

@Injectable()
export class InMemoryOfferRepository implements OfferRepository {
  private readonly logger = new Logger(InMemoryOfferRepository.name);
  private offers: Offer[] = [];

  constructor() {
    // Start empty - offers will be populated dynamically when users search
    // and the MercadoLibre scraper fetches real product data
  }

  findByProductIds(productIds: ProductId[]): Promise<Offer[]> {
    const productIdSet = new Set(productIds.map((id) => id.value));
    const results = this.offers.filter((offer) =>
      productIdSet.has(offer.productId.value),
    );
    this.logger.log(
      `🔍 Finding offers for ${productIds.length} products - Found ${results.length} offers (Total in DB: ${this.offers.length})`,
    );
    return Promise.resolve(results);
  }

  save(offer: Offer): Promise<void> {
    const index = this.offers.findIndex((o) => o.id.value === offer.id.value);
    if (index >= 0) {
      this.logger.log(
        `📝 Updated offer: ${offer.id.value} for product ${offer.productId.value}`,
      );
      this.offers[index] = offer;
    } else {
      this.logger.log(
        `➕ Created new offer: ${offer.id.value} for product ${offer.productId.value} (total: ${this.offers.length + 1})`,
      );
      this.offers.push(offer);
    }
    return Promise.resolve();
  }

  deleteByProductIdAndVendorId(
    productId: ProductId,
    vendorId: VendorId,
  ): Promise<void> {
    this.offers = this.offers.filter(
      (offer) =>
        !(
          offer.productId.value === productId.value &&
          offer.vendor.id.value === vendorId.value
        ),
    );
    return Promise.resolve();
  }
}
