# TechEniac-lms-frontend

## Prerequisites

- Node.js 24 LTS (see `.nvmrc`)
- npm (bundled with Node 24)
- [Gitleaks](https://github.com/gitleaks/gitleaks) (required for pre-commit secret scanning hooks)

## Setup

```bash
# Ensure Node 24 is active
nvm use

# Install dependencies
npm install

# Initialize Husky Git hooks (runs automatically during npm install)
npm run prepare
```

## Environment

```bash
# Copy example environment configuration
cp .env.example .env.local
```

> **Note**: `NEXT_PUBLIC_*` variables are bundled into client-side code and publicly visible. Never place secrets in `.env.local`.

## Run

```bash
# Start local development server
npm run dev

# Run static type analysis
npm run typecheck

# Lint source files with zero warning tolerance
npm run lint

# Prove and verify custom ESLint rules against test fixtures
npm run lint:test-rules

# Check source file formatting
npm run format:check

# Automatically format source files with Prettier and Tailwind plugin
npm run format

# Initialize Husky Git hooks
npm run prepare

# Create optimized production build
npm run build

# Start production server
npm run start
```

## Test

_(Automated test suite coming soon; lint rule verification available via `npm run lint:test-rules`)_

## Migrations

Frontend does not manage database migrations. Database schema migrations are handled by `TechEniac-lms-backend`.

## Troubleshooting

- **Node Version Mismatch**: Ensure Node 24 is active by running `nvm use` or verify with `node -v`.
- **API Connection**: Ensure `NEXT_PUBLIC_API_BASE_URL` in `.env.local` points to a running backend service (default: `http://localhost:4000/api/v1`).
- **Gitleaks Not Found**: If commits fail with `Gitleaks is required but was not found on PATH`, install Gitleaks on your system (e.g., via package manager or GitHub release).
- **Lint Fixtures**: Intentionally invalid fixtures in `lint-fixtures/` are excluded from standard linting (`npm run lint`) and tested exclusively via `npm run lint:test-rules`.

## Docs

- [Architecture Overview](.agent/architecture.md)
- [Development Conventions](.agent/conventions.md)
- [Architecture Decision Records](.agent/decisions.md)
- [Git Safety Rules](.agent/rules/git-safety.md)
- [Security Rules](.agent/rules/security.md)
