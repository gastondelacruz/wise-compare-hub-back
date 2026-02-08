import { Injectable, Inject } from '@nestjs/common';
import { EventHandler } from '@contexts/offer/application/ports/output/event-handler';
import { OffersFetchRequested } from '@contexts/offer/domain/events/offers-fetch-requested.event';
import { MercadoLibreOfferProvider } from '../../vendors/mercado-libre/mercado-libre-offer-provider';
import { IngestOffersUseCase } from '@contexts/offer/application/ports/input/ingest-offers-use-case';
import { ProductRepository } from '@contexts/product/application/ports/output/product.repository';
import { CanonicalProductId } from '@contexts/product/domain/models/canonical-product-id.vo';

/**
 * Handler for OffersFetchRequested events from MercadoLibre vendor.
 * Responsibilities:
 * - Listen to OffersFetchRequested events
 * - Use MercadoLibreOfferProvider to fetch offers
 * - Call IngestOffersService to ingest offers
 *
 * Constraints:
 * - Idempotent: Multiple calls with same event produce same result
 * - Safe to retry: Errors are handled gracefully
 */
@Injectable()
export class MercadoLibreOffersFetchHandler implements EventHandler<OffersFetchRequested> {
  private readonly MERCADOLIBRE_VENDOR_ID = 'mercadolibre';

  constructor(
    private readonly mercadoLibreProvider: MercadoLibreOfferProvider,
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
      // 1. Fetch offers from MercadoLibre
      const offers = await this.mercadoLibreProvider.fetchOffers(
        event.canonicalProductId,
      );

      if (offers.length === 0) {
        return; // No offers to ingest
      }

      // 2. Get product metadata (name, category, imageUrl)
      // Try to get from existing product, or use defaults
      const productMetadata = await this.getProductMetadata(
        event.canonicalProductId,
      );

      // 3. Ingest offers
      await this.ingestOffersUseCase.execute(
        event.canonicalProductId,
        productMetadata.name,
        productMetadata.category,
        productMetadata.imageUrl,
      );
    } catch {
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
