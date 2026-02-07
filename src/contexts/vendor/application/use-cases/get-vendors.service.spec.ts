import { GetVendorsService } from './get-vendors.service';
import { VendorRepository } from '../ports/output/vendor.repository';
import { Vendor } from '@contexts/vendor/domain/models/vendor.entity';
import { VendorId } from '@contexts/vendor/domain/models/vendor-id.vo';

describe('GetVendorsService', () => {
  let service: GetVendorsService;
  let mockVendorRepository: jest.Mocked<VendorRepository>;

  const createVendor = (
    id: string,
    name: string,
    isOfficial: boolean,
    logoUrl: string,
    enabled: boolean,
  ): Vendor => {
    return new Vendor(new VendorId(id), name, isOfficial, logoUrl, enabled);
  };

  beforeEach(() => {
    mockVendorRepository = {
      findAll: jest.fn(),
      findByEnabled: jest.fn(),
    };
    service = new GetVendorsService(mockVendorRepository);
  });

  it('should return all vendors when enabled is not specified', async () => {
    const vendors = [
      createVendor(
        'amazon',
        'Amazon',
        true,
        'https://cdn.wisecompare.com/vendors/amazon.svg',
        true,
      ),
      createVendor(
        'bestbuy',
        'Best Buy',
        true,
        'https://cdn.wisecompare.com/vendors/bestbuy.svg',
        false,
      ),
    ];
    mockVendorRepository.findAll.mockResolvedValue(vendors);

    const result = await service.execute();

    expect(result.vendors).toHaveLength(2);
    expect(result.vendors[0].id).toBe('amazon');
    expect(result.vendors[1].id).toBe('bestbuy');
    expect(mockVendorRepository.findAll).toHaveBeenCalled();
  });

  it('should return only enabled vendors when enabled=true', async () => {
    const enabledVendors = [
      createVendor(
        'amazon',
        'Amazon',
        true,
        'https://cdn.wisecompare.com/vendors/amazon.svg',
        true,
      ),
    ];
    mockVendorRepository.findByEnabled.mockResolvedValue(enabledVendors);

    const result = await service.execute(true);

    expect(result.vendors).toHaveLength(1);
    expect(result.vendors[0].id).toBe('amazon');
    expect(result.vendors[0].enabled).toBe(true);
    expect(mockVendorRepository.findByEnabled).toHaveBeenCalledWith(true);
  });

  it('should return only disabled vendors when enabled=false', async () => {
    const disabledVendors = [
      createVendor(
        'bestbuy',
        'Best Buy',
        true,
        'https://cdn.wisecompare.com/vendors/bestbuy.svg',
        false,
      ),
    ];
    mockVendorRepository.findByEnabled.mockResolvedValue(disabledVendors);

    const result = await service.execute(false);

    expect(result.vendors).toHaveLength(1);
    expect(result.vendors[0].id).toBe('bestbuy');
    expect(result.vendors[0].enabled).toBe(false);
    expect(mockVendorRepository.findByEnabled).toHaveBeenCalledWith(false);
  });

  it('should map vendor properties correctly', async () => {
    const vendors = [
      createVendor(
        'amazon',
        'Amazon',
        true,
        'https://cdn.wisecompare.com/vendors/amazon.svg',
        true,
      ),
    ];
    mockVendorRepository.findAll.mockResolvedValue(vendors);

    const result = await service.execute();

    expect(result.vendors[0]).toEqual({
      id: 'amazon',
      name: 'Amazon',
      logoUrl: 'https://cdn.wisecompare.com/vendors/amazon.svg',
      isOfficial: true,
      enabled: true,
    });
  });

  it('should return empty array when no vendors found', async () => {
    mockVendorRepository.findAll.mockResolvedValue([]);

    const result = await service.execute();

    expect(result.vendors).toHaveLength(0);
  });
});
