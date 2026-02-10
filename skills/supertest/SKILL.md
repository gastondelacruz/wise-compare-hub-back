---
name: supertest
description: >
  E2E testing library for HTTP endpoints and NestJS applications.
  Trigger: When writing end-to-end tests for API endpoints, testing HTTP responses, status codes, and request/response cycles.
license: Apache-2.0
metadata:
  author: Wise Compare Hub
  version: '1.0'
  scope: [test]
  auto_invoke: 'Writing E2E tests for endpoints'
allowed-tools: Read, Edit, Write, Glob, Grep, Bash, Task
---

## ⚠️ CRITICAL: Always Consult Context7 MCP

**BEFORE writing any E2E tests:**

1. 🔍 Check existing E2E tests in `test/` directory
2. 📋 Review `Context7 MCP` documentation for E2E test patterns
3. ✅ Follow existing test structure and endpoint testing conventions
4. 🚫 NEVER test internal implementation details in E2E tests

**Reference:** `Context7 MCP` contains the authoritative E2E test patterns for this project.

---

## When to Use

Use this skill when:

- Testing HTTP endpoints (GET, POST, PUT, DELETE)
- Testing request validation and error responses
- Testing authentication and authorization
- Testing complete request/response cycles
- Testing API contracts and response formats
- Testing edge cases and error handling at API level

---

## Critical Patterns

### Pattern 1: Basic E2E Test

```typescript
// ✅ CORRECT - E2E test structure
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';

describe('ProductController (E2E)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('GET /products/:id', () => {
    it('should return product by id', () => {
      return request(app.getHttpServer())
        .get('/products/1')
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('id');
          expect(res.body).toHaveProperty('name');
          expect(res.body.id).toBe('1');
        });
    });

    it('should return 404 for non-existent product', () => {
      return request(app.getHttpServer())
        .get('/products/999')
        .expect(404)
        .expect((res) => {
          expect(res.body).toHaveProperty('error');
        });
    });
  });
});
```

### Pattern 2: POST Request Testing

```typescript
// ✅ CORRECT - Testing POST with validation
describe('POST /products', () => {
  it('should create product with valid data', () => {
    return request(app.getHttpServer())
      .post('/products')
      .send({
        name: 'New Laptop',
        price: 1000,
      })
      .expect(201)
      .expect((res) => {
        expect(res.body).toHaveProperty('id');
        expect(res.body.name).toBe('New Laptop');
        expect(res.body.price).toBe(1000);
      });
  });

  it('should reject with invalid data', () => {
    return request(app.getHttpServer())
      .post('/products')
      .send({
        name: '', // Empty name
        price: -100, // Negative price
      })
      .expect(400)
      .expect((res) => {
        expect(res.body.error).toBeDefined();
      });
  });
});
```

### Pattern 3: Authentication Testing

```typescript
// ✅ CORRECT - Testing with authentication
describe('Protected Routes', () => {
  let token: string;

  beforeAll(async () => {
    const loginRes = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: 'user@example.com',
        password: 'password123',
      });

    token = loginRes.body.accessToken;
  });

  it('should require authentication', () => {
    return request(app.getHttpServer()).get('/products').expect(401);
  });

  it('should access with valid token', () => {
    return request(app.getHttpServer())
      .get('/products')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
  });

  it('should reject invalid token', () => {
    return request(app.getHttpServer())
      .get('/products')
      .set('Authorization', 'Bearer invalid-token')
      .expect(401);
  });
});
```

### Pattern 4: Request Chain Testing

```typescript
// ✅ CORRECT - Testing complete workflows
describe('Product Workflow', () => {
  let createdProductId: string;

  it('should create, retrieve, and update product', async () => {
    // Create
    const createRes = await request(app.getHttpServer())
      .post('/products')
      .send({
        name: 'Test Product',
        price: 100,
      })
      .expect(201);

    createdProductId = createRes.body.id;

    // Retrieve
    await request(app.getHttpServer())
      .get(`/products/${createdProductId}`)
      .expect(200)
      .expect((res) => {
        expect(res.body.name).toBe('Test Product');
      });

    // Update
    await request(app.getHttpServer())
      .put(`/products/${createdProductId}`)
      .send({
        price: 150,
      })
      .expect(200);

    // Verify update
    await request(app.getHttpServer())
      .get(`/products/${createdProductId}`)
      .expect(200)
      .expect((res) => {
        expect(res.body.price).toBe(150);
      });
  });
});
```

---

## Decision Tree

```
Testing HTTP endpoint?
  ├─ Success case (2xx status)?
  │  └─ Test successful response
  │     → Check status code
  │     → Verify response format
  │     → Validate data
  │
  ├─ Client error (4xx status)?
  │  └─ Test error handling
  │     → Check error message
  │     → Verify error format
  │
  └─ Server error (5xx status)?
     └─ Test error response
        → Check status code
        → Verify error details
```

---

## Common Patterns

### HTTP Methods

```typescript
// GET
request(app.getHttpServer()).get('/products');

// POST
request(app.getHttpServer()).post('/products').send(data);

// PUT
request(app.getHttpServer()).put(`/products/${id}`).send(data);

// PATCH
request(app.getHttpServer()).patch(`/products/${id}`).send(data);

// DELETE
request(app.getHttpServer()).delete(`/products/${id}`);
```

### Request Building

```typescript
request(app.getHttpServer())
  .post('/products')
  .set('Authorization', `Bearer ${token}`) // Headers
  .set('Content-Type', 'application/json')
  .send(data) // Body
  .query({ page: 1, limit: 10 }) // Query params
  .expect(200) // Status code
  .expect((res) => {
    // Assertions
    expect(res.body).toBeDefined();
  });
```

### Response Validation

```typescript
request(app.getHttpServer())
  .get('/products')
  .expect('Content-Type', /json/) // Header check
  .expect(200) // Status code
  .expect((res) => {
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
  });
```

---

## Test File Configuration

```typescript
// test/jest-e2e.json
{
  "moduleFileExtensions": ["js", "json", "ts"],
  "rootDir": ".",
  "testEnvironment": "node",
  "testRegex": ".e2e-spec.ts$",
  "transform": {
    "^.+\\.(t|j)s$": "ts-jest"
  }
}
```

---

## Commands

```bash
pnpm test:e2e           # Run E2E tests
pnpm test:e2e --watch  # Run E2E tests in watch mode
pnpm test:e2e --file   # Run specific E2E test file
```

---

## Best Practices

✅ **Test complete workflows** - Create, read, update, delete
✅ **Test both success and error cases**
✅ **Use realistic test data** - Close to production scenarios
✅ **Clean up after tests** - Avoid side effects
✅ **Test authentication** - Authorized and unauthorized requests
✅ **Verify response format** - Status codes, headers, body
✅ **Test edge cases** - Invalid inputs, missing fields

---

## Common Mistakes

❌ Testing internal implementation details
❌ Hardcoding response values in tests
❌ Not cleaning up test data
❌ Missing error case testing
❌ Testing without authentication where needed
❌ Not verifying response structure
❌ Slow tests that depend on database operations
❌ Tests that pass with wrong data

---

## Setup Patterns

```typescript
// ✅ CORRECT - Proper setup/teardown
describe('E2E Tests', () => {
  let app: INestApplication;
  let dataSource: DataSource;

  beforeAll(async () => {
    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    dataSource = moduleFixture.get<DataSource>(DataSource);
    await app.init();
  });

  beforeEach(async () => {
    // Clear database before each test
    await clearDatabase(dataSource);
  });

  afterAll(async () => {
    await dataSource.destroy();
    await app.close();
  });
});
```

---

## Resources

- [Supertest Documentation](https://github.com/visionmedia/supertest)
- [NestJS E2E Testing](https://docs.nestjs.com/fundamentals/testing#end-to-end-testing)
- [HTTP Testing Best Practices](https://www.postman.com/api-platform/api-testing/)
- [API Testing Strategies](https://testingjavascript.com/)
