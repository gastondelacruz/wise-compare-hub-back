import { Offer } from '@contexts/offer/domain/models/offer.entity';
import { CanonicalProductId } from '@contexts/product/domain/models/canonical-product-id.vo';

/**
 * Vendor-agnostic provider for fetching offers.
 *
 * Responsibilities:
 * - Fetch offers for a given canonicalProductId
 * - Return offers already mapped to internal Offer model
 * - Be vendor-agnostic from caller perspective
 *
 * Constraints:
 * - Provider must NOT persist data
 * - Provider must NOT create products
 */
export interface VendorOfferProvider {
  /**
   * Fetches all offers for a given canonical product ID.
   *
   * @param canonicalProductId - The canonical product identifier
   * @returns Promise resolving to an array of offers already mapped to the internal Offer model
   */
  fetchOffers(canonicalProductId: CanonicalProductId): Promise<Offer[]>;
}
