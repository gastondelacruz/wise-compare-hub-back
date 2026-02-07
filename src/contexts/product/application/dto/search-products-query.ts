export class SearchProductsQuery {
  constructor(
    public readonly q?: string,
    public readonly minPrice?: number,
    public readonly maxPrice?: number,
    public readonly sources?: string[],
    public readonly sort?: string,
    public readonly page?: number,
    public readonly limit?: number,
  ) {}
}
