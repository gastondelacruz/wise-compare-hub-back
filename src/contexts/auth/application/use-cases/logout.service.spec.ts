import { LogoutService } from './logout.service';
import { TokenStore } from '../ports/output/token-store';
import { Token } from '@contexts/auth/domain/models/token.vo';

describe('LogoutService', () => {
  let service: LogoutService;
  let mockTokenStore: jest.Mocked<TokenStore>;

  beforeEach(() => {
    mockTokenStore = {
      save: jest.fn(),
      exists: jest.fn(),
      remove: jest.fn(),
    };
    service = new LogoutService(mockTokenStore);
  });

  it('should logout successfully when token exists', async () => {
    const tokenValue = 'mock-jwt-token-123';
    const token = new Token(tokenValue);

    mockTokenStore.exists.mockResolvedValue(true);

    await service.execute(tokenValue);

    expect(mockTokenStore.exists).toHaveBeenCalledWith(token);
    expect(mockTokenStore.remove).toHaveBeenCalledWith(token);
  });

  it('should throw error when token does not exist', async () => {
    const tokenValue = 'invalid-token';
    const token = new Token(tokenValue);

    mockTokenStore.exists.mockResolvedValue(false);

    await expect(service.execute(tokenValue)).rejects.toThrow(
      'Invalid or expired token',
    );

    expect(mockTokenStore.exists).toHaveBeenCalledWith(token);
    expect(mockTokenStore.remove).not.toHaveBeenCalled();
  });
});
