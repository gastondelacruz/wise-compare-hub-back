import { chromium, Browser, Page, Locator } from 'playwright';
import { MercadoLibreItem } from '../types/mercado-libre-api.types';

/**
 * Mercado Libre Web Scraper
 * Single Responsibility: Extract product data from MercadoLibre website
 *
 * This class contains pure scraping logic without NestJS dependencies,
 * making it reusable in both production code and E2E tests.
 *
 * Patterns Applied:
 * - Page Object Model: Encapsulates page interactions
 * - Explicit waits: Uses waitForSelector for dynamic content with timeouts
 * - Semantic selectors: Uses role-based and specific element attributes
 * - Error handling: Graceful fallback on scraping failures
 * - Top 10 results: Automatically filters and sorts by price
 */
export class MercadoLibreScraper {
  private browser: Browser | null = null;

  /**
   * Scrapes Mercado Libre search results and returns top 10 products sorted by price
   * Can be called with a page instance (for E2E tests) or without (for production - will manage browser internally)
   * @param searchQuery - Product name/query to search
   * @param logger - Optional logger function for debugging
   * @param page - Optional Playwright Page instance (if not provided, will create one)
   * @returns Array of up to 10 items sorted by price (ascending)
   */
  async scrapeTopOffers(
    searchQuery: string,
    logger?: (message: string) => void,
    page?: Page,
  ): Promise<MercadoLibreItem[]> {
    const log = logger || console.log;
    const shouldCloseBrowser = !page; // Only close browser if we created it
    let currentPage = page;

    try {
      log(`Scraping search results for: "${searchQuery}"`);

      // If no page provided, create browser and page
      if (!currentPage) {
        if (!this.browser) {
          log('🚀 Launching browser...');
          this.browser = await chromium.launch({
            headless: true,
            args: [
              '--no-sandbox',
              '--disable-setuid-sandbox',
              '--disable-dev-shm-usage',
              '--disable-accelerated-2d-canvas',
              '--disable-gpu',
            ],
          });
          log('✅ Browser launched successfully');
        }

        log('📄 Creating new page...');
        currentPage = await this.browser.newPage({
          viewport: { width: 1280, height: 720 },
          userAgent:
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
        });
        log('✅ Page created successfully');
      }

      // Navigate directly to search results URL with proper format
      // Format: /search-query_OrderId_PRICE_NoIndex_True
      const encodedQuery = searchQuery.toLowerCase().replace(/\s+/g, '-');
      const searchUrl = `https://listado.mercadolibre.com.ar/${encodedQuery}_OrderId_PRICE_NoIndex_True`;

      await currentPage.goto(searchUrl, {
        waitUntil: 'domcontentloaded',
        timeout: 60000,
      });

      // Wait for page to be ready
      await currentPage.waitForLoadState('networkidle', { timeout: 60000 });

      // Wait for results to load
      await currentPage.waitForSelector('li.ui-search-layout__item', {
        timeout: 30000,
      });

      // Wait for page to fully render
      await currentPage.waitForTimeout(2000);

      log('✅ Page loaded and sorted by lowest price');

      // Extract product data
      const products = await this.extractProductsFromPage(currentPage, logger);

      // Filter and sort by price, get top 10
      const topOffers = this.sortByPriceAndGetTop10(products);

      log(
        `Successfully scraped ${topOffers.length} offers for "${searchQuery}"`,
      );

      return topOffers;
    } catch (error) {
      log(
        `Failed to scrape Mercado Libre for "${searchQuery}": ${error instanceof Error ? error.message : String(error)}`,
      );
      return [];
    } finally {
      // Only close page if we created it
      if (shouldCloseBrowser && currentPage) {
        log('🧹 Closing page...');
        await currentPage.close();
      }
    }
  }

  /**
   * Cleanup method to close browser
   * Should be called on application shutdown
   */
  async closeBrowser(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }

  /**
   * Extracts product data from search results page
   * Processes elements until we have 10 valid products (with price > 0)
   */
  private async extractProductsFromPage(
    page: Page,
    logger?: (message: string) => void,
  ): Promise<MercadoLibreItem[]> {
    const log = logger || console.log;
    const products: MercadoLibreItem[] = [];
    const MAX_VALID_PRODUCTS = 10; // We want exactly 10 valid products

    // Get all product items (correct selector for listing page)
    const productElements = await page
      .locator('li.ui-search-layout__item')
      .all();

    log(
      `Found ${productElements.length} product elements (will process until we have ${MAX_VALID_PRODUCTS} valid offers)`,
    );

    // Process elements until we have MAX_VALID_PRODUCTS valid products (with price > 0)
    let processed = 0;
    let validProducts = 0;

    for (const element of productElements) {
      // Stop if we already have enough valid products
      if (validProducts >= MAX_VALID_PRODUCTS) {
        break;
      }

      try {
        processed++;
        const item = await this.extractProductFromElement(element, logger);

        // Only count items with valid price
        if (item && item.price > 0) {
          products.push(item);
          validProducts++;

          if (validProducts % 5 === 0) {
            log(
              `Found ${validProducts}/${MAX_VALID_PRODUCTS} valid offers (processed ${processed} elements)...`,
            );
          }
        }
      } catch (error) {
        log(
          `Failed to extract product: ${error instanceof Error ? error.message : String(error)}`,
        );
        continue;
      }
    }

    log(
      `Extraction complete! Found ${validProducts} valid products (processed ${processed} elements)`,
    );
    return products;
  }

  /**
   * Extracts individual product data from a page element
   * Uses correct selectors for MercadoLibre listing page (li.ui-search-layout__item)
   */
  private async extractProductFromElement(
    element: Locator,
    logger?: (message: string) => void,
  ): Promise<MercadoLibreItem | null> {
    const log = logger || console.log;

    try {
      // Extract title and product URL from a.poly-component__title
      // This is the only link inside each li.ui-search-layout__item
      const titleElement = element.locator('a.poly-component__title').first();
      const title = await titleElement.textContent({ timeout: 2000 });
      const href = await titleElement.getAttribute('href', { timeout: 2000 });

      if (!title || !href) {
        return null;
      }

      // Strip tracking fragment (e.g. #polycard_client=...) for a clean URL
      const productUrl = href.split('#')[0];

      // Extract product ID from the URL
      // MercadoLibre URLs can be: /p/MLA123, /MLA-123-title, or item URLs
      const idMatch = href.match(/MLA[-]?\d+/);
      const id = idMatch ? idMatch[0].replace('-', '') : 'unknown';

      // Extract price (whole part)
      let priceText = '';
      try {
        const priceElement = element
          .locator('.andes-money-amount__fraction')
          .first();
        priceText = (await priceElement.textContent({ timeout: 2000 })) || '';

        if (!priceText.trim()) {
          return null; // Skip products without price
        }
      } catch {
        return null; // Skip products without price
      }

      const price = this.parsePrice(priceText);

      // Validate price
      if (price <= 0) {
        return null;
      }

      // Extract picture URL from img
      let pictureUrl = '';
      try {
        const imgElement = element.locator('img').first();
        pictureUrl =
          (await imgElement.getAttribute('src', { timeout: 2000 })) || '';

        // If no src, try data-src
        if (!pictureUrl) {
          pictureUrl =
            (await imgElement.getAttribute('data-src', { timeout: 1000 })) ||
            '';
        }

        if (!pictureUrl) {
          pictureUrl = 'https://via.placeholder.com/150';
        }
      } catch {
        pictureUrl = 'https://via.placeholder.com/150';
      }

      // Extract seller rating (optional - usually not shown in listing)
      let rating: number | undefined = undefined;
      try {
        const ratingElement = element.locator('[class*="rating"]').first();
        const ratingText = await ratingElement.textContent({ timeout: 500 });
        if (ratingText) {
          const ratingMatch = ratingText.match(/(\d+\.?\d*)/);
          if (ratingMatch) {
            rating = parseFloat(ratingMatch[1]);
          }
        }
      } catch {
        // Rating is optional
        rating = undefined;
      }

      // Check for free shipping
      let freeShipping = false;
      try {
        const textContent = await element.textContent({ timeout: 500 });
        freeShipping = textContent?.toLowerCase().includes('gratis') || false;
      } catch {
        freeShipping = false;
      }

      return {
        id,
        title: title.trim(),
        price,
        currency_id: 'ARS',
        url: productUrl,
        picture_url: pictureUrl,
        condition: 'new',
        shipping: {
          free_shipping: freeShipping,
        },
        seller: {
          id: 0,
          reputation: {
            transactions: {
              ratings: {
                average: rating,
              },
            },
          },
        },
      };
    } catch (error) {
      log(
        `Error extracting product element: ${error instanceof Error ? error.message : String(error)}`,
      );
      return null;
    }
  }

  /**
   * Parses price string and returns numeric value
   * Handles various formats: "$123.456,78", "123456.78", "1.234.567", etc.
   */
  private parsePrice(priceText: string): number {
    // Remove everything except digits, dots, and commas
    let cleanPrice = priceText.replace(/[^\d.,]/g, '').trim();

    if (!cleanPrice) {
      return 0;
    }

    // In Argentina, the format is: 1.234.567,89
    // Thousands separator: . (dot)
    // Decimal separator: , (comma)
    // So we need to: remove dots, replace comma with dot
    cleanPrice = cleanPrice.replace(/\./g, '').replace(',', '.');

    const price = parseFloat(cleanPrice);
    return isNaN(price) ? 0 : price;
  }

  /**
   * Sorts products by price (ascending) and returns top 10
   * Products already have valid prices (filtered during extraction)
   */
  private sortByPriceAndGetTop10(
    products: MercadoLibreItem[],
  ): MercadoLibreItem[] {
    // Products are already sorted by MercadoLibre's "OrderId_PRICE" filter
    // But sort again to be sure, and take top 10
    return products.sort((a, b) => a.price - b.price).slice(0, 10);
  }
}
