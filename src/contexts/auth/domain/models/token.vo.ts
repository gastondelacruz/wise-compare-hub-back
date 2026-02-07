export class Token {
  constructor(public readonly value: string) {
    if (!value || value.trim().length === 0) {
      throw new Error('Token cannot be empty');
    }
  }
}
