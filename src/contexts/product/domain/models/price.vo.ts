export class Price {
  public readonly total: number;

  constructor(
    public readonly basePrice: number,
    public readonly shipping: number,
  ) {
    if (basePrice < 0) {
      throw new Error('Base price must be greater than or equal to 0');
    }
    if (shipping < 0) {
      throw new Error('Shipping must be greater than or equal to 0');
    }
    this.total = basePrice + shipping;
  }
}
