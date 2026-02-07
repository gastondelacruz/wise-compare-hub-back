import { Price } from './price.vo';

describe('Price', () => {
  it('should create a valid Price', () => {
    const price = new Price(100, 10);
    expect(price.basePrice).toBe(100);
    expect(price.shipping).toBe(10);
    expect(price.total).toBe(110);
  });

  it('should calculate total correctly', () => {
    const price = new Price(1899, 0);
    expect(price.total).toBe(1899);
  });

  it('should throw error when basePrice is negative', () => {
    expect(() => new Price(-1, 0)).toThrow(
      'Base price must be greater than or equal to 0',
    );
  });

  it('should throw error when shipping is negative', () => {
    expect(() => new Price(100, -1)).toThrow(
      'Shipping must be greater than or equal to 0',
    );
  });

  it('should allow zero basePrice', () => {
    const price = new Price(0, 10);
    expect(price.total).toBe(10);
  });

  it('should allow zero shipping', () => {
    const price = new Price(100, 0);
    expect(price.total).toBe(100);
  });
});
