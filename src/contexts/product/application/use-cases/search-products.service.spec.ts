import { SearchProductsService } from './search-products.service';
import { ProductRepository } from '../ports/output/product.repository';
import { RecentSearchRepository } from '../ports/output/recent-search.repository';
import { SearchProductsQuery } from '../dto/search-products-query';
import { Product } from '@contexts/product/domain/models/product.entity';
import { ProductId } from '@contexts/product/domain/models/product-id.vo';
import { ProductName } from '@contexts/product/domain/models/product-name.vo';
import { Price } from '@contexts/product/domain/models/price.vo';
import { Source } from '@contexts/product/domain/models/source.vo';

describe('SearchProductsService', () => {
  let service: SearchProductsService;
  let mockRepository: jest.Mocked<ProductRepository>;
  let mockRecentSearchRepository: jest.Mocked<RecentSearchRepository>;

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
    mockRepository = {
      findAll: jest.fn(),
    };
    mockRecentSearchRepository = {
      findByUserId: jest.fn(),
      findGlobal: jest.fn(),
      save: jest.fn(),
      saveGlobal: jest.fn(),
    };
    service = new SearchProductsService(
      mockRepository,
      mockRecentSearchRepository,
    );
  });

  it('should return all products when no filters applied', async () => {
    const products = [
      createTestProduct('1', 'Laptop', 1000, 'amazon'),
      createTestProduct('2', 'Mouse', 20, 'mercadolibre'),
    ];
    mockRepository.findAll.mockResolvedValue(products);

    const query = new SearchProductsQuery();
    const result = await service.execute(query);

    expect(result.products).toHaveLength(2);
    expect(result.total).toBe(2);
    expect(result.page).toBe(1);
    expect(result.limit).toBe(20);
  });

  it('should filter by text query', async () => {
    const products = [
      createTestProduct('1', 'Laptop Dell', 1000, 'amazon'),
      createTestProduct('2', 'Mouse Logitech', 20, 'amazon'),
      createTestProduct('3', 'Laptop HP', 800, 'mercadolibre'),
    ];
    mockRepository.findAll.mockResolvedValue(products);

    const query = new SearchProductsQuery('laptop');
    const result = await service.execute(query);

    expect(result.products).toHaveLength(2);
    expect(result.products[0].name.value).toBe('Laptop Dell');
    expect(result.products[1].name.value).toBe('Laptop HP');
  });

  it('should filter by minPrice', async () => {
    const products = [
      createTestProduct('1', 'Product 1', 100, 'amazon'),
      createTestProduct('2', 'Product 2', 200, 'amazon'),
      createTestProduct('3', 'Product 3', 50, 'amazon'),
    ];
    mockRepository.findAll.mockResolvedValue(products);

    const query = new SearchProductsQuery(undefined, 100);
    const result = await service.execute(query);

    expect(result.products).toHaveLength(2);
    expect(result.products.every((p) => p.price.value >= 100)).toBe(true);
  });

  it('should filter by maxPrice', async () => {
    const products = [
      createTestProduct('1', 'Product 1', 100, 'amazon'),
      createTestProduct('2', 'Product 2', 200, 'amazon'),
      createTestProduct('3', 'Product 3', 300, 'amazon'),
    ];
    mockRepository.findAll.mockResolvedValue(products);

    const query = new SearchProductsQuery(undefined, undefined, 200);
    const result = await service.execute(query);

    expect(result.products).toHaveLength(2);
    expect(result.products.every((p) => p.price.value <= 200)).toBe(true);
  });

  it('should filter by price range', async () => {
    const products = [
      createTestProduct('1', 'Product 1', 100, 'amazon'),
      createTestProduct('2', 'Product 2', 200, 'amazon'),
      createTestProduct('3', 'Product 3', 300, 'amazon'),
      createTestProduct('4', 'Product 4', 150, 'amazon'),
    ];
    mockRepository.findAll.mockResolvedValue(products);

    const query = new SearchProductsQuery(undefined, 100, 200);
    const result = await service.execute(query);

    expect(result.products).toHaveLength(3);
    expect(
      result.products.every(
        (p) => p.price.value >= 100 && p.price.value <= 200,
      ),
    ).toBe(true);
  });

  it('should filter by sources', async () => {
    const products = [
      createTestProduct('1', 'Product 1', 100, 'amazon'),
      createTestProduct('2', 'Product 2', 200, 'mercadolibre'),
      createTestProduct('3', 'Product 3', 300, 'amazon'),
    ];
    mockRepository.findAll.mockResolvedValue(products);

    const query = new SearchProductsQuery(undefined, undefined, undefined, [
      'amazon',
    ]);
    const result = await service.execute(query);

    expect(result.products).toHaveLength(2);
    expect(result.products.every((p) => p.source.value === 'amazon')).toBe(
      true,
    );
  });

  it('should filter by multiple sources', async () => {
    const products = [
      createTestProduct('1', 'Product 1', 100, 'amazon'),
      createTestProduct('2', 'Product 2', 200, 'mercadolibre'),
      createTestProduct('3', 'Product 3', 300, 'falabella'),
    ];
    mockRepository.findAll.mockResolvedValue(products);

    const query = new SearchProductsQuery(undefined, undefined, undefined, [
      'amazon',
      'mercadolibre',
    ]);
    const result = await service.execute(query);

    expect(result.products).toHaveLength(2);
    expect(
      ['amazon', 'mercadolibre'].includes(result.products[0].source.value),
    ).toBe(true);
    expect(
      ['amazon', 'mercadolibre'].includes(result.products[1].source.value),
    ).toBe(true);
  });

  it('should sort by price-low', async () => {
    const products = [
      createTestProduct('1', 'Product 1', 300, 'amazon'),
      createTestProduct('2', 'Product 2', 100, 'amazon'),
      createTestProduct('3', 'Product 3', 200, 'amazon'),
    ];
    mockRepository.findAll.mockResolvedValue(products);

    const query = new SearchProductsQuery(
      undefined,
      undefined,
      undefined,
      undefined,
      'price-low',
    );
    const result = await service.execute(query);

    expect(result.products[0].price.value).toBe(100);
    expect(result.products[1].price.value).toBe(200);
    expect(result.products[2].price.value).toBe(300);
  });

  it('should sort by price-high', async () => {
    const products = [
      createTestProduct('1', 'Product 1', 100, 'amazon'),
      createTestProduct('2', 'Product 2', 300, 'amazon'),
      createTestProduct('3', 'Product 3', 200, 'amazon'),
    ];
    mockRepository.findAll.mockResolvedValue(products);

    const query = new SearchProductsQuery(
      undefined,
      undefined,
      undefined,
      undefined,
      'price-high',
    );
    const result = await service.execute(query);

    expect(result.products[0].price.value).toBe(300);
    expect(result.products[1].price.value).toBe(200);
    expect(result.products[2].price.value).toBe(100);
  });

  it('should paginate results', async () => {
    const products = Array.from({ length: 25 }, (_, i) =>
      createTestProduct(`id-${i}`, `Product ${i}`, 100 + i, 'amazon'),
    );
    mockRepository.findAll.mockResolvedValue(products);

    const query = new SearchProductsQuery(
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      1,
      10,
    );
    const result = await service.execute(query);

    expect(result.products).toHaveLength(10);
    expect(result.total).toBe(25);
    expect(result.page).toBe(1);
    expect(result.limit).toBe(10);
    expect(result.totalPages).toBe(3);
  });

  it('should paginate to second page', async () => {
    const products = Array.from({ length: 25 }, (_, i) =>
      createTestProduct(`id-${i}`, `Product ${i}`, 100 + i, 'amazon'),
    );
    mockRepository.findAll.mockResolvedValue(products);

    const query = new SearchProductsQuery(
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      2,
      10,
    );
    const result = await service.execute(query);

    expect(result.products).toHaveLength(10);
    expect(result.page).toBe(2);
    expect(result.totalPages).toBe(3);
  });

  it('should combine all filters', async () => {
    const products = [
      createTestProduct('1', 'Laptop Dell', 1000, 'amazon'),
      createTestProduct('2', 'Laptop HP', 800, 'amazon'),
      createTestProduct('3', 'Mouse', 20, 'amazon'),
      createTestProduct('4', 'Laptop Lenovo', 1200, 'mercadolibre'),
    ];
    mockRepository.findAll.mockResolvedValue(products);

    const query = new SearchProductsQuery(
      'laptop',
      800,
      1100,
      ['amazon'],
      'price-low',
      1,
      20,
    );
    const result = await service.execute(query);

    expect(result.products).toHaveLength(2);
    expect(result.products[0].name.value).toBe('Laptop HP');
    expect(result.products[1].name.value).toBe('Laptop Dell');
  });
});
