import { InMemoryRecentSearchRepository } from './in-memory-recent-search.repository';
import { UserId } from '@contexts/auth/domain/models/user-id.vo';

describe('InMemoryRecentSearchRepository', () => {
  let repository: InMemoryRecentSearchRepository;

  beforeEach(() => {
    repository = new InMemoryRecentSearchRepository();
  });

  it('should return empty array when user has no searches', async () => {
    const userId = new UserId('user-1');
    const searches = await repository.findByUserId(userId);

    expect(searches).toEqual([]);
  });

  it('should save and retrieve searches for user', async () => {
    const userId = new UserId('user-1');
    await repository.save(userId, 'laptop');
    await repository.save(userId, 'mouse');

    const searches = await repository.findByUserId(userId);

    expect(searches).toHaveLength(2);
    expect(searches).toContain('laptop');
    expect(searches).toContain('mouse');
  });

  it('should return searches in reverse order (most recent first)', async () => {
    const userId = new UserId('user-1');
    await repository.save(userId, 'laptop');
    await repository.save(userId, 'mouse');
    await repository.save(userId, 'keyboard');

    const searches = await repository.findByUserId(userId);

    expect(searches).toEqual(['keyboard', 'mouse', 'laptop']);
  });

  it('should keep only last 10 searches per user', async () => {
    const userId = new UserId('user-1');
    for (let i = 1; i <= 15; i++) {
      await repository.save(userId, `search-${i}`);
    }

    const searches = await repository.findByUserId(userId);

    expect(searches).toHaveLength(10);
    expect(searches[0]).toBe('search-15');
    expect(searches[9]).toBe('search-6');
    expect(searches).not.toContain('search-5');
  });

  it('should handle searches for different users independently', async () => {
    const userId1 = new UserId('user-1');
    const userId2 = new UserId('user-2');

    await repository.save(userId1, 'laptop');
    await repository.save(userId2, 'mouse');

    const searches1 = await repository.findByUserId(userId1);
    const searches2 = await repository.findByUserId(userId2);

    expect(searches1).toEqual(['laptop']);
    expect(searches2).toEqual(['mouse']);
  });

  describe('global searches', () => {
    it('should return empty array when no global searches', async () => {
      const searches = await repository.findGlobal();
      expect(searches).toEqual([]);
    });

    it('should save and retrieve global searches', async () => {
      await repository.saveGlobal('laptop');
      await repository.saveGlobal('mouse');

      const searches = await repository.findGlobal();

      expect(searches).toHaveLength(2);
      expect(searches).toContain('laptop');
      expect(searches).toContain('mouse');
    });

    it('should return global searches in reverse order (most recent first)', async () => {
      await repository.saveGlobal('laptop');
      await repository.saveGlobal('mouse');
      await repository.saveGlobal('keyboard');

      const searches = await repository.findGlobal();

      expect(searches).toEqual(['keyboard', 'mouse', 'laptop']);
    });

    it('should keep only last 10 global searches', async () => {
      for (let i = 1; i <= 15; i++) {
        await repository.saveGlobal(`search-${i}`);
      }

      const searches = await repository.findGlobal();

      expect(searches).toHaveLength(10);
      expect(searches[0]).toBe('search-15');
      expect(searches[9]).toBe('search-6');
      expect(searches).not.toContain('search-5');
    });

    it('should handle global and user searches independently', async () => {
      const userId = new UserId('user-1');
      await repository.save(userId, 'user-laptop');
      await repository.saveGlobal('global-laptop');

      const userSearches = await repository.findByUserId(userId);
      const globalSearches = await repository.findGlobal();

      expect(userSearches).toEqual(['user-laptop']);
      expect(globalSearches).toEqual(['global-laptop']);
    });
  });
});
