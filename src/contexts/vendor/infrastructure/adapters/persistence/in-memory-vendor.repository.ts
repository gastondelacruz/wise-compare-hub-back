import { Injectable } from '@nestjs/common';
import { VendorRepository } from '@contexts/vendor/application/ports/output/vendor.repository';
import { Vendor } from '@contexts/vendor/domain/models/vendor.entity';
import { VendorId } from '@contexts/vendor/domain/models/vendor-id.vo';

@Injectable()
export class InMemoryVendorRepository implements VendorRepository {
  private vendors: Vendor[] = [];

  constructor() {
    this.initializeMockVendors();
  }

  private initializeMockVendors(): void {
    const mockVendors = [
      {
        id: 'amazon',
        name: 'Amazon',
        isOfficial: true,
        logoUrl: 'https://cdn.wisecompare.com/vendors/amazon.svg',
        enabled: true,
      },
      {
        id: 'bestbuy',
        name: 'Best Buy',
        isOfficial: true,
        logoUrl: 'https://cdn.wisecompare.com/vendors/bestbuy.svg',
        enabled: true,
      },
      {
        id: 'walmart',
        name: 'Walmart',
        isOfficial: true,
        logoUrl: 'https://cdn.wisecompare.com/vendors/walmart.svg',
        enabled: true,
      },
      {
        id: 'target',
        name: 'Target',
        isOfficial: false,
        logoUrl: 'https://cdn.wisecompare.com/vendors/target.svg',
        enabled: true,
      },
      {
        id: 'newegg',
        name: 'Newegg',
        isOfficial: false,
        logoUrl: 'https://cdn.wisecompare.com/vendors/newegg.svg',
        enabled: true,
      },
    ];

    mockVendors.forEach((mock) => {
      const vendor = new Vendor(
        new VendorId(mock.id),
        mock.name,
        mock.isOfficial,
        mock.logoUrl,
        mock.enabled,
      );
      this.vendors.push(vendor);
    });
  }

  findAll(): Promise<Vendor[]> {
    return Promise.resolve([...this.vendors]);
  }

  findByEnabled(enabled: boolean): Promise<Vendor[]> {
    return Promise.resolve(this.vendors.filter((v) => v.enabled === enabled));
  }
}
