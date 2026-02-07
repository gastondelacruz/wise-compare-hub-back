export class OfferId {
  constructor(public readonly value: string) {
    if (!value || value.trim().length === 0) {
      throw new Error('OfferId cannot be empty');
    }
  }
}
