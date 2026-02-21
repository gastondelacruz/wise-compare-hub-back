import { InvalidTokenError } from '@contexts/auth/domain/exceptions/invalid-token.error';

export class Token {
  constructor(public readonly value: string) {
    if (!value || value.trim().length === 0) {
      throw new InvalidTokenError();
    }
  }
}
