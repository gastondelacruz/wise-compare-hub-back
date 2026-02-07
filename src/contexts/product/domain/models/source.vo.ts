export class Source {
  constructor(public readonly value: string) {
    if (!value || value.trim().length === 0) {
      throw new Error('Source cannot be empty');
    }
  }
}
