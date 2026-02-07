import { Vendor } from '@contexts/vendor/domain/models/vendor.entity';

export interface VendorRepository {
  findAll(): Promise<Vendor[]>;
  findByEnabled(enabled: boolean): Promise<Vendor[]>;
}
