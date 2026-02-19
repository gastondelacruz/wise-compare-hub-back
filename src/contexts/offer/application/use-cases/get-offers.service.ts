import { Injectable, Inject } from '@nestjs/common';
import { GetOffersUseCase } from '../ports/input/get-offers-use-case';
import { OffersQueryUseCase } from '../ports/input/offers-query-use-case';
import { RequestOffersFetchUseCase } from '../ports/input/request-offers-fetch-use-case';
import { GetProductOffersResponseDto } from '@contexts/product/application/dto/get-product-offers-response.dto';

/**
 * Service responsible for getting offers for a product.
 * Queries existing offers and automatically requests fetch if none are found.
 */
@Injectable()
export class GetOffersService implements GetOffersUseCase {
  constructor(
    @Inject('OffersQueryUseCase')
    private readonly offersQueryUseCase: OffersQueryUseCase,
    @Inject('RequestOffersFetchUseCase')
    private readonly requestOffersFetchUseCase: RequestOffersFetchUseCase,
  ) {}

  async execute(
    canonicalProductId: string,
    sort?: string,
    vendors?: string[],
    preferences?: boolean,
    userId?: string,
  ): Promise<GetProductOffersResponseDto> {
    const result = await this.offersQueryUseCase.execute(
      canonicalProductId,
      sort,
      vendors,
      preferences,
      userId,
    );

    // If no offers found, trigger scraper in background (fire-and-forget)
    if (result.offers.length === 0) {
      // Don't await - let scraper run in background
      void this.requestOffersFetchUseCase.execute(canonicalProductId);
    }

    return result;
  }
}
