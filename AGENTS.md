# Wise Compare Hub API - Agent Instructions

## 🎯 Quick Reference (Read This First)

**You are**: Senior Backend Engineer | NestJS + Hexagonal Architecture + TDD

**CRITICAL RULES** (Never violate):

1. 🔴 **TDD MANDATORY**: Write failing test BEFORE any production code
2. 🏛️ **Dependencies Flow Inward**: Infrastructure → Application → Domain
3. 🚫 **Domain = Pure TypeScript**: NO framework dependencies in domain
4. ✅ **Validate Before Complete**: Run `pnpm verify` - all must pass
5. 📍 **Constants Only**: Never hardcode business values

**Quick Decision Tree**:

```
Business Logic? → Domain Layer (pure TS, test first)
Use Case/Orchestration? → Application Layer (ports, test with mocks)
HTTP/DB/External? → Infrastructure Layer (adapters, integration tests)
```

---

## ⚠️ Absolute Prohibitions

**NEVER**:

- ❌ Use `any` type
- ❌ Use `@ts-ignore` / `@ts-expect-error`
- ❌ Write production code without failing test first
- ❌ Import infrastructure/application in domain layer
- ❌ Hardcode business values (use constants)
- ❌ Expose sensitive data in responses
- ❌ Skip validation (`pnpm verify`)

---

## 📁 Project Structure

```
src/contexts/{context}/
├── domain/              # 🔵 Pure Business Logic (NO dependencies)
│   ├── models/         # Entities, Value Objects
│   ├── services/       # Domain Services
│   └── constants/      # Domain business rules
├── application/         # 🟢 Use Cases (Framework agnostic)
│   ├── ports/
│   │   ├── input/     # Use case interfaces
│   │   └── output/    # Repository interfaces
│   ├── use-cases/     # Implementations
│   └── dto/           # Commands/Queries
└── infrastructure/      # 🟡 Adapters (Framework specific)
    ├── adapters/
    │   ├── http/      # Controllers + DTOs
    │   └── persistence/ # Repositories + ORM
    └── {context}.module.ts

src/shared/              # Shared across contexts
src/common/              # Technical utilities + constants
```

**Dependency Rule**: `Infrastructure → Application → Domain` (NEVER reverse)

---

## 🔴🟢🔵 TDD Workflow (MANDATORY)

### Red-Green-Refactor Cycle

Every feature MUST follow:

1. **🔴 RED**: Write failing test
2. **🟢 GREEN**: Minimal code to pass
3. **🔵 REFACTOR**: Improve while tests stay green

### Implementation Order (Inside-Out)

```
1. Domain Layer
   🔴 Test Value Object → 🟢 Implement → 🔵 Refactor
   🔴 Test Entity → 🟢 Implement → 🔵 Refactor

2. Application Layer
   🔴 Test Use Case (mock repos) → 🟢 Define Port → 🟢 Implement → 🔵 Refactor

3. Infrastructure Layer
   🔴 Test Repository → 🟢 Implement Adapter → 🔵 Refactor
   🔴 Test Controller → 🟢 Implement → 🔵 Refactor

4. E2E Test
   🔴 Test Complete Flow → 🟢 Verify Integration
```

**Checkpoint**: Never write code without a failing test first!

---

## 📋 Code Patterns (By Layer)

### Domain Layer (Pure TypeScript)

```typescript
// Value Object
export class ProductId {
  constructor(public readonly value: string) {
    if (!value) throw new Error('ProductId cannot be empty');
  }
}

// Entity
export class Product {
  constructor(
    public readonly id: ProductId,
    public readonly name: ProductName,
    public readonly price: Money,
  ) {}

  updatePrice(newPrice: Money): Product {
    if (newPrice.value <= 0) throw new InvalidPriceError();
    return new Product(this.id, this.name, newPrice);
  }
}

// Test (write FIRST)
describe('Product', () => {
  it('should update price when valid', () => {
    const product = createTestProduct();
    const updated = product.updatePrice(new Money(100, 'USD'));
    expect(updated.price.value).toBe(100);
  });
});
```

**Rules**:

- ✅ Pure TypeScript classes
- ✅ Immutable objects
- ✅ Business logic here
- ❌ NO decorators (@Injectable, etc.)
- ❌ NO imports from application/infrastructure

---

### Application Layer (Use Cases)

```typescript
// Input Port (interface)
export interface CreateProductUseCase {
  execute(command: CreateProductCommand): Promise<Product>;
}

// Output Port (repository interface)
export interface ProductRepository {
  save(product: Product): Promise<void>;
  findById(id: ProductId): Promise<Product | null>;
}

// Use Case Implementation
@Injectable()
export class CreateProductService implements CreateProductUseCase {
  constructor(
    @Inject('ProductRepository')
    private readonly repo: ProductRepository,
  ) {}

  async execute(cmd: CreateProductCommand): Promise<Product> {
    const product = new Product(
      new ProductId(randomUUID()),
      new ProductName(cmd.name),
      new Money(cmd.price, 'USD'),
    );
    await this.repo.save(product);
    return product;
  }
}

// Test with Mock (write FIRST)
describe('CreateProductService', () => {
  let service: CreateProductService;
  let mockRepo: jest.Mocked<ProductRepository>;

  beforeEach(() => {
    mockRepo = { save: jest.fn(), findById: jest.fn() };
    service = new CreateProductService(mockRepo);
  });

  it('should create and save product', async () => {
    const cmd = new CreateProductCommand('Laptop', 1000);
    const result = await service.execute(cmd);

    expect(result.name.value).toBe('Laptop');
    expect(mockRepo.save).toHaveBeenCalledWith(expect.any(Product));
  });
});
```

**Rules**:

- ✅ Define ports (interfaces)
- ✅ Orchestrate domain logic
- ✅ Test with mocked dependencies
- ❌ NO business logic here
- ❌ NO infrastructure imports

---

### Infrastructure Layer (Adapters)

```typescript
// HTTP Adapter (Controller)
@Controller('products')
export class ProductsController {
  constructor(
    @Inject('CreateProductUseCase')
    private readonly createUseCase: CreateProductUseCase,
  ) {}

  @Post()
  async create(@Body() dto: CreateProductDto): Promise<ProductResponseDto> {
    const cmd = new CreateProductCommand(dto.name, dto.price);
    const product = await this.createUseCase.execute(cmd);
    return { id: product.id.value, name: product.name.value };
  }
}

// DTO with Validation
export class CreateProductDto {
  @IsString()
  @MinLength(3)
  readonly name: string;

  @IsNumber()
  @Min(0.01)
  readonly price: number;
}

// Persistence Adapter (Repository)
@Injectable()
export class TypeOrmProductRepository implements ProductRepository {
  constructor(
    @InjectRepository(ProductEntity)
    private readonly repo: Repository<ProductEntity>,
  ) {}

  async save(product: Product): Promise<void> {
    await this.repo.save(this.toEntity(product));
  }

  private toEntity(product: Product): ProductEntity {
    return {
      id: product.id.value,
      name: product.name.value,
      price: product.price.value,
    };
  }
}

// Module Configuration
@Module({
  imports: [TypeOrmModule.forFeature([ProductEntity])],
  controllers: [ProductsController],
  providers: [
    { provide: 'CreateProductUseCase', useClass: CreateProductService },
    { provide: 'ProductRepository', useClass: TypeOrmProductRepository },
  ],
})
export class ProductModule {}
```

**Rules**:

- ✅ Implement ports from application layer
- ✅ Use NestJS decorators here
- ✅ Map between Domain ↔ Infrastructure
- ✅ Validate all inputs (DTOs)
- ❌ NO business logic here

---

## 🔧 Constants Management

```typescript
// Domain Constants (src/contexts/product/domain/constants/)
export const PRODUCT_RULES = {
  MIN_PRICE: 0.01,
  MAX_NAME_LENGTH: 100,
  ALLOWED_CURRENCIES: ['USD', 'EUR'] as const,
} as const;

// Technical Constants (src/common/constants/business-rules.ts)
export const PAGINATION = {
  DEFAULT_LIMIT: 10,
  MAX_LIMIT: 100,
} as const;

export const RATE_LIMITS = {
  API_CALLS_PER_MINUTE: 100,
} as const;
```

**Rule**: Business logic constants in domain, technical constants in common.

---

## 📦 Import Rules

```typescript
// ✅ Domain Layer - Only domain or shared domain
import { Money } from './money.vo';
import { DomainException } from '@shared/domain/exceptions';

// ✅ Application Layer - Domain imports OK
import { Product } from '@contexts/product/domain/models/product.entity';
import { ProductRepository } from '../ports/output/product.repository';

// ✅ Infrastructure Layer - All imports OK
import { CreateProductUseCase } from '@contexts/product/application/ports/input';
import { Product } from '@contexts/product/domain/models/product.entity';
import { PAGINATION } from '@common/constants/business-rules';

// ❌ Domain Layer - FORBIDDEN
import { ProductRepository } from '../../infrastructure/...'; // NEVER!
import { CreateProductDto } from '../../infrastructure/...'; // NEVER!
```

---

## 🧪 Testing Checklist

**Before considering task complete**:

- [ ] 🔴 Did I write the test FIRST?
- [ ] Domain tests pass (no mocks)?
- [ ] Application tests pass (with mocks)?
- [ ] Integration tests pass (real DB)?
- [ ] E2E tests pass?
- [ ] `pnpm verify` passes (lint, build, tests)?
- [ ] No hardcoded values?
- [ ] Dependencies flow inward?

---

## ✅ Validation Process

**Execute before reporting complete**:

```bash
pnpm verify
```

This runs:

1. Lint → Must pass
2. Format check → Must pass
3. Security audit → No critical issues
4. Build → 0 type errors
5. Unit tests → All pass
6. E2E tests → All pass

**Report**: Show output explicitly. Task is NOT complete if any fail.

---

## 🚦 Example: Add "Apply Discount" Feature (TDD)

### Step 1: Domain (Test First)

```typescript
// 🔴 RED - Write failing test
describe('Product.applyDiscount', () => {
  it('should reduce price by percentage', () => {
    const product = createTestProduct({ price: 100 });
    const discounted = product.applyDiscount(new Discount(10));
    expect(discounted.price.value).toBe(90);
  });
});

// 🟢 GREEN - Implement
export class Product {
  applyDiscount(discount: Discount): Product {
    const newPrice = this.price.reduce(discount.percentage);
    return new Product(this.id, this.name, newPrice);
  }
}

// 🔵 REFACTOR - Add validation
export class Discount {
  constructor(public readonly percentage: number) {
    if (percentage < 0 || percentage > 100) {
      throw new InvalidDiscountError();
    }
  }
}
```

### Step 2: Application (Test First)

```typescript
// 🔴 RED - Write failing test
describe('ApplyDiscountService', () => {
  it('should apply discount and save', async () => {
    mockRepo.findById.mockResolvedValue(createTestProduct());
    const cmd = new ApplyDiscountCommand('123', 10);

    await service.execute(cmd);

    expect(mockRepo.save).toHaveBeenCalled();
  });
});

// 🟢 GREEN - Implement use case
@Injectable()
export class ApplyDiscountService {
  async execute(cmd: ApplyDiscountCommand): Promise<Product> {
    const product = await this.repo.findById(new ProductId(cmd.id));
    if (!product) throw new ProductNotFoundError();

    const discounted = product.applyDiscount(new Discount(cmd.percentage));
    await this.repo.save(discounted);
    return discounted;
  }
}
```

### Step 3: Infrastructure (Test First)

```typescript
// 🔴 RED - Write failing controller test
it('should apply discount via HTTP', async () => {
  const result = await controller.applyDiscount('123', { percentage: 10 });
  expect(result.price).toBeLessThan(100);
});

// 🟢 GREEN - Implement controller
@Patch(':id/discount')
async applyDiscount(
  @Param('id') id: string,
  @Body() dto: ApplyDiscountDto,
) {
  const cmd = new ApplyDiscountCommand(id, dto.percentage);
  const product = await this.useCase.execute(cmd);
  return this.toDto(product);
}
```

### Step 4: E2E

```typescript
it('should apply discount end-to-end', () => {
  return request(app.getHttpServer())
    .patch('/products/123/discount')
    .send({ percentage: 10 })
    .expect(200);
});
```

---

## 🎯 Workflow Summary

1. **Understand**: Which context? Which layer?
2. **TDD - Domain**: 🔴 Test → 🟢 Implement → 🔵 Refactor
3. **TDD - Application**: 🔴 Test (mocks) → 🟢 Ports + Use Case → 🔵 Refactor
4. **TDD - Infrastructure**: 🔴 Test → 🟢 Adapters → 🔵 Refactor
5. **E2E**: Test complete flow
6. **Validate**: `pnpm verify`
7. **Report**: Show results

---

## 📚 Key Principles

**Architecture**:

- Domain = Pure business logic (no deps)
- Application = Use cases (framework agnostic)
- Infrastructure = Adapters (NestJS, TypeORM, etc.)

**TDD**:

- Always test first (Red-Green-Refactor)
- Domain: pure unit tests
- Application: unit tests with mocks
- Infrastructure: integration tests

**Quality**:

- No `any` type
- No hardcoded values
- All DTOs validated
- All errors handled
- Dependencies flow inward

**Security**:

- Hash passwords (bcrypt)
- Use guards (JWT)
- Rate limit sensitive endpoints
- Never expose secrets
- Validate all inputs

---

## ❓ Quick Decisions

**Business rule validation?** → Domain layer
**Orchestrating multiple operations?** → Application layer
**HTTP request handling?** → Infrastructure layer (Controller)
**Database access?** → Infrastructure layer (Repository)
**Shared across contexts?** → Shared kernel
**Technical utility?** → Common

**Remember**: Test FIRST, implement SECOND, validate ALWAYS.
