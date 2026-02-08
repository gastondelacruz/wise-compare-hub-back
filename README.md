# Wise Compare Hub API

<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" /></a>
</p>

REST API backend for product and offer comparison across multiple vendors, built with NestJS following Hexagonal Architecture (DDD) and TDD.

## 📋 Description

Wise Compare Hub is a REST API that enables:
- Search for canonical products with aggregated offers from multiple vendors
- Compare offers for specific products
- User authentication management
- Recent search history (user-specific and global)
- Vendor information retrieval

## 🏗️ Architecture

The project follows **Hexagonal Architecture (DDD)** with clear layer separation:

```
src/contexts/{context}/
├── domain/              # 🔵 Pure Business Logic (no dependencies)
│   ├── models/         # Entities, Value Objects
│   ├── services/       # Domain Services
│   └── constants/      # Business rules
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

src/shared/              # Code shared across contexts
src/common/              # Technical utilities + constants
```

**Dependency Rule**: `Infrastructure → Application → Domain` (NEVER reverse)

## 🎯 Contexts (Bounded Contexts)

### 🔐 Auth (Authentication)
- User login with email and password
- Logout with token invalidation
- JWT token generation and validation
- Session management

### 📦 Product (Products)
- Search for canonical products with aggregated offers
- Get all offers for a specific product
- Recent search history (user-specific and global)
- Aggregation of price, delivery time, and rating information

### 🏪 Vendor (Vendors)
- List of available vendors
- Filter by status (enabled/disabled)
- Vendor information for search filters

### 💰 Offer (Offers)
- Domain model for product offers
- Relationship with products and vendors
- Price, delivery, and rating information

## 🚀 Technologies

- **Framework**: NestJS 11.x
- **Language**: TypeScript 5.7
- **Database**: PostgreSQL (TypeORM)
- **Authentication**: JWT (Passport)
- **Validation**: class-validator, class-transformer
- **Documentation**: Swagger/OpenAPI
- **Testing**: Jest
- **Package Manager**: pnpm
- **Security**: bcrypt for passwords, rate limiting with Throttler

## 📦 Installation

```bash
# Install dependencies
$ pnpm install
```

## ⚙️ Configuration

Copy the `.env.example` file to `.env` and update the values:

```bash
cp .env.example .env
```

Then edit `.env` with your actual values. The file should contain the following variables:

```env
# Server
PORT=3000
NODE_ENV=development

# JWT
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=24h

# Database (if using PostgreSQL)
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_DATABASE=wise_compare_hub

# CORS
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001

# MercadoLibre API
MERCADOLIBRE_CLIENT_ID=your-client-id
MERCADOLIBRE_CLIENT_SECRET=your-client-secret
MERCADOLIBRE_OAUTH_TOKEN_URL=https://api.mercadolibre.com/oauth/token
MERCADOLIBRE_PRODUCTS_SEARCH_URL=https://api.mercadolibre.com/products/search
```

## 🏃 Running the Application

```bash
# Development (with watch mode)
$ pnpm run start:dev

# Production
$ pnpm run start:prod

# Debug
$ pnpm run start:debug
```

The API will be available at `http://localhost:3000/api`

## 📚 API Documentation

Once the server is running, Swagger documentation is available at:

```
http://localhost:3000/api/docs
```

## 🧪 Testing

The project follows **TDD (Test-Driven Development)** as a mandatory methodology.

```bash
# Run all tests
$ pnpm run test

# Tests in watch mode
$ pnpm run test:watch

# Coverage
$ pnpm run test:cov

# E2E tests
$ pnpm run test:e2e

# Debug tests
$ pnpm run test:debug
```

## ✅ Validation

Before considering a task complete, run:

```bash
$ pnpm verify
```

This command runs:
1. Lint → Must pass
2. Format check → Must pass
3. Security audit → No critical issues
4. Build → 0 type errors
5. Unit tests → All pass
6. E2E tests → All pass

## 📡 Main Endpoints

### Authentication
- `POST /api/auth/login` - Login
- `POST /api/auth/logout` - Logout (requires token)

### Products
- `GET /api/products/search` - Search products with aggregated offers
- `GET /api/products/:canonicalProductId/offers` - Get all offers for a product
- `GET /api/products/recent-searches` - Get recent searches

### Vendors
- `GET /api/vendors` - List available vendors

### Health
- `GET /api/health` - Application status

## 🔒 Security

- JWT authentication with Bearer tokens
- Passwords hashed with bcrypt
- Rate limiting on sensitive endpoints
- Input validation with class-validator
- CORS configured
- Centralized exception handling with ExceptionFilters

## 🏛️ Design Principles

### TDD (Test-Driven Development)
- 🔴 **RED**: Write failing test first
- 🟢 **GREEN**: Minimal code to pass
- 🔵 **REFACTOR**: Improve while keeping tests green

### Hexagonal Architecture
- **Domain Layer**: Pure business logic, no framework dependencies
- **Application Layer**: Use cases, orchestration, framework agnostic
- **Infrastructure Layer**: HTTP adapters, persistence, framework specific

### Critical Rules
- ❌ NEVER use `any`
- ❌ NEVER hardcode business values (use constants)
- ❌ NEVER put business logic in controllers
- ❌ NEVER handle exceptions in controllers (use ExceptionFilters)
- ✅ Thin controllers: only coordinate
- ✅ Dependencies flow inward: Infrastructure → Application → Domain

## 📁 Context Structure

Each context follows the same hexagonal structure:

```
contexts/{context}/
├── domain/              # Domain models, Value Objects, exceptions
├── application/         # Use cases, ports, DTOs
└── infrastructure/      # Controllers, Repositories, NestJS Module
```

## 🛠️ Available Scripts

```bash
# Development
pnpm run start:dev      # Start in development mode with watch
pnpm run start:debug   # Start in debug mode

# Production
pnpm run build         # Build the project
pnpm run start:prod    # Start in production mode

# Code Quality
pnpm run lint          # Run ESLint
pnpm run format        # Format code with Prettier
pnpm run format:check  # Check format without modifying

# Testing
pnpm run test          # Run unit tests
pnpm run test:watch    # Tests in watch mode
pnpm run test:cov      # Tests with coverage
pnpm run test:e2e      # End-to-end tests

# Full validation
pnpm run verify        # Run lint, format, audit, build and tests
```

## 📖 Additional Documentation

- [AGENTS.md](./AGENTS.md) - Complete guide for developers and AI agents
- [Swagger Docs](http://localhost:3000/api/docs) - Interactive API documentation

## 🤝 Contributing

This project strictly follows the rules defined in `AGENTS.md`. Before contributing:

1. Read `AGENTS.md` completely
2. Follow TDD: write tests first
3. Respect hexagonal architecture
4. Run `pnpm verify` before committing
5. Keep controllers thin
6. Use ExceptionFilters for error handling

## 📝 License

This project is private and not licensed for public use.
