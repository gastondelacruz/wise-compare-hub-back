import { Price } from './price.vo';

describe('Price', () => {
  it('should create Price with valid value', () => {
    const price = new Price(100.5);
    expect(price.value).toBe(100.5);
  });

  it('should throw error when value is negative', () => {
    expect(() => new Price(-10)).toThrow('Price cannot be negative');
  });

  it('should allow zero price', () => {
    const price = new Price(0);
    expect(price.value).toBe(0);
  });
});
