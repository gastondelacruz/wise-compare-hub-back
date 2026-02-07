import { InMemoryUserRepository } from './in-memory-user.repository';
import { Email } from '@contexts/auth/domain/models/email.vo';

describe('InMemoryUserRepository', () => {
  let repository: InMemoryUserRepository;

  beforeEach(() => {
    repository = new InMemoryUserRepository();
  });

  it('should find user by email when exists', async () => {
    const email = new Email('test@example.com');
    const user = await repository.findByEmail(email);

    expect(user).not.toBeNull();
    expect(user?.email.value).toBe('test@example.com');
  });

  it('should return null when user not found', async () => {
    const email = new Email('notfound@example.com');
    const user = await repository.findByEmail(email);

    expect(user).toBeNull();
  });

  it('should find all mock users', async () => {
    const testEmail = new Email('test@example.com');
    const adminEmail = new Email('admin@example.com');

    const testUser = await repository.findByEmail(testEmail);
    const adminUser = await repository.findByEmail(adminEmail);

    expect(testUser).not.toBeNull();
    expect(testUser?.email.value).toBe('test@example.com');
    expect(adminUser).not.toBeNull();
    expect(adminUser?.email.value).toBe('admin@example.com');
  });
});
