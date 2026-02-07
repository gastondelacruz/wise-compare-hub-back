export type SortOption = 'relevance' | 'price_asc' | 'price_desc' | 'rating';

export class SearchProductsQuery {
  constructor(
    public readonly q?: string,
    public readonly sort?: SortOption,
    public readonly minPrice?: number,
    public readonly maxPrice?: number,
    public readonly vendors?: string[],
  ) {}

  static fromDto(dto: {
    q?: string;
    sort?: string;
    minPrice?: number;
    maxPrice?: number;
    vendors?: string[];
  }): SearchProductsQuery {
    const validSorts: SortOption[] = [
      'relevance',
      'price_asc',
      'price_desc',
      'rating',
    ];
    const sort =
      dto.sort && validSorts.includes(dto.sort as SortOption)
        ? (dto.sort as SortOption)
        : 'relevance';

    return new SearchProductsQuery(
      dto.q,
      sort,
      dto.minPrice,
      dto.maxPrice,
      dto.vendors,
    );
  }
}
