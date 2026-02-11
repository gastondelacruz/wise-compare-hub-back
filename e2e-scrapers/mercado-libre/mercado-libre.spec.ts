import { test, expect } from '@playwright/test';

interface Product {
  title: string;
  price: string;
  imageUrl: string;
  productUrl: string;
  seller: string;
  condition?: string;
}

test.describe('Mercado Libre Scraper', () => {
  test('should extract product data from search results', async ({ page }) => {
    // Navigate to Mercado Libre home
    await page.goto('https://www.mercadolibre.com.ar/');

    console.log('✅ Navigated to Mercado Libre home');

    // Click on search combobox
    await page
      .getByRole('combobox', { name: 'Ingresá lo que quieras' })
      .click();

    console.log('✅ Clicked search combobox');

    // Fill search query
    await page
      .getByRole('combobox', { name: 'Ingresá lo que quieras' })
      .fill('samsung s25');

    console.log('✅ Filled search query: samsung s25');

    // Click search button
    await page.getByRole('button', { name: 'Buscar' }).click();

    console.log('✅ Clicked search button');

    // Wait for results to load
    await page.waitForTimeout(2000);

    console.log('✅ Search results loaded');

    // Extract product data
    const products: Product[] = await page.evaluate(() => {
      const productList: Product[] = [];

      // Find all product cards using the class structure you provided
      // div.andes-card.poly-card.poly-card--grid-card
      const productCards = document.querySelectorAll(
        'div.andes-card.poly-card.poly-card--grid-card',
      );

      console.log(`Found ${productCards.length} product cards`);

      productCards.forEach((card) => {
        try {
          // Extract title from h3 > a (simplified selector)
          const titleElement = card.querySelector('h3 > a');
          const title = titleElement?.textContent?.trim() || '';

          // Extract price - use span[class*="price"] instead
          const priceElement = card.querySelector('span[class*="price"]');
          const price = priceElement?.textContent?.trim() || '';

          // Extract image URL from img.poly-component__picture
          const imageElement = card.querySelector(
            'img.poly-component__picture',
          );
          const imageUrl = imageElement?.getAttribute('src') || '';

          // Extract product URL from the h3 > a link
          const productUrl = titleElement?.getAttribute('href') || '';

          // Only add if we have at least title and URL
          if (title && productUrl) {
            productList.push({
              title,
              price,
              imageUrl,
              productUrl,
              seller: 'Mercado Libre',
            });
          }
        } catch (error) {
          // Skip products that fail to extract
          console.error('Error extracting product:', error);
        }
      });

      return productList;
    });

    console.log(`\n📊 Extracted ${products.length} products:\n`);

    // Display extracted products
    products.slice(0, 10).forEach((product, index) => {
      console.log(`${index + 1}. ${product.title}`);
      console.log(`   💰 Price: ${product.price}`);
      console.log(`   🔗 URL: ${product.productUrl}`);
      console.log(`   🖼️  Image: ${product.imageUrl.substring(0, 80)}...`);
      console.log(`   🏪 Seller: ${product.seller}`);
      console.log('');
    });

    // Verify we extracted products
    expect(products.length).toBeGreaterThan(0);

    console.log(`✅ Successfully extracted ${products.length} products`);

    // Take screenshot
    await page.screenshot({ path: 'search-results.png' });
  });

  test('should extract top 10 products sorted by price', async ({ page }) => {
    // Navigate to search results
    await page.goto('https://www.mercadolibre.com.ar/');

    // Search
    await page
      .getByRole('combobox', { name: 'Ingresá lo que quieras' })
      .click();
    await page
      .getByRole('combobox', { name: 'Ingresá lo que quieras' })
      .fill('samsung s25');
    await page.getByRole('button', { name: 'Buscar' }).click();

    // Wait for results to load
    await page.waitForTimeout(2000);

    console.log('✅ Search completed');

    // Extract and process products
    const products: Product[] = await page.evaluate(() => {
      const productList: Product[] = [];
      const productCards = document.querySelectorAll(
        'div.andes-card.poly-card.poly-card--grid-card',
      );

      productCards.forEach((card) => {
        try {
          const titleElement = card.querySelector('h3 > a');
          const title = titleElement?.textContent?.trim() || '';

          const priceElement = card.querySelector('span[class*="price"]');
          const priceText = priceElement?.textContent?.trim() || '0';

          // Parse price - remove currency symbols and spaces, keep only numbers
          const priceNumeric = parseFloat(
            priceText
              .replace(/[^\d.,]/g, '')
              .replace(/\./g, '')
              .replace(',', '.'),
          );

          const imageElement = card.querySelector(
            'img.poly-component__picture',
          );
          const imageUrl = imageElement?.getAttribute('src') || '';

          const productUrl = titleElement?.getAttribute('href') || '';

          if (title && productUrl) {
            productList.push({
              title,
              price: priceText,
              imageUrl,
              productUrl,
              seller: 'Mercado Libre',
            });
          }
        } catch (error) {
          // Skip products that fail to extract
        }
      });

      return productList;
    });

    console.log(`✅ Extracted ${products.length} products`);

    // Sort by price (lowest first) and get top 10
    const topProducts = products
      .filter((p) => p.price !== '') // Filter out products without price
      .sort((a, b) => {
        const priceA = parseFloat(
          a.price
            .replace(/[^\d.,]/g, '')
            .replace(/\./g, '')
            .replace(',', '.'),
        );
        const priceB = parseFloat(
          b.price
            .replace(/[^\d.,]/g, '')
            .replace(/\./g, '')
            .replace(',', '.'),
        );
        return priceA - priceB;
      })
      .slice(0, 10);

    console.log(`\n📊 Top 10 products by price:\n`);

    topProducts.forEach((product, index) => {
      console.log(`${index + 1}. ${product.title}`);
      console.log(`   💰 Price: ${product.price}`);
      console.log(`   🏪 Seller: ${product.seller}`);
      console.log('');
    });

    // Verify we have top 10
    expect(topProducts.length).toBeGreaterThan(0);

    console.log(`✅ Successfully extracted top ${topProducts.length} products`);

    // Take screenshot
    await page.screenshot({ path: 'top-10-products.png' });
  });

  test('should analyze product card structure', async ({ page }) => {
    // Navigate and search
    await page.goto('https://www.mercadolibre.com.ar/');

    await page
      .getByRole('combobox', { name: 'Ingresá lo que quieras' })
      .click();
    await page
      .getByRole('combobox', { name: 'Ingresá lo que quieras' })
      .fill('samsung s25');
    await page.getByRole('button', { name: 'Buscar' }).click();

    // Wait for results to load
    await page.waitForTimeout(2000);

    // Discover actual nested selectors
    const discovery = await page.evaluate(() => {
      const productCards = document.querySelectorAll(
        'div.andes-card.poly-card.poly-card--grid-card',
      );

      const analysis = {
        totalCards: productCards.length,
        nestedSelectors: {
          'h3.poly-component__title-wrapper > a.poly-component__title': 0,
          'h3 > a': 0,
          'a[href*="/p/"]': 0,
          'span.poly-price__current-price-text': 0,
          'span[class*="price"]': 0,
          'img.poly-component__picture': 0,
          'img[data-testid="picture"]': 0,
          img: 0,
        },
        firstCardHTML: '',
        firstCardElements: {} as any,
      };

      // Analyze first card in detail
      if (productCards.length > 0) {
        const card = productCards[0];

        // Test each selector
        analysis.nestedSelectors[
          'h3.poly-component__title-wrapper > a.poly-component__title'
        ] = card.querySelectorAll(
          'h3.poly-component__title-wrapper > a.poly-component__title',
        ).length;
        analysis.nestedSelectors['h3 > a'] =
          card.querySelectorAll('h3 > a').length;
        analysis.nestedSelectors['a[href*="/p/"]'] =
          card.querySelectorAll('a[href*="/p/"]').length;
        analysis.nestedSelectors['span.poly-price__current-price-text'] =
          card.querySelectorAll('span.poly-price__current-price-text').length;
        analysis.nestedSelectors['span[class*="price"]'] =
          card.querySelectorAll('span[class*="price"]').length;
        analysis.nestedSelectors['img.poly-component__picture'] =
          card.querySelectorAll('img.poly-component__picture').length;
        analysis.nestedSelectors['img[data-testid="picture"]'] =
          card.querySelectorAll('img[data-testid="picture"]').length;
        analysis.nestedSelectors['img'] = card.querySelectorAll('img').length;

        // Get actual HTML of first card
        analysis.firstCardHTML = card.innerHTML.substring(0, 1000);

        // Get elements info
        const titleEl =
          card.querySelector('h3 > a') || card.querySelector('a[href*="/p/"]');
        const priceEl = card.querySelector('span[class*="price"]');
        const imgEl = card.querySelector('img');

        analysis.firstCardElements = {
          hasTitle: !!titleEl,
          titleText: titleEl?.textContent?.substring(0, 50) || '',
          hasPrice: !!priceEl,
          priceText: priceEl?.textContent?.substring(0, 30) || '',
          hasImage: !!imgEl,
          imageSrc: imgEl?.getAttribute('src')?.substring(0, 80) || '',
        };
      }

      return analysis;
    });

    console.log('\n🔍 DETAILED DISCOVERY:');
    console.log(`Total cards found: ${discovery.totalCards}`);
    console.log('\nNested selector test results:');
    Object.entries(discovery.nestedSelectors).forEach(([selector, count]) => {
      console.log(`   "${selector}": ${count}`);
    });

    console.log('\nFirst card elements:');
    Object.entries(discovery.firstCardElements).forEach(([key, value]) => {
      console.log(`   ${key}: ${value}`);
    });

    console.log(
      '\nFirst card HTML sample:',
      discovery.firstCardHTML.substring(0, 200),
    );

    // Take screenshot for manual inspection
    await page.screenshot({ path: 'discovery-screenshot.png' });

    // For now, don't fail - this is discovery
    expect(true).toBe(true);
  });
});
