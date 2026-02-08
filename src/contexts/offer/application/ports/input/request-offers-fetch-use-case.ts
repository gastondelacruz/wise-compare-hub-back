/**
 * Use case for requesting offers fetch for a product.
 * Emits OffersFetchRequested events for all enabled vendors when no offers are found.
 */
export interface RequestOffersFetchUseCase {
  execute(canonicalProductId: string): Promise<void>;
}
