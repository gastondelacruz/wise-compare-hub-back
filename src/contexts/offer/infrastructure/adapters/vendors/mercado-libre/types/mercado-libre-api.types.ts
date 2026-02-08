/**
 * Type definitions for MercadoLibre API responses
 * These types represent the external API contract
 */

export interface MercadoLibreTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  scope: string;
  user_id: number;
  refresh_token?: string;
}

export interface MercadoLibreProductsSearchResponse {
  keywords: string;
  paging: {
    total: number;
    limit: number;
    offset: number;
    last: string;
  };
  results: MercadoLibreProduct[];
  query_type: string;
}

export interface MercadoLibreProduct {
  id: string;
  catalog_product_id: string;
  domain_id: string;
  name: string;
  parent_id: string;
  settings: {
    content: string;
    listing_strategy: string;
    exclusive: boolean;
  };
  children_ids: string[];
  attributes: MercadoLibreAttribute[];
  status: string;
  short_description: {
    type: string;
    content: string;
  };
  pictures: MercadoLibrePicture[];
  authority_types: string[];
  date_created: string;
  last_updated: string;
  quality_type: string;
  product_standard: boolean;
  search_type: string;
}

export interface MercadoLibreAttribute {
  id: string;
  name: string;
  value_id?: string;
  value_name?: string;
  values?: Array<{
    id: string;
    name: string;
  }>;
  meta?: {
    rgb?: string;
    value?: boolean;
  };
}

export interface MercadoLibrePicture {
  id: string;
  url: string;
  max_width: string;
  max_height: string;
}

/**
 * Represents a MercadoLibre catalog product that needs to be converted to an offer.
 * Since catalog products don't have prices directly, we use the product ID
 * and will need to fetch items/announcements separately if prices are needed.
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
