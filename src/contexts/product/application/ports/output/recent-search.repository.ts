import { UserId } from '@contexts/auth/domain/models/user-id.vo';

export interface RecentSearchRepository {
  findByUserId(userId: UserId): Promise<string[]>;
  save(userId: UserId, searchQuery: string): Promise<void>;
}
