# E2E Scrapers - Playwright Tests

This directory contains end-to-end tests for web scrapers using Playwright.

## 🚀 Quick Start

### Option 1: Interactive UI Mode (Recommended)

```bash
pnpm run test:scraper:ui
```

or

```bash
npx playwright test --ui
```

This opens Playwright's awesome UI with:

- ⏱️ Time travel debugging
- 📸 Step-by-step screenshots
- 🔍 DOM inspection
- 🌐 Network monitoring
- ▶️ Play/pause/step controls

### Option 2: Headed Mode (See Browser)

```bash
pnpm run test:scraper
```

or

```bash
npx playwright test --headed
```

Opens the browser so you can watch the scraping in action.

### Option 3: Debug Mode

```bash
pnpm run test:scraper:debug
```

or

```bash
npx playwright test --debug
```

Opens Playwright Inspector for detailed debugging.

### Option 4: Headless Mode (CI/Production)

```bash
npx playwright test
```

Runs tests without visible browser (fastest).

## 📁 Test Files

- `mercado-libre-scraper.spec.ts` - MercadoLibre scraper E2E tests

## 🎯 How to Use

### Run All Tests

```bash
npx playwright test
```

### Run Specific Test

```bash
npx playwright test mercado-libre-scraper
```

### Run with Specific Browser

```bash
npx playwright test --project=chromium
```

### View Last Test Report

```bash
npx playwright show-report
```

## 🛠️ Modifying Tests

To test different products, edit the test file and change the search query:

```typescript
test('should scrape top 10 offers for YOUR PRODUCT', async ({ page }) => {
  const searchQuery = 'YOUR PRODUCT HERE';
  const offers = await scrapeTopOffers(page, searchQuery);
  // ...
});
```

To enable skipped tests, remove `.skip`:

```typescript
// Before:
test.skip('should scrape iPhone 15', ...)

// After:
test('should scrape iPhone 15', ...)
```

## 📊 Output

Tests will show detailed results in the console:

```
📊 RESULTS:
================================================================================

1. Samsung Galaxy S25 Ultra 256gb
   💰 Price: $1.699.999 ARS
   🆔 ID: MLA123456
   🚚 Free Shipping: Yes
   ⭐ Rating: 4.8
   🔗 Image: https://...

2. [Next product]
...
```

## 🎥 Videos and Screenshots

- **Screenshots**: Taken automatically on failure
- **Videos**: Recorded on failure
- **Traces**: Available for debugging

Find them in: `test-results/` directory

## 📚 More Info

- [Playwright Documentation](https://playwright.dev)
- [Playwright Test API](https://playwright.dev/docs/api/class-test)
