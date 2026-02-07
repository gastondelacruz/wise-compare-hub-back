import { ProductId } from './product-id.vo';
import { ProductName } from './product-name.vo';
import { Price } from './price.vo';
import { Source } from './source.vo';

export class Product {
  constructor(
    public readonly id: ProductId,
    public readonly name: ProductName,
    public readonly price: Price,
    public readonly source: Source,
  ) {}

  matchesText(query: string): boolean {
    if (!query || query.trim().length === 0) {
      return true;
    }
    return this.name.value.toLowerCase().includes(query.toLowerCase());
  }

  matchesSource(sourceValue: string): boolean {
    return this.source.value === sourceValue;
  }
}
