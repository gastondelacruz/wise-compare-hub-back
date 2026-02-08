import { InMemoryRecentSearchRepository } from './in-memory-recent-search.repository';
import { RecentSearch } from '@contexts/product/domain/models/recent-search.entity';

describe('InMemoryRecentSearchRepository', () => {
  let repository: InMemoryRecentSearchRepository;

  beforeEach(() => {
    repository = new InMemoryRecentSearchRepository();
  });

  describe('save', () => {
    it('should save a recent search', async () => {
      const search = new RecentSearch('laptop');
      await repository.save(search);

      const globalSearches = await repository.findGlobal();
      expect(globalSearches).toHaveLength(1);
      expect(globalSearches[0].searchTerm).toBe('laptop');
    });

    it('should save multiple searches', async () => {
      await repository.save(new RecentSearch('laptop'));
      await repository.save(new RecentSearch('mouse'));
      await repository.save(new RecentSearch('keyboard'));

      const globalSearches = await repository.findGlobal();
      expect(globalSearches).toHaveLength(3);
    });

    it('should save user-specific searches', async () => {
      const userId = 'user-123';
      await repository.save(new RecentSearch('laptop', userId));

      const userSearches = await repository.findByUserId(userId);
      expect(userSearches).toHaveLength(1);
      expect(userSearches[0].searchTerm).toBe('laptop');
      expect(userSearches[0].userId).toBe(userId);
    });
  });

  describe('findByUserId', () => {
    it('should return searches for specific user', async () => {
      const userId1 = 'user-1';
      const userId2 = 'user-2';

      await repository.save(new RecentSearch('laptop', userId1));
      await repository.save(new RecentSearch('mouse', userId1));
      await repository.save(new RecentSearch('keyboard', userId2));

      const user1Searches = await repository.findByUserId(userId1);
      expect(user1Searches).toHaveLength(2);
      expect(user1Searches.every((s) => s.userId === userId1)).toBe(true);

      const user2Searches = await repository.findByUserId(userId2);
      expect(user2Searches).toHaveLength(1);
      expect(user2Searches[0].userId).toBe(userId2);
    });

    it('should return empty array when user has no searches', async () => {
      const searches = await repository.findByUserId('nonexistent-user');
      expect(searches).toEqual([]);
    });

    it('should not return global searches', async () => {
      await repository.save(new RecentSearch('laptop'));
      await repository.save(new RecentSearch('mouse', 'user-123'));

      const userSearches = await repository.findByUserId('user-123');
      expect(userSearches).toHaveLength(1);
      expect(userSearches[0].searchTerm).toBe('mouse');
    });

    it('should return searches ordered by most recent first', async () => {
      const userId = 'user-123';
      const search1 = new RecentSearch('laptop', userId);
      await new Promise((resolve) => setTimeout(resolve, 10));
      const search2 = new RecentSearch('mouse', userId);
      await new Promise((resolve) => setTimeout(resolve, 10));
      const search3 = new RecentSearch('keyboard', userId);

      await repository.save(search1);
      await repository.save(search2);
      await repository.save(search3);

      const searches = await repository.findByUserId(userId);
      expect(searches).toHaveLength(3);
      expect(searches[0].searchTerm).toBe('keyboard');
      expect(searches[1].searchTerm).toBe('mouse');
      expect(searches[2].searchTerm).toBe('laptop');
    });
  });

  describe('findGlobal', () => {
    it('should return only global searches', async () => {
      await repository.save(new RecentSearch('laptop'));
      await repository.save(new RecentSearch('mouse'));
      await repository.save(new RecentSearch('keyboard', 'user-123'));

      const globalSearches = await repository.findGlobal();
      expect(globalSearches).toHaveLength(2);
      expect(globalSearches.every((s) => s.isGlobalSearch())).toBe(true);
    });

    it('should return empty array when no global searches exist', async () => {
      await repository.save(new RecentSearch('laptop', 'user-123'));
      const globalSearches = await repository.findGlobal();
      expect(globalSearches).toEqual([]);
    });

    it('should return searches ordered by most recent first', async () => {
      const search1 = new RecentSearch('laptop');
      await new Promise((resolve) => setTimeout(resolve, 10));
      const search2 = new RecentSearch('mouse');
      await new Promise((resolve) => setTimeout(resolve, 10));
      const search3 = new RecentSearch('keyboard');

      await repository.save(search1);
      await repository.save(search2);
      await repository.save(search3);

      const searches = await repository.findGlobal();
      expect(searches).toHaveLength(3);
      expect(searches[0].searchTerm).toBe('keyboard');
      expect(searches[1].searchTerm).toBe('mouse');
      expect(searches[2].searchTerm).toBe('laptop');
    });

    it('should not duplicate searches with same term (case insensitive)', async () => {
      await repository.save(new RecentSearch('Apple'));
      await repository.save(new RecentSearch('apple'));
      await repository.save(new RecentSearch('APPLE'));

      const searches = await repository.findGlobal();
      expect(searches).toHaveLength(1);
      expect(searches[0].searchTerm).toBe('apple');
    });

    it('should update timestamp when saving duplicate search term', async () => {
      const search1 = new RecentSearch('Apple');
      await repository.save(search1);
      const firstTimestamp = search1.timestamp;

      await new Promise((resolve) => setTimeout(resolve, 10));

      const search2 = new RecentSearch('apple');
      await repository.save(search2);
      const secondTimestamp = search2.timestamp;

      const searches = await repository.findGlobal();
      expect(searches).toHaveLength(1);
      expect(searches[0].searchTerm).toBe('apple');
      expect(searches[0].timestamp.getTime()).toBeGreaterThan(
        firstTimestamp.getTime(),
      );
      expect(searches[0].timestamp.getTime()).toBe(secondTimestamp.getTime());
    });

    it('should not duplicate user-specific searches with same term', async () => {
      const userId = 'user-123';
      await repository.save(new RecentSearch('Apple', userId));
      await repository.save(new RecentSearch('apple', userId));
      await repository.save(new RecentSearch('APPLE', userId));

      const searches = await repository.findByUserId(userId);
      expect(searches).toHaveLength(1);
      expect(searches[0].searchTerm).toBe('apple');
    });

    it('should allow same search term for different users', async () => {
      await repository.save(new RecentSearch('Apple', 'user-1'));
      await repository.save(new RecentSearch('apple', 'user-2'));

      const user1Searches = await repository.findByUserId('user-1');
      const user2Searches = await repository.findByUserId('user-2');

      expect(user1Searches).toHaveLength(1);
      expect(user2Searches).toHaveLength(1);
    });

    it('should not mix global and user-specific searches', async () => {
      await repository.save(new RecentSearch('Apple'));
      await repository.save(new RecentSearch('apple', 'user-123'));

      const globalSearches = await repository.findGlobal();
      const userSearches = await repository.findByUserId('user-123');

      expect(globalSearches).toHaveLength(1);
      expect(userSearches).toHaveLength(1);
    });
  });
});
