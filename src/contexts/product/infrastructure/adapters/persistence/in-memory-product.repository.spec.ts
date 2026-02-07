import { InMemoryProductRepository } from './in-memory-product.repository';
import { Product } from '@contexts/product/domain/models/product.entity';
import { ProductId } from '@contexts/product/domain/models/product-id.vo';
import { ProductName } from '@contexts/product/domain/models/product-name.vo';
import { Price } from '@contexts/product/domain/models/price.vo';
import { Source } from '@contexts/product/domain/models/source.vo';

describe('InMemoryProductRepository', () => {
  let repository: InMemoryProductRepository;

  const createTestProduct = (
    id: string,
    name: string,
    price: number,
    source: string,
  ): Product => {
    return new Product(
      new ProductId(id),
      new ProductName(name),
      new Price(price),
      new Source(source),
    );
  };

  beforeEach(() => {
    repository = new InMemoryProductRepository();
  });

  it('should find product by id', async () => {
    const products = await repository.findAll();
    expect(products.length).toBeGreaterThan(0);

    const firstProduct = products[0];
    const found = await repository.findById(firstProduct.id);

    expect(found).not.toBeNull();
    expect(found?.id.value).toBe(firstProduct.id.value);
  });

  it('should return null when product not found', async () => {
    const nonExistentId = new ProductId('non-existent-id');
    const found = await repository.findById(nonExistentId);

    expect(found).toBeNull();
  });

  it('should return empty array when initialized with empty array', async () => {
    const emptyRepository = new (class extends InMemoryProductRepository {
      constructor() {
        super();
        (this as unknown as { products: Product[] }).products = [];
      }
    })();
    const products = await emptyRepository.findAll();
    expect(products).toEqual([]);
  });

  it('should return default products when initialized without parameters', async () => {
    const products = await repository.findAll();
    expect(products.length).toBeGreaterThan(0);
  });

  it('should return all products after initialization', async () => {
    const testProducts = [
      createTestProduct('1', 'Product 1', 100, 'amazon'),
      createTestProduct('2', 'Product 2', 200, 'mercadolibre'),
    ];
    const customRepository = new (class extends InMemoryProductRepository {
      constructor() {
        super();
        (this as unknown as { products: Product[] }).products = testProducts;
      }
    })();

    const products = await customRepository.findAll();
    expect(products).toHaveLength(2);
    expect(products[0].id.value).toBe('1');
    expect(products[1].id.value).toBe('2');
  });

  it('should return products with different sources', async () => {
    const testProducts = [
      createTestProduct('1', 'Laptop', 1000, 'amazon'),
      createTestProduct('2', 'Mouse', 20, 'mercadolibre'),
      createTestProduct('3', 'Keyboard', 50, 'falabella'),
    ];
    const customRepository = new (class extends InMemoryProductRepository {
      constructor() {
        super();
        (this as unknown as { products: Product[] }).products = testProducts;
      }
    })();

    const products = await customRepository.findAll();
    expect(products).toHaveLength(3);
    expect(products.map((p) => p.source.value)).toEqual([
      'amazon',
      'mercadolibre',
      'falabella',
    ]);
  });
});
