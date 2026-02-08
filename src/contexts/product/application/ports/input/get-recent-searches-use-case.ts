import { RecentSearch } from '@contexts/product/domain/models/recent-search.entity';

export interface GetRecentSearchesUseCase {
  execute(userId?: string): Promise<RecentSearch[]>;
}
