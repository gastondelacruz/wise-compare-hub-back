import { VendorId } from './vendor-id.vo';

export class Vendor {
  constructor(
    public readonly id: VendorId,
    public readonly name: string,
    public readonly isOfficial: boolean,
  ) {
    if (!name || name.trim().length === 0) {
      throw new Error('Vendor name cannot be empty');
    }
  }
}
