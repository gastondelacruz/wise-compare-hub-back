import { Injectable, Inject } from '@nestjs/common';
import { GetRecentSearchesUseCase } from '../ports/input/get-recent-searches-use-case';
import { RecentSearchRepository } from '../ports/output/recent-search.repository';
import { UserId } from '@contexts/auth/domain/models/user-id.vo';

@Injectable()
export class GetRecentSearchesService implements GetRecentSearchesUseCase {
  constructor(
    @Inject('RecentSearchRepository')
    private readonly recentSearchRepository: RecentSearchRepository,
  ) {}

  async execute(userId: string | null): Promise<string[]> {
    if (!userId) {
      return [];
    }

    const user = new UserId(userId);
    return this.recentSearchRepository.findByUserId(user);
  }
}
