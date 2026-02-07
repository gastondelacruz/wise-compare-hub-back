export class DeliveryDays {
  constructor(public readonly value: number) {
    if (value < 0) {
      throw new Error('Delivery days must be greater than or equal to 0');
    }
  }
}
