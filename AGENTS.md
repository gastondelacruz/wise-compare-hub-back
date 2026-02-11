# Wise Compare Hub API - Agent Instructions

## How to Use This Guide

- Start here for cross-project norms and general guidelines.
- For detailed architecture patterns, see the **Available Skills** section below.
- This file provides project overview and setup instructions.

## Available Skills

Use these skills for detailed patterns on-demand:

| Skill              | Description                                 | URL                                          |
| ------------------ | ------------------------------------------- | -------------------------------------------- |
| `typescript`       | Const types, flat interfaces, utility types | [SKILL.md](skills/typescript/SKILL.md)       |
| `nestjs-10`        | NestJS framework, DI, modules, decorators   | [SKILL.md](skills/nestjs-10/SKILL.md)        |
| `nestjs-hexagonal` | Hexagonal architecture, DDD, TDD patterns   | [SKILL.md](skills/nestjs-hexagonal/SKILL.md) |
| `jest`             | Unit and integration testing framework      | [SKILL.md](skills/jest/SKILL.md)             |
| `axios`            | HTTP client for API calls and requests      | [SKILL.md](skills/axios/SKILL.md)            |
| `supertest`        | E2E testing library for HTTP endpoints      | [SKILL.md](skills/supertest/SKILL.md)        |
| `playwright`       | Browser automation and E2E testing          | [SKILL.md](skills/playwright/SKILL.md)       |
| `typeorm`          | PostgreSQL ORM for database operations      | [SKILL.md](skills/typeorm/SKILL.md)          |

### Auto-invoke Skills

When performing these actions, ALWAYS invoke the corresponding skill FIRST:

| Action                                                        | Skill              |
| ------------------------------------------------------------- | ------------------ |
| Writing TypeScript types/interfaces                           | `typescript`       |
| Setting up NestJS controllers, services, modules              | `nestjs-10`        |
| Implementing guards, filters, interceptors                    | `nestjs-10`        |
| Writing tests (domain/application/infrastructure)             | `jest`             |
| Writing unit tests for domain/application logic               | `jest`             |
| Writing E2E tests for endpoints                               | `supertest`        |
| Writing E2E browser automation tests                          | `playwright`       |
| Making HTTP requests in application code                      | `axios`            |
| Setting up database models and repositories                   | `typeorm`          |
| Creating database migrations                                  | `typeorm`          |
| Implementing domain layer (entities, value objects)           | `nestjs-hexagonal` |
| Implementing application layer (use cases, ports)             | `nestjs-hexagonal` |
| Implementing infrastructure layer (controllers, repositories) | `nestjs-hexagonal` |
| Creating exception filters                                    | `nestjs-hexagonal` |
| Setting up guards and decorators                              | `nestjs-hexagonal` |

---

## Project Overview

Wise Compare Hub is a NestJS-based API for comparing products using hexagonal architecture with TDD methodology.

| Aspect          | Details                       |
| --------------- | ----------------------------- |
| Framework       | NestJS 10+                    |
| Language        | TypeScript 5+                 |
| Architecture    | Hexagonal (Ports & Adapters)  |
| Methodology     | Test-Driven Development (TDD) |
| Database        | PostgreSQL (via TypeORM)      |
| Package Manager | pnpm                          |

---

## TypeScript Development

```bash
# Setup
pnpm install

# Code quality
pnpm run lint
pnpm run format
pnpm run format:check

# Testing
pnpm test
pnpm test:watch
pnpm test:e2e

# Build & Validation
pnpm run build
pnpm verify
```

---

## Key Technology Stack

- **NestJS 10+**: Progressive Node.js framework
- **TypeScript 5+**: Strict mode enabled
- **TypeORM**: ORM for database operations
- **Jest**: Unit and integration testing framework
- **Supertest**: E2E testing for HTTP endpoints
- **Playwright**: Browser automation and E2E testing
- **Axios**: HTTP client for API requests
- **TypeORM**: PostgreSQL ORM for database operations
- **PostgreSQL**: Primary data store
- **Hexagonal Architecture**: Domain, Application, Infrastructure layers
- **TDD**: Red-Green-Refactor cycle mandatory

---

## Quick Start

1. **Clone & Install**:

   ```bash
   git clone <repository>
   cd wise-compare-hub
   pnpm install
   ```

2. **Setup Database**:

   ```bash
   # Configure .env with database credentials
   pnpm run typeorm:migration:run
   ```

3. **Run Development Server**:

   ```bash
   pnpm run start:dev
   ```

4. **Run Tests**:

   ```bash
   pnpm test
   ```

5. **Validate**:
   ```bash
   pnpm verify
   ```

---

## Commit & Pull Request Guidelines

Follow conventional-commit style: `<type>[scope]: <description>`

**Types**: `feat`, `fix`, `docs`, `chore`, `perf`, `refactor`, `style`, `test`

**Examples**:

- `feat(products): add product filtering by price range`
- `fix(search): handle null comparisons in query builder`
- `test(domain): add validation tests for ProductId value object`
- `refactor(app): simplify use case dependency injection`

Before creating a PR:

1. Run `pnpm verify` - all checks must pass
2. Write tests first (TDD mandatory)
3. Ensure commit messages follow conventions
4. Link related issues or PRs

---

## Code Quality Standards

- ✅ **Strict TypeScript**: No `any` type, `@ts-ignore`, or `@ts-expect-error`
- ✅ **TDD Mandatory**: Write failing tests before implementation
- ✅ **Hexagonal Architecture**: Domain → Application → Infrastructure dependency flow
- ✅ **Constants Only**: Never hardcode business values
- ✅ **Thin Controllers**: Only coordinate, never contain logic
- ✅ **Exception Filters**: Controllers NEVER handle exceptions
- ✅ **Validation**: Run `pnpm verify` before completing tasks

---

## Project Structure

```
src/
├── contexts/              # Business domains
│   └── {context}/
│       ├── domain/        # Pure business logic (no dependencies)
│       ├── application/   # Use cases & orchestration
│       └── infrastructure/# Adapters (NestJS, Database, HTTP)
├── shared/                # Shared kernel across contexts
├── common/                # Technical utilities & constants
└── main.ts                # Application entry point
```

For detailed architecture guidance, see `skills/nestjs-hexagonal/SKILL.md`.

---

## Important Files

- **AGENTS.md**: This file (project guidelines)
- **skills/typescript/SKILL.md**: TypeScript patterns and best practices
- **skills/nestjs-hexagonal/SKILL.md**: Hexagonal architecture, DDD, TDD patterns
- **tsconfig.json**: Strict TypeScript configuration
- **.env.example**: Environment variables template

---

## Getting Help

For detailed guidance on specific patterns:

1. **TypeScript Types & Interfaces** → Read `skills/typescript/SKILL.md`
2. **NestJS Framework (Controllers, Services, Modules)** → Read `skills/nestjs-10/SKILL.md`
3. **Unit & Integration Tests** → Read `skills/jest/SKILL.md`
4. **E2E Testing with HTTP Endpoints** → Read `skills/supertest/SKILL.md`
5. **Browser Automation & E2E Testing** → Read `skills/playwright/SKILL.md`
6. **Making HTTP Requests** → Read `skills/axios/SKILL.md`
7. **Database Models & Repositories** → Read `skills/typeorm/SKILL.md`
8. **Hexagonal Architecture & TDD** → Read `skills/nestjs-hexagonal/SKILL.md`
9. **Domain/Application/Infrastructure Implementation** → Read `skills/nestjs-hexagonal/SKILL.md`
10. **Exception Filters & Guards** → See `skills/nestjs-hexagonal/SKILL.md` and `skills/nestjs-10/SKILL.md`
11. **Architecture Decisions** → Consult the Quick Decision Tree in `skills/nestjs-hexagonal/SKILL.md`

---

## Critical Rules (Never Violate)

1. 🔴 **TDD MANDATORY**: Write failing test BEFORE any production code
2. 🏛️ **Dependencies Flow Inward**: Infrastructure → Application → Domain
3. 🚫 **Domain = Pure TypeScript**: NO framework dependencies in domain
4. ✅ **Validate Before Complete**: Run `pnpm verify` - all must pass
5. 📍 **Constants Only**: Never hardcode business values
6. 🎯 **Controllers = Thin Layer**: Only coordinate, never contain logic
7. 🛡️ **Exception Filters**: Controllers NEVER handle exceptions

---

## Next Steps

1. Install dependencies: `pnpm install`
2. Review `skills/nestjs-hexagonal/SKILL.md` for architecture patterns
3. Review `skills/typescript/SKILL.md` for type safety patterns
4. Start development following TDD workflow
5. Run `pnpm verify` before committing changes
