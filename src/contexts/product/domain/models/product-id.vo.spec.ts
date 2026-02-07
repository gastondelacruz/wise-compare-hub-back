import { ProductId } from './product-id.vo';

describe('ProductId', () => {
  it('should create ProductId with valid value', () => {
    const id = new ProductId('product-123');
    expect(id.value).toBe('product-123');
  });

  it('should throw error when value is empty', () => {
    expect(() => new ProductId('')).toThrow('ProductId cannot be empty');
  });

  it('should throw error when value is only whitespace', () => {
    expect(() => new ProductId('   ')).toThrow('ProductId cannot be empty');
  });
});
