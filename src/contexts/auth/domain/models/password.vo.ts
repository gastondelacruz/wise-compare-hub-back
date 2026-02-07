export class Password {
  constructor(public readonly value: string) {
    if (!value || value.trim().length === 0) {
      throw new Error('Password cannot be empty');
    }
  }

  equals(other: Password): boolean {
    return this.value === other.value;
  }
}
