import { InMemoryTokenStore } from './in-memory-token-store';
import { Token } from '@contexts/auth/domain/models/token.vo';

describe('InMemoryTokenStore', () => {
  let store: InMemoryTokenStore;

  beforeEach(() => {
    store = new InMemoryTokenStore();
  });

  it('should save token', async () => {
    const token = new Token('test-token-123');
    await store.save(token);

    const exists = await store.exists(token);
    expect(exists).toBe(true);
  });

  it('should return false when token does not exist', async () => {
    const token = new Token('non-existent-token');
    const exists = await store.exists(token);

    expect(exists).toBe(false);
  });

  it('should remove token', async () => {
    const token = new Token('test-token-456');
    await store.save(token);

    let exists = await store.exists(token);
    expect(exists).toBe(true);

    await store.remove(token);
    exists = await store.exists(token);
    expect(exists).toBe(false);
  });

  it('should handle multiple tokens', async () => {
    const token1 = new Token('token-1');
    const token2 = new Token('token-2');

    await store.save(token1);
    await store.save(token2);

    expect(await store.exists(token1)).toBe(true);
    expect(await store.exists(token2)).toBe(true);

    await store.remove(token1);
    expect(await store.exists(token1)).toBe(false);
    expect(await store.exists(token2)).toBe(true);
  });
});
