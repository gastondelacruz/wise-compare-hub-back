---
name: nestjs-hexagonal
description: >
  NestJS Hexagonal Architecture, DDD, and TDD patterns.
  Trigger: When implementing domain/application/infrastructure layers, tests, exception filters, guards.
license: Apache-2.0
metadata:
  author: Wise Compare Hub
  version: '1.0'
  scope: [contexts, shared, common]
  auto_invoke: 'Implementing layers, writing tests, creating exception filters, setting up guards'
allowed-tools: Read, Edit, Write, Glob, Grep, Bash, Task
---

## Quick Decision Tree

```
Business Logic? → Domain Layer (pure TS, test first)
Use Case/Orchestration? → Application Layer (ports, test with mocks)
HTTP/DB/External? → Infrastructure Layer (adapters, integration tests)
Token/Auth Logic? → Guard + Decorator (NOT in controller)
Exception Handling? → ExceptionFilter (NOT in controller)
```

## TDD Workflow (MANDATORY)

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

## Domain Layer Pattern

```typescript
// ✅ Value Object (immutable, validation in constructor)
export class ProductId {
  constructor(public readonly value: string) {
    if (!value) throw new Error('ProductId cannot be empty');
  }
}

// ✅ Entity (domain logic, immutable returns)
export class Product {
  constructor(
    public readonly id: ProductId,
    public readonly name: string,
    public readonly price: number,
  ) {}

  updatePrice(newPrice: number): Product {
    if (newPrice <= 0) throw new InvalidPriceError();
    return new Product(this.id, this.name, newPrice);
  }
}

// ✅ Domain Service
export class PricingService {
  calculateDiscount(price: number, percentage: number): number {
    if (percentage < 0 || percentage > 100) throw new InvalidDiscountError();
    return price * (1 - percentage / 100);
  }
}

// ✅ Domain Exception
export class InvalidPriceError extends Error {
  constructor() {
    super('Price must be greater than 0');
    this.name = 'InvalidPriceError';
  }
}

// ✅ Test (write FIRST)
describe('Product', () => {
  it('should update price when valid', () => {
    const product = new Product(new ProductId('1'), 'Laptop', 1000);
    const updated = product.updatePrice(900);
    expect(updated.price).toBe(900);
  });

  it('should throw when price is invalid', () => {
    const product = new Product(new ProductId('1'), 'Laptop', 1000);
    expect(() => product.updatePrice(-10)).toThrow(InvalidPriceError);
  });
});
```

**Rules:**

- ✅ Pure TypeScript (no NestJS decorators)
- ✅ Immutable objects
- ✅ Business logic here
- ✅ Throw domain exceptions
- ❌ NO framework dependencies
- ❌ NO imports from application/infrastructure

## Application Layer Pattern

```typescript
// ✅ Input Port (interface)
export interface CreateProductUseCase {
  execute(command: CreateProductCommand): Promise<Product>;
}

// ✅ Output Port (repository interface)
export interface ProductRepository {
  save(product: Product): Promise<void>;
  findById(id: ProductId): Promise<Product | null>;
}

// ✅ Use Case Implementation
@Injectable()
export class CreateProductService implements CreateProductUseCase {
  constructor(
    @Inject('ProductRepository')
    private readonly repo: ProductRepository,
  ) {}

  async execute(cmd: CreateProductCommand): Promise<Product> {
    const product = new Product(
      new ProductId(randomUUID()),
      cmd.name,
      cmd.price,
    );
    await this.repo.save(product);
    return product;
  }
}

// ✅ Test (with mocks)
describe('CreateProductService', () => {
  let service: CreateProductService;
  let mockRepo: jest.Mocked<ProductRepository>;

  beforeEach(() => {
    mockRepo = {
      save: jest.fn(),
      findById: jest.fn(),
    };
    service = new CreateProductService(mockRepo);
  });

  it('should create and save product', async () => {
    const cmd = new CreateProductCommand('Laptop', 1000);
    const result = await service.execute(cmd);

    expect(result.name).toBe('Laptop');
    expect(mockRepo.save).toHaveBeenCalledWith(expect.any(Product));
  });
});
```

**Rules:**

- ✅ Define ports (interfaces)
- ✅ Orchestrate domain logic
- ✅ Test with mocked dependencies
- ✅ Inject dependencies via constructor
- ❌ NO business logic here
- ❌ NO infrastructure imports

## Infrastructure Layer Pattern

### Controller (Thin Layer)

```typescript
// ✅ GOOD - Thin Controller
@Controller('products')
export class ProductsController {
  constructor(
    @Inject('CreateProductUseCase')
    private readonly createUseCase: CreateProductUseCase,
  ) {}

  @Post()
  async create(@Body() dto: CreateProductDto): Promise<ProductResponseDto> {
    // ✅ Simple: DTO → Command → Use Case → Response
    const command = new CreateProductCommand(dto.name, dto.price);
    const product = await this.createUseCase.execute(command);
    return ProductResponseDto.fromDomain(product);
  }

  @Get(':id')
  async getById(@Param('id') id: string): Promise<ProductResponseDto> {
    // ✅ No try-catch - ExceptionFilter handles all errors
    const product = await this.getByIdUseCase.execute(id);
    return ProductResponseDto.fromDomain(product);
  }
}

// ❌ BAD - Controller with logic
@Controller('products')
export class BadProductsController {
  @Get(':id')
  async getById(@Param('id') id: string) {
    try {
      // ❌ Business logic in controller
      if (!id) throw new Error('Invalid ID');

      const product = await this.service.execute(id);

      // ❌ Exception handling in controller
      return {
        id: product.id.value,
        name: product.name.value,
        price: product.price.value,
      };
    } catch (error) {
      // ❌ NEVER handle exceptions here
      throw new NotFoundException();
    }
  }
}
```

**Controller ONLY:**

- ✅ Receive HTTP requests
- ✅ Validate DTOs (class-validator)
- ✅ Map DTO → Command/Query
- ✅ Call Use Case
- ✅ Map Domain → Response DTO
- ✅ Return HTTP response

**Controller NEVER:**

- ❌ Contain business logic
- ❌ Handle exceptions (use ExceptionFilters)
- ❌ Use try-catch blocks
- ❌ Inject repositories directly
- ❌ Decode tokens (use Guards/Decorators)

### Exception Filters (Handle ALL Exceptions)

```typescript
// ✅ Global exception filter
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

    // NestJS HTTP exceptions
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
    });
  }
}

// Register globally in main.ts
app.useGlobalFilters(new AllExceptionsFilter());
```

**CRITICAL RULE**: **ALL exceptions MUST be handled by ExceptionFilters. Controllers NEVER handle exceptions.**

### Guards and Decorators

```typescript
// ✅ Guard extracts and validates user
@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private jwtService: JwtService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const token = this.extractToken(request);

    if (!token) {
      request.user = null;
      return true;
    }

    try {
      const payload = this.jwtService.verify(token);
      request.user = { id: payload.sub };
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

// ✅ Custom decorator
export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): string | undefined => {
    const request = ctx.switchToHttp().getRequest();
    return request.user?.id;
  },
);

// ✅ Usage
@Controller('products')
@UseGuards(JwtAuthGuard)
export class ProductsController {
  @Get('search')
  async search(
    @Query() dto: SearchProductsDto,
    @CurrentUser() userId?: string,
  ) {
    const query = SearchProductsQuery.fromDto(dto, userId);
    const result = await this.searchUseCase.execute(query);
    return SearchProductsResponseDto.fromDomain(result);
  }
}
```

### Repository Implementation

```typescript
// ✅ Repository (implements port)
@Injectable()
export class TypeOrmProductRepository implements ProductRepository {
  constructor(
    @InjectRepository(ProductEntity)
    private readonly repo: Repository<ProductEntity>,
  ) {}

  async save(product: Product): Promise<void> {
    await this.repo.save(this.toEntity(product));
  }

  async findById(id: ProductId): Promise<Product | null> {
    const entity = await this.repo.findOne({
      where: { id: id.value },
    });
    return entity ? this.toDomain(entity) : null;
  }

  private toEntity(product: Product): ProductEntity {
    return {
      id: product.id.value,
      name: product.name,
      price: product.price,
    };
  }

  private toDomain(entity: ProductEntity): Product {
    return new Product(new ProductId(entity.id), entity.name, entity.price);
  }
}

// ✅ Test (integration)
describe('TypeOrmProductRepository', () => {
  let repo: TypeOrmProductRepository;
  let typeormRepo: Repository<ProductEntity>;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      imports: [TypeOrmModule.forRoot(testDbConfig)],
    }).compile();

    repo = module.get(TypeOrmProductRepository);
    typeormRepo = module.get(getRepositoryToken(ProductEntity));
  });

  it('should save and retrieve product', async () => {
    const product = new Product(new ProductId('1'), 'Laptop', 1000);

    await repo.save(product);
    const found = await repo.findById(product.id);

    expect(found).toEqual(product);
  });
});
```

## Module Configuration

```typescript
@Module({
  imports: [TypeOrmModule.forFeature([ProductEntity])],
  controllers: [ProductsController],
  providers: [
    { provide: 'CreateProductUseCase', useClass: CreateProductService },
    { provide: 'GetProductByIdUseCase', useClass: GetProductByIdService },
    { provide: 'ProductRepository', useClass: TypeOrmProductRepository },
    JwtAuthGuard,
  ],
})
export class ProductModule {}
```

## Constants Management

```typescript
// Domain Constants (src/contexts/product/domain/constants/)
export const PRODUCT_RULES = {
  MIN_PRICE: 0.01,
  MAX_NAME_LENGTH: 100,
  ALLOWED_CURRENCIES: ['USD', 'EUR'] as const,
} as const;

// Technical Constants (src/common/constants/)
export const PAGINATION = {
  DEFAULT_LIMIT: 10,
  MAX_LIMIT: 100,
} as const;
```

## Project Structure

```
src/contexts/{context}/
├── domain/              # 🔵 Pure Business Logic
│   ├── models/         # Entities, Value Objects
│   ├── services/       # Domain Services
│   ├── constants/      # Business rules
│   └── exceptions/     # Domain exceptions
├── application/         # 🟢 Use Cases
│   ├── ports/
│   │   ├── input/     # Use case interfaces
│   │   └── output/    # Repository interfaces
│   ├── use-cases/     # Implementations
│   └── dto/           # Commands/Queries
└── infrastructure/      # 🟡 Adapters
    ├── adapters/
    │   ├── http/      # Controllers + Guards + Filters
    │   └── persistence/ # Repositories
    └── {context}.module.ts

src/shared/              # Shared kernel
src/common/              # Technical utilities
```

## Import Rules

```typescript
// ✅ Domain Layer - Only domain
import { Money } from './money.vo';

// ✅ Application Layer - Domain imports OK
import { Product } from '@contexts/product/domain/models/product';
import { ProductRepository } from '../ports/output/product.repository';

// ✅ Infrastructure Layer - All imports OK
import { CreateProductUseCase } from '@contexts/product/application/ports/input';
import { Product } from '@contexts/product/domain/models/product';

// ❌ Domain Layer - FORBIDDEN
import { ProductRepository } from '../../infrastructure/...';
import { CreateProductDto } from '../../infrastructure/...';
```

## Testing Checklist

Before considering task complete:

- [ ] 🔴 Did I write the test FIRST?
- [ ] Domain tests pass (no mocks)?
- [ ] Application tests pass (with mocks)?
- [ ] Integration tests pass (real DB)?
- [ ] E2E tests pass?
- [ ] `pnpm verify` passes (lint, build, tests)?
- [ ] No hardcoded values (use constants)?
- [ ] Dependencies flow inward?
- [ ] Controllers are thin (no logic, no try-catch)?
- [ ] ALL exceptions handled by ExceptionFilters?
- [ ] ExceptionFilter registered globally in main.ts?

## Validation

Execute before reporting complete:

```bash
pnpm verify
```

This must pass:

1. Lint → 0 errors
2. Format check → 0 issues
3. Type check → 0 errors
4. Unit tests → All pass
5. E2E tests → All pass
