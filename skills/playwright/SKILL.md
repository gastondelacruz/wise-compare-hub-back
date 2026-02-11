---
name: playwright
description: >
  Browser automation and end-to-end testing library. Trigger: When writing E2E tests,
  automating browser interactions, web scraping, or testing full user workflows.
license: Apache-2.0
metadata:
  author: Wise Compare Hub
  version: '1.0'
  scope: [testing, automation, infrastructure]
  auto_invoke: 'Writing E2E browser automation tests'
allowed-tools: Read, Edit, Write, Glob, Grep, Bash, Task
---

## ⚠️ CRITICAL: Always Consult Context7 MCP

**BEFORE writing Playwright tests:**

1. 🔍 Check existing E2E tests in `test/e2e/` or `src/**/*.e2e.spec.ts`
2. 📋 Review `Context7 MCP` documentation for existing Playwright patterns
3. ✅ Use existing test structure and conventions
4. 🚫 NEVER create duplicate test utilities or page objects

**Reference:** `Context7 MCP` contains the authoritative Playwright patterns for this project.

---

## When to Use

Use this skill when:

- Writing end-to-end tests for full user workflows
- Testing browser interactions (clicks, forms, navigation)
- Automating web scraping or data collection
- Testing multi-page workflows or redirects
- Verifying UI state changes and element visibility
- Testing authentication flows and protected pages
- Validating API responses from browser context

---

## Critical Patterns

### Pattern 1: Basic Browser Navigation & Interaction

```typescript
// ✅ CORRECT - Basic Playwright test structure
import { test, expect } from '@playwright/test';

test('user can search for products', async ({ page }) => {
  // Navigate to application
  await page.goto('http://localhost:3000');

  // Find and interact with search input
  const searchInput = page.locator('input[placeholder="Search products"]');
  await searchInput.fill('laptop');

  // Click search button
  await page.click('button:has-text("Search")');

  // Wait for results and verify
  await page.waitForSelector('[data-testid="product-result"]');
  const results = page.locator('[data-testid="product-result"]');
  await expect(results).toHaveCount(1);
});
```

### Pattern 2: Page Object Model (POM)

```typescript
// ✅ CORRECT - Reusable page objects for maintainability
import { Page } from '@playwright/test';

export class SearchPage {
  constructor(private page: Page) {}

  async goto() {
    await this.page.goto('http://localhost:3000');
  }

  async searchFor(query: string) {
    await this.page.locator('input[placeholder="Search products"]').fill(query);
    await this.page.click('button:has-text("Search")');
  }

  async getResultCount(): Promise<number> {
    await this.page.waitForSelector('[data-testid="product-result"]');
    return (await this.page.locator('[data-testid="product-result"]').all())
      .length;
  }

  async clickResult(index: number) {
    const results = this.page.locator('[data-testid="product-result"]');
    await results.nth(index).click();
  }
}

// Usage in test
test('search workflow', async ({ page }) => {
  const searchPage = new SearchPage(page);
  await searchPage.goto();
  await searchPage.searchFor('laptop');
  const count = await searchPage.getResultCount();
  expect(count).toBeGreaterThan(0);
});
```

### Pattern 3: Form Submission & Validation

```typescript
// ✅ CORRECT - Form testing with validation
test('user can submit product comparison form', async ({ page }) => {
  await page.goto('http://localhost:3000/compare');

  // Fill form fields
  await page.fill('input[name="product1"]', 'Product A');
  await page.fill('input[name="product2"]', 'Product B');

  // Select dropdown option
  await page.selectOption('select[name="category"]', 'electronics');

  // Check checkbox
  await page.check('input[type="checkbox"][name="includePrices"]');

  // Submit form
  await page.click('button[type="submit"]');

  // Wait for success state
  await expect(page).toHaveURL(/.*\/results/);
  await expect(page.locator('text=Comparison Results')).toBeVisible();
});
```

### Pattern 4: Authentication Flow Testing

```typescript
// ✅ CORRECT - Testing login and protected routes
test('user login workflow', async ({ page }) => {
  await page.goto('http://localhost:3000/login');

  // Fill credentials
  await page.fill('input[type="email"]', 'user@example.com');
  await page.fill('input[type="password"]', 'password123');

  // Submit login
  await page.click('button:has-text("Login")');

  // Wait for redirect to dashboard
  await expect(page).toHaveURL('**/dashboard');

  // Verify authenticated content
  await expect(page.locator('text=Welcome, User')).toBeVisible();
});

test('unauthenticated users cannot access dashboard', async ({ page }) => {
  // Try to navigate to protected route
  await page.goto('http://localhost:3000/dashboard');

  // Should redirect to login
  await expect(page).toHaveURL('**/login');
});
```

### Pattern 5: API Response Interception

```typescript
// ✅ CORRECT - Intercept and mock API responses
test('handle API errors gracefully', async ({ page }) => {
  // Intercept API calls
  await page.route('**/api/products/**', (route) => {
    if (route.request().method() === 'GET') {
      route.abort('failed');
    } else {
      route.continue();
    }
  });

  await page.goto('http://localhost:3000');

  // Verify error handling
  await expect(page.locator('text=Failed to load products')).toBeVisible();
});

test('verify API response in browser', async ({ page }) => {
  let apiResponse: any;

  page.on('response', (response) => {
    if (response.url().includes('/api/products')) {
      apiResponse = response;
    }
  });

  await page.goto('http://localhost:3000');
  await page.waitForSelector('[data-testid="product-list"]');

  expect(apiResponse.status()).toBe(200);
});
```

### Pattern 6: Multi-page Workflow Testing

```typescript
// ✅ CORRECT - Full user workflow across multiple pages
test('complete product comparison workflow', async ({ page }) => {
  // Step 1: Search for products
  await page.goto('http://localhost:3000');
  await page.fill('input[placeholder="Search"]', 'laptop');
  await page.click('button:has-text("Search")');

  // Step 2: Select first product
  await page.click('[data-testid="product-result"]:first-child');
  await expect(page).toHaveURL(/.*\/products\/\d+/);

  // Step 3: Add to comparison
  await page.click('button:has-text("Add to Comparison")');
  await expect(page.locator('text=Added to comparison')).toBeVisible();

  // Step 4: Navigate to comparison page
  await page.click('a:has-text("View Comparison")');
  await expect(page).toHaveURL('**/compare');

  // Step 5: Verify comparison data
  await expect(page.locator('[data-testid="comparison-table"]')).toBeVisible();
});
```

### Pattern 7: Screenshot & Visual Testing

```typescript
// ✅ CORRECT - Visual regression testing
import { test, expect } from '@playwright/test';

test('verify product page layout', async ({ page }) => {
  await page.goto('http://localhost:3000/products/123');

  // Wait for content to load
  await page.waitForLoadState('networkidle');

  // Take screenshot for visual regression
  await expect(page).toHaveScreenshot('product-page.png');
});

test('verify responsive design on mobile', async ({ browser }) => {
  const context = await browser.newContext({
    viewport: { width: 375, height: 667 }, // iPhone size
  });
  const page = await context.newPage();

  await page.goto('http://localhost:3000');
  await expect(page).toHaveScreenshot('mobile-home.png');

  await context.close();
});
```

### Pattern 8: Advanced Selectors & Waits

```typescript
// ✅ CORRECT - Robust element selection and waiting
test('wait for dynamic content', async ({ page }) => {
  await page.goto('http://localhost:3000');

  // Wait for specific element with custom timeout
  await page.waitForSelector('[data-testid="loading-spinner"]', {
    timeout: 5000,
  });

  // Wait for element to be hidden
  await page.waitForSelector('[data-testid="loading-spinner"]', {
    state: 'hidden',
  });

  // Use locator with retry logic
  const productName = page.locator('text=Product Name');
  await expect(productName).toBeVisible();

  // Get element text
  const text = await productName.textContent();
  expect(text).toContain('Expected Text');
});

test('interact with dynamic lists', async ({ page }) => {
  await page.goto('http://localhost:3000/products');

  // Wait for list to load
  await page.waitForSelector('[data-testid="product-item"]');

  // Count items
  const items = page.locator('[data-testid="product-item"]');
  const count = await items.count();
  expect(count).toBeGreaterThan(0);

  // Iterate and interact
  for (let i = 0; i < count; i++) {
    const item = items.nth(i);
    const name = await item
      .locator('[data-testid="product-name"]')
      .textContent();
    console.log(`Product ${i}: ${name}`);
  }
});
```

---

## Test Configuration

### playwright.config.ts Setup

```typescript
// ✅ CORRECT - Comprehensive Playwright configuration
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './test/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
  ],
  webServer: {
    command: 'npm run start:dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
});
```

---

## Common Mistakes ❌

### ❌ DO NOT: Hard-coded waits

```typescript
// ❌ WRONG - Brittle test with arbitrary waits
test('bad test', async ({ page }) => {
  await page.goto('http://localhost:3000');
  await page.waitForTimeout(2000); // ← BAD: Arbitrary wait
  await page.click('button');
});

// ✅ CORRECT - Wait for specific condition
test('good test', async ({ page }) => {
  await page.goto('http://localhost:3000');
  await page.waitForLoadState('networkidle');
  await page.click('button:visible');
});
```

### ❌ DO NOT: Overly specific selectors

```typescript
// ❌ WRONG - Fragile selector
test('bad selector', async ({ page }) => {
  await page.click('body > div > section > div:nth-child(2) > button');
});

// ✅ CORRECT - Use data-testid or semantic selectors
test('good selector', async ({ page }) => {
  await page.click('[data-testid="submit-button"]');
  // or
  await page.click('button:has-text("Submit")');
});
```

### ❌ DO NOT: Missing waits for navigation

```typescript
// ❌ WRONG - Race condition
test('bad navigation', async ({ page }) => {
  await page.click('a[href="/products"]');
  // ← Page might not be loaded yet
  await expect(page).toHaveURL('**/products');
});

// ✅ CORRECT - Wait for navigation
test('good navigation', async ({ page }) => {
  await Promise.all([
    page.waitForNavigation(),
    page.click('a[href="/products"]'),
  ]);
  await expect(page).toHaveURL('**/products');
});
```

### ❌ DO NOT: Coupling tests to implementation

```typescript
// ❌ WRONG - Tests break if HTML structure changes
test('bad coupling', async ({ page }) => {
  await page.goto('http://localhost:3000');
  const inputs = page.locator('input');
  await inputs.nth(0).fill('email@example.com');
  await inputs.nth(2).fill('password123');
});

// ✅ CORRECT - Use semantic selectors
test('good decoupling', async ({ page }) => {
  await page.goto('http://localhost:3000');
  await page.fill('input[type="email"]', 'email@example.com');
  await page.fill('input[type="password"]', 'password123');
});
```

---

## Best Practices ✅

1. **Use data-testid attributes**: Add `data-testid` to important elements for reliable selection
2. **Page Object Model**: Extract page interactions into reusable page classes
3. **Explicit waits**: Always wait for specific conditions, never arbitrary timeouts
4. **Semantic selectors**: Use role-based or data-testid selectors, avoid nth-child
5. **Test isolation**: Each test should be independent and not rely on other tests
6. **CI/CD integration**: Configure Playwright for parallel execution and retries
7. **Visual testing**: Use screenshots for regression testing, not just state checks
8. **API mocking**: Intercept API calls for testing edge cases and error scenarios

---

## Running Tests

```bash
# Run all Playwright tests
npx playwright test

# Run tests in UI mode (interactive)
npx playwright test --ui

# Run tests in headed mode (see browser)
npx playwright test --headed

# Run specific test file
npx playwright test test/e2e/search.spec.ts

# Run tests matching pattern
npx playwright test --grep "search"

# Run tests with debugging
npx playwright test --debug

# Generate HTML report
npx playwright show-report
```

---

## Integration with NestJS Testing

```typescript
// ✅ CORRECT - E2E tests using real NestJS application
import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from '@/app.module';
import { test, expect } from '@playwright/test';

let app: INestApplication;

test.beforeAll(async () => {
  const moduleFixture: TestingModule = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();

  app = moduleFixture.createNestApplication();
  await app.listen(3000);
});

test.afterAll(async () => {
  await app.close();
});

test('verify API integration', async ({ page }) => {
  await page.goto('http://localhost:3000');

  // Verify that page content matches API data
  const productName = await page
    .locator('[data-testid="product-name"]')
    .first()
    .textContent();
  expect(productName).toBeTruthy();
});
```

---

## Additional Resources

- [Playwright Official Documentation](https://playwright.dev)
- [Playwright Best Practices](https://playwright.dev/docs/best-practices)
- [Locators Guide](https://playwright.dev/docs/locators)
- [Debugging Tests](https://playwright.dev/docs/debug)
- [CI/CD Integration](https://playwright.dev/docs/ci)
