export interface GetRecentSearchesUseCase {
  execute(userId: string | null): Promise<string[]>;
}
