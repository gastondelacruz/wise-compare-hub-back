import { Offer } from './offer.entity';
import { OfferId } from './offer-id.vo';
import { ProductId } from '@contexts/product/domain/models/product-id.vo';
import { Vendor } from '@contexts/vendor/domain/models/vendor.entity';
import { VendorId } from '@contexts/vendor/domain/models/vendor-id.vo';
import { Price } from '@contexts/product/domain/models/price.vo';
import { DeliveryDays } from '@contexts/product/domain/models/delivery-days.vo';
import { Rating } from '@contexts/product/domain/models/rating.vo';

describe('Offer', () => {
  const createVendor = (
    id: string,
    name: string,
    isOfficial: boolean,
  ): Vendor => {
    return new Vendor(
      new VendorId(id),
      name,
      isOfficial,
      `https://cdn.wisecompare.com/vendors/${id}.svg`,
      true,
    );
  };

  it('should create a valid Offer', () => {
    const vendor = createVendor('amazon', 'Amazon', true);
    const offer = new Offer(
      new OfferId('offer-1'),
      new ProductId('prod-1'),
      vendor,
      new Price(1899, 0),
      new DeliveryDays(2),
      new Rating(4.5),
    );

    expect(offer.id.value).toBe('offer-1');
    expect(offer.productId.value).toBe('prod-1');
    expect(offer.vendor.id.value).toBe('amazon');
    expect(offer.price.total).toBe(1899);
    expect(offer.deliveryDays.value).toBe(2);
    expect(offer.rating?.value).toBe(4.5);
  });

  it('should create an Offer without rating', () => {
    const vendor = createVendor('bestbuy', 'Best Buy', false);
    const offer = new Offer(
      new OfferId('offer-2'),
      new ProductId('prod-1'),
      vendor,
      new Price(1999, 10),
      new DeliveryDays(5),
    );

    expect(offer.rating).toBeUndefined();
    expect(offer.price.total).toBe(2009);
  });
});
