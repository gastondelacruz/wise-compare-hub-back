import { CanonicalProductId } from '@contexts/product/domain/models/canonical-product-id.vo';

/**
 * Use case interface for ingesting offers for a product.
 * Orchestrates offer ingestion from all vendor providers, ensuring product existence and replacing previous offers.
 */
export interface IngestOffersUseCase {
  execute(
    canonicalProductId: CanonicalProductId,
    productName: string,
    productCategory: string,
    productImageUrl: string,
  ): Promise<void>;
}
