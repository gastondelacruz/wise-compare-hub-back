import { Rating } from './rating.vo';

describe('Rating', () => {
  it('should create a valid Rating', () => {
    const rating = new Rating(4.5);
    expect(rating.value).toBe(4.5);
  });

  it('should throw error when value is less than 0', () => {
    expect(() => new Rating(-0.1)).toThrow('Rating must be between 0 and 5');
  });

  it('should throw error when value is greater than 5', () => {
    expect(() => new Rating(5.1)).toThrow('Rating must be between 0 and 5');
  });

  it('should allow minimum rating (0)', () => {
    const rating = new Rating(0);
    expect(rating.value).toBe(0);
  });

  it('should allow maximum rating (5)', () => {
    const rating = new Rating(5);
    expect(rating.value).toBe(5);
  });
});
