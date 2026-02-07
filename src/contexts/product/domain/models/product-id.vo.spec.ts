import { ProductId } from './product-id.vo';

describe('ProductId', () => {
  it('should create a valid ProductId', () => {
    const productId = new ProductId('prod-123');
    expect(productId.value).toBe('prod-123');
  });

  it('should throw error when value is empty', () => {
    expect(() => new ProductId('')).toThrow('ProductId cannot be empty');
  });

  it('should throw error when value is whitespace only', () => {
    expect(() => new ProductId('   ')).toThrow('ProductId cannot be empty');
  });
});
