export class ProductNotFoundError extends Error {
  constructor(canonicalProductId: string) {
    super(`Canonical product with ID ${canonicalProductId} not found`);
    this.name = 'ProductNotFoundError';
  }
}
