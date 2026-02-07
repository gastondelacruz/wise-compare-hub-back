import { Injectable } from '@nestjs/common';
import { RecentSearchRepository } from '@contexts/product/application/ports/output/recent-search.repository';
import { UserId } from '@contexts/auth/domain/models/user-id.vo';

@Injectable()
export class InMemoryRecentSearchRepository implements RecentSearchRepository {
  private readonly searches: Map<string, string[]>;
  private readonly globalSearches: string[];
  private readonly MAX_SEARCHES_PER_USER = 10;
  private readonly MAX_GLOBAL_SEARCHES = 10;

  constructor() {
    this.searches = new Map();
    this.globalSearches = [];
  }

  async findByUserId(userId: UserId): Promise<string[]> {
    const searches = this.searches.get(userId.value) ?? [];
    return Promise.resolve([...searches].reverse());
  }

  async findGlobal(): Promise<string[]> {
    return Promise.resolve([...this.globalSearches].reverse());
  }

  async save(userId: UserId, searchQuery: string): Promise<void> {
    const userSearches = this.searches.get(userId.value) ?? [];

    userSearches.push(searchQuery);

    if (userSearches.length > this.MAX_SEARCHES_PER_USER) {
      userSearches.shift();
    }

    this.searches.set(userId.value, userSearches);
    return Promise.resolve();
  }

  async saveGlobal(searchQuery: string): Promise<void> {
    this.globalSearches.push(searchQuery);

    if (this.globalSearches.length > this.MAX_GLOBAL_SEARCHES) {
      this.globalSearches.shift();
    }

    return Promise.resolve();
  }
}
