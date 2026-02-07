# Wise Compare Hub API - Agent Instructions

## 🎯 Quick Reference (Read This First)

**You are**: Senior Backend Engineer | NestJS + Hexagonal Architecture + TDD

**CRITICAL RULES** (Never violate):

1. 🔴 **TDD MANDATORY**: Write failing test BEFORE any production code
2. 🏛️ **Dependencies Flow Inward**: Infrastructure → Application → Domain
3. 🚫 **Domain = Pure TypeScript**: NO framework dependencies in domain
4. ✅ **Validate Before Complete**: Run `pnpm verify` - all must pass
5. 📍 **Constants Only**: Never hardcode business values
6. 🎯 **Controllers = Thin Layer**: Only coordinate, never contain logic
7. 🛡️ **Exception Filters**: Controllers NEVER handle exceptions

**Quick Decision Tree**:

```
Business Logic? → Domain Layer (pure TS, test first)
Use Case/Orchestration? → Application Layer (ports, test with mocks)
HTTP/DB/External? → Infrastructure Layer (adapters, integration tests)
Token/Auth Logic? → Guard + Decorator (NOT in controller)
Exception Handling? → ExceptionFilter (NOT in controller)
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
- ❌ Put business logic in controllers
- ❌ Handle exceptions in controllers (use ExceptionFilters)
- ❌ Inject repositories directly in controllers
- ❌ Decode tokens or perform auth logic in controllers

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
    │   ├── http/      # Controllers + DTOs + Guards + Filters
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

#### Controller Rules (CRITICAL)

**Controllers ONLY**:

- ✅ Receive HTTP requests
- ✅ Validate DTOs (class-validator)
- ✅ Map DTO → Command/Query
- ✅ Call Use Case
- ✅ Map Domain → Response DTO
- ✅ Return HTTP response

**Controllers NEVER**:

- ❌ Contain business logic
- ❌ Handle exceptions (ALL exceptions handled by ExceptionFilters - MANDATORY)
- ❌ Use try-catch blocks (let exceptions propagate to ExceptionFilters)
- ❌ Throw HttpException manually (ExceptionFilters map domain errors)
- ❌ Inject repositories directly
- ❌ Decode tokens (use Guards/Decorators)
- ❌ Save data directly
- ❌ Transform complex data structures
- ❌ Make decisions based on domain data

**Exception Handling Pattern**:

```typescript
// ✅ CORRECT - Let exceptions propagate
async getById(@Param('id') id: string): Promise<ProductResponseDto> {
  const product = await this.useCase.execute(id);
  return ProductResponseDto.fromDomain(product);
}

// ❌ WRONG - Handling exceptions in controller
async getById(@Param('id') id: string): Promise<ProductResponseDto> {
  try {
    const product = await this.useCase.execute(id);
    return ProductResponseDto.fromDomain(product);
  } catch (error) {
    // ❌ NEVER do this - ExceptionFilter handles it
    throw new NotFoundException();
  }
}
```

#### Bad vs Good Controller Examples

```typescript
// ❌ BAD - Controller doing too much
@Controller('products')
export class ProductsController {
  constructor(
    @Inject('SearchProductsUseCase') private useCase: SearchProductsUseCase,
    @Inject('RecentSearchRepository') private repo: RecentSearchRepository, // ❌ Repository injection
    private tokenDecoder: TokenDecoderService, // ❌ Business logic service
  ) {}

  @Get('search')
  async search(@Query() dto: SearchProductsDto, @Token() token: string) {
    // ❌ Complex transformation logic in controller
    let sourcesArray: string[] | undefined;
    if (dto.sources) {
      if (Array.isArray(dto.sources)) {
        sourcesArray = dto.sources;
      } else if (typeof dto.sources === 'string') {
        sourcesArray = [dto.sources];
      }
    }

    const query = new SearchProductsQuery(
      dto.q,
      dto.minPrice,
      dto.maxPrice,
      sourcesArray,
    );
    const result = await this.useCase.execute(query);

    // ❌ Business logic - deciding when to save search
    if (dto.q && result.total > 0) {
      const userId = this.tokenDecoder.decodeUserId(token); // ❌ Token decoding
      if (userId) {
        await this.repo.save(new UserId(userId), dto.q); // ❌ Direct repository call
      } else {
        await this.repo.saveGlobal(dto.q);
      }
    }

    // ❌ Exception handling in controller
    try {
      return this.mapToDto(result);
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      throw error;
    }
  }

  @Get(':id')
  async getById(@Param('id') id: string) {
    // ❌ Try-catch in controller
    try {
      const product = await this.getByIdUseCase.execute(id);
      return {
        id: product.id.value,
        name: product.name.value,
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw error;
    }
  }
}

// ✅ GOOD - Clean controller
@Controller('products')
export class ProductsController {
  constructor(
    @Inject('CreateProductUseCase')
    private readonly createUseCase: CreateProductUseCase,
    @Inject('SearchProductsUseCase')
    private readonly searchUseCase: SearchProductsUseCase,
    @Inject('GetProductByIdUseCase')
    private readonly getByIdUseCase: GetProductByIdUseCase,
  ) {}

  @Post()
  async create(@Body() dto: CreateProductDto): Promise<ProductResponseDto> {
    // ✅ Simple: DTO → Command → Use Case → Response
    const command = new CreateProductCommand(dto.name, dto.price);
    const product = await this.createUseCase.execute(command);
    return ProductResponseDto.fromDomain(product);
  }

  @Get('search')
  async search(
    @Query() dto: SearchProductsDto,
    @CurrentUser() userId?: string, // ✅ Use Guard + Custom Decorator
  ): Promise<SearchProductsResponseDto> {
    // ✅ Complex transformation moved to Query static factory
    const query = SearchProductsQuery.fromDto(dto, userId);

    // ✅ All business logic is in the use case (including saving search)
    const result = await this.searchUseCase.execute(query);

    // ✅ Simple mapping to response
    return SearchProductsResponseDto.fromDomain(result);
  }

  @Get(':id')
  async getById(@Param('id') id: string): Promise<ProductResponseDto> {
    // ✅ No try-catch - ExceptionFilter handles domain exceptions
    const product = await this.getByIdUseCase.execute(id);
    return ProductResponseDto.fromDomain(product);
  }
}
```

#### DTO Factory Pattern

```typescript
// ✅ Move complex transformations to static factory methods
export class SearchProductsQuery {
  constructor(
    public readonly searchTerm?: string,
    public readonly minPrice?: number,
    public readonly maxPrice?: number,
    public readonly sources?: string[],
    public readonly userId?: string,
  ) {}

  // ✅ Complex logic here, not in controller
  static fromDto(dto: SearchProductsDto, userId?: string): SearchProductsQuery {
    // Handle sources transformation
    let sourcesArray: string[] | undefined;
    if (dto.sources) {
      sourcesArray = Array.isArray(dto.sources) ? dto.sources : [dto.sources];
    }

    return new SearchProductsQuery(
      dto.q,
      dto.minPrice,
      dto.maxPrice,
      sourcesArray,
      userId,
    );
  }
}

// ✅ Response mapping in static method
export class ProductResponseDto {
  id: string;
  name: string;
  price: number;

  static fromDomain(product: Product): ProductResponseDto {
    return {
      id: product.id.value,
      name: product.name.value,
      price: product.price.value,
    };
  }
}
```

#### Exception Filters (Handle ALL Exceptions) - MANDATORY

**CRITICAL RULE**: **ALL exceptions MUST be handled by ExceptionFilters. Controllers NEVER handle exceptions.**

**Why ExceptionFilters?**:

- ✅ Centralized error handling
- ✅ Consistent error responses
- ✅ Separation of concerns (controllers stay thin)
- ✅ Easy to maintain and test
- ✅ Domain exceptions mapped to HTTP status codes

**Location**: `src/contexts/{context}/infrastructure/adapters/http/filters/` or `src/common/filters/` for global filters

**Implementation**:

```typescript
// ✅ Global exception filter (src/common/filters/all-exceptions.filter.ts)
import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    // Domain exceptions - Map to HTTP status codes
    if (exception instanceof ProductNotFoundError) {
      return response.status(HttpStatus.NOT_FOUND).json({
        statusCode: HttpStatus.NOT_FOUND,
        message: exception.message,
        error: 'Not Found',
      });
    }

    if (exception instanceof InvalidPriceError) {
      return response.status(HttpStatus.BAD_REQUEST).json({
        statusCode: HttpStatus.BAD_REQUEST,
        message: exception.message,
        error: 'Bad Request',
      });
    }

    if (exception instanceof InvalidCredentialsError) {
      return response.status(HttpStatus.UNAUTHORIZED).json({
        statusCode: HttpStatus.UNAUTHORIZED,
        message: exception.message,
        error: 'Unauthorized',
      });
    }

    // Validation errors from Value Objects
    if (
      exception instanceof Error &&
      (exception.message.includes('cannot be empty') ||
        exception.message.includes('Invalid email format') ||
        exception.message.includes('Invalid format'))
    ) {
      return response.status(HttpStatus.BAD_REQUEST).json({
        statusCode: HttpStatus.BAD_REQUEST,
        message: exception.message,
        error: 'Bad Request',
      });
    }

    // NestJS HTTP exceptions (from ValidationPipe, etc.)
    if (exception instanceof HttpException) {
      return response
        .status(exception.getStatus())
        .json(exception.getResponse());
    }

    // Unknown/unexpected errors
    console.error('Unhandled exception:', exception);
    return response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      message: 'Internal server error',
      error: 'Internal Server Error',
    });
  }
}

// Register globally in main.ts
import { AllExceptionsFilter } from '@common/filters/all-exceptions.filter';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);

  // ... other configuration ...

  // ✅ Register global exception filter
  app.useGlobalFilters(new AllExceptionsFilter());

  await app.listen(3000);
}
```

**Domain Exception Classes** (create in domain layer):

```typescript
// src/contexts/product/domain/exceptions/product-not-found.error.ts
export class ProductNotFoundError extends Error {
  constructor(productId: string) {
    super(`Product with ID ${productId} not found`);
    this.name = 'ProductNotFoundError';
  }
}

// src/contexts/auth/domain/exceptions/invalid-credentials.error.ts
export class InvalidCredentialsError extends Error {
  constructor() {
    super('Invalid credentials');
    this.name = 'InvalidCredentialsError';
  }
}
```

**Controller Pattern (NO exception handling)**:

```typescript
// ❌ BAD - Controller handling exceptions
@Controller('products')
export class ProductsController {
  @Get(':id')
  async getById(@Param('id') id: string) {
    try {
      const product = await this.useCase.execute(id);
      return ProductResponseDto.fromDomain(product);
    } catch (error) {
      if (error instanceof ProductNotFoundError) {
        throw new NotFoundException(error.message);
      }
      throw error;
    }
  }
}

// ✅ GOOD - Controller lets exceptions propagate
@Controller('products')
export class ProductsController {
  @Get(':id')
  async getById(@Param('id') id: string): Promise<ProductResponseDto> {
    // ✅ No try-catch - ExceptionFilter handles all errors
    const product = await this.useCase.execute(id);
    return ProductResponseDto.fromDomain(product);
  }
}
```

**Rules**:

- ✅ ALL exceptions handled by ExceptionFilters
- ✅ Controllers NEVER use try-catch
- ✅ Domain exceptions extend Error with descriptive messages
- ✅ Map domain exceptions to appropriate HTTP status codes
- ✅ Register ExceptionFilter globally in main.ts
- ✅ Log unexpected errors for debugging
- ❌ NEVER handle exceptions in controllers
- ❌ NEVER throw HttpException from domain/application layers

#### Guards and Decorators (Handle Auth)

```typescript
// ✅ Guard extracts and validates user
@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private jwtService: JwtService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const token = this.extractToken(request);

    if (!token) {
      request.user = null; // Optional auth
      return true;
    }

    try {
      const payload = this.jwtService.verify(token);
      request.user = { id: payload.sub }; // Attach to request
      return true;
    } catch {
      request.user = null;
      return true;
    }
  }

  private extractToken(request: any): string | null {
    const auth = request.headers.authorization;
    return auth?.startsWith('Bearer ') ? auth.substring(7) : null;
  }
}

// ✅ Custom decorator extracts user from request
export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): string | undefined => {
    const request = ctx.switchToHttp().getRequest();
    return request.user?.id; // Already validated by guard
  },
);

// ✅ Usage in controller
@Controller('products')
@UseGuards(JwtAuthGuard) // Apply guard
export class ProductsController {
  @Get('search')
  async search(
    @Query() dto: SearchProductsDto,
    @CurrentUser() userId?: string, // ✅ Clean, no token decoding
  ) {
    const query = SearchProductsQuery.fromDto(dto, userId);
    const result = await this.searchUseCase.execute(query);
    return SearchProductsResponseDto.fromDomain(result);
  }
}
```

#### Complete Infrastructure Example

```typescript
// HTTP Adapter (Controller)
@Controller('products')
@UseGuards(JwtAuthGuard)
export class ProductsController {
  constructor(
    @Inject('CreateProductUseCase')
    private readonly createUseCase: CreateProductUseCase,
  ) {}

  @Post()
  async create(@Body() dto: CreateProductDto): Promise<ProductResponseDto> {
    const cmd = new CreateProductCommand(dto.name, dto.price);
    const product = await this.createUseCase.execute(cmd);
    return ProductResponseDto.fromDomain(product);
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
    JwtAuthGuard,
  ],
})
export class ProductModule {}
```

**Rules**:

- ✅ Implement ports from application layer
- ✅ Use NestJS decorators here
- ✅ Map between Domain ↔ Infrastructure
- ✅ Validate all inputs (DTOs)
- ✅ Thin controllers - only coordinate
- ✅ ExceptionFilters handle all errors
- ✅ Guards handle authentication
- ❌ NO business logic here
- ❌ NO exception handling in controllers

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
- [ ] Controllers are thin (no logic, no try-catch)?
- [ ] ALL exceptions handled by ExceptionFilters (MANDATORY)?
- [ ] ExceptionFilter registered globally in main.ts?

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

// 🟢 GREEN - Implement clean controller
@Patch(':id/discount')
async applyDiscount(
  @Param('id') id: string,
  @Body() dto: ApplyDiscountDto,
): Promise<ProductResponseDto> {
  // ✅ Simple: DTO → Command → Use Case → Response
  const command = new ApplyDiscountCommand(id, dto.percentage);
  const product = await this.useCase.execute(command);
  return ProductResponseDto.fromDomain(product);
}

// ✅ ExceptionFilter handles ProductNotFoundError automatically
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

**Controllers**:

- Thin layer - only coordinate
- No business logic
- No exception handling (ALL exceptions handled by ExceptionFilters - MANDATORY)
- No try-catch blocks (let exceptions propagate)
- No direct repository access
- No token decoding (use guards)

**TDD**:

- Always test first (Red-Green-Refactor)
- Domain: pure unit tests
- Application: unit tests with mocks
- Infrastructure: integration tests

**Quality**:

- No `any` type
- No hardcoded values
- All DTOs validated
- All errors handled by ExceptionFilters (MANDATORY - no try-catch in controllers)
- Dependencies flow inward
- Controllers stay thin

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
**HTTP request handling?** → Infrastructure layer (Thin Controller)
**Database access?** → Infrastructure layer (Repository)
**Token validation?** → Infrastructure layer (Guard)
**Exception handling?** → Infrastructure layer (ExceptionFilter - MANDATORY for ALL exceptions)
**Complex DTO transformation?** → Static factory method in Command/Query
**Shared across contexts?** → Shared kernel
**Technical utility?** → Common

**Remember**: Test FIRST, implement SECOND, validate ALWAYS, controllers THIN.
