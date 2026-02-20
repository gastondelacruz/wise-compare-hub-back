import { test, expect } from '@playwright/test';
import { MercadoLibreScraper } from '../src/contexts/offer/infrastructure/adapters/vendors/mercado-libre/scraper/mercado-libre-scraper';

/**
 * Mercado Libre Web Scraper - E2E Test with Playwright
 *
 * Usage:
 *   pnpm run test:scraper:ui              (Interactive UI mode - RECOMMENDED)
 *   pnpm run test:scraper                 (With visible browser)
 *   pnpm run test:scraper:debug           (Debug mode)
 *   npx playwright test                   (Headless mode)
 *
 * This test uses the same MercadoLibreScraper class used in production,
 * ensuring that what you test is what runs in production (no code duplication).
 *
 * Playwright's awesome features:
 * - ⏱️ Time travel debugging
 * - 📸 Step-by-step screenshots
 * - 🌐 Network inspection
 * - 🎥 Video recording
 * - 🔍 DOM inspection
 */

// Create scraper instance (same class used in production!)
const scraper = new MercadoLibreScraper();

// ============================================================================
// PLAYWRIGHT TESTS
// ============================================================================

test.describe('Mercado Libre Scraper - E2E Tests', () => {
  // Timeout for scraping operations (only processes first 15 elements, much faster!)
  test.setTimeout(60000); // 1 minute

  test('should scrape top 10 offers for Samsung S25', async ({ page }) => {
    const searchQuery = 'Samsung S25';

    // Use the same scraper class as production code!
    // Pass page as third parameter for E2E tests (scraper won't manage browser)
    const offers = await scraper.scrapeTopOffers(
      searchQuery,
      (msg) => console.log(`🔍 ${msg}`),
      page,
    );

    console.log('\n📊 RESULTS:');
    console.log('='.repeat(80));

    offers.forEach((offer, index) => {
      console.log(`\n${index + 1}. ${offer.title}`);
      console.log(
        `   💰 Price: $${offer.price.toLocaleString('es-AR')} ${offer.currency_id}`,
      );
      console.log(`   🆔 ID: ${offer.id}`);
      console.log(
        `   🚚 Free Shipping: ${offer.shipping?.free_shipping ? 'Yes' : 'No'}`,
      );
      if (offer.seller?.reputation?.transactions?.ratings?.average) {
        console.log(
          `   ⭐ Rating: ${offer.seller.reputation.transactions.ratings.average}`,
        );
      }
      console.log(
        `   🔗 Image: ${offer.picture_url?.substring(0, 60) || 'N/A'}...`,
      );
    });

    console.log('\n' + '='.repeat(80));

    // Assertions
    expect(offers).toBeDefined();
    expect(offers.length).toBeGreaterThan(0);
    expect(offers.length).toBeLessThanOrEqual(10);

    // Verify sorting by price (ascending)
    for (let i = 0; i < offers.length - 1; i++) {
      expect(offers[i].price).toBeLessThanOrEqual(offers[i + 1].price);
    }

    // Verify all offers have required fields
    for (const offer of offers) {
      expect(offer.id).toBeTruthy();
      expect(offer.title).toBeTruthy();
      expect(offer.price).toBeGreaterThan(0);
      expect(offer.currency_id).toBe('ARS');
    }
  });
});
