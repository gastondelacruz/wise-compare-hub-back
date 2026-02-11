import { Injectable, Logger } from '@nestjs/common';
import { chromium, Browser, Page, Locator } from 'playwright';
import { MercadoLibreItem } from './types/mercado-libre-api.types';

/**
 * Mercado Libre web scraper using Playwright
 * Single Responsibility: Scrape product listings from Mercado Libre website
 *
 * Patterns Applied:
 * - Page Object Model: Encapsulates page interactions
 * - Explicit waits: Uses waitForSelector for dynamic content
 * - Semantic selectors: Uses data-testid and specific element attributes
 * - Error handling: Graceful fallback on scraping failures
 * - Top 10 results: Automatically filters and sorts by price
 */
@Injectable()
export class MercadoLibreScraperService {
  private readonly logger = new Logger(MercadoLibreScraperService.name);
  private browser: Browser | null = null;

  /**
   * Scrapes Mercado Libre search results and returns top 10 products sorted by price
   * @param searchQuery - Product name/query to search
   * @returns Array of up to 10 items sorted by price (ascending)
   */
  async scrapeTopOffers(searchQuery: string): Promise<MercadoLibreItem[]> {
    let page: Page | null = null;

    try {
      // Initialize browser if not already done
      if (!this.browser) {
        this.browser = await chromium.launch({ headless: true });
      }

      page = await this.browser.newPage();

      // Set realistic user agent and viewport
      await page.setViewportSize({ width: 1280, height: 720 });

      this.logger.debug(`Scraping search results for: "${searchQuery}"`);

      // Navigate to home page
      await page.goto('https://www.mercadolibre.com.ar/', {
        waitUntil: 'networkidle',
      });

      // Use Playwright role-based selectors for better reliability
      // Click on search input combobox
      const searchCombobox = page.getByRole('combobox', {
        name: 'Ingresá lo que quieras',
      });

      await searchCombobox.click();
      await searchCombobox.fill(searchQuery);
      await searchCombobox.press('Enter');

      // Click search button
      await page.getByRole('button', { name: 'Buscar' }).click();

      // Wait for results to load
      await page.waitForSelector(
        'div.andes-card.poly-card.poly-card--grid-card',
        {
          timeout: 15000,
        },
      );

      // Wait for page to fully render
      await page.waitForTimeout(2000);

      // Change sorting to "Menor precio" (Lowest price)
      try {
        const sortCombobox = page.getByRole('combobox', {
          name: 'Más relevantes',
        });
        await sortCombobox.click();
        await page.getByText('Menor precio').click();

        // Wait for re-sorting
        await page.waitForTimeout(1000);
      } catch (error) {
        this.logger.debug(`Could not change sort order: ${error}`);
        // Continue anyway - results might already be sorted
      }

      // Extract product data
      const products = await this.extractProductsFromPage(page);

      // Since we already sorted by price on the page, just get top 10
      const topOffers = this.sortByPriceAndGetTop10(products);

      this.logger.debug(
        `Successfully scraped ${topOffers.length} offers for "${searchQuery}"`,
      );

      return topOffers;
    } catch (error) {
      this.logger.error(
        `Failed to scrape Mercado Libre for "${searchQuery}": ${error instanceof Error ? error.message : String(error)}`,
      );
      return [];
    } finally {
      // Clean up page resource
      if (page) {
        await page.close();
      }
    }
  }

  /**
   * Closes the browser instance
   */
  async closeBrowser(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }

  /**
   * Builds Mercado Libre search URL with query parameters
   * @private
   */

  /**
   * Extracts product data from search results page
   * Pattern: Multiple element extraction with error handling
   * @private
   */
  private async extractProductsFromPage(
    page: Page,
  ): Promise<MercadoLibreItem[]> {
    const products: MercadoLibreItem[] = [];

    // Get all product items - using the actual Mercado Libre card selector
    const productElements = await page
      .locator('div.andes-card.poly-card.poly-card--grid-card')
      .all();

    for (const element of productElements) {
      try {
        const item = await this.extractProductFromElement(element);
        if (item) {
          products.push(item);
        }
      } catch (error) {
        this.logger.debug(
          `Failed to extract product: ${error instanceof Error ? error.message : String(error)}`,
        );
        // Continue with next product if one fails to extract
        continue;
      }
    }

    return products;
  }

  /**
   * Extracts individual product data from a page element
   * Pattern: Semantic element selection with fallbacks
   * @private
   */
  private async extractProductFromElement(
    element: Locator,
  ): Promise<MercadoLibreItem | null> {
    try {
      // Extract title and link from h3 > a
      const titleElement = element.locator('h3 > a');
      const title = await titleElement.textContent();
      const href = await titleElement.getAttribute('href');

      if (!title || !href) {
        return null;
      }

      // Extract product ID from the URL (e.g., /p/MLA12345)
      const idMatch = href.match(/\/p\/(MLA\d+)/);
      const id = idMatch ? idMatch[1] : 'unknown';

      // Extract price - use span[class*="price"]
      let priceText = '';
      try {
        const priceElement = element.locator('span[class*="price"]');
        priceText = (await priceElement.textContent()) || '';
      } catch {
        // Price is optional - some products might not have price on list view
        priceText = '';
      }

      const price = this.parsePrice(priceText);

      // Extract picture URL from img.poly-component__picture
      let pictureUrl = '';
      try {
        const imgElement = element.locator('img.poly-component__picture');
        pictureUrl = (await imgElement.getAttribute('src')) || '';
      } catch {
        // If specific image not found, try any img tag
        const imgElement = element.locator('img').first();
        pictureUrl = (await imgElement.getAttribute('src')) || '';
      }

      // Extract seller rating if available (optional)
      let rating: number | undefined = undefined;
      try {
        const ratingElement = element.locator('[class*="rating"]').first();
        const ratingText = await ratingElement.textContent();
        if (ratingText) {
          const ratingMatch = ratingText.match(/(\d+\.?\d*)/);
          if (ratingMatch) {
            rating = parseFloat(ratingMatch[1]);
          }
        }
      } catch {
        // Rating is optional
      }

      // Check for free shipping (optional)
      let freeShipping = false;
      try {
        const shippingText = await element.textContent();
        freeShipping =
          shippingText?.toLowerCase().includes('envío gratis') || false;
      } catch {
        // Shipping info is optional
      }

      return {
        id,
        title: title.trim(),
        price,
        currency_id: 'ARS',
        picture_url: pictureUrl,
        condition: 'new',
        shipping: {
          free_shipping: freeShipping,
        },
        seller: {
          id: 0, // Not available in search results
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
      this.logger.debug(
        `Error extracting product element: ${error instanceof Error ? error.message : String(error)}`,
      );
      return null;
    }
  }

  /**
   * Parses price string and returns numeric value
   * Handles various formats: "$123.456,78", "123456.78", etc.
   * @private
   */
  private parsePrice(priceText: string): number {
    // Remove currency symbols and whitespace
    let cleanPrice = priceText.replace(/[^\d.,]/g, '').trim();

    if (!cleanPrice) {
      return 0;
    }

    // Handle different decimal separators
    // If there's both comma and period, last one is decimal separator
    const lastCommaIndex = cleanPrice.lastIndexOf(',');
    const lastPeriodIndex = cleanPrice.lastIndexOf('.');

    if (lastCommaIndex > lastPeriodIndex) {
      // Comma is decimal separator (European format)
      cleanPrice = cleanPrice.replace(/\./g, '').replace(',', '.');
    } else if (lastPeriodIndex > lastCommaIndex) {
      // Period is decimal separator (US format)
      cleanPrice = cleanPrice.replace(/,/g, '');
    } else if (lastCommaIndex >= 0) {
      // Only comma exists
      cleanPrice = cleanPrice.replace(',', '.');
    }

    const price = parseFloat(cleanPrice);
    return isNaN(price) ? 0 : price;
  }

  /**
   * Sorts products by price (ascending) and returns top 10
   * @private
   */
  private sortByPriceAndGetTop10(
    products: MercadoLibreItem[],
  ): MercadoLibreItem[] {
    return products
      .filter((product) => product.price > 0) // Filter out products with no valid price
      .sort((a, b) => a.price - b.price) // Sort by price ascending
      .slice(0, 10); // Get top 10
  }
}
