---
name: jest
description: >
  Unit and integration testing framework for TypeScript/NestJS.
  Trigger: When writing unit tests, integration tests, or test fixtures for domain/application/infrastructure layers.
license: Apache-2.0
metadata:
  author: Wise Compare Hub
  version: '1.0'
  scope: [test]
  auto_invoke: 'Writing unit tests for domain/application logic'
allowed-tools: Read, Edit, Write, Glob, Grep, Bash, Task
---

## ⚠️ CRITICAL: Always Consult Context7 MCP

**BEFORE writing any tests:**

1. 🔍 Check existing tests in `test/` and `src/**/*.spec.ts`
2. 📋 Review `Context7 MCP` documentation for test patterns
3. ✅ Follow existing test structure and conventions
4. 🚫 NEVER duplicate existing test suites

**Reference:** `Context7 MCP` contains the authoritative testing patterns and test setup for this project.

---

## When to Use

Use this skill when:

- Writing unit tests for domain layer (entities, value objects)
- Writing unit tests for application layer (use cases, services)
- Writing integration tests for repositories
- Creating test fixtures and mocks
- Setting up test modules with `@nestjs/testing`
- Testing error handling and exceptions

---

## Critical Patterns

### Pattern 1: Unit Test Structure (Domain Layer)

```typescript
// ✅ CORRECT - Simple domain entity test
describe('Product Entity', () => {
  it('should create product with valid data', () => {
    const product = new Product(new ProductId('1'), 'Laptop', 100);

    expect(product.id.value).toBe('1');
    expect(product.name).toBe('Laptop');
    expect(product.price).toBe(100);
  });

  it('should throw error when price is invalid', () => {
    expect(() => {
      new Product(new ProductId('1'), 'Laptop', -10);
    }).toThrow(InvalidPriceError);
  });
});
```

### Pattern 2: Service Test with Mocks (Application Layer)

```typescript
// ✅ CORRECT - Service test with mocked repository
describe('CreateProductService', () => {
  let service: CreateProductService;
  let mockRepository: jest.Mocked<ProductRepository>;

  beforeEach(() => {
    mockRepository = {
      save: jest.fn(),
      findById: jest.fn(),
    };
    service = new CreateProductService(mockRepository);
  });

  it('should create and save product', async () => {
    const command = new CreateProductCommand('Laptop', 1000);

    const result = await service.execute(command);

    expect(result.name).toBe('Laptop');
    expect(mockRepository.save).toHaveBeenCalledWith(expect.any(Product));
  });

  it('should throw when repository fails', async () => {
    mockRepository.save.mockRejectedValue(new Error('DB Error'));

    await expect(
      service.execute(new CreateProductCommand('Laptop', 1000)),
    ).rejects.toThrow('DB Error');
  });
});
```

### Pattern 3: Integration Test (Infrastructure Layer)

```typescript
// ✅ CORRECT - Integration test with real database
describe('TypeOrmProductRepository (Integration)', () => {
  let repository: TypeOrmProductRepository;
  let typeormRepository: Repository<ProductEntity>;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRoot(testDbConfig),
        TypeOrmModule.forFeature([ProductEntity]),
      ],
      providers: [TypeOrmProductRepository],
    }).compile();

    repository = module.get(TypeOrmProductRepository);
    typeormRepository = module.get(getRepositoryToken(ProductEntity));
  });

  it('should save and retrieve product', async () => {
    const product = new Product(new ProductId('1'), 'Laptop', 1000);

    await repository.save(product);
    const found = await repository.findById(product.id);

    expect(found).toEqual(product);
  });
});
```

### Pattern 4: Test Module with NestJS Testing

```typescript
// ✅ CORRECT - Test module setup
beforeEach(async () => {
  const moduleFixture: TestingModule = await Test.createTestingModule({
    controllers: [ProductController],
    providers: [
      { provide: 'CreateProductUseCase', useClass: CreateProductService },
      { provide: 'ProductRepository', useClass: MockProductRepository },
    ],
  }).compile();

  controller = moduleFixture.get<ProductController>(ProductController);
});
```

---

## Decision Tree

```
Writing tests?
  ├─ Domain layer (entities, value objects)?
  │  └─ Pure unit tests, no mocks
  │     → Test logic, edge cases, errors
  │
  ├─ Application layer (use cases, services)?
  │  └─ Unit tests with mocked repositories
  │     → Mock dependencies, test orchestration
  │
  └─ Infrastructure layer (repositories, controllers)?
     └─ Integration tests with real resources
        → Use Test.createTestingModule()
        → May need test database
```

---

## Common Patterns

### Describe & It Structure

```typescript
describe('Feature/Component', () => {
  describe('specific functionality', () => {
    it('should do X when Y', () => {
      // Arrange
      const input = setup();

      // Act
      const result = execute(input);

      // Assert
      expect(result).toBe(expected);
    });
  });
});
```

### Mock Setup

```typescript
// Mock function
const mockFn = jest.fn();
mockFn.mockReturnValue(value);
mockFn.mockResolvedValue(promise);
mockFn.mockRejectedValue(error);

// Verify calls
expect(mockFn).toHaveBeenCalled();
expect(mockFn).toHaveBeenCalledWith(arg);
expect(mockFn).toHaveBeenCalledTimes(1);
```

### Setup & Teardown

```typescript
describe('Suite', () => {
  beforeEach(() => {
    // Run before each test
  });

  afterEach(() => {
    // Run after each test
  });

  beforeAll(() => {
    // Run once before all tests
  });

  afterAll(() => {
    // Run once after all tests
  });
});
```

---

## Commands

```bash
pnpm test                    # Run all tests
pnpm test:watch             # Run tests in watch mode
pnpm test:cov               # Run tests with coverage
pnpm test -- --testFile=name   # Run specific test file
pnpm test -- --testNamePattern="name"  # Run tests matching pattern
```

---

## Best Practices

✅ **Test names are descriptive**: "should create product with valid data" (not "test product")
✅ **Arrange-Act-Assert pattern**: Clear test structure
✅ **One assertion per test** (or related assertions)
✅ **Mock external dependencies**: Database, APIs, services
✅ **Test both happy path and error cases**
✅ **Use meaningful variable names** in tests
✅ **Keep tests focused and isolated**

---

## Common Mistakes

❌ Testing implementation details instead of behavior
❌ Overly complex mocks that mirror real implementation
❌ Tests that depend on other tests
❌ Not testing error cases
❌ Async tests without proper await
❌ Hardcoded test data instead of factories
❌ Tests that take too long to run

---

## Test File Structure

```
test/
├── jest-e2e.json         # E2E test configuration
└── integration/          # Integration tests (optional)

src/
└── {context}/
    ├── domain/
    │   └── **/*.spec.ts  # Domain unit tests
    ├── application/
    │   └── **/*.spec.ts  # Application unit tests
    └── infrastructure/
        └── **/*.spec.ts  # Infrastructure integration tests
```

---

## Resources

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [NestJS Testing](https://docs.nestjs.com/fundamentals/testing)
- [Jest Configuration](https://jestjs.io/docs/configuration)
- [Testing Best Practices](https://testingjavascript.com/)
