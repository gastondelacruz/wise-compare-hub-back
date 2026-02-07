import { Token } from './token.vo';

describe('Token', () => {
  it('should create token with valid value', () => {
    const token = new Token('mock-jwt-token-123');
    expect(token.value).toBe('mock-jwt-token-123');
  });

  it('should throw error when token is empty', () => {
    expect(() => new Token('')).toThrow('Token cannot be empty');
  });

  it('should throw error when token is only whitespace', () => {
    expect(() => new Token('   ')).toThrow('Token cannot be empty');
  });
});
