import { Product } from './product.entity';
import { ProductId } from './product-id.vo';
import { CanonicalProductId } from './canonical-product-id.vo';

describe('Product', () => {
  it('should create a valid Product', () => {
    const product = new Product(
      new ProductId('prod-1'),
      new CanonicalProductId('apple-macbook-pro-14-m3'),
      'Apple MacBook Pro 14" M3',
      'Laptops',
      'https://cdn.example.com/macbook-pro-m3.jpg',
    );

    expect(product.id.value).toBe('prod-1');
    expect(product.canonicalProductId.value).toBe('apple-macbook-pro-14-m3');
    expect(product.name).toBe('Apple MacBook Pro 14" M3');
    expect(product.category).toBe('Laptops');
    expect(product.imageUrl).toBe('https://cdn.example.com/macbook-pro-m3.jpg');
  });

  it('should throw error when name is empty', () => {
    expect(() => {
      new Product(
        new ProductId('prod-1'),
        new CanonicalProductId('canonical-1'),
        '',
        'Category',
        'https://example.com/image.jpg',
      );
    }).toThrow('Product name cannot be empty');
  });

  it('should throw error when category is empty', () => {
    expect(() => {
      new Product(
        new ProductId('prod-1'),
        new CanonicalProductId('canonical-1'),
        'Product Name',
        '',
        'https://example.com/image.jpg',
      );
    }).toThrow('Product category cannot be empty');
  });
});
