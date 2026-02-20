import { Offer } from '@contexts/offer/domain/models/offer.entity';

export interface VendorOfferResult {
  offers: Offer[];
  productImageUrl?: string;
}
