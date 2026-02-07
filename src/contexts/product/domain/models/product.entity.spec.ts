import { Product } from './product.entity';
import { ProductId } from './product-id.vo';
import { ProductName } from './product-name.vo';
import { Price } from './price.vo';
import { Source } from './source.vo';

describe('Product', () => {
  const createTestProduct = (overrides?: {
    id?: string;
    name?: string;
    price?: number;
    source?: string;
  }): Product => {
    return new Product(
      new ProductId(overrides?.id ?? 'product-123'),
      new ProductName(overrides?.name ?? 'Test Product'),
      new Price(overrides?.price ?? 100),
      new Source(overrides?.source ?? 'amazon'),
    );
  };

  it('should create product with all fields', () => {
    const product = createTestProduct({
      id: 'product-1',
      name: 'Laptop Dell',
      price: 999.99,
      source: 'amazon',
    });

    expect(product.id.value).toBe('product-1');
    expect(product.name.value).toBe('Laptop Dell');
    expect(product.price.value).toBe(999.99);
    expect(product.source.value).toBe('amazon');
  });

  it('should match text query in name', () => {
    const product = createTestProduct({ name: 'Laptop Dell XPS' });
    expect(product.matchesText('laptop')).toBe(true);
    expect(product.matchesText('Dell')).toBe(true);
    expect(product.matchesText('XPS')).toBe(true);
    expect(product.matchesText('notfound')).toBe(false);
  });

  it('should match text query case-insensitively', () => {
    const product = createTestProduct({ name: 'Laptop Dell' });
    expect(product.matchesText('LAPTOP')).toBe(true);
    expect(product.matchesText('dell')).toBe(true);
  });

  it('should match source', () => {
    const product = createTestProduct({ source: 'amazon' });
    expect(product.matchesSource('amazon')).toBe(true);
    expect(product.matchesSource('mercadolibre')).toBe(false);
  });
});
