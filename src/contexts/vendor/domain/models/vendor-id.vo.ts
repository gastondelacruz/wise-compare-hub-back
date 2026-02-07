export class VendorId {
  constructor(public readonly value: string) {
    if (!value || value.trim().length === 0) {
      throw new Error('VendorId cannot be empty');
    }
  }
}
