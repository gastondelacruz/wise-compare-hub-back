import { CanonicalProductId } from './canonical-product-id.vo';

describe('CanonicalProductId', () => {
  it('should create a valid CanonicalProductId', () => {
    const canonicalId = new CanonicalProductId('apple-macbook-pro-14-m3');
    expect(canonicalId.value).toBe('apple-macbook-pro-14-m3');
  });

  it('should throw error when value is empty', () => {
    expect(() => new CanonicalProductId('')).toThrow(
      'CanonicalProductId cannot be empty',
    );
  });

  it('should throw error when value is whitespace only', () => {
    expect(() => new CanonicalProductId('   ')).toThrow(
      'CanonicalProductId cannot be empty',
    );
  });
});
