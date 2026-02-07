import { Injectable, Inject } from '@nestjs/common';
import { SearchProductsUseCase } from '../ports/input/search-products-use-case';
import { SearchProductsQuery } from '../dto/search-products-query';
import { SearchProductsResponseDto } from '../dto/search-products-response.dto';
import { ProductRepository } from '../ports/output/product.repository';
import { RecentSearchRepository } from '../ports/output/recent-search.repository';
import { Product } from '@contexts/product/domain/models/product.entity';
import { UserId } from '@contexts/auth/domain/models/user-id.vo';
import { PAGINATION } from '@common/constants/business-rules';

@Injectable()
export class SearchProductsService implements SearchProductsUseCase {
  constructor(
    @Inject('ProductRepository')
    private readonly productRepository: ProductRepository,
    @Inject('RecentSearchRepository')
    private readonly recentSearchRepository: RecentSearchRepository,
  ) {}

  async execute(
    query: SearchProductsQuery,
  ): Promise<SearchProductsResponseDto> {
    const allProducts = await this.productRepository.findAll();

    let filtered = this.applyFilters(allProducts, query);
    filtered = this.applySort(filtered, query.sort);
    const limit = query.limit ?? PAGINATION.DEFAULT_PRODUCT_LIMIT;
    const page = query.page ?? PAGINATION.DEFAULT_PAGE;
    const paginated = this.applyPagination(filtered, page, limit);

    const totalPages = Math.ceil(filtered.length / limit);

    // Save search query to recent searches if query exists and results found
    if (query.q && filtered.length > 0) {
      if (query.userId) {
        await this.recentSearchRepository.save(
          new UserId(query.userId),
          query.q,
        );
      } else {
        await this.recentSearchRepository.saveGlobal(query.q);
      }
    }

    return new SearchProductsResponseDto(
      paginated,
      filtered.length,
      page,
      limit,
      totalPages,
    );
  }

  private applyFilters(
    products: Product[],
    query: SearchProductsQuery,
  ): Product[] {
    let filtered = products;

    if (query.q) {
      filtered = filtered.filter((p) => p.matchesText(query.q!));
    }

    if (query.minPrice !== undefined) {
      filtered = filtered.filter((p) => p.price.value >= query.minPrice!);
    }

    if (query.maxPrice !== undefined) {
      filtered = filtered.filter((p) => p.price.value <= query.maxPrice!);
    }

    if (query.sources && query.sources.length > 0) {
      const sourcesArray = Array.isArray(query.sources)
        ? query.sources
        : [query.sources];
      filtered = filtered.filter((p) =>
        sourcesArray.some((source) => p.matchesSource(source)),
      );
    }

    return filtered;
  }

  private applySort(products: Product[], sort?: string): Product[] {
    if (!sort || sort === 'relevance') {
      return products;
    }

    const sorted = [...products];

    if (sort === 'price-low') {
      return sorted.sort((a, b) => a.price.value - b.price.value);
    }

    if (sort === 'price-high') {
      return sorted.sort((a, b) => b.price.value - a.price.value);
    }

    return sorted;
  }

  private applyPagination(
    products: Product[],
    page: number,
    limit: number,
  ): Product[] {
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    return products.slice(startIndex, endIndex);
  }
}
