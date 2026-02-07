export class Rating {
  constructor(public readonly value: number) {
    if (value < 0 || value > 5) {
      throw new Error('Rating must be between 0 and 5');
    }
  }
}
