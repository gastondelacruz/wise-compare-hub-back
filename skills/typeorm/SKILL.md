---
name: typeorm
description: >
  TypeORM patterns for PostgreSQL database operations, entities, repositories, and migrations.
  Trigger: When implementing database models, repositories, migrations, or database queries.
license: Apache-2.0
metadata:
  author: Wise Compare Hub
  version: '1.0'
  scope: [infrastructure, domain]
  auto_invoke: 'Setting up database models and repositories'
allowed-tools: Read, Edit, Write, Glob, Grep, Bash, Task
---

## ⚠️ CRITICAL: Always Consult Context7 MCP

**BEFORE creating database models:**

1. 🔍 Check existing entities in `src/contexts/*/domain/models/` and infrastructure layers
2. 📋 Review `Context7 MCP` documentation for existing TypeORM patterns
3. ✅ Use existing entity mappings and repository patterns
4. 🚫 NEVER create duplicate entity definitions or repository implementations
5. 📊 Check `src/database/migrations/` for existing schema patterns

**Reference:** `Context7 MCP` contains the authoritative database patterns for this project.

---

## When to Use

Use this skill when:

- Creating TypeORM entities and domain models
- Implementing database repositories
- Writing database migrations
- Adding or modifying database relationships
- Implementing complex queries with query builders
- Setting up indexes and constraints
- Configuring entity relationships (OneToOne, OneToMany, ManyToMany)

---

## Critical Patterns

### Pattern 1: TypeORM Entity with Hexagonal Architecture

```typescript
// ✅ CORRECT - Entity in domain layer (pure TypeScript)
// src/contexts/product/domain/models/product.entity.ts

import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('products')
export class Product {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  price: number;

  @Column({ type: 'varchar', length: 255, nullable: true })
  imageUrl: string;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @Column({
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
    onUpdate: 'CURRENT_TIMESTAMP',
  })
  updatedAt: Date;

  // Domain methods (pure TypeScript, no dependencies)
  isAvailable(): boolean {
    return this.price > 0;
  }

  updatePrice(newPrice: number): void {
    if (newPrice < 0) {
      throw new Error('Price cannot be negative');
    }
    this.price = newPrice;
  }
}
```

### Pattern 2: Repository Pattern with Hexagonal Architecture

```typescript
// ✅ CORRECT - Repository interface in application layer
// src/contexts/product/application/ports/output/product.repository.ts

import { Product } from '@/contexts/product/domain/models/product.entity';

export interface IProductRepository {
  findById(id: string): Promise<Product | null>;
  findAll(): Promise<Product[]>;
  findByName(name: string): Promise<Product[]>;
  save(product: Product): Promise<Product>;
  update(id: string, product: Partial<Product>): Promise<Product>;
  delete(id: string): Promise<boolean>;
  search(query: string, limit?: number): Promise<Product[]>;
}

// ✅ CORRECT - Repository implementation in infrastructure layer
// src/contexts/product/infrastructure/adapters/persistence/typeorm-product.repository.ts

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from '@/contexts/product/domain/models/product.entity';
import { IProductRepository } from '@/contexts/product/application/ports/output/product.repository';

@Injectable()
export class TypeOrmProductRepository implements IProductRepository {
  constructor(
    @InjectRepository(Product)
    private readonly repository: Repository<Product>,
  ) {}

  async findById(id: string): Promise<Product | null> {
    return this.repository.findOne({ where: { id } });
  }

  async findAll(): Promise<Product[]> {
    return this.repository.find({
      order: { createdAt: 'DESC' },
    });
  }

  async findByName(name: string): Promise<Product[]> {
    return this.repository
      .createQueryBuilder('product')
      .where('product.name ILIKE :name', { name: `%${name}%` })
      .orderBy('product.createdAt', 'DESC')
      .getMany();
  }

  async save(product: Product): Promise<Product> {
    return this.repository.save(product);
  }

  async update(id: string, product: Partial<Product>): Promise<Product> {
    await this.repository.update(id, product);
    const updated = await this.findById(id);
    if (!updated) {
      throw new Error(`Product with id ${id} not found`);
    }
    return updated;
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.repository.delete(id);
    return result.affected ? result.affected > 0 : false;
  }

  async search(query: string, limit: number = 10): Promise<Product[]> {
    return this.repository
      .createQueryBuilder('product')
      .where('product.name ILIKE :query', { query: `%${query}%` })
      .orWhere('product.description ILIKE :query', { query: `%${query}%` })
      .orderBy('product.createdAt', 'DESC')
      .limit(limit)
      .getMany();
  }
}
```

### Pattern 3: Entity Relationships (OneToMany)

```typescript
// ✅ CORRECT - Parent entity with one-to-many relationship
// src/contexts/vendor/domain/models/vendor.entity.ts

import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { Offer } from '@/contexts/offer/domain/models/offer.entity';

@Entity('vendors')
export class Vendor {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'varchar', length: 255 })
  externalId: string;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  // One vendor has many offers
  @OneToMany(() => Offer, (offer) => offer.vendor, {
    cascade: true,
    eager: false,
  })
  offers: Offer[];
}

// ✅ CORRECT - Child entity with many-to-one relationship
// src/contexts/offer/domain/models/offer.entity.ts

import {
  Column,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  Index,
} from 'typeorm';
import { Vendor } from '@/contexts/vendor/domain/models/vendor.entity';
import { Product } from '@/contexts/product/domain/models/product.entity';

@Entity('offers')
@Index(['vendorId', 'productId'])
@Index(['vendorId', 'createdAt'])
export class Offer {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  vendorId: string;

  @Column({ type: 'uuid' })
  productId: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  price: number;

  @Column({ type: 'varchar', length: 255, nullable: true })
  url: string;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  // Many offers belong to one vendor
  @ManyToOne(() => Vendor, (vendor) => vendor.offers, {
    onDelete: 'CASCADE',
    eager: false,
  })
  vendor: Vendor;

  // Many offers belong to one product
  @ManyToOne(() => Product, {
    onDelete: 'CASCADE',
    eager: false,
  })
  product: Product;
}
```

### Pattern 4: Query Builder for Complex Queries

```typescript
// ✅ CORRECT - Complex query with query builder
async findOffersForProduct(
  productId: string,
  limit: number = 10,
): Promise<Offer[]> {
  return this.repository
    .createQueryBuilder('offer')
    .innerJoinAndSelect(
      'offer.vendor',
      'vendor',
      'vendor.id = offer.vendorId',
    )
    .where('offer.productId = :productId', { productId })
    .andWhere('offer.price > :minPrice', { minPrice: 0 })
    .orderBy('offer.price', 'ASC')
    .addOrderBy('offer.createdAt', 'DESC')
    .limit(limit)
    .getMany();
}

// ✅ CORRECT - Aggregation query
async getAveragePriceByProduct(productId: string): Promise<number> {
  const result = await this.repository
    .createQueryBuilder('offer')
    .select('AVG(offer.price)', 'averagePrice')
    .where('offer.productId = :productId', { productId })
    .getRawOne();

  return parseFloat(result.averagePrice) || 0;
}

// ✅ CORRECT - Count query with conditions
async countOffersForVendor(vendorId: string): Promise<number> {
  return this.repository
    .createQueryBuilder('offer')
    .where('offer.vendorId = :vendorId', { vendorId })
    .andWhere('offer.createdAt >= :date', {
      date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
    })
    .getCount();
}
```

### Pattern 5: Database Migration

```typescript
// ✅ CORRECT - TypeORM migration
// src/database/migrations/1708000000000-CreateProductsTable.ts

import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm';

export class CreateProductsTable1708000000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'products',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            default: 'uuid_generate_v4()',
          },
          {
            name: 'name',
            type: 'varchar',
            length: '255',
            isNullable: false,
          },
          {
            name: 'description',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'price',
            type: 'decimal',
            precision: 10,
            scale: 2,
            isNullable: false,
          },
          {
            name: 'imageUrl',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'createdAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updatedAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true,
    );

    // Add indexes for performance
    await queryRunner.createIndex(
      'products',
      new TableIndex({
        name: 'IDX_products_name',
        columnNames: ['name'],
      }),
    );

    await queryRunner.createIndex(
      'products',
      new TableIndex({
        name: 'IDX_products_createdAt',
        columnNames: ['createdAt'],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('products');
  }
}
```

### Pattern 6: TypeORM Module Configuration

```typescript
// ✅ CORRECT - NestJS module with TypeORM configuration
// src/contexts/product/infrastructure/product.module.ts

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Product } from '@/contexts/product/domain/models/product.entity';
import { SearchProductsService } from '@/contexts/product/application/use-cases/search-products.service';
import { TypeOrmProductRepository } from './adapters/persistence/typeorm-product.repository';

@Module({
  imports: [TypeOrmModule.forFeature([Product])],
  providers: [
    SearchProductsService,
    {
      provide: 'IProductRepository',
      useClass: TypeOrmProductRepository,
    },
  ],
  exports: ['IProductRepository'],
})
export class ProductModule {}
```

### Pattern 7: Soft Delete Pattern

```typescript
// ✅ CORRECT - Entity with soft delete
// src/contexts/product/domain/models/product.entity.ts

import { Column, Entity, DeleteDateColumn, PrimaryGeneratedColumn } from 'typeorm';

@Entity('products')
export class Product {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @DeleteDateColumn({ nullable: true })
  deletedAt: Date | null;

  // Soft delete - only marks as deleted
  softDelete(): void {
    this.deletedAt = new Date();
  }

  isDeleted(): boolean {
    return this.deletedAt !== null;
  }
}

// ✅ CORRECT - Repository with soft delete queries
async findActiveProducts(): Promise<Product[]> {
  return this.repository
    .createQueryBuilder('product')
    .where('product.deletedAt IS NULL')
    .getMany();
}

async permanentlyDelete(id: string): Promise<boolean> {
  const result = await this.repository.delete(id);
  return result.affected ? result.affected > 0 : false;
}
```

### Pattern 8: Transaction Support

```typescript
// ✅ CORRECT - Using transactions with TypeORM
// src/contexts/offer/application/use-cases/ingest-offers.service.ts

import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';

@Injectable()
export class IngestOffersService {
  constructor(private readonly dataSource: DataSource) {}

  async ingestOffers(vendorId: string, offers: OfferDto[]): Promise<void> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const offerRepository = queryRunner.manager.getRepository(Offer);

      // Delete existing offers for this vendor
      await offerRepository.delete({ vendorId });

      // Insert new offers
      for (const offerDto of offers) {
        const offer = new Offer();
        offer.vendorId = vendorId;
        offer.productId = offerDto.productId;
        offer.price = offerDto.price;
        offer.url = offerDto.url;

        await offerRepository.save(offer);
      }

      await queryRunner.commitTransaction();
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }
}
```

---

## Common Mistakes ❌

### ❌ DO NOT: Put business logic in repository

```typescript
// ❌ WRONG - Business logic in repository
async saveProduct(product: Product): Promise<void> {
  // ← Business logic shouldn't be here
  if (product.price < 0) {
    throw new Error('Invalid price');
  }
  await this.repository.save(product);
}

// ✅ CORRECT - Business logic in domain entity
class Product {
  updatePrice(newPrice: number): void {
    if (newPrice < 0) {
      throw new Error('Invalid price');
    }
    this.price = newPrice;
  }
}

async saveProduct(product: Product): Promise<void> {
  await this.repository.save(product);
}
```

### ❌ DO NOT: Ignore eager loading issues

```typescript
// ❌ WRONG - N+1 query problem
async getVendorOffers(vendorId: string): Promise<Offer[]> {
  const vendor = await this.vendorRepository.findById(vendorId);
  // ← This loads vendor without offers
  const offers = await this.offerRepository.find({ vendorId });
  // ← This is a second query (N+1 problem)
  return offers;
}

// ✅ CORRECT - Use joins to avoid N+1
async getVendorOffers(vendorId: string): Promise<Offer[]> {
  return this.repository
    .createQueryBuilder('offer')
    .leftJoinAndSelect('offer.vendor', 'vendor')
    .where('offer.vendorId = :vendorId', { vendorId })
    .getMany();
}
```

### ❌ DO NOT: Create entities without repository interface

```typescript
// ❌ WRONG - No separation of concerns
@Injectable()
export class ProductService {
  constructor(@InjectRepository(Product) private repo: Repository<Product>) {}
}

// ✅ CORRECT - Use interface for abstraction
@Injectable()
export class ProductService {
  constructor(@Inject('IProductRepository') private repo: IProductRepository) {}
}
```

### ❌ DO NOT: Skip indexes on frequently queried columns

```typescript
// ❌ WRONG - No indexes on search column
@Entity('products')
export class Product {
  @Column()
  name: string; // ← Missing index!
}

// ✅ CORRECT - Add indexes for frequently queried columns
@Entity('products')
@Index(['name'])
@Index(['createdAt'])
export class Product {
  @Column()
  name: string;

  @Column()
  createdAt: Date;
}
```

---

## Database Configuration

### ormconfig.ts Setup

```typescript
// ✅ CORRECT - TypeORM configuration
// src/config/database.config.ts

import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { Product } from '@/contexts/product/domain/models/product.entity';
import { Offer } from '@/contexts/offer/domain/models/offer.entity';
import { Vendor } from '@/contexts/vendor/domain/models/vendor.entity';

export const databaseConfig: TypeOrmModuleOptions = {
  type: 'postgres',
  host: process.env.DATABASE_HOST || 'localhost',
  port: parseInt(process.env.DATABASE_PORT || '5432'),
  username: process.env.DATABASE_USER || 'postgres',
  password: process.env.DATABASE_PASSWORD,
  database: process.env.DATABASE_NAME || 'wise_compare_hub',
  entities: [Product, Vendor, Offer],
  migrations: [__dirname + '/../database/migrations/*{.ts,.js}'],
  migrationsRun: true,
  logging: process.env.DATABASE_LOGGING === 'true',
  synchronize: false,
  ssl:
    process.env.NODE_ENV === 'production'
      ? { rejectUnauthorized: false }
      : false,
};
```

### AppModule Integration

```typescript
// ✅ CORRECT - TypeORM module in AppModule
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { databaseConfig } from '@/config/database.config';
import { ProductModule } from '@/contexts/product/infrastructure/product.module';
import { VendorModule } from '@/contexts/vendor/infrastructure/vendor.module';

@Module({
  imports: [TypeOrmModule.forRoot(databaseConfig), ProductModule, VendorModule],
})
export class AppModule {}
```

---

## Running Migrations

```bash
# Generate a new migration
npx typeorm migration:generate src/database/migrations/MigrationName

# Run pending migrations
npx typeorm migration:run

# Revert last migration
npx typeorm migration:revert

# Show all migrations
npx typeorm migration:show

# Display pending migrations
npx typeorm query "SELECT * FROM typeorm_metadata WHERE type='migration'"
```

---

## Best Practices ✅

1. **Repository Pattern**: Always use repositories to abstract database access
2. **Type Safety**: Use TypeScript interfaces for repository contracts
3. **Separation of Concerns**: Keep business logic in entities, persistence in repositories
4. **Eager vs Lazy Loading**: Choose strategically to avoid N+1 queries
5. **Indexes**: Add indexes to frequently queried columns
6. **Transactions**: Use transactions for multi-entity operations
7. **Soft Deletes**: Use soft delete for historical data preservation
8. **Migrations**: Keep migrations version-controlled and tested
9. **Entity Relationships**: Define relationships clearly with cascade options
10. **Query Optimization**: Use query builder for complex queries

---

## Additional Resources

- [TypeORM Official Documentation](https://typeorm.io)
- [PostgreSQL Documentation](https://www.postgresql.org/docs)
- [TypeORM Query Builder](https://typeorm.io/select-query-builder)
- [TypeORM Migrations](https://typeorm.io/migrations)
- [NestJS TypeORM Integration](https://docs.nestjs.com/techniques/database)
