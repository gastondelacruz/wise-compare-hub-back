import { ProductName } from './product-name.vo';

describe('ProductName', () => {
  it('should create ProductName with valid value', () => {
    const name = new ProductName('Laptop Dell');
    expect(name.value).toBe('Laptop Dell');
  });

  it('should throw error when value is empty', () => {
    expect(() => new ProductName('')).toThrow('ProductName cannot be empty');
  });

  it('should throw error when value is only whitespace', () => {
    expect(() => new ProductName('   ')).toThrow('ProductName cannot be empty');
  });
});
