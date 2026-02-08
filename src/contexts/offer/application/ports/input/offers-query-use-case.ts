import { GetProductOffersResponseDto } from '@contexts/product/application/dto/get-product-offers-response.dto';

export interface OffersQueryUseCase {
  execute(
    canonicalProductId: string,
    sort?: string,
    vendors?: string[],
    preferences?: boolean,
    userId?: string,
  ): Promise<GetProductOffersResponseDto>;
}
