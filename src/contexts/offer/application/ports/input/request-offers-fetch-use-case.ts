/**
 * Use case for requesting offers fetch for a product.
 * Emits OffersFetchRequested events for all enabled vendors when no offers are found.
 *
 * Note: This is fire-and-forget - caller should NOT await the result
 * to avoid blocking while scraper executes in background.
 */
export interface RequestOffersFetchUseCase {
  execute(canonicalProductId: string): Promise<void>;
}
