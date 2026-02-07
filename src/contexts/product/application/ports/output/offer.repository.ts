import { Offer } from '@contexts/product/domain/models/offer.entity';
import { ProductId } from '@contexts/product/domain/models/product-id.vo';

export interface OfferRepository {
  findByProductIds(productIds: ProductId[]): Promise<Offer[]>;
}
