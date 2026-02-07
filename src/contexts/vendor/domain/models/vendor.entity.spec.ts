import { Vendor } from './vendor.entity';
import { VendorId } from './vendor-id.vo';

describe('Vendor', () => {
  it('should create a valid Vendor', () => {
    const vendor = new Vendor(
      new VendorId('amazon'),
      'Amazon',
      true,
      'https://cdn.wisecompare.com/vendors/amazon.svg',
      true,
    );

    expect(vendor.id.value).toBe('amazon');
    expect(vendor.name).toBe('Amazon');
    expect(vendor.isOfficial).toBe(true);
    expect(vendor.logoUrl).toBe(
      'https://cdn.wisecompare.com/vendors/amazon.svg',
    );
    expect(vendor.enabled).toBe(true);
  });

  it('should create a non-official vendor', () => {
    const vendor = new Vendor(
      new VendorId('bestbuy'),
      'Best Buy',
      false,
      'https://cdn.wisecompare.com/vendors/bestbuy.svg',
      true,
    );

    expect(vendor.isOfficial).toBe(false);
    expect(vendor.enabled).toBe(true);
  });

  it('should create a disabled vendor', () => {
    const vendor = new Vendor(
      new VendorId('walmart'),
      'Walmart',
      true,
      'https://cdn.wisecompare.com/vendors/walmart.svg',
      false,
    );

    expect(vendor.enabled).toBe(false);
  });

  it('should throw error when name is empty', () => {
    expect(() => {
      new Vendor(
        new VendorId('test'),
        '',
        true,
        'https://example.com/logo.svg',
        true,
      );
    }).toThrow('Vendor name cannot be empty');
  });
});
