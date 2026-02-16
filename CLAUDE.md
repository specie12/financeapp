# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Architecture Overview

This is a TypeScript monorepo for a comprehensive financial management application using pnpm workspaces and Turbo for build orchestration.

### Applications (`apps/`)

- **`api/`** - NestJS backend API with PostgreSQL/Prisma
  - Authentication/authorization with JWT and role-based permissions
  - Financial data integration with Plaid
  - AI-powered insights using Anthropic SDK
  - Comprehensive financial modules (assets, liabilities, budgets, goals, etc.)

- **`web/`** - Next.js frontend web application
  - React 19 with TypeScript
  - Tailwind CSS + Radix UI components
  - React Hook Form with Zod validation
  - Recharts for data visualization

- **`mobile/`** - Expo React Native mobile application
  - Expo Router for navigation
  - Shared types and validation with web/api

### Shared Packages (`packages/`)

- **`api-client/`** - Shared API client for web and mobile
- **`finance-engine/`** - Core financial calculations and business logic
- **`shared-types/`** - TypeScript types shared across all apps
- **`validation/`** - Zod schemas for consistent validation

## Development Commands

### Root Level Commands

```bash
# Development
pnpm dev                 # Start all apps in development mode
pnpm build              # Build all apps
pnpm lint               # Lint all apps
pnpm lint:fix           # Fix linting issues
pnpm type-check         # TypeScript type checking
pnpm format             # Format code with Prettier
pnpm clean              # Clean all build artifacts

# Individual app commands
pnpm api <command>      # Run command in API app
pnpm web <command>      # Run command in web app
pnpm mobile <command>   # Run command in mobile app
```

### API Development

```bash
# Start development server
pnpm api dev

# Database operations
pnpm api db:generate    # Generate Prisma client
pnpm api db:migrate     # Run database migrations
pnpm api db:seed        # Seed database with initial data
pnpm api db:studio      # Open Prisma Studio
pnpm api db:reset       # Reset database (WARNING: destructive)

# Testing
pnpm api test           # Run unit tests
pnpm api test:watch     # Run tests in watch mode
pnpm api test:e2e       # Run end-to-end tests
pnpm api test:cov       # Generate test coverage
```

### Web Development

```bash
pnpm web dev            # Start Next.js dev server (localhost:3001)
pnpm web build          # Build for production
pnpm web start          # Start production server
```

### Mobile Development

```bash
pnpm mobile dev         # Start Expo dev server
pnpm mobile android     # Start Android development
pnpm mobile ios         # Start iOS development
```

## Database Setup

The application uses PostgreSQL with Prisma ORM:

1. **Start PostgreSQL**: `docker-compose up -d` (runs on port 5433)
2. **Copy environment**: Copy `apps/api/.env.example` to `apps/api/.env`
3. **Run migrations**: `pnpm api db:migrate`
4. **Seed database**: `pnpm api db:seed`

## Authentication & Authorization

The API implements a multi-layered security system:

1. **JwtAuthGuard** - JWT token validation and user attachment
2. **PermissionGuard** - Role-based permission checking
3. **HouseholdGuard** - Resource ownership verification

Use `@RequirePermission()` decorator and `@ResourceId()` for protected endpoints.

## Key Architecture Patterns

### Module Structure

- Each domain has its own NestJS module (AuthModule, AssetsModule, etc.)
- Controllers handle HTTP requests with proper DTO validation
- Services contain business logic and database operations
- Guards handle security concerns at the application level

### Validation Strategy

- Zod schemas in `packages/validation` for consistent validation across apps
- DTOs in API use class-validator decorators
- Frontend forms use react-hook-form with Zod resolvers

### Financial Calculations

- Core financial logic resides in `packages/finance-engine`
- Uses decimal.js for precise currency calculations
- Shared between API services and frontend calculations

### Database Design

- Multi-tenant architecture with household-based data isolation
- Comprehensive financial entities (accounts, transactions, assets, liabilities, budgets)
- Audit fields (createdAt, updatedAt) on all entities
- Support for multiple currencies and countries

## External Integrations

- **Plaid** - Bank account linking and transaction import
- **Anthropic Claude** - AI-powered financial insights and recommendations

## Testing Strategy

- **Unit tests** - Jest with coverage reporting
- **E2E tests** - Available for API endpoints
- Run `pnpm test` from root to test all packages
- Individual package testing with `pnpm <package> test`

## Code Quality

- **ESLint** with TypeScript and Prettier integration
- **Husky** pre-commit hooks for linting and formatting
- **GitHub Actions** CI pipeline for linting, type-checking, and testing
- Strict TypeScript configuration with comprehensive compiler options
