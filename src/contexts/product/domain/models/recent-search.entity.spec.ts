import { RecentSearch } from './recent-search.entity';

describe('RecentSearch', () => {
  describe('constructor', () => {
    it('should create a recent search with search term', () => {
      const searchTerm = 'laptop';
      const recentSearch = new RecentSearch(searchTerm);

      expect(recentSearch.searchTerm).toBe(searchTerm);
      expect(recentSearch.userId).toBeUndefined();
      expect(recentSearch.timestamp).toBeInstanceOf(Date);
    });

    it('should create a recent search with search term and userId', () => {
      const searchTerm = 'laptop';
      const userId = 'user-123';
      const recentSearch = new RecentSearch(searchTerm, userId);

      expect(recentSearch.searchTerm).toBe(searchTerm);
      expect(recentSearch.userId).toBe(userId);
      expect(recentSearch.timestamp).toBeInstanceOf(Date);
    });

    it('should throw error if search term is empty', () => {
      expect(() => new RecentSearch('')).toThrow('Search term cannot be empty');
    });

    it('should throw error if search term is only whitespace', () => {
      expect(() => new RecentSearch('   ')).toThrow(
        'Search term cannot be empty',
      );
    });

    it('should normalize search term to lowercase', () => {
      const recentSearch = new RecentSearch('Apple');
      expect(recentSearch.searchTerm).toBe('apple');
    });

    it('should normalize search term with mixed case to lowercase', () => {
      const recentSearch = new RecentSearch('MacBook Pro');
      expect(recentSearch.searchTerm).toBe('macbook pro');
    });

    it('should preserve trimmed whitespace but normalize case', () => {
      const recentSearch = new RecentSearch('  Apple  ');
      expect(recentSearch.searchTerm).toBe('apple');
    });
  });

  describe('isUserSearch', () => {
    it('should return true when userId is provided', () => {
      const recentSearch = new RecentSearch('laptop', 'user-123');
      expect(recentSearch.isUserSearch()).toBe(true);
    });

    it('should return false when userId is not provided', () => {
      const recentSearch = new RecentSearch('laptop');
      expect(recentSearch.isUserSearch()).toBe(false);
    });
  });

  describe('isGlobalSearch', () => {
    it('should return true when userId is not provided', () => {
      const recentSearch = new RecentSearch('laptop');
      expect(recentSearch.isGlobalSearch()).toBe(true);
    });

    it('should return false when userId is provided', () => {
      const recentSearch = new RecentSearch('laptop', 'user-123');
      expect(recentSearch.isGlobalSearch()).toBe(false);
    });
  });
});
