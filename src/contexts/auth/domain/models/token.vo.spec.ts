import { Token } from './token.vo';
import { InvalidTokenError } from '@contexts/auth/domain/exceptions/invalid-token.error';

describe('Token', () => {
  it('should create token with valid value', () => {
    const token = new Token('mock-jwt-token-123');
    expect(token.value).toBe('mock-jwt-token-123');
  });

  it('should throw InvalidTokenError when token is empty', () => {
    expect(() => new Token('')).toThrow(InvalidTokenError);
  });

  it('should throw InvalidTokenError when token is only whitespace', () => {
    expect(() => new Token('   ')).toThrow(InvalidTokenError);
  });
});
