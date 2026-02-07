import { OfferId } from './offer-id.vo';
import { ProductId } from './product-id.vo';
import { Vendor } from './vendor.entity';
import { Price } from './price.vo';
import { DeliveryDays } from './delivery-days.vo';
import { Rating } from './rating.vo';

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
