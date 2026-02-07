export class VendorDto {
  constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly isOfficial: boolean,
  ) {}
}

export class PricingDto {
  constructor(
    public readonly basePrice: number,
    public readonly shipping: number,
    public readonly total: number,
    public readonly currency: string,
  ) {}
}

export class DeliveryDto {
  constructor(public readonly days: number) {}
}

export class RatingDto {
  constructor(public readonly score: number) {}
}

export class FlagsDto {
  constructor(
    public readonly isBestPrice: boolean,
    public readonly isFastestDelivery: boolean,
  ) {}
}

export class CtaDto {
  constructor(
    public readonly url: string,
    public readonly label: string,
  ) {}
}

export class OfferDto {
  constructor(
    public readonly offerId: string,
    public readonly vendor: VendorDto,
    public readonly pricing: PricingDto,
    public readonly delivery: DeliveryDto,
    public readonly rating: RatingDto | undefined,
    public readonly flags: FlagsDto,
    public readonly cta: CtaDto,
  ) {}
}

export class SummaryDto {
  constructor(
    public readonly offersCount: number,
    public readonly bestPrice: number,
    public readonly fastestDeliveryDays: number,
  ) {}
}

export class GetProductOffersResponseDto {
  constructor(
    public readonly canonicalProductId: string,
    public readonly name: string,
    public readonly imageUrl: string,
    public readonly summary: SummaryDto,
    public readonly offers: OfferDto[],
  ) {}
}
