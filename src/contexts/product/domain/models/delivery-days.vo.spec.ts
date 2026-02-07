import { DeliveryDays } from './delivery-days.vo';

describe('DeliveryDays', () => {
  it('should create a valid DeliveryDays', () => {
    const deliveryDays = new DeliveryDays(2);
    expect(deliveryDays.value).toBe(2);
  });

  it('should throw error when value is negative', () => {
    expect(() => new DeliveryDays(-1)).toThrow(
      'Delivery days must be greater than or equal to 0',
    );
  });

  it('should allow zero delivery days', () => {
    const deliveryDays = new DeliveryDays(0);
    expect(deliveryDays.value).toBe(0);
  });
});
