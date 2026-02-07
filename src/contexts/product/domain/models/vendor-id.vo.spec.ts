import { VendorId } from './vendor-id.vo';

describe('VendorId', () => {
  it('should create a valid VendorId', () => {
    const vendorId = new VendorId('amazon');
    expect(vendorId.value).toBe('amazon');
  });

  it('should throw error when value is empty', () => {
    expect(() => new VendorId('')).toThrow('VendorId cannot be empty');
  });

  it('should throw error when value is whitespace only', () => {
    expect(() => new VendorId('   ')).toThrow('VendorId cannot be empty');
  });
});
