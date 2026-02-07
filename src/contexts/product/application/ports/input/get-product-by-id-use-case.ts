import { Product } from '@contexts/product/domain/models/product.entity';

export interface GetProductByIdUseCase {
  execute(productId: string): Promise<Product>;
}
