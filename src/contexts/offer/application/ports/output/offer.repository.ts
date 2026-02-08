import { Offer } from '@contexts/offer/domain/models/offer.entity';
import { ProductId } from '@contexts/product/domain/models/product-id.vo';
import { VendorId } from '@contexts/vendor/domain/models/vendor-id.vo';

export interface OfferRepository {
  findByProductIds(productIds: ProductId[]): Promise<Offer[]>;
  save(offer: Offer): Promise<void>;
  deleteByProductIdAndVendorId(
    productId: ProductId,
    vendorId: VendorId,
  ): Promise<void>;
}
