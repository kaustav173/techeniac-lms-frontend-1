# TechEniac LMS Frontend

TechEniac LMS Frontend provides the student, instructor, and admin web experience for the TechEniac Learning Management System. Built with Next.js 16 (App Router), React 19, strict TypeScript, and Tailwind CSS, consuming the backend API at `/api/v1`.

## Repository Map

- `app/`: Next.js App Router root layouts, pages, and route groups (`(public)`, `(auth)`).
- `components/`: UI components organized by tier (`ui/`, `patterns/`, `layout/`, `app/`).
- `hooks/`: Reusable custom React hooks.
- `services/`: API client services communicating with `/api/v1`.
- `lib/`: Shared utility functions, validation schemas (`lib/validation/`), and third-party client instantiations.
- `context/`: Lightweight client-only React contexts.
- `proxy.ts`: Cheap edge routing/redirect placeholder (Next.js 16 convention; not security).
- `.agent/`: Engineering standards, architecture decisions, and non-negotiable rules.

## Available Commands

- `npm run dev`: Start Next.js local development server.
- `npm run build`: Create an optimized production build.
- `npm run start`: Start production Next.js server.
- `npm run lint`: Run ESLint checks (`--max-warnings=0`).
- `npm run lint:test-rules`: Run automated ESLint rule verification fixtures.
- `npm run typecheck`: Run TypeScript static type analysis (`tsc --noEmit`).
- `npm run format`: Format code with Prettier and Tailwind class sorting.
- `npm run format:check`: Check code formatting with Prettier.
- `npm run prepare`: Configure Husky Git hooks.
- `npm test`: _(coming soon)_ Run automated unit and component tests.
- `npm run e2e`: _(coming soon)_ Run end-to-end integration tests.

## Non-Negotiable Rules

1. **No Secrets in Public Env**: Never store secrets, keys, or credentials in `NEXT_PUBLIC_*` or client code.
2. **OpenAPI-Generated Types**: Generate API schemas/types from backend OpenAPI specs; do not hand-write them.
3. **Server State in TanStack Query**: Keep server state in TanStack Query cache; never duplicate into local UI state.
4. **Proxy & UI Hiding Are Not Access Control**: `proxy.ts` and UI guards are routing/UX conveniences; backend enforces authorization.
5. **Architecture Confinement**: `components/ui/**` cannot import higher tiers (`app`, `patterns`, `services`, `hooks`). Pages/components cannot import `services/**` directly; data access must go through `hooks/**`.
6. **No Direct Commits to Protected Branches & Mandatory Branch Planning**: Direct commits to `main`, `staging`, and `dev` are strictly prohibited; all changes must arrive via Pull Requests. Before any code changes, identify the target branch (`feat/*`, `fix/*`, `chore/*`), present multi-branch roadmaps for large features upfront, obtain explicit user approval before creating/switching branches, and ensure the workspace is on the target branch before writing code. Never run mutating Git commands without explicit per-command user approval.
7. **No Console Log**: Prohibit `console.log` in committed code; use structured logging/observability when configured.
8. **Continuous Integration**: All Pull Requests must pass the GitHub Actions CI pipeline (Gitleaks, typecheck, lint, architecture rule fixtures, format check, and Next.js build) before merging.
9. **Branch Diff Limit (<400 Lines)**: Changes in a single branch or PR must not exceed ~400 lines of code. If more than 400 lines are needed in one branch, prompt and ask the user for confirmation before making those changes, or break them down into a multi-branch roadmap.

## Agent Governance Links

- [Architecture Overview](.agent/architecture.md)
- [Development Conventions](.agent/conventions.md)
- [Architecture Decision Records](.agent/decisions.md)
- [Git Safety Rules](.agent/rules/git-safety.md)
- [Security Rules](.agent/rules/security.md)
- [UI Components & Design System Rules](.agent/rules/ui-components.md)
