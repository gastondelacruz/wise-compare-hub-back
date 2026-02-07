import { UserId } from './user-id.vo';
import { Email } from './email.vo';
import { Password } from './password.vo';

export class User {
  constructor(
    public readonly id: UserId,
    public readonly email: Email,
    public readonly password: Password,
    public readonly name?: string,
  ) {}

  verifyPassword(password: Password): boolean {
    return this.password.equals(password);
  }
}
