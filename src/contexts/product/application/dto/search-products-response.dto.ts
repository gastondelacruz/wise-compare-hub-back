import { Product } from '@contexts/product/domain/models/product.entity';

export class SearchProductsResponseDto {
  constructor(
    public readonly products: Product[],
    public readonly total: number,
    public readonly page: number,
    public readonly limit: number,
    public readonly totalPages: number,
  ) {}
}
