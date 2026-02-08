export class RecentSearch {
  public readonly timestamp: Date;
  public readonly searchTerm: string;

  constructor(
    searchTerm: string,
    public readonly userId?: string,
  ) {
    const trimmed = searchTerm.trim();
    if (!trimmed || trimmed.length === 0) {
      throw new Error('Search term cannot be empty');
    }
    this.searchTerm = trimmed.toLowerCase();
    this.timestamp = new Date();
  }

  isUserSearch(): boolean {
    return this.userId !== undefined;
  }

  isGlobalSearch(): boolean {
    return this.userId === undefined;
  }
}
