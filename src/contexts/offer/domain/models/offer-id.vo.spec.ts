import { OfferId } from './offer-id.vo';

describe('OfferId', () => {
  it('should create a valid OfferId', () => {
    const offerId = new OfferId('offer-123');
    expect(offerId.value).toBe('offer-123');
  });

  it('should throw error when value is empty', () => {
    expect(() => new OfferId('')).toThrow('OfferId cannot be empty');
  });

  it('should throw error when value is whitespace only', () => {
    expect(() => new OfferId('   ')).toThrow('OfferId cannot be empty');
  });
});
