import {
  MercadoLibreProduct,
  MercadoLibreItem,
} from '../types/mercado-libre-api.types';

/**
 * Extracts items from MercadoLibre catalog products.
 * Single Responsibility: Extract items from catalog products structure
 *
 * Note: Catalog products from /products/search don't have prices directly.
 * To get actual offers with prices, we would need to fetch items/announcements
 * for each catalog_product_id. For now, we convert catalog products to items
 * without prices (price = 0) as placeholders.
 */
export class MercadoLibreItemExtractor {
  extractItemsFromProducts(
    products: MercadoLibreProduct[],
  ): MercadoLibreItem[] {
    const items: MercadoLibreItem[] = [];

    for (const product of products) {
      // Extract main picture URL if available
      const pictureUrl =
        product.pictures && product.pictures.length > 0
          ? product.pictures[0].url
          : undefined;

      // Convert catalog product to item
      // Note: Catalog products don't have prices, so we use 0 as placeholder
      // In a real implementation, we would need to fetch items/announcements
      // for each catalog_product_id to get actual prices
      const item: MercadoLibreItem = {
        id: product.id,
        title: product.name,
        price: 0, // Catalog products don't have prices - would need additional API call
        currency_id: 'ARS', // Default currency
        picture_url: pictureUrl,
        condition: 'new', // Default condition
      };

      items.push(item);
    }

    return items;
  }
}
