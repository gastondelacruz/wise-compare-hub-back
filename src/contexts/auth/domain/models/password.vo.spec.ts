import { Password } from './password.vo';

describe('Password', () => {
  it('should create password with valid value', () => {
    const password = new Password('password123');
    expect(password.value).toBe('password123');
  });

  it('should throw error when password is empty', () => {
    expect(() => new Password('')).toThrow('Password cannot be empty');
  });

  it('should compare passwords correctly', () => {
    const password1 = new Password('password123');
    const password2 = new Password('password123');
    const password3 = new Password('different');

    expect(password1.equals(password2)).toBe(true);
    expect(password1.equals(password3)).toBe(false);
  });
});
