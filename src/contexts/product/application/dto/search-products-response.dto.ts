export class PriceRangeDto {
  constructor(
    public readonly min: number,
    public readonly max: number,
    public readonly currency: string,
  ) {}
}

export class OffersSummaryDto {
  constructor(
    public readonly offersCount: number,
    public readonly bestPrice: number,
    public readonly fastestDeliveryDays: number,
  ) {}
}

export class BadgesDto {
  constructor(
    public readonly isBestPrice: boolean,
    public readonly isFastestDelivery: boolean,
    public readonly isPopular: boolean,
  ) {}
}

export class ProductSearchResultDto {
  constructor(
    public readonly canonicalProductId: string,
    public readonly name: string,
    public readonly category: string,
    public readonly imageUrl: string,
    public readonly priceRange: PriceRangeDto,
    public readonly offersSummary: OffersSummaryDto,
    public readonly badges: BadgesDto,
  ) {}
}

export class SearchProductsResponseDto {
  constructor(
    public readonly query: string | undefined,
    public readonly total: number,
    public readonly products: ProductSearchResultDto[],
  ) {}
}
