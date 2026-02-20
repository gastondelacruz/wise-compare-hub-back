import { Injectable, Inject } from '@nestjs/common';
import { GetProductOffersUseCase } from '../ports/input/get-product-offers-use-case';
import {
  GetProductOffersResponseDto,
  OfferDto,
  SummaryDto,
  VendorDto,
  PricingDto,
  DeliveryDto,
  RatingDto,
  FlagsDto,
  CtaDto,
} from '../dto/get-product-offers-response.dto';
import { ProductRepository } from '../ports/output/product.repository';
import { OfferRepository } from '@contexts/offer/application/ports/output/offer.repository';
import { CanonicalProductId } from '@contexts/product/domain/models/canonical-product-id.vo';
import { ProductNotFoundError } from '@contexts/product/domain/exceptions/product-not-found.error';
import { Offer } from '@contexts/offer/domain/models/offer.entity';
import { OFFER_RULES } from '@contexts/offer/domain/constants/offer-rules';

@Injectable()
export class GetProductOffersService implements GetProductOffersUseCase {
  constructor(
    @Inject('ProductRepository')
    private readonly productRepository: ProductRepository,
    @Inject('OfferRepository')
    private readonly offerRepository: OfferRepository,
  ) {}

  async execute(
    canonicalProductId: string,
    sort?: string,
    vendors?: string[],
    preferences?: boolean,
    userId?: string,
  ): Promise<GetProductOffersResponseDto> {
    // 1. Buscar productos por canonicalProductId
    const canonicalId = new CanonicalProductId(canonicalProductId);
    const products =
      await this.productRepository.findByCanonicalProductId(canonicalId);

    if (products.length === 0) {
      throw new ProductNotFoundError(canonicalProductId);
    }

    // 2. Obtener todos los productId asociados
    const productIds = products.map((p) => p.id);

    // 3. Buscar todas las ofertas por esos productId
    const allOffers = await this.offerRepository.findByProductIds(productIds);

    // 4. Aplicar filtros por vendor
    let filteredOffers = allOffers;
    if (vendors && vendors.length > 0) {
      const vendorSet = new Set(vendors);
      filteredOffers = allOffers.filter((offer) =>
        vendorSet.has(offer.vendor.id.value),
      );
    }

    if (filteredOffers.length === 0) {
      // Return empty offers but still return product info
      const product = products[0];
      return new GetProductOffersResponseDto(
        canonicalProductId,
        product.name,
        product.imageUrl,
        new SummaryDto(0, 0, 0),
        [],
      );
    }

    // 5. Calcular flags por oferta
    const bestPrice = Math.min(...filteredOffers.map((o) => o.price.total));
    const fastestDelivery = Math.min(
      ...filteredOffers.map((o) => o.deliveryDays.value),
    );

    // 6. Ordenar las ofertas según sort o preferencias
    let sortedOffers: Offer[];
    if (preferences && userId) {
      sortedOffers = this.sortOffersWithPreferences(
        filteredOffers,
        sort,
        userId,
      );
    } else {
      sortedOffers = this.sortOffers(filteredOffers, sort);
    }

    // 7. Limit to max offers per product
    const cappedOffers = sortedOffers.slice(
      0,
      OFFER_RULES.MAX_OFFERS_PER_PRODUCT,
    );

    // 8. Convertir a DTOs
    const offerDtos = cappedOffers.map((offer) =>
      this.mapOfferToDto(offer, bestPrice, fastestDelivery),
    );

    // 9. Calcular summary
    const summary = new SummaryDto(
      offerDtos.length,
      bestPrice,
      fastestDelivery,
    );

    const product = products[0];
    return new GetProductOffersResponseDto(
      canonicalProductId,
      product.name,
      product.imageUrl,
      summary,
      offerDtos,
    );
  }

  private sortOffers(offers: Offer[], sort?: string): Offer[] {
    const sorted = [...offers];

    switch (sort) {
      case 'delivery':
        sorted.sort((a, b) => a.deliveryDays.value - b.deliveryDays.value);
        break;
      case 'rating':
        sorted.sort((a, b) => {
          const ratingA = a.rating?.value || 0;
          const ratingB = b.rating?.value || 0;
          return ratingB - ratingA; // Descendente
        });
        break;
      case 'price':
      default:
        sorted.sort((a, b) => a.price.total - b.price.total);
        break;
    }

    return sorted;
  }

  private sortOffersWithPreferences(
    offers: Offer[],
    sort?: string,
    userId?: string,
  ): Offer[] {
    // Si hay sort explícito, usar ese
    if (sort) {
      return this.sortOffers(offers, sort);
    }

    // Validar que userId existe (debe estar presente si preferences=true)
    if (!userId) {
      // Fallback a ordenamiento por precio si no hay userId
      return this.sortOffers(offers, 'price');
    }

    // Aplicar scoring ponderado simple basado en preferencias del usuario
    // Por ahora, asumimos preferencias por defecto: precio bajo y entrega rápida
    // TODO: En el futuro, obtener preferencias específicas del usuario desde UserPreferencesRepository
    const sorted = [...offers];

    // Calcular score ponderado para cada oferta
    const maxPrice = Math.max(...offers.map((o) => o.price.total));
    const maxDelivery = Math.max(...offers.map((o) => o.deliveryDays.value));

    sorted.sort((a, b) => {
      // Normalizar precio (menor es mejor): score de 0 a 1
      const priceScoreA = 1 - a.price.total / maxPrice;
      const priceScoreB = 1 - b.price.total / maxPrice;

      // Normalizar delivery (menor es mejor): score de 0 a 1
      const deliveryScoreA = 1 - a.deliveryDays.value / maxDelivery;
      const deliveryScoreB = 1 - b.deliveryDays.value / maxDelivery;

      // Rating normalizado (mayor es mejor): score de 0 a 1
      const ratingA = a.rating?.value || 0;
      const ratingB = b.rating?.value || 0;
      const ratingScoreA = ratingA / 5;
      const ratingScoreB = ratingB / 5;

      // Pesos simples: precio 50%, delivery 30%, rating 20%
      const weightPrice = 0.5;
      const weightDelivery = 0.3;
      const weightRating = 0.2;

      const totalScoreA =
        priceScoreA * weightPrice +
        deliveryScoreA * weightDelivery +
        ratingScoreA * weightRating;

      const totalScoreB =
        priceScoreB * weightPrice +
        deliveryScoreB * weightDelivery +
        ratingScoreB * weightRating;

      // Ordenar descendente (mayor score primero)
      return totalScoreB - totalScoreA;
    });

    return sorted;
  }

  private mapOfferToDto(
    offer: Offer,
    bestPrice: number,
    fastestDelivery: number,
  ): OfferDto {
    const vendorDto = new VendorDto(
      offer.vendor.id.value,
      offer.vendor.name,
      offer.vendor.isOfficial,
    );

    const pricingDto = new PricingDto(
      offer.price.basePrice,
      offer.price.shipping,
      offer.price.total,
      'USD',
    );

    const deliveryDto = new DeliveryDto(offer.deliveryDays.value);

    const ratingDto = offer.rating
      ? new RatingDto(offer.rating.value)
      : undefined;

    const flagsDto = new FlagsDto(
      offer.price.total === bestPrice,
      offer.deliveryDays.value === fastestDelivery,
    );

    // CTA using the real vendor URL
    const ctaDto = new CtaDto(offer.url, 'View offer');

    return new OfferDto(
      offer.id.value,
      vendorDto,
      pricingDto,
      deliveryDto,
      ratingDto,
      flagsDto,
      ctaDto,
    );
  }
}
