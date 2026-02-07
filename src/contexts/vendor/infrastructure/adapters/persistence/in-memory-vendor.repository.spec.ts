import { InMemoryVendorRepository } from './in-memory-vendor.repository';

describe('InMemoryVendorRepository', () => {
  let repository: InMemoryVendorRepository;

  beforeEach(() => {
    repository = new InMemoryVendorRepository();
  });

  it('should return all vendors', async () => {
    const vendors = await repository.findAll();
    expect(Array.isArray(vendors)).toBe(true);
    expect(vendors.length).toBeGreaterThan(0);
  });

  it('should return only enabled vendors when enabled=true', async () => {
    const vendors = await repository.findByEnabled(true);

    expect(vendors.length).toBeGreaterThan(0);
    expect(vendors.every((v) => v.enabled === true)).toBe(true);
  });

  it('should return only disabled vendors when enabled=false', async () => {
    const vendors = await repository.findByEnabled(false);

    // Puede que no haya vendors deshabilitados en los datos mock
    expect(Array.isArray(vendors)).toBe(true);
    if (vendors.length > 0) {
      expect(vendors.every((v) => v.enabled === false)).toBe(true);
    }
  });

  it('should return vendors with all required properties', async () => {
    const vendors = await repository.findAll();

    if (vendors.length > 0) {
      const vendor = vendors[0];
      expect(vendor.id).toBeDefined();
      expect(vendor.name).toBeDefined();
      expect(vendor.logoUrl).toBeDefined();
      expect(typeof vendor.isOfficial).toBe('boolean');
      expect(typeof vendor.enabled).toBe('boolean');
    }
  });
});
