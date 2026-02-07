import { Injectable } from '@nestjs/common';
import { UserRepository } from '@contexts/auth/application/ports/output/user.repository';
import { User } from '@contexts/auth/domain/models/user.entity';
import { Email } from '@contexts/auth/domain/models/email.vo';
import { UserId } from '@contexts/auth/domain/models/user-id.vo';
import { Password } from '@contexts/auth/domain/models/password.vo';
import { AUTH_RULES } from '@contexts/auth/domain/constants/auth-rules';

@Injectable()
export class InMemoryUserRepository implements UserRepository {
  private readonly users: Map<string, User>;

  constructor() {
    this.users = new Map();
    this.initializeMockUsers();
  }

  private initializeMockUsers(): void {
    AUTH_RULES.MOCK_USERS.forEach((mockUser) => {
      const user = new User(
        new UserId(mockUser.id),
        new Email(mockUser.email),
        new Password(mockUser.password),
        mockUser.name,
      );
      this.users.set(mockUser.email, user);
    });
  }

  findByEmail(email: Email): Promise<User | null> {
    return Promise.resolve(this.users.get(email.value) || null);
  }
}
