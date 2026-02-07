import { Injectable, Inject } from '@nestjs/common';
import { SearchProductsUseCase } from '../ports/input/search-products-use-case';
import { SearchProductsQuery } from '../dto/search-products-query';
import {
  SearchProductsResponseDto,
  ProductSearchResultDto,
  PriceRangeDto,
  OffersSummaryDto,
  BadgesDto,
} from '../dto/search-products-response.dto';
import { ProductRepository } from '../ports/output/product.repository';
import { OfferRepository } from '../ports/output/offer.repository';
import { Product } from '@contexts/product/domain/models/product.entity';
import { Offer } from '@contexts/product/domain/models/offer.entity';
import { PRODUCT_RULES } from '@contexts/product/domain/constants/product-rules';

@Injectable()
export class SearchProductsService implements SearchProductsUseCase {
  constructor(
    @Inject('ProductRepository')
    private readonly productRepository: ProductRepository,
    @Inject('OfferRepository')
    private readonly offerRepository: OfferRepository,
  ) {}

  async execute(
    query: SearchProductsQuery,
  ): Promise<SearchProductsResponseDto> {
    // 1. Filtrar productos por término de búsqueda
    const products = query.q
      ? await this.productRepository.findBySearchTerm(query.q)
      : await this.productRepository.findAll();

    if (products.length === 0) {
      return new SearchProductsResponseDto(query.q, 0, []);
    }

    // 2. Agrupar productos por canonicalProductId
    const productsByCanonicalId = new Map<string, Product[]>();
    for (const product of products) {
      const canonicalId = product.canonicalProductId.value;
      if (!productsByCanonicalId.has(canonicalId)) {
        productsByCanonicalId.set(canonicalId, []);
      }
      productsByCanonicalId.get(canonicalId)!.push(product);
    }

    // 3. Obtener todas las ofertas para todos los productos
    const allProductIds = products.map((p) => p.id);
    const allOffers =
      await this.offerRepository.findByProductIds(allProductIds);

    // 4. Agrupar ofertas por canonicalProductId
    const offersByCanonicalId = new Map<string, Offer[]>();
    for (const offer of allOffers) {
      const product = products.find(
        (p) => p.id.value === offer.productId.value,
      );
      if (product) {
        const canonicalId = product.canonicalProductId.value;
        if (!offersByCanonicalId.has(canonicalId)) {
          offersByCanonicalId.set(canonicalId, []);
        }
        offersByCanonicalId.get(canonicalId)!.push(offer);
      }
    }

    // 5. Procesar cada grupo canónico
    const productResults: ProductSearchResultDto[] = [];
    const offersByCanonicalIdForResults = new Map<string, Offer[]>();

    for (const [
      canonicalId,
      canonicalProducts,
    ] of productsByCanonicalId.entries()) {
      const offers = offersByCanonicalId.get(canonicalId) || [];

      // Aplicar filtros
      const filteredOffers = this.applyFilters(offers, query);

      if (filteredOffers.length === 0) {
        continue; // Skip productos sin ofertas válidas
      }

      // Guardar ofertas filtradas para cálculo de rating después
      offersByCanonicalIdForResults.set(canonicalId, filteredOffers);

      // Calcular agregaciones
      const product = canonicalProducts[0]; // Usar el primer producto del grupo
      const priceRange = this.calculatePriceRange(filteredOffers);
      const offersSummary = this.calculateOffersSummary(filteredOffers);

      productResults.push(
        new ProductSearchResultDto(
          canonicalId,
          product.name,
          product.category,
          product.imageUrl,
          priceRange,
          offersSummary,
          new BadgesDto(false, false, false), // Se calculará después
        ),
      );
    }

    // 6. Calcular badges comparando con otros productos
    this.calculateBadges(productResults);

    // 7. Ordenar resultados
    const sortedResults = this.sortResults(
      productResults,
      query.sort,
      offersByCanonicalIdForResults,
    );

    return new SearchProductsResponseDto(
      query.q,
      sortedResults.length,
      sortedResults,
    );
  }

  private applyFilters(offers: Offer[], query: SearchProductsQuery): Offer[] {
    let filtered = [...offers];

    // Filtrar por precio
    if (query.minPrice !== undefined) {
      filtered = filtered.filter(
        (offer) => offer.price.total >= query.minPrice!,
      );
    }
    if (query.maxPrice !== undefined) {
      filtered = filtered.filter(
        (offer) => offer.price.total <= query.maxPrice!,
      );
    }

    // Filtrar por vendors
    if (query.vendors && query.vendors.length > 0) {
      const vendorIds = new Set(query.vendors);
      filtered = filtered.filter((offer) =>
        vendorIds.has(offer.vendor.id.value),
      );
    }

    return filtered;
  }

  private calculatePriceRange(offers: Offer[]): PriceRangeDto {
    if (offers.length === 0) {
      return new PriceRangeDto(0, 0, 'USD');
    }

    const prices = offers.map((offer) => offer.price.total);
    const min = Math.min(...prices);
    const max = Math.max(...prices);

    return new PriceRangeDto(min, max, 'USD');
  }

  private calculateOffersSummary(offers: Offer[]): OffersSummaryDto {
    if (offers.length === 0) {
      return new OffersSummaryDto(0, 0, 0);
    }

    const prices = offers.map((offer) => offer.price.total);
    const bestPrice = Math.min(...prices);

    const deliveryDays = offers.map((offer) => offer.deliveryDays.value);
    const fastestDeliveryDays = Math.min(...deliveryDays);

    return new OffersSummaryDto(offers.length, bestPrice, fastestDeliveryDays);
  }

  private calculateBadges(products: ProductSearchResultDto[]): void {
    if (products.length === 0) return;

    // Encontrar el mejor precio y la entrega más rápida
    const bestPrice = Math.min(
      ...products.map((p) => p.offersSummary.bestPrice),
    );
    const fastestDelivery = Math.min(
      ...products.map((p) => p.offersSummary.fastestDeliveryDays),
    );

    // Actualizar badges creando nuevos objetos
    for (let i = 0; i < products.length; i++) {
      const product = products[i];
      products[i] = new ProductSearchResultDto(
        product.canonicalProductId,
        product.name,
        product.category,
        product.imageUrl,
        product.priceRange,
        product.offersSummary,
        new BadgesDto(
          product.offersSummary.bestPrice === bestPrice,
          product.offersSummary.fastestDeliveryDays === fastestDelivery,
          product.offersSummary.offersCount >=
            PRODUCT_RULES.MIN_POPULAR_OFFERS_COUNT,
        ),
      );
    }
  }

  private sortResults(
    products: ProductSearchResultDto[],
    sort?: string,
    offersByCanonicalId?: Map<string, Offer[]>,
  ): ProductSearchResultDto[] {
    const sorted = [...products];

    switch (sort) {
      case 'price_asc':
        sorted.sort(
          (a, b) => a.offersSummary.bestPrice - b.offersSummary.bestPrice,
        );
        break;
      case 'price_desc':
        sorted.sort(
          (a, b) => b.offersSummary.bestPrice - a.offersSummary.bestPrice,
        );
        break;
      case 'rating':
        if (offersByCanonicalId) {
          sorted.sort((a, b) => {
            const avgRatingA = this.calculateAverageRating(
              offersByCanonicalId.get(a.canonicalProductId) || [],
            );
            const avgRatingB = this.calculateAverageRating(
              offersByCanonicalId.get(b.canonicalProductId) || [],
            );
            return avgRatingB - avgRatingA; // Descendente (mayor rating primero)
          });
        }
        break;
      case 'relevance':
      default:
        // Mantener orden original (relevance)
        break;
    }

    return sorted;
  }

  private calculateAverageRating(offers: Offer[]): number {
    if (offers.length === 0) return 0;
    const ratings = offers
      .map((offer) => offer.rating?.value)
      .filter((rating): rating is number => rating !== undefined);
    if (ratings.length === 0) return 0;
    const sum = ratings.reduce((acc, rating) => acc + rating, 0);
    return sum / ratings.length;
  }
}
