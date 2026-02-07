import { Vendor } from './vendor.entity';
import { VendorId } from './vendor-id.vo';

describe('Vendor', () => {
  it('should create a valid Vendor', () => {
    const vendor = new Vendor(new VendorId('amazon'), 'Amazon', true);

    expect(vendor.id.value).toBe('amazon');
    expect(vendor.name).toBe('Amazon');
    expect(vendor.isOfficial).toBe(true);
  });

  it('should create a non-official vendor', () => {
    const vendor = new Vendor(new VendorId('bestbuy'), 'Best Buy', false);

    expect(vendor.isOfficial).toBe(false);
  });
});
