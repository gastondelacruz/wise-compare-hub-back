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
    // 1. Check if product exists
    const existingProducts =
      await this.productRepository.findByCanonicalProductId(canonicalProductId);

    let product: Product;
    if (existingProducts.length === 0) {
      // 2. Create product if it doesn't exist
      product = new Product(
        new ProductId(randomUUID()),
        canonicalProductId,
        productName,
        productCategory,
        productImageUrl,
      );
      await this.productRepository.save(product);
    } else {
      // Use existing product (use first one if multiple exist)
      product = existingProducts[0];
    }

    // 3. Fetch offers from all vendor providers
    const allOffers: Offer[] = [];
    for (const provider of this.vendorProviders) {
      try {
        const offers = await provider.fetchOffers(canonicalProductId);
        allOffers.push(...offers);
      } catch {
        // Fail gracefully - continue with other providers if one fails
        continue;
      }
    }

    if (allOffers.length === 0) {
      return; // No offers to ingest
    }

    // 4. Group offers by vendor to identify which vendors to replace
    const vendorsToReplace = new Set(
      allOffers.map((offer) => offer.vendor.id.value),
    );

    // 5. Delete previous offers for same vendors
    for (const vendorIdValue of vendorsToReplace) {
      await this.offerRepository.deleteByProductIdAndVendorId(
        product.id,
        new VendorId(vendorIdValue),
      );
    }

    // 6. Save new offers (update productId to match the product)
    for (const offer of allOffers) {
      // Create new offer with correct productId
      const offerWithProductId = new Offer(
        offer.id,
        product.id,
        offer.vendor,
        offer.price,
        offer.deliveryDays,
        offer.rating,
      );
      await this.offerRepository.save(offerWithProductId);
    }
  }
}
