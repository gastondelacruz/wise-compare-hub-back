import { UserId } from '@contexts/auth/domain/models/user-id.vo';

export interface RecentSearchRepository {
  findByUserId(userId: UserId): Promise<string[]>;
  findGlobal(): Promise<string[]>;
  save(userId: UserId, searchQuery: string): Promise<void>;
  saveGlobal(searchQuery: string): Promise<void>;
}
