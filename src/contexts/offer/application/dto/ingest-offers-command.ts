import { CanonicalProductId } from '@contexts/product/domain/models/canonical-product-id.vo';
import { Offer } from '@contexts/offer/domain/models/offer.entity';

/**
 * Command for ingesting offers for a product.
 * Contains product metadata needed to create the product if it doesn't exist.
 */
export class IngestOffersCommand {
  constructor(
    public readonly canonicalProductId: CanonicalProductId,
    public readonly offers: Offer[],
    public readonly productName: string,
    public readonly productCategory: string,
    public readonly productImageUrl: string,
  ) {
    if (!productName || productName.trim().length === 0) {
      throw new Error('Product name cannot be empty');
    }
    if (!productCategory || productCategory.trim().length === 0) {
      throw new Error('Product category cannot be empty');
    }
    if (!productImageUrl || productImageUrl.trim().length === 0) {
      throw new Error('Product image URL cannot be empty');
    }
  }
}
