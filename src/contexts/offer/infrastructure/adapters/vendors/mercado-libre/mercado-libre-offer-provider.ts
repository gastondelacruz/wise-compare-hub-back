import { Injectable, Logger, OnApplicationShutdown } from '@nestjs/common';
import { VendorOfferProvider } from '@contexts/offer/application/ports/output/vendor-offer-provider';
import { Offer } from '@contexts/offer/domain/models/offer.entity';
import { CanonicalProductId } from '@contexts/product/domain/models/canonical-product-id.vo';
import { MercadoLibreOfferMapper } from './mappers/mercado-libre-offer-mapper';
import { createMercadoLibreVendor } from './mercado-libre-vendor';
import { MercadoLibreScraperService } from './mercado-libre-scraper.service';

/**
 * Provider for fetching offers from MercadoLibre using web scraping.
 * Single Responsibility: Orchestrate the flow of scraping offers from Mercado Libre website
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

  constructor(private readonly scraperService: MercadoLibreScraperService) {
    this.offerMapper = new MercadoLibreOfferMapper(this.mercadoLibreVendor);
  }

  async fetchOffers(canonicalProductId: CanonicalProductId): Promise<Offer[]> {
    try {
      this.logger.debug(
        `Fetching offers for product: ${canonicalProductId.value}`,
      );

      // Scrape top 10 products sorted by price from Mercado Libre
      const items = await this.scraperService.scrapeTopOffers(
        canonicalProductId.value,
      );

      if (items.length === 0) {
        this.logger.debug(
          `No offers found for product: ${canonicalProductId.value}`,
        );
        return [];
      }

      // Map scraped items to domain Offers
      const offers = this.offerMapper.mapItemsToOffers(
        items,
        canonicalProductId,
      );

      this.logger.debug(
        `Successfully fetched ${offers.length} offers for product: ${canonicalProductId.value}`,
      );

      return offers;
    } catch (error) {
      this.logger.error(
        `Failed to fetch offers for ${canonicalProductId.value}: ${error instanceof Error ? error.message : String(error)}`,
      );
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
    await this.scraperService.closeBrowser();
  }
}
