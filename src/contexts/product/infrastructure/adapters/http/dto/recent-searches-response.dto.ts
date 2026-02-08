import { ApiProperty } from '@nestjs/swagger';
import { RecentSearch } from '@contexts/product/domain/models/recent-search.entity';

export class RecentSearchResponseDto {
  @ApiProperty({
    description: 'Search term',
    example: 'laptop',
  })
  searchTerm: string;

  @ApiProperty({
    description: 'Timestamp when the search was performed',
    example: '2026-02-08T10:30:00.000Z',
  })
  timestamp: Date;

  static fromDomain(recentSearch: RecentSearch): RecentSearchResponseDto {
    return {
      searchTerm: recentSearch.searchTerm,
      timestamp: recentSearch.timestamp,
    };
  }

  static fromDomainArray(
    recentSearches: RecentSearch[],
  ): RecentSearchResponseDto[] {
    return recentSearches.map((search) => this.fromDomain(search));
  }
}
