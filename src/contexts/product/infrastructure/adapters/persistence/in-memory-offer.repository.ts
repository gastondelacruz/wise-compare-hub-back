import { Injectable } from '@nestjs/common';
import { OfferRepository } from '@contexts/product/application/ports/output/offer.repository';
import { Offer } from '@contexts/product/domain/models/offer.entity';
import { ProductId } from '@contexts/product/domain/models/product-id.vo';
import { OfferId } from '@contexts/product/domain/models/offer-id.vo';
import { Vendor } from '@contexts/product/domain/models/vendor.entity';
import { VendorId } from '@contexts/product/domain/models/vendor-id.vo';
import { Price } from '@contexts/product/domain/models/price.vo';
import { DeliveryDays } from '@contexts/product/domain/models/delivery-days.vo';
import { Rating } from '@contexts/product/domain/models/rating.vo';

@Injectable()
export class InMemoryOfferRepository implements OfferRepository {
  private offers: Offer[] = [];

  constructor() {
    this.initializeMockOffers();
  }

  private initializeMockOffers(): void {
    const mockOffers = [
      // MacBook Pro offers (prod-1, prod-2)
      {
        id: 'offer-1',
        productId: 'prod-1',
        vendorId: 'amazon',
        vendorName: 'Amazon',
        basePrice: 1899,
        shipping: 0,
        deliveryDays: 2,
        rating: 4.5,
      },
      {
        id: 'offer-2',
        productId: 'prod-1',
        vendorId: 'bestbuy',
        vendorName: 'Best Buy',
        basePrice: 1999,
        shipping: 10,
        deliveryDays: 5,
        rating: 4.3,
      },
      {
        id: 'offer-3',
        productId: 'prod-2',
        vendorId: 'newegg',
        vendorName: 'Newegg',
        basePrice: 1950,
        shipping: 0,
        deliveryDays: 3,
        rating: 4.7,
      },
      {
        id: 'offer-4',
        productId: 'prod-2',
        vendorId: 'amazon',
        vendorName: 'Amazon',
        basePrice: 2199,
        shipping: 0,
        deliveryDays: 1,
        rating: 4.6,
      },
      // iPhone 15 Pro offers (prod-3)
      {
        id: 'offer-5',
        productId: 'prod-3',
        vendorId: 'amazon',
        vendorName: 'Amazon',
        basePrice: 999,
        shipping: 0,
        deliveryDays: 2,
        rating: 4.8,
      },
      {
        id: 'offer-6',
        productId: 'prod-3',
        vendorId: 'bestbuy',
        vendorName: 'Best Buy',
        basePrice: 1049,
        shipping: 0,
        deliveryDays: 1,
        rating: 4.5,
      },
      // Dell XPS 15 offers (prod-4)
      {
        id: 'offer-7',
        productId: 'prod-4',
        vendorId: 'amazon',
        vendorName: 'Amazon',
        basePrice: 1599,
        shipping: 0,
        deliveryDays: 3,
        rating: 4.4,
      },
      {
        id: 'offer-8',
        productId: 'prod-4',
        vendorId: 'bestbuy',
        vendorName: 'Best Buy',
        basePrice: 1699,
        shipping: 10,
        deliveryDays: 4,
        rating: 4.2,
      },
    ];

    mockOffers.forEach((mock) => {
      const offer = new Offer(
        new OfferId(mock.id),
        new ProductId(mock.productId),
        new Vendor(new VendorId(mock.vendorId), mock.vendorName, false),
        new Price(mock.basePrice, mock.shipping),
        new DeliveryDays(mock.deliveryDays),
        new Rating(mock.rating),
      );
      this.offers.push(offer);
    });
  }

  findByProductIds(productIds: ProductId[]): Promise<Offer[]> {
    const productIdSet = new Set(productIds.map((id) => id.value));
    return Promise.resolve(
      this.offers.filter((offer) => productIdSet.has(offer.productId.value)),
    );
  }

  save(offer: Offer): Promise<void> {
    const index = this.offers.findIndex((o) => o.id.value === offer.id.value);
    if (index >= 0) {
      this.offers[index] = offer;
    } else {
      this.offers.push(offer);
    }
    return Promise.resolve();
  }
}
