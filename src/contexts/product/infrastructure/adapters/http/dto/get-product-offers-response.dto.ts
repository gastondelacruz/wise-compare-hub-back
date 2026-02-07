import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  GetProductOffersResponseDto as ApplicationGetProductOffersResponseDto,
  OfferDto as ApplicationOfferDto,
} from '@contexts/product/application/dto/get-product-offers-response.dto';

export class VendorResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  isOfficial: boolean;
}

export class PricingResponseDto {
  @ApiProperty()
  basePrice: number;

  @ApiProperty()
  shipping: number;

  @ApiProperty()
  total: number;

  @ApiProperty()
  currency: string;
}

export class DeliveryResponseDto {
  @ApiProperty()
  days: number;
}

export class RatingResponseDto {
  @ApiProperty()
  score: number;
}

export class FlagsResponseDto {
  @ApiProperty()
  isBestPrice: boolean;

  @ApiProperty()
  isFastestDelivery: boolean;
}

export class CtaResponseDto {
  @ApiProperty()
  url: string;

  @ApiProperty()
  label: string;
}

export class OfferResponseDto {
  @ApiProperty()
  offerId: string;

  @ApiProperty({ type: VendorResponseDto })
  vendor: VendorResponseDto;

  @ApiProperty({ type: PricingResponseDto })
  pricing: PricingResponseDto;

  @ApiProperty({ type: DeliveryResponseDto })
  delivery: DeliveryResponseDto;

  @ApiPropertyOptional({ type: RatingResponseDto })
  rating?: RatingResponseDto;

  @ApiProperty({ type: FlagsResponseDto })
  flags: FlagsResponseDto;

  @ApiProperty({ type: CtaResponseDto })
  cta: CtaResponseDto;
}

export class SummaryResponseDto {
  @ApiProperty()
  offersCount: number;

  @ApiProperty()
  bestPrice: number;

  @ApiProperty()
  fastestDeliveryDays: number;
}

export class GetProductOffersResponseDto {
  @ApiProperty()
  canonicalProductId: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  imageUrl: string;

  @ApiProperty({ type: SummaryResponseDto })
  summary: SummaryResponseDto;

  @ApiProperty({ type: [OfferResponseDto] })
  offers: OfferResponseDto[];

  static fromApplication(
    dto: ApplicationGetProductOffersResponseDto,
  ): GetProductOffersResponseDto {
    return {
      canonicalProductId: dto.canonicalProductId,
      name: dto.name,
      imageUrl: dto.imageUrl,
      summary: {
        offersCount: dto.summary.offersCount,
        bestPrice: dto.summary.bestPrice,
        fastestDeliveryDays: dto.summary.fastestDeliveryDays,
      },
      offers: dto.offers.map((offer) => this.mapOffer(offer)),
    };
  }

  private static mapOffer(offer: ApplicationOfferDto): OfferResponseDto {
    return {
      offerId: offer.offerId,
      vendor: {
        id: offer.vendor.id,
        name: offer.vendor.name,
        isOfficial: offer.vendor.isOfficial,
      },
      pricing: {
        basePrice: offer.pricing.basePrice,
        shipping: offer.pricing.shipping,
        total: offer.pricing.total,
        currency: offer.pricing.currency,
      },
      delivery: {
        days: offer.delivery.days,
      },
      rating: offer.rating
        ? {
            score: offer.rating.score,
          }
        : undefined,
      flags: {
        isBestPrice: offer.flags.isBestPrice,
        isFastestDelivery: offer.flags.isFastestDelivery,
      },
      cta: {
        url: offer.cta.url,
        label: offer.cta.label,
      },
    };
  }
}
