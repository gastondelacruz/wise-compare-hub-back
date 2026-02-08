import { Injectable, Inject } from '@nestjs/common';
import { GetRecentSearchesUseCase } from '../ports/input/get-recent-searches-use-case';
import { RecentSearchRepository } from '../ports/output/recent-search.repository';
import { RecentSearch } from '@contexts/product/domain/models/recent-search.entity';
import { PRODUCT_RULES } from '@contexts/product/domain/constants/product-rules';

@Injectable()
export class GetRecentSearchesService implements GetRecentSearchesUseCase {
  constructor(
    @Inject('RecentSearchRepository')
    private readonly repository: RecentSearchRepository,
  ) {}

  async execute(userId?: string): Promise<RecentSearch[]> {
    const searches = userId
      ? await this.repository.findByUserId(userId)
      : await this.repository.findGlobal();

    return searches.slice(0, PRODUCT_RULES.MAX_RECENT_SEARCHES);
  }
}
