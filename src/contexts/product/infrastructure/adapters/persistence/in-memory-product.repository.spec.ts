import { InMemoryProductRepository } from './in-memory-product.repository';
import { Product } from '@contexts/product/domain/models/product.entity';
import { ProductId } from '@contexts/product/domain/models/product-id.vo';
import { CanonicalProductId } from '@contexts/product/domain/models/canonical-product-id.vo';

describe('InMemoryProductRepository', () => {
  let repository: InMemoryProductRepository;

  const createProduct = (
    id: string,
    canonicalId: string,
    name: string,
  ): Product => {
    return new Product(
      new ProductId(id),
      new CanonicalProductId(canonicalId),
      name,
      'Laptops',
      'https://example.com/image.jpg',
    );
  };

  beforeEach(() => {
    repository = new InMemoryProductRepository();
  });

  it('should return all products', async () => {
    const products = await repository.findAll();
    expect(Array.isArray(products)).toBe(true);
  });

  it('should find product by id', async () => {
    const product = createProduct('prod-1', 'canonical-1', 'Product 1');
    await repository.save(product);

    const found = await repository.findById(new ProductId('prod-1'));
    expect(found).not.toBeNull();
    expect(found?.id.value).toBe('prod-1');
  });

  it('should return null when product not found by id', async () => {
    const found = await repository.findById(new ProductId('nonexistent'));
    expect(found).toBeNull();
  });

  it('should find products by canonicalProductId', async () => {
    const product1 = createProduct('prod-1', 'canonical-1', 'Product 1');
    const product2 = createProduct(
      'prod-2',
      'canonical-1',
      'Product 1 Variant',
    );
    await repository.save(product1);
    await repository.save(product2);

    const found = await repository.findByCanonicalProductId(
      new CanonicalProductId('canonical-1'),
    );
    expect(found).toHaveLength(2);
  });

  it('should find products by search term', async () => {
    const product1 = createProduct('prod-1', 'canonical-1', 'MacBook Pro');
    const product2 = createProduct('prod-2', 'canonical-2', 'iPhone 15');
    await repository.save(product1);
    await repository.save(product2);

    const found = await repository.findBySearchTerm('macbook');
    expect(found).toHaveLength(1);
    expect(found[0].name.toLowerCase()).toContain('macbook');
  });

  it('should be case insensitive when searching', async () => {
    const product = createProduct(
      'prod-test',
      'canonical-test',
      'MacBook Pro Test',
    );
    await repository.save(product);

    const found = await repository.findBySearchTerm('MACBOOK');
    expect(found.length).toBeGreaterThanOrEqual(1);
    expect(found.some((p) => p.name.includes('MacBook'))).toBe(true);
  });

  it('should return empty array when no products match search term', async () => {
    const found = await repository.findBySearchTerm('nonexistent');
    expect(found).toHaveLength(0);
  });
});
