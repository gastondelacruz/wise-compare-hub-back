import { Injectable, Inject } from '@nestjs/common';
import { IngestOffersUseCase } from '../ports/input/ingest-offers-use-case';
import { VendorOfferProvider } from '@contexts/offer/application/ports/output/vendor-offer-provider';
import { ProductRepository } from '@contexts/product/application/ports/output/product.repository';
import { OfferRepository } from '@contexts/offer/application/ports/output/offer.repository';
import { Product } from '@contexts/product/domain/models/product.entity';
import { ProductId } from '@contexts/product/domain/models/product-id.vo';
import { CanonicalProductId } from '@contexts/product/domain/models/canonical-product-id.vo';
import { VendorId } from '@contexts/vendor/domain/models/vendor-id.vo';
import { Offer } from '@contexts/offer/domain/models/offer.entity';
import { OFFER_RULES } from '@contexts/offer/domain/constants/offer-rules';
import { randomUUID } from 'crypto';

/**
 * Service responsible for ingesting offers for a product.
 * Orchestrates offer ingestion from all vendor providers, ensuring product existence and replacing previous offers.
 */
@Injectable()
export class IngestOffersService implements IngestOffersUseCase {
  constructor(
    @Inject('ProductRepository')
    private readonly productRepository: ProductRepository,
    @Inject('OfferRepository')
    private readonly offerRepository: OfferRepository,
    @Inject('VendorOfferProviders')
    private readonly vendorProviders: VendorOfferProvider[],
  ) {}

  async execute(
    canonicalProductId: CanonicalProductId,
    productName: string,
    productCategory: string,
    productImageUrl: string,
  ): Promise<void> {
    // 1. Fetch offers from all vendor providers (before product creation to get image URL)
    const allOffers: Offer[] = [];
    let vendorImageUrl: string | undefined;
    for (const provider of this.vendorProviders) {
      try {
        const result = await provider.fetchOffers(canonicalProductId);
        allOffers.push(...result.offers);
        if (!vendorImageUrl && result.productImageUrl) {
          vendorImageUrl = result.productImageUrl;
        }
      } catch {
        // Fail gracefully - continue with other providers if one fails
        continue;
      }
    }

    if (allOffers.length === 0) {
      return; // No offers to ingest
    }

    // 2. Check if product exists
    const existingProducts =
      await this.productRepository.findByCanonicalProductId(canonicalProductId);

    let product: Product;
    if (existingProducts.length === 0) {
      // 3. Create product if it doesn't exist, preferring scraped image over fallback
      product = new Product(
        new ProductId(randomUUID()),
        canonicalProductId,
        productName,
        productCategory,
        vendorImageUrl ?? productImageUrl,
      );
      await this.productRepository.save(product);
    } else {
      // Use existing product (use first one if multiple exist)
      product = existingProducts[0];
    }

    // 4. Limit to max offers per product (sorted by price ascending)
    const limitedOffers = allOffers
      .sort((a, b) => a.price.total - b.price.total)
      .slice(0, OFFER_RULES.MAX_OFFERS_PER_PRODUCT);

    // 5. Group offers by vendor to identify which vendors to replace
    const vendorsToReplace = new Set(
      limitedOffers.map((offer) => offer.vendor.id.value),
    );

    // 6. Delete previous offers for same vendors
    for (const vendorIdValue of vendorsToReplace) {
      await this.offerRepository.deleteByProductIdAndVendorId(
        product.id,
        new VendorId(vendorIdValue),
      );
    }

    // 7. Save new offers (update productId to match the product)
    for (const offer of limitedOffers) {
      const offerWithProductId = new Offer(
        offer.id,
        product.id,
        offer.vendor,
        offer.price,
        offer.deliveryDays,
        offer.url,
        offer.rating,
      );
      await this.offerRepository.save(offerWithProductId);
    }
  }
}
