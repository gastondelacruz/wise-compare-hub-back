import { RecentSearch } from '@contexts/product/domain/models/recent-search.entity';

export interface RecentSearchRepository {
  findByUserId(userId: string): Promise<RecentSearch[]>;
  findGlobal(): Promise<RecentSearch[]>;
  save(recentSearch: RecentSearch): Promise<void>;
}
