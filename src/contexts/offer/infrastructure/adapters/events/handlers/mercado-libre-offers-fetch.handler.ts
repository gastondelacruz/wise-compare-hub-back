import { Injectable, Inject, Logger } from '@nestjs/common';
import { EventHandler } from '@contexts/offer/application/ports/output/event-handler';
import { OffersFetchRequested } from '@contexts/offer/domain/events/offers-fetch-requested.event';
import { IngestOffersUseCase } from '@contexts/offer/application/ports/input/ingest-offers-use-case';
import { ProductRepository } from '@contexts/product/application/ports/output/product.repository';
import { CanonicalProductId } from '@contexts/product/domain/models/canonical-product-id.vo';

/**
 * Handler for OffersFetchRequested events from MercadoLibre vendor.
 * Responsibilities:
 * - Listen to OffersFetchRequested events
 * - Delegate to IngestOffersUseCase which will fetch and save offers
 *
 * Constraints:
 * - Idempotent: Multiple calls with same event produce same result
 * - Safe to retry: Errors are handled gracefully
 */
@Injectable()
export class MercadoLibreOffersFetchHandler implements EventHandler<OffersFetchRequested> {
  private readonly MERCADOLIBRE_VENDOR_ID = 'mercadolibre';
  private readonly logger = new Logger(MercadoLibreOffersFetchHandler.name);

  constructor(
    @Inject('IngestOffersUseCase')
    private readonly ingestOffersUseCase: IngestOffersUseCase,
    @Inject('ProductRepository')
    private readonly productRepository: ProductRepository,
  ) {}

  async handle(event: OffersFetchRequested): Promise<void> {
    // Only process events for MercadoLibre vendor
    if (event.vendorId.value !== this.MERCADOLIBRE_VENDOR_ID) {
      return;
    }

    try {
      this.logger.log(
        `📬 Received offers fetch request for: ${event.canonicalProductId.value}`,
      );

      // Get product metadata (name, category, imageUrl)
      // Try to get from existing product, or use defaults
      const productMetadata = await this.getProductMetadata(
        event.canonicalProductId,
      );

      // Delegate to IngestOffersUseCase which will:
      // 1. Fetch offers from all vendors (including MercadoLibre)
      // 2. Create/update product
      // 3. Save offers to database
      await this.ingestOffersUseCase.execute(
        event.canonicalProductId,
        productMetadata.name,
        productMetadata.category,
        productMetadata.imageUrl,
      );

      this.logger.log(
        `✅ Successfully processed offers for: ${event.canonicalProductId.value}`,
      );
    } catch (error) {
      this.logger.error(
        `❌ Failed to process offers for ${event.canonicalProductId.value}: ${error instanceof Error ? error.message : String(error)}`,
      );
      // Fail gracefully - safe to retry
      // Errors are logged but not thrown to allow retries
    }
  }

  private async getProductMetadata(
    canonicalProductId: CanonicalProductId,
  ): Promise<{
    name: string;
    category: string;
    imageUrl: string;
  }> {
    // Try to get product from repository
    const existingProducts =
      await this.productRepository.findByCanonicalProductId(canonicalProductId);

    if (existingProducts.length > 0) {
      const product = existingProducts[0];
      return {
        name: product.name,
        category: product.category,
        imageUrl: product.imageUrl,
      };
    }

    // Use defaults if product doesn't exist
    // The ingest service will create the product with these values
    return {
      name: canonicalProductId.value,
      category: 'General',
      imageUrl: 'https://via.placeholder.com/400x300?text=Product',
    };
  }
}
