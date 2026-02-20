/**
 * Offer Domain Constants
 * Business rules for the offer context
 */

export const OFFER_RULES = {
  MAX_OFFERS_PER_PRODUCT: 10,
  SCORE_MAX: 5,
  SCORE_WEIGHT_PRICE: 0.6,
  SCORE_WEIGHT_DELIVERY: 0.4,
} as const;
