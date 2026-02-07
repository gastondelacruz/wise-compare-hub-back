import { MockJwtService } from './mock-jwt.service';
import { User } from '@contexts/auth/domain/models/user.entity';
import { UserId } from '@contexts/auth/domain/models/user-id.vo';
import { Email } from '@contexts/auth/domain/models/email.vo';
import { Password } from '@contexts/auth/domain/models/password.vo';

describe('MockJwtService', () => {
  let service: MockJwtService;

  beforeEach(() => {
    service = new MockJwtService();
  });

  it('should generate mock token for user', async () => {
    const user = new User(
      new UserId('user-1'),
      new Email('test@example.com'),
      new Password('password123'),
    );

    const token = await service.generate(user);

    expect(token).toBeTruthy();
    expect(typeof token).toBe('string');
    expect(token.length).toBeGreaterThan(0);
  });

  it('should generate different tokens for different users', async () => {
    const user1 = new User(
      new UserId('user-1'),
      new Email('test1@example.com'),
      new Password('password123'),
    );
    const user2 = new User(
      new UserId('user-2'),
      new Email('test2@example.com'),
      new Password('password123'),
    );

    const token1 = await service.generate(user1);
    const token2 = await service.generate(user2);

    expect(token1).not.toBe(token2);
  });

  it('should generate consistent token format', async () => {
    const user = new User(
      new UserId('user-1'),
      new Email('test@example.com'),
      new Password('password123'),
    );

    const token = await service.generate(user);

    expect(token).toMatch(/^mock-jwt-/);
  });
});
