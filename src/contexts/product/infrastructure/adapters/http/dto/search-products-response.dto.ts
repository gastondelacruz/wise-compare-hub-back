import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  SearchProductsResponseDto as ApplicationSearchProductsResponseDto,
  ProductSearchResultDto as ApplicationProductSearchResultDto,
} from '@contexts/product/application/dto/search-products-response.dto';

export class PriceRangeResponseDto {
  @ApiProperty()
  min: number;

  @ApiProperty()
  max: number;

  @ApiProperty()
  currency: string;
}

export class OffersSummaryResponseDto {
  @ApiProperty()
  offersCount: number;

  @ApiProperty()
  bestPrice: number;

  @ApiProperty()
  fastestDeliveryDays: number;
}

export class BadgesResponseDto {
  @ApiProperty()
  isBestPrice: boolean;

  @ApiProperty()
  isFastestDelivery: boolean;

  @ApiProperty()
  isPopular: boolean;
}

export class ProductSearchResultResponseDto {
  @ApiProperty()
  canonicalProductId: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  category: string;

  @ApiProperty()
  imageUrl: string;

  @ApiProperty({ type: PriceRangeResponseDto })
  priceRange: PriceRangeResponseDto;

  @ApiProperty({ type: OffersSummaryResponseDto })
  offersSummary: OffersSummaryResponseDto;

  @ApiProperty({ type: BadgesResponseDto })
  badges: BadgesResponseDto;
}

export class SearchProductsResponseDto {
  @ApiPropertyOptional()
  query?: string;

  @ApiProperty()
  total: number;

  @ApiProperty({ type: [ProductSearchResultResponseDto] })
  products: ProductSearchResultResponseDto[];

  static fromApplication(
    dto: ApplicationSearchProductsResponseDto,
  ): SearchProductsResponseDto {
    return {
      query: dto.query,
      total: dto.total,
      products: dto.products.map((product) => this.mapProduct(product)),
    };
  }

  private static mapProduct(
    product: ApplicationProductSearchResultDto,
  ): ProductSearchResultResponseDto {
    return {
      canonicalProductId: product.canonicalProductId,
      name: product.name,
      category: product.category,
      imageUrl: product.imageUrl,
      priceRange: {
        min: product.priceRange.min,
        max: product.priceRange.max,
        currency: product.priceRange.currency,
      },
      offersSummary: {
        offersCount: product.offersSummary.offersCount,
        bestPrice: product.offersSummary.bestPrice,
        fastestDeliveryDays: product.offersSummary.fastestDeliveryDays,
      },
      badges: {
        isBestPrice: product.badges.isBestPrice,
        isFastestDelivery: product.badges.isFastestDelivery,
        isPopular: product.badges.isPopular,
      },
    };
  }
}
