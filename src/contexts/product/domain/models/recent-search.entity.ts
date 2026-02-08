export class RecentSearch {
  public readonly timestamp: Date;

  constructor(
    public readonly searchTerm: string,
    public readonly userId?: string,
  ) {
    if (!searchTerm || searchTerm.trim().length === 0) {
      throw new Error('Search term cannot be empty');
    }
    this.timestamp = new Date();
  }

  isUserSearch(): boolean {
    return this.userId !== undefined;
  }

  isGlobalSearch(): boolean {
    return this.userId === undefined;
  }
}
