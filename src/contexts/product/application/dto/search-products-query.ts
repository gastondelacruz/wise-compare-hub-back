export class SearchProductsQuery {
  constructor(
    public readonly q?: string,
    public readonly minPrice?: number,
    public readonly maxPrice?: number,
    public readonly sources?: string[],
    public readonly sort?: string,
    public readonly page?: number,
    public readonly limit?: number,
    public readonly userId?: string,
  ) {}

  static fromDto(
    dto: {
      q?: string;
      minPrice?: number;
      maxPrice?: number;
      sources?: string | string[];
      sort?: string;
      page?: number;
      limit?: number;
    },
    userId?: string,
  ): SearchProductsQuery {
    // Handle sources transformation
    let sourcesArray: string[] | undefined;
    if (dto.sources) {
      sourcesArray = Array.isArray(dto.sources) ? dto.sources : [dto.sources];
    }

    return new SearchProductsQuery(
      dto.q,
      dto.minPrice,
      dto.maxPrice,
      sourcesArray,
      dto.sort,
      dto.page ? Number(dto.page) : undefined,
      dto.limit ? Number(dto.limit) : undefined,
      userId,
    );
  }
}
