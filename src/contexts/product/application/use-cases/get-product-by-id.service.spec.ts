import { GetProductByIdService } from './get-product-by-id.service';
import { ProductRepository } from '../ports/output/product.repository';
import { Product } from '@contexts/product/domain/models/product.entity';
import { ProductId } from '@contexts/product/domain/models/product-id.vo';
import { ProductName } from '@contexts/product/domain/models/product-name.vo';
import { Price } from '@contexts/product/domain/models/price.vo';
import { Source } from '@contexts/product/domain/models/source.vo';
import { ProductNotFoundError } from '@contexts/product/domain/exceptions/product-not-found.error';

describe('GetProductByIdService', () => {
  let service: GetProductByIdService;
  let mockRepository: jest.Mocked<ProductRepository>;

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
      findById: jest.fn(),
    };
    service = new GetProductByIdService(mockRepository);
  });

  it('should return product when found', async () => {
    const product = createTestProduct('1', 'Laptop', 1000, 'amazon');
    mockRepository.findById.mockResolvedValue(product);

    const result = await service.execute('1');

    expect(result).toEqual(product);
    expect(result.id.value).toBe('1');
    expect(mockRepository.findById).toHaveBeenCalledWith(
      expect.objectContaining({ value: '1' }),
    );
  });

  it('should throw ProductNotFoundError when product not found', async () => {
    mockRepository.findById.mockResolvedValue(null);

    await expect(service.execute('999')).rejects.toThrow(ProductNotFoundError);
    expect(mockRepository.findById).toHaveBeenCalledWith(
      expect.objectContaining({ value: '999' }),
    );
  });
});
