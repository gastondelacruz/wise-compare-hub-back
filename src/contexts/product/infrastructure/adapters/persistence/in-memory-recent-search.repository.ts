import { Injectable } from '@nestjs/common';
import { RecentSearchRepository } from '@contexts/product/application/ports/output/recent-search.repository';
import { RecentSearch } from '@contexts/product/domain/models/recent-search.entity';

@Injectable()
export class InMemoryRecentSearchRepository implements RecentSearchRepository {
  private searches: RecentSearch[] = [];

  async findByUserId(userId: string): Promise<RecentSearch[]> {
    const userSearches = this.searches.filter(
      (search) => search.userId === userId,
    );
    return Promise.resolve(this.sortByMostRecent(userSearches));
  }

  async findGlobal(): Promise<RecentSearch[]> {
    const globalSearches = this.searches.filter((search) =>
      search.isGlobalSearch(),
    );
    return Promise.resolve(this.sortByMostRecent(globalSearches));
  }

  async save(recentSearch: RecentSearch): Promise<void> {
    this.searches.push(recentSearch);
    return Promise.resolve();
  }

  private sortByMostRecent(searches: RecentSearch[]): RecentSearch[] {
    return [...searches].sort(
      (a, b) => b.timestamp.getTime() - a.timestamp.getTime(),
    );
  }
}
