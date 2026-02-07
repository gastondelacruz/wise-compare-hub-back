import { User } from '@contexts/auth/domain/models/user.entity';

export interface TokenGenerator {
  generate(user: User): Promise<string>;
}
