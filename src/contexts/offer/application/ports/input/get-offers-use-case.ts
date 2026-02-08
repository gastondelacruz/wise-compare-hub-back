import { GetProductOffersResponseDto } from '@contexts/product/application/dto/get-product-offers-response.dto';

/**
 * Use case for getting offers for a product.
 * Queries existing offers and automatically requests fetch if none are found.
 */
export interface GetOffersUseCase {
  execute(
    canonicalProductId: string,
    sort?: string,
    vendors?: string[],
    preferences?: boolean,
    userId?: string,
  ): Promise<GetProductOffersResponseDto>;
}
