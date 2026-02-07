import { GetProductOffersResponseDto } from '../../dto/get-product-offers-response.dto';

export interface GetProductOffersUseCase {
  execute(
    canonicalProductId: string,
    sort?: string,
    vendors?: string[],
    preferences?: boolean,
    userId?: string,
  ): Promise<GetProductOffersResponseDto>;
}
