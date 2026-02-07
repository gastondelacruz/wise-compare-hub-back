import { User } from './user.entity';
import { UserId } from './user-id.vo';
import { Email } from './email.vo';
import { Password } from './password.vo';

describe('User', () => {
  const createTestUser = (overrides?: {
    id?: string;
    email?: string;
    password?: string;
    name?: string;
  }): User => {
    return new User(
      new UserId(overrides?.id ?? 'user-123'),
      new Email(overrides?.email ?? 'user@example.com'),
      new Password(overrides?.password ?? 'password123'),
      overrides?.name,
    );
  };

  it('should create user with all fields', () => {
    const user = createTestUser({
      id: 'user-1',
      email: 'test@example.com',
      password: 'pass123',
      name: 'Test User',
    });

    expect(user.id.value).toBe('user-1');
    expect(user.email.value).toBe('test@example.com');
    expect(user.password.value).toBe('pass123');
    expect(user.name).toBe('Test User');
  });

  it('should create user without name', () => {
    const user = createTestUser({ name: undefined });

    expect(user.id.value).toBe('user-123');
    expect(user.email.value).toBe('user@example.com');
    expect(user.name).toBeUndefined();
  });

  it('should verify password correctly', () => {
    const user = createTestUser({ password: 'correct-password' });
    const correctPassword = new Password('correct-password');
    const wrongPassword = new Password('wrong-password');

    expect(user.verifyPassword(correctPassword)).toBe(true);
    expect(user.verifyPassword(wrongPassword)).toBe(false);
  });
});
