import { Email } from './email.vo';

describe('Email', () => {
  it('should create email with valid value', () => {
    const email = new Email('user@example.com');
    expect(email.value).toBe('user@example.com');
  });

  it('should throw error when email is empty', () => {
    expect(() => new Email('')).toThrow('Email cannot be empty');
  });

  it('should throw error when email is invalid format', () => {
    expect(() => new Email('invalid-email')).toThrow('Invalid email format');
    expect(() => new Email('invalid@')).toThrow('Invalid email format');
    expect(() => new Email('@example.com')).toThrow('Invalid email format');
  });

  it('should accept valid email formats', () => {
    expect(() => new Email('user@example.com')).not.toThrow();
    expect(() => new Email('user.name@example.com')).not.toThrow();
    expect(() => new Email('user+tag@example.co.uk')).not.toThrow();
  });
});
