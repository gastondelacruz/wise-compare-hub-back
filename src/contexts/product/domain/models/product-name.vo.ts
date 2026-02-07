export class ProductName {
  constructor(public readonly value: string) {
    if (!value || value.trim().length === 0) {
      throw new Error('ProductName cannot be empty');
    }
  }
}
