import { Product } from '@contexts/product/domain/models/product.entity';
import { ProductId } from '@contexts/product/domain/models/product-id.vo';
import { CanonicalProductId } from '@contexts/product/domain/models/canonical-product-id.vo';

export interface ProductRepository {
  findAll(): Promise<Product[]>;
  findById(id: ProductId): Promise<Product | null>;
  findByCanonicalProductId(
    canonicalProductId: CanonicalProductId,
  ): Promise<Product[]>;
  findBySearchTerm(searchTerm: string): Promise<Product[]>;
  save(product: Product): Promise<void>;
}
