export class Email {
  private static readonly EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  constructor(public readonly value: string) {
    if (!value || value.trim().length === 0) {
      throw new Error('Email cannot be empty');
    }

    if (!Email.EMAIL_REGEX.test(value)) {
      throw new Error('Invalid email format');
    }
  }
}
