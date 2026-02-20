import { Injectable, Logger, OnApplicationShutdown } from '@nestjs/common';
import { VendorOfferProvider } from '@contexts/offer/application/ports/output/vendor-offer-provider';
import { Offer } from '@contexts/offer/domain/models/offer.entity';
import { CanonicalProductId } from '@contexts/product/domain/models/canonical-product-id.vo';
import { MercadoLibreOfferMapper } from './mappers/mercado-libre-offer-mapper';
import { createMercadoLibreVendor } from './mercado-libre-vendor';
import { MercadoLibreScraper } from './scraper/mercado-libre-scraper';

/**
 * Provider for fetching offers from MercadoLibre using web scraping.
 * Single Responsibility: Delegate to MercadoLibreScraper and map results to domain Offers
 *
 * Uses Playwright-based scraping instead of API calls to:
 * - Avoid rate limiting and authentication complexity
 * - Get real-time pricing and availability
 * - Automatically handle pagination and sorting by price
 * - Return top 10 best-priced offers
 */
@Injectable()
export class MercadoLibreOfferProvider
  implements VendorOfferProvider, OnApplicationShutdown
{
  private readonly logger = new Logger(MercadoLibreOfferProvider.name);
  private readonly mercadoLibreVendor = createMercadoLibreVendor();
  private readonly offerMapper: MercadoLibreOfferMapper;
  private readonly scraper: MercadoLibreScraper;

  constructor() {
    this.offerMapper = new MercadoLibreOfferMapper(this.mercadoLibreVendor);
    this.scraper = new MercadoLibreScraper();
  }

  async fetchOffers(canonicalProductId: CanonicalProductId): Promise<Offer[]> {
    try {
      this.logger.log(
        `🔍 Fetching offers for product: ${canonicalProductId.value}`,
      );

      // Delegate scraping to MercadoLibreScraper (handles browser internally)
      this.logger.log('🕷️ Starting scraper...');
      const items = await this.scraper.scrapeTopOffers(
        canonicalProductId.value,
        (message) => this.logger.log(`  ${message}`),
      );

      if (items.length === 0) {
        this.logger.warn(
          `⚠️ No offers found for product: ${canonicalProductId.value}`,
        );
        return [];
      }

      // Map scraped items to domain Offers
      this.logger.log(`🗺️ Mapping ${items.length} items to domain offers...`);
      const offers = this.offerMapper.mapItemsToOffers(
        items,
        canonicalProductId,
      );

      this.logger.log(
        `✅ Successfully fetched ${offers.length} offers for product: ${canonicalProductId.value}`,
      );

      return offers;
    } catch (error) {
      this.logger.error(
        `❌ Failed to fetch offers for ${canonicalProductId.value}: ${error instanceof Error ? error.message : String(error)}`,
      );
      if (error instanceof Error && error.stack) {
        this.logger.error(`Stack trace: ${error.stack}`);
      }
      // Fail gracefully - return empty array on any error
      return [];
    }
  }

  /**
   * Cleanup on application shutdown
   * Closes the Playwright browser instance
   */
  async onApplicationShutdown(): Promise<void> {
    this.logger.debug('Closing Mercado Libre scraper browser');
    await this.scraper.closeBrowser();
  }
}
