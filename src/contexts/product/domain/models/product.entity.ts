import { ProductId } from './product-id.vo';
import { CanonicalProductId } from './canonical-product-id.vo';

export class Product {
  constructor(
    public readonly id: ProductId,
    public readonly canonicalProductId: CanonicalProductId,
    public readonly name: string,
    public readonly category: string,
    public readonly imageUrl: string,
  ) {
    if (!name || name.trim().length === 0) {
      throw new Error('Product name cannot be empty');
    }
    if (!category || category.trim().length === 0) {
      throw new Error('Product category cannot be empty');
    }
  }
}
