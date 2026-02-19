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
    // Only initialize real vendors with actual implementations
    // Other vendors will be added when their scrapers are implemented
    const mercadoLibre = new Vendor(
      new VendorId('mercadolibre'),
      'MercadoLibre',
      true, // isOfficial
      'https://cdn.wisecompare.com/vendors/mercadolibre.svg',
      true, // enabled
    );

    this.vendors.push(mercadoLibre);
  }

  findAll(): Promise<Vendor[]> {
    return Promise.resolve([...this.vendors]);
  }

  findByEnabled(enabled: boolean): Promise<Vendor[]> {
    return Promise.resolve(this.vendors.filter((v) => v.enabled === enabled));
  }
}
