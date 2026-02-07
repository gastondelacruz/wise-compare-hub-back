import { OfferId } from './offer-id.vo';
import { ProductId } from '@contexts/product/domain/models/product-id.vo';
import { Vendor } from '@contexts/vendor/domain/models/vendor.entity';
import { Price } from '@contexts/product/domain/models/price.vo';
import { DeliveryDays } from '@contexts/product/domain/models/delivery-days.vo';
import { Rating } from '@contexts/product/domain/models/rating.vo';

export class Offer {
  constructor(
    public readonly id: OfferId,
    public readonly productId: ProductId,
    public readonly vendor: Vendor,
    public readonly price: Price,
    public readonly deliveryDays: DeliveryDays,
    public readonly rating?: Rating,
  ) {}
}
