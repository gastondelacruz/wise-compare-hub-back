import { InMemoryOfferRepository } from './in-memory-offer.repository';
import { Offer } from '@contexts/offer/domain/models/offer.entity';
import { OfferId } from '@contexts/offer/domain/models/offer-id.vo';
import { ProductId } from '@contexts/product/domain/models/product-id.vo';
import { Vendor } from '@contexts/vendor/domain/models/vendor.entity';
import { VendorId } from '@contexts/vendor/domain/models/vendor-id.vo';
import { Price } from '@contexts/product/domain/models/price.vo';
import { DeliveryDays } from '@contexts/product/domain/models/delivery-days.vo';

describe('InMemoryOfferRepository', () => {
  let repository: InMemoryOfferRepository;

  const createOffer = (id: string, productId: string): Offer => {
    return new Offer(
      new OfferId(id),
      new ProductId(productId),
      new Vendor(
        new VendorId('amazon'),
        'Amazon',
        false,
        'https://cdn.wisecompare.com/vendors/amazon.svg',
        true,
      ),
      new Price(1000, 0),
      new DeliveryDays(2),
    );
  };

  beforeEach(() => {
    repository = new InMemoryOfferRepository();
  });

  it('should return offers for given product ids', async () => {
    const offer1 = createOffer('offer-test-1', 'prod-test-1');
    const offer2 = createOffer('offer-test-2', 'prod-test-1');
    const offer3 = createOffer('offer-test-3', 'prod-test-2');
    await repository.save(offer1);
    await repository.save(offer2);
    await repository.save(offer3);

    const found = await repository.findByProductIds([
      new ProductId('prod-test-1'),
      new ProductId('prod-test-2'),
    ]);

    expect(found).toHaveLength(3);
  });

  it('should return empty array when no offers found', async () => {
    const found = await repository.findByProductIds([
      new ProductId('nonexistent'),
    ]);
    expect(found).toHaveLength(0);
  });

  it('should return only offers for specified product ids', async () => {
    const offer1 = createOffer('offer-1', 'prod-1');
    const offer2 = createOffer('offer-2', 'prod-2');
    await repository.save(offer1);
    await repository.save(offer2);

    const found = await repository.findByProductIds([new ProductId('prod-1')]);
    expect(found).toHaveLength(1);
    expect(found[0].productId.value).toBe('prod-1');
  });

  it('should delete offers by product id and vendor id', async () => {
    const offer1 = createOffer('offer-test-delete-1', 'prod-test-delete');
    const offer2 = new Offer(
      new OfferId('offer-test-delete-2'),
      new ProductId('prod-test-delete'),
      new Vendor(
        new VendorId('bestbuy'),
        'Best Buy',
        false,
        'https://cdn.wisecompare.com/vendors/bestbuy.svg',
        true,
      ),
      new Price(1000, 0),
      new DeliveryDays(2),
    );
    await repository.save(offer1);
    await repository.save(offer2);

    await repository.deleteByProductIdAndVendorId(
      new ProductId('prod-test-delete'),
      new VendorId('amazon'),
    );

    const found = await repository.findByProductIds([
      new ProductId('prod-test-delete'),
    ]);
    expect(found).toHaveLength(1);
    expect(found[0].vendor.id.value).toBe('bestbuy');
  });

  it('should not delete offers with different product id', async () => {
    const offer1 = createOffer('offer-test-1', 'prod-test-1');
    const offer2 = createOffer('offer-test-2', 'prod-test-2');
    await repository.save(offer1);
    await repository.save(offer2);

    await repository.deleteByProductIdAndVendorId(
      new ProductId('prod-test-1'),
      new VendorId('amazon'),
    );

    const found = await repository.findByProductIds([
      new ProductId('prod-test-2'),
    ]);
    expect(found).toHaveLength(1);
    expect(found[0].productId.value).toBe('prod-test-2');
  });

  it('should not delete offers with different vendor id', async () => {
    const offer1 = createOffer('offer-test-vendor', 'prod-test-vendor');
    await repository.save(offer1);

    await repository.deleteByProductIdAndVendorId(
      new ProductId('prod-test-vendor'),
      new VendorId('bestbuy'),
    );

    const found = await repository.findByProductIds([
      new ProductId('prod-test-vendor'),
    ]);
    expect(found).toHaveLength(1);
    expect(found[0].vendor.id.value).toBe('amazon');
  });
});
