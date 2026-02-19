/**
 * Type definitions for MercadoLibre scraped data
 * These types represent the data structure extracted from web scraping
 */

/**
 * Represents a MercadoLibre item scraped from search results.
 * Contains product information including price, shipping, and seller data.
 */
export interface MercadoLibreItem {
  id: string;
  title: string;
  price: number;
  currency_id: string;
  shipping?: {
    free_shipping?: boolean;
    logistic_type?: string;
  };
  seller?: {
    id: number;
    reputation?: {
      transactions?: {
        ratings?: {
          average?: number;
        };
      };
    };
  };
  condition?: string;
  picture_url?: string;
}
