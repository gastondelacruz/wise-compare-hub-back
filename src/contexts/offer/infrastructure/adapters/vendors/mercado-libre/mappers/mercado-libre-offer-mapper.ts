import { MercadoLibreItem } from '../types/mercado-libre-api.types';
import { Offer } from '@contexts/offer/domain/models/offer.entity';
import { CanonicalProductId } from '@contexts/product/domain/models/canonical-product-id.vo';
import { OfferId } from '@contexts/offer/domain/models/offer-id.vo';
import { ProductId } from '@contexts/product/domain/models/product-id.vo';
import { Price } from '@contexts/product/domain/models/price.vo';
import { DeliveryDays } from '@contexts/product/domain/models/delivery-days.vo';
import { Rating } from '@contexts/product/domain/models/rating.vo';
import { Vendor } from '@contexts/vendor/domain/models/vendor.entity';
import { VendorOfferResult } from '@contexts/offer/application/ports/output/vendor-offer-result';
import { randomUUID } from 'crypto';

/**
 * Maps MercadoLibre items to internal Offer entities.
 * Single Responsibility: Map external API data to domain models
 */
export class MercadoLibreOfferMapper {
  constructor(private readonly mercadoLibreVendor: Vendor) {}

  mapItemsToOffers(
    items: MercadoLibreItem[],
    canonicalProductId: CanonicalProductId,
  ): VendorOfferResult {
    const offers = items
      .map((item) => {
        try {
          return this.mapItemToOffer(item, canonicalProductId);
        } catch {
          // Skip items that fail to map
          return null;
        }
      })
      .filter((offer): offer is Offer => offer !== null);

    const productImageUrl = items.find((i) => i.picture_url)?.picture_url;

    return { offers, productImageUrl };
  }

  private mapItemToOffer(
    item: MercadoLibreItem,
    canonicalProductId: CanonicalProductId,
  ): Offer {
    // Map shipping cost (0 if free shipping, otherwise use default shipping cost estimate)
    const shippingCost = item.shipping?.free_shipping ? 0 : 50; // 50 ARS default shipping

    // Map price from scraped data
    // With current scraper, prices should always be valid (filtered by sortByPriceAndGetTop10)
    // For backward compatibility and robustness, use default price of 1 for invalid prices
    const itemPrice = item.price > 0 ? item.price : 1;
    const price = new Price(itemPrice, shippingCost);

    // Map delivery days (default to 5 days for MercadoLibre if not specified)
    const deliveryDays = new DeliveryDays(5);

    // Map rating if available
    const sellerRating =
      item.seller?.reputation?.transactions?.ratings?.average;
    const rating =
      sellerRating !== undefined && sellerRating >= 0 && sellerRating <= 5
        ? new Rating(sellerRating)
        : undefined;

    // Generate a product ID from the canonical ID (since we don't have actual product IDs)
    // In a real scenario, we might need to match or create products
    const productId = new ProductId(`${canonicalProductId.value}-${item.id}`);

    // Generate internal UUID for offer ID (not using external vendor ID)
    const offerId = new OfferId(randomUUID());

    return new Offer(
      offerId,
      productId,
      this.mercadoLibreVendor,
      price,
      deliveryDays,
      item.url,
      rating,
    );
  }
}
