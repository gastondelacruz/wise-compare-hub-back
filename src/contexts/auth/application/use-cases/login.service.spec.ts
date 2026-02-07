import { LoginService } from './login.service';
import { LoginCommand } from '../dto/login-command';
import { UserRepository } from '../ports/output/user.repository';
import { TokenGenerator } from '../ports/output/token-generator';
import { TokenStore } from '../ports/output/token-store';
import { User } from '@contexts/auth/domain/models/user.entity';
import { UserId } from '@contexts/auth/domain/models/user-id.vo';
import { Email } from '@contexts/auth/domain/models/email.vo';
import { Password } from '@contexts/auth/domain/models/password.vo';
import { InvalidCredentialsError } from '@contexts/auth/domain/exceptions/invalid-credentials.error';

describe('LoginService', () => {
  let service: LoginService;
  let mockUserRepository: jest.Mocked<UserRepository>;
  let mockTokenGenerator: jest.Mocked<TokenGenerator>;
  let mockTokenStore: jest.Mocked<TokenStore>;

  beforeEach(() => {
    mockUserRepository = {
      findByEmail: jest.fn(),
    };
    mockTokenGenerator = {
      generate: jest.fn(),
    };
    mockTokenStore = {
      save: jest.fn(),
      exists: jest.fn(),
      remove: jest.fn(),
    };
    service = new LoginService(
      mockUserRepository,
      mockTokenGenerator,
      mockTokenStore,
    );
  });

  it('should login successfully with valid credentials', async () => {
    const user = new User(
      new UserId('user-1'),
      new Email('test@example.com'),
      new Password('password123'),
      'Test User',
    );

    mockUserRepository.findByEmail.mockResolvedValue(user);
    mockTokenGenerator.generate.mockResolvedValue('mock-jwt-token');

    const command = new LoginCommand('test@example.com', 'password123');
    const result = await service.execute(command);

    expect(result.token).toBe('mock-jwt-token');
    expect(result.user.id).toBe('user-1');
    expect(result.user.email).toBe('test@example.com');
    expect(result.user.name).toBe('Test User');
    expect(mockUserRepository.findByEmail).toHaveBeenCalledWith(
      expect.any(Email),
    );
    expect(mockTokenGenerator.generate).toHaveBeenCalledWith(user);
    expect(mockTokenStore.save).toHaveBeenCalledWith(expect.any(Object));
  });

  it('should throw InvalidCredentialsError when user not found', async () => {
    mockUserRepository.findByEmail.mockResolvedValue(null);

    const command = new LoginCommand('notfound@example.com', 'password123');

    await expect(service.execute(command)).rejects.toThrow(
      InvalidCredentialsError,
    );
  });

  it('should throw InvalidCredentialsError when password is incorrect', async () => {
    const user = new User(
      new UserId('user-1'),
      new Email('test@example.com'),
      new Password('correct-password'),
    );

    mockUserRepository.findByEmail.mockResolvedValue(user);

    const command = new LoginCommand('test@example.com', 'wrong-password');

    await expect(service.execute(command)).rejects.toThrow(
      InvalidCredentialsError,
    );
  });
});
