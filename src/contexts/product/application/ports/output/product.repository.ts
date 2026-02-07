import { Product } from '@contexts/product/domain/models/product.entity';

export interface ProductRepository {
  findAll(): Promise<Product[]>;
}
