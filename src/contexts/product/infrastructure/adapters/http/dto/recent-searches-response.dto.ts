import { ApiProperty } from '@nestjs/swagger';

export class RecentSearchesResponseDto {
  @ApiProperty({ type: [String], example: ['laptop', 'mouse', 'keyboard'] })
  searches: string[];

  static fromDomain(searches: string[]): RecentSearchesResponseDto {
    return { searches };
  }
}
