---
name: nestjs-10
description: >
  NestJS 10+ framework patterns, dependency injection, modules, and decorators.
  Trigger: When implementing NestJS controllers, services, modules, guards, filters, interceptors.
license: Apache-2.0
metadata:
  author: Wise Compare Hub
  version: '1.0'
  scope: [infrastructure]
  auto_invoke: 'Setting up NestJS controllers, services, modules, guards, filters'
allowed-tools: Read, Edit, Write, Glob, Grep, Bash, Task
---

## ⚠️ CRITICAL: Always Consult Context7 MCP

**BEFORE implementing any NestJS components:**

1. 🔍 Check existing modules in `src/contexts/*/infrastructure/`
2. 📋 Review `Context7 MCP` documentation for module patterns
3. ✅ Ensure controllers, services, and modules follow existing conventions
4. 🚫 NEVER create duplicate providers or modules

**Reference:** `Context7 MCP` contains the authoritative NestJS patterns and module structure for this project.

---

## When to Use

Use this skill when:

- Setting up NestJS controllers (HTTP endpoints)
- Creating NestJS services (dependency injection)
- Configuring NestJS modules (imports, providers, controllers)
- Implementing guards (authentication, authorization)
- Creating exception filters (error handling)
- Using decorators (@Controller, @Service, @Injectable, @Inject)
- Working with dependency injection containers

---

## Critical Patterns

### Rule 1: Dependency Injection (ALWAYS use `@Injectable()`)

```typescript
// ✅ CORRECT - Service with @Injectable() decorator
import { Injectable } from '@nestjs/common';

@Injectable()
export class ProductService {
  constructor(private readonly repository: ProductRepository) {}

  async findAll(): Promise<Product[]> {
    return this.repository.find();
  }
}

// ❌ WRONG - Missing @Injectable()
export class ProductService {
  constructor(private readonly repository: ProductRepository) {}
}
```

### Rule 2: Module Configuration (Proper imports/exports/providers)

```typescript
// ✅ CORRECT - Complete module configuration
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductController } from './infrastructure/adapters/http/product.controller';
import { CreateProductService } from './application/use-cases/create-product.service';
import { TypeOrmProductRepository } from './infrastructure/adapters/persistence/typeorm-product.repository';
import { ProductEntity } from './infrastructure/adapters/persistence/product.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ProductEntity])],
  controllers: [ProductController],
  providers: [
    { provide: 'CreateProductUseCase', useClass: CreateProductService },
    { provide: 'ProductRepository', useClass: TypeOrmProductRepository },
  ],
})
export class ProductModule {}

// ❌ WRONG - Missing proper token registration
@Module({
  imports: [TypeOrmModule.forFeature([ProductEntity])],
  controllers: [ProductController],
  providers: [CreateProductService, TypeOrmProductRepository], // Missing token mapping
})
export class ProductModule {}
```

### Rule 3: Inject Dependencies with `@Inject()` token

```typescript
// ✅ CORRECT - Explicit token injection
@Controller('products')
export class ProductController {
  constructor(
    @Inject('CreateProductUseCase')
    private readonly createUseCase: CreateProductUseCase,
  ) {}

  @Post()
  async create(@Body() dto: CreateProductDto) {
    const command = new CreateProductCommand(dto.name, dto.price);
    return await this.createUseCase.execute(command);
  }
}

// ❌ WRONG - Missing @Inject() with custom token
@Controller('products')
export class ProductController {
  constructor(private readonly createUseCase: CreateProductUseCase) {}
  // Will fail if token name doesn't match provider name
}
```

### Rule 4: Global Filters in main.ts

```typescript
// ✅ CORRECT - Register global exception filter
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from '@common/filters/all-exceptions.filter';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);

  // ✅ Register global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // ✅ Register global exception filter (MANDATORY)
  app.useGlobalFilters(new AllExceptionsFilter());

  await app.listen(3000);
}

bootstrap();

// ❌ WRONG - No global exception handling
async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  await app.listen(3000);
  // Controllers will handle exceptions (WRONG)
}
```

---

## Decision Tree

```
Need HTTP endpoint?
  → Use @Controller decorator with path
  → Define route with @Get/@Post/@Patch/@Delete
  → Inject use case with @Inject(token)
  → Let exceptions propagate to filter

Need to validate input?
  → Create DTO class with class-validator decorators
  → Use @Body() @Query() @Param() decorators
  → ValidationPipe in main.ts handles validation

Need authentication?
  → Create Guard implementing CanActivate
  → Use @UseGuards(GuardClass) on controller/route
  → Guards handle token validation
  → Use @CurrentUser() custom decorator for extraction

Need error handling?
  → Create ExceptionFilter implementing ExceptionFilter
  → Register with app.useGlobalFilters()
  → Map domain exceptions to HTTP status codes
  → Controllers NEVER handle exceptions
```

---

## Code Examples

### Example 1: Basic Controller with Dependency Injection

```typescript
import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { CreateProductUseCase } from '../application/ports/input/create-product.use-case';
import { GetProductByIdUseCase } from '../application/ports/input/get-product-by-id.use-case';
import { CreateProductDto } from './dto/create-product.dto';
import { ProductResponseDto } from './dto/product-response.dto';

@Controller('products')
export class ProductsController {
  constructor(
    @Inject('CreateProductUseCase')
    private readonly createUseCase: CreateProductUseCase,
    @Inject('GetProductByIdUseCase')
    private readonly getByIdUseCase: GetProductByIdUseCase,
  ) {}

  @Post()
  async create(@Body() dto: CreateProductDto): Promise<ProductResponseDto> {
    const command = new CreateProductCommand(dto.name, dto.price);
    const product = await this.createUseCase.execute(command);
    return ProductResponseDto.fromDomain(product);
  }

  @Get(':id')
  async getById(@Param('id') id: string): Promise<ProductResponseDto> {
    const product = await this.getByIdUseCase.execute(id);
    return ProductResponseDto.fromDomain(product);
  }
}
```

### Example 2: DTO with Validation

```typescript
import {
  IsString,
  IsNumber,
  MinLength,
  Min,
  IsNotEmpty,
} from 'class-validator';

export class CreateProductDto {
  @IsNotEmpty()
  @IsString()
  @MinLength(3, { message: 'Name must be at least 3 characters' })
  name: string;

  @IsNotEmpty()
  @IsNumber()
  @Min(0.01, { message: 'Price must be greater than 0' })
  price: number;
}

export class ProductResponseDto {
  id: string;
  name: string;
  price: number;

  static fromDomain(product: Product): ProductResponseDto {
    return {
      id: product.id.value,
      name: product.name,
      price: product.price,
    };
  }
}
```

### Example 3: Guard for Authentication

```typescript
import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private jwtService: JwtService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const token = this.extractToken(request);

    if (!token) {
      request.user = null;
      return true; // Optional auth
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
```

### Example 4: Custom Decorator for Parameter Extraction

```typescript
import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): string | undefined => {
    const request = ctx.switchToHttp().getRequest();
    return request.user?.id;
  },
);

// Usage in controller
@Controller('products')
@UseGuards(JwtAuthGuard)
export class ProductsController {
  @Get('search')
  async search(
    @Query() dto: SearchProductsDto,
    @CurrentUser() userId?: string,
  ) {
    // userId is already validated by guard
  }
}
```

### Example 5: Global Exception Filter

```typescript
import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpStatus,
  HttpException,
} from '@nestjs/common';
import { Response } from 'express';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    // Domain exceptions
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

    // NestJS validation errors
    if (exception instanceof HttpException) {
      return response
        .status(exception.getStatus())
        .json(exception.getResponse());
    }

    // Unknown errors
    console.error('Unhandled exception:', exception);
    return response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      message: 'Internal server error',
      error: 'Internal Server Error',
    });
  }
}
```

---

## Commands

```bash
nest new project-name                    # Create new NestJS project
nest generate module contexts/product    # Generate module
nest generate service services/product   # Generate service
nest generate controller controllers/product  # Generate controller
npm start                                 # Run development server
npm run start:dev                        # Run with auto-reload
npm run build                            # Build for production
npm test                                 # Run tests
```

---

## Module Structure Best Practices

```
ProductModule
├── Imports
│   └── TypeOrmModule.forFeature([ProductEntity])
├── Controllers
│   └── ProductsController
└── Providers
    ├── { provide: 'CreateProductUseCase', useClass: CreateProductService }
    ├── { provide: 'GetProductByIdUseCase', useClass: GetProductByIdService }
    └── { provide: 'ProductRepository', useClass: TypeOrmProductRepository }
```

---

## Common Mistakes

❌ **Missing @Injectable()** - Service won't be injectable  
❌ **Hardcoding service instances** - Use dependency injection  
❌ **Exception handling in controllers** - Use global ExceptionFilter  
❌ **Direct database access** - Use repositories via ports  
❌ **Business logic in controllers** - Controllers stay thin  
❌ **Forgetting @Inject(token)** - Will fail with custom provider tokens  
❌ **Not validating inputs** - Use DTOs with class-validator

---

## Resources

- [NestJS Official Documentation](https://docs.nestjs.com/)
- [NestJS Dependency Injection](https://docs.nestjs.com/fundamentals/custom-providers)
- [NestJS Controllers](https://docs.nestjs.com/controllers)
- [NestJS Exception Filters](https://docs.nestjs.com/exception-filters)
- [NestJS Guards](https://docs.nestjs.com/guards)
