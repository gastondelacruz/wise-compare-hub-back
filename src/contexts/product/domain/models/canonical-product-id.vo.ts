export class CanonicalProductId {
  constructor(public readonly value: string) {
    if (!value || value.trim().length === 0) {
      throw new Error('CanonicalProductId cannot be empty');
    }
  }
}
