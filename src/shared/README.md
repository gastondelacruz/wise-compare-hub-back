# Shared Kernel

Code shared across multiple bounded contexts.

## Structure

- `domain/` - Shared domain concepts (value objects, exceptions, interfaces)
- `application/` - Shared application concerns (interfaces, decorators)
- `infrastructure/` - Shared infrastructure (filters, guards, interceptors, config)

## Rules

- Only place code here if it's used by 2+ contexts
- Domain layer can import from `shared/domain`
- Application layer can import from `shared/domain` and `shared/application`
- Infrastructure layer can import from all shared layers
