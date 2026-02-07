import { Product } from '@contexts/product/domain/models/product.entity';
import { ProductId } from '@contexts/product/domain/models/product-id.vo';

export interface ProductRepository {
  findAll(): Promise<Product[]>;
  findById(id: ProductId): Promise<Product | null>;
}
