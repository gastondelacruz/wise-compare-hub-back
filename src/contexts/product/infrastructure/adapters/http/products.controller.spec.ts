import { Test, TestingModule } from '@nestjs/testing';
import { ProductsController } from './products.controller';
import { SearchProductsUseCase } from '@contexts/product/application/ports/input/search-products-use-case';
import { GetProductByIdUseCase } from '@contexts/product/application/ports/input/get-product-by-id-use-case';
import { SearchProductsResponseDto as ApplicationResponseDto } from '@contexts/product/application/dto/search-products-response.dto';
import { Product } from '@contexts/product/domain/models/product.entity';
import { ProductId } from '@contexts/product/domain/models/product-id.vo';
import { ProductName } from '@contexts/product/domain/models/product-name.vo';
import { Price } from '@contexts/product/domain/models/price.vo';
import { Source } from '@contexts/product/domain/models/source.vo';
import { NotFoundException } from '@nestjs/common';

describe('ProductsController', () => {
  let controller: ProductsController;
  let mockSearchUseCase: jest.Mocked<SearchProductsUseCase>;
  let mockGetByIdUseCase: jest.Mocked<GetProductByIdUseCase>;

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
      ],
    }).compile();

    controller = module.get<ProductsController>(ProductsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should search products with query params', async () => {
    const products = [createTestProduct('1', 'Laptop', 1000, 'amazon')];
    const response = new ApplicationResponseDto(products, 1, 1, 20, 1);
    mockSearchUseCase.execute.mockResolvedValue(response);

    const result = await controller.search({
      q: 'laptop',
      page: 1,
      limit: 20,
    });

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

    const result = await controller.search({});

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

    it('should throw NotFoundException when product not found', async () => {
      mockGetByIdUseCase.execute.mockRejectedValue(
        new NotFoundException('Product not found'),
      );

      await expect(controller.getById('999')).rejects.toThrow(
        NotFoundException,
      );
      expect(mockGetByIdUseCase.execute).toHaveBeenCalledWith('999');
    });
  });
});
