import { User } from '@contexts/auth/domain/models/user.entity';
import { Email } from '@contexts/auth/domain/models/email.vo';

export interface UserRepository {
  findByEmail(email: Email): Promise<User | null>;
}
