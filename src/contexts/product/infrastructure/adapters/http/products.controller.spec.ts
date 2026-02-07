import { Test, TestingModule } from '@nestjs/testing';
import { ProductsController } from './products.controller';
import { SearchProductsUseCase } from '@contexts/product/application/ports/input/search-products-use-case';
import { GetProductByIdUseCase } from '@contexts/product/application/ports/input/get-product-by-id-use-case';
import { GetRecentSearchesUseCase } from '@contexts/product/application/ports/input/get-recent-searches-use-case';
import { SearchProductsResponseDto as ApplicationResponseDto } from '@contexts/product/application/dto/search-products-response.dto';
import { Product } from '@contexts/product/domain/models/product.entity';
import { ProductId } from '@contexts/product/domain/models/product-id.vo';
import { ProductName } from '@contexts/product/domain/models/product-name.vo';
import { Price } from '@contexts/product/domain/models/price.vo';
import { Source } from '@contexts/product/domain/models/source.vo';
import { ProductNotFoundError } from '@contexts/product/domain/exceptions/product-not-found.error';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';

describe('ProductsController', () => {
  let controller: ProductsController;
  let mockSearchUseCase: jest.Mocked<SearchProductsUseCase>;
  let mockGetByIdUseCase: jest.Mocked<GetProductByIdUseCase>;
  let mockGetRecentSearchesUseCase: jest.Mocked<GetRecentSearchesUseCase>;

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

  beforeEach(async () => {
    mockSearchUseCase = {
      execute: jest.fn(),
    };
    mockGetByIdUseCase = {
      execute: jest.fn(),
    };
    mockGetRecentSearchesUseCase = {
      execute: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProductsController],
      providers: [
        {
          provide: 'SearchProductsUseCase',
          useValue: mockSearchUseCase,
        },
        {
          provide: 'GetProductByIdUseCase',
          useValue: mockGetByIdUseCase,
        },
        {
          provide: 'GetRecentSearchesUseCase',
          useValue: mockGetRecentSearchesUseCase,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<ProductsController>(ProductsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should search products with query params', async () => {
    const products = [createTestProduct('1', 'Laptop', 1000, 'amazon')];
    const response = new ApplicationResponseDto(products, 1, 1, 20, 1);
    mockSearchUseCase.execute.mockResolvedValue(response);

    const result = await controller.search(
      {
        q: 'laptop',
        page: 1,
        limit: 20,
      },
      undefined,
    );

    expect(result.products).toHaveLength(1);
    expect(result.products[0].id).toBe('1');
    expect(result.products[0].name).toBe('Laptop');
    expect(result.products[0].price).toBe(1000);
    expect(result.products[0].source).toBe('amazon');
    expect(result.total).toBe(1);
    expect(result.page).toBe(1);
    expect(result.limit).toBe(20);
    expect(result.totalPages).toBe(1);
  });

  it('should map domain products to response DTOs', async () => {
    const products = [
      createTestProduct('1', 'Product 1', 100, 'amazon'),
      createTestProduct('2', 'Product 2', 200, 'mercadolibre'),
    ];
    const response = new ApplicationResponseDto(products, 2, 1, 20, 1);
    mockSearchUseCase.execute.mockResolvedValue(response);

    const result = await controller.search({}, undefined);

    expect(result.products).toHaveLength(2);
    expect(result.products[0]).toEqual({
      id: '1',
      name: 'Product 1',
      price: 100,
      source: 'amazon',
    });
    expect(result.products[1]).toEqual({
      id: '2',
      name: 'Product 2',
      price: 200,
      source: 'mercadolibre',
    });
  });

  describe('getById', () => {
    it('should return product by id', async () => {
      const product = createTestProduct('1', 'Laptop', 1000, 'amazon');
      mockGetByIdUseCase.execute.mockResolvedValue(product);

      const result = await controller.getById('1');

      expect(result).toEqual({
        id: '1',
        name: 'Laptop',
        price: 1000,
        source: 'amazon',
      });
      expect(mockGetByIdUseCase.execute).toHaveBeenCalledWith('1');
    });

    it('should propagate ProductNotFoundError when product not found', async () => {
      mockGetByIdUseCase.execute.mockRejectedValue(
        new ProductNotFoundError('999'),
      );

      await expect(controller.getById('999')).rejects.toThrow(
        ProductNotFoundError,
      );
      expect(mockGetByIdUseCase.execute).toHaveBeenCalledWith('999');
    });
  });

  describe('getRecentSearches', () => {
    it('should return global searches when no userId provided', async () => {
      const globalSearches = ['laptop', 'mouse'];
      mockGetRecentSearchesUseCase.execute.mockResolvedValue(globalSearches);

      const result = await controller.getRecentSearches(undefined);

      expect(result.searches).toEqual(globalSearches);
      expect(mockGetRecentSearchesUseCase.execute).toHaveBeenCalledWith(null);
    });

    it('should return searches when userId provided', async () => {
      const userId = 'user-123';
      const searches = ['laptop', 'mouse', 'keyboard'];
      mockGetRecentSearchesUseCase.execute.mockResolvedValue(searches);

      const result = await controller.getRecentSearches(userId);

      expect(result.searches).toEqual(searches);
      expect(mockGetRecentSearchesUseCase.execute).toHaveBeenCalledWith(userId);
    });
  });
});
