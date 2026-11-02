# Architecture Decision Records (ADRs)

## ADR-001: Node.js 24 LTS Runtime

- **Date**: 2026-10-14
- **Status**: Accepted
- **Context**: The frontend application requires a stable Node.js runtime aligned with modern ECMAScript standards, performance optimizations, and long-term security maintenance, matching the backend runtime.
- **Options**:
  1. Node.js 20 LTS
  2. Node.js 22 LTS
  3. Node.js 24 LTS
- **Choice**: Node.js 24 LTS with `.nvmrc` set to `24` and `package.json` engines pinned to `>=24 <25`.
- **Reasons**: Node 24 is the active LTS release offering updated V8 engine optimizations, standard native cryptographic and fetch primitives, and parity with the `TechEniac-lms-backend` environment.
- **Consequences**: Local development and deployment environments must use Node 24. Older Node runtime environments are unsupported.

---

## ADR-002: Next.js 16 App Router Framework

- **Date**: 2026-10-14
- **Status**: Accepted
- **Context**: The frontend requires a production React framework supporting server-side rendering, streaming, static optimization, edge routing, and native TypeScript support.
- **Options**:
  1. Vite + React Single Page App (SPA)
  2. Next.js 14 / 15 Pages Router
  3. Next.js 16 App Router with Turbopack
- **Choice**: Next.js 16.4.0 with App Router, Turbopack, and React 19.
- **Reasons**: Next.js 16 is the verified stable release installed by `create-next-app@latest`. App Router provides first-class React Server Components, streaming SSR, built-in metadata management, and nested layouts, while Turbopack dramatically accelerates local build and development cycles.
- **Consequences**: Route definitions must follow App Router folder conventions (`app/page.tsx`, `app/layout.tsx`). Client interactivity requires explicit `'use client'` directives.

---

## ADR-003: TypeScript Compiler Strictness Flags

- **Date**: 2026-10-14
- **Status**: Accepted
- **Context**: We need to configure TypeScript compilation options to guarantee maximum static type safety without breaking framework runtime execution or build pipelines.
- **Options**:
  1. Standard `strict: true` baseline only.
  2. `strict: true` with selective flags (`noUncheckedIndexedAccess`, `noImplicitOverride`) while disabling `exactOptionalPropertyTypes` based on hypothetical third-party typing conflicts.
  3. Fully enabled strict compiler flags: `strict: true`, `noUncheckedIndexedAccess: true`, `noImplicitOverride: true`, and `exactOptionalPropertyTypes: true`.
- **Choice**: Option 3 (All four strict flags enabled).
- **Reasons**:
  - We ran empirical evaluations testing `npx tsc --noEmit` and `npm run build` on the scaffolded Next.js 16 App Router project with all four flags enabled.
  - The static analysis and Turbopack production build both exited with code 0 without any type or compilation errors.
  - Rather than disabling `exactOptionalPropertyTypes` based on assumptions, empirical evidence demonstrates full compatibility with the Next.js 16 and React 19 foundation.
  - `noUncheckedIndexedAccess: true` prevents invisible undefined runtime indexing errors.
  - `noImplicitOverride: true` enforces explicit intent when extending classes or methods.
  - `exactOptionalPropertyTypes: true` prevents accidentally assigning `undefined` to optional properties that expect omission or explicit values.
- **Consequences**: Developers must write precise types, handle potential `undefined` array lookups, and respect exact optional property assignments.

---

## ADR-004: Decoupled Repositories vs Monorepo

- **Date**: 2026-10-14
- **Status**: Accepted
- **Context**: The TechEniac LMS consists of an API backend (`TechEniac-lms-backend`) and a user-facing frontend (`TechEniac-lms-frontend`). We must select repository architecture.
- **Options**:
  1. Unified Monorepo housing both backend and frontend.
  2. Decoupled individual repositories (`TechEniac-lms-backend` and `TechEniac-lms-frontend`).
- **Choice**: Decoupled individual repositories.
- **Reasons**:
  - Autonomous deployment lifecycles and CI/CD pipelines (Vercel/edge for frontend, container/cloud for backend).
  - Clear domain boundaries: the backend exposes a versioned REST API (`/api/v1`), and the frontend acts as an API consumer.
  - Simpler dependency trees without monorepo tooling overhead (e.g. Turborepo, Nx).
  - Independent security access and repository permissions.
- **Consequences**: API contracts must be formally synchronized via OpenAPI specifications.

---

## ADR-005: Pull Request Merging & Linear History Discipline

- **Date**: 2026-10-14 (Updated: 2026-10-19)
- **Status**: Accepted
- **Context**: A Git branching and merging strategy is required to maintain a readable, bisectable history across integration branches.
- **Options**:
  1. Merge commits via Pull Requests (`git merge --no-ff`)
  2. Fast-forward rebase
  3. Squash merge via Pull Requests
- **Choice**: Merge commits via reviewed Pull Requests with Conventional Commits for all branches merged into `dev`, with structured promotion across `dev` -> `staging` -> `main`.
- **Reasons**:
  - Preserves complete development commit history and author attribution across pull requests.
  - Produces traceable PR merge points linking features and fixes to their PR context.
  - Maintains strict semantic versioning and changelog accuracy through Conventional Commits.
- **Consequences**: Individual commit histories on feature branches are preserved upon merge. Developers must write Conventional Commit messages for all commits on working branches.

---

## ADR-006: Folder Layout & Component Tiering

- **Date**: 2026-10-14
- **Status**: Accepted
- **Context**: As the LMS application scales to include public landing pages, student portals, instructor course builders, and admin panels, clear folder conventions are necessary to prevent architectural decay.
- **Options**:
  1. Flat component structure inside `components/` and arbitrary route nesting.
  2. Feature-sliced route groups with a four-tier component architecture (`components/{ui,patterns,layout,app}`) and dedicated directories for `hooks/`, `services/`, `lib/`, and `context/`.
- **Choice**: Option 2.
- **Reasons**:
  - Route groups `app/(public)` and `app/(auth)` provide clear layout boundaries and route separation without altering URL pathnames.
  - Primitive UI atoms (`components/ui`) remain decoupled from business logic.
  - Complex UI assemblies (`components/patterns`) provide reusable compositions.
  - Page-specific views (`components/app`) keep route files lightweight.
  - Server state is isolated in TanStack Query via `services/`, preventing client context bloat.
- **Consequences**: Developers must place components and files within their appropriate tier based on reusability and scope.

---

## ADR-007: Migration to Proxy Convention (`proxy.ts`)

- **Date**: 2026-10-14
- **Status**: Accepted
- **Context**: In Next.js 16, the `middleware.ts` convention is officially deprecated in favor of `proxy.ts` (documented in `docs/01-app/03-api-reference/03-file-conventions/proxy.md`). Turbopack outputs deprecation warnings during build when `middleware.ts` is present.
- **Options**:
  1. Retain deprecated `middleware.ts` and ignore build deprecation warnings.
  2. Migrate to the native Next.js 16 `proxy.ts` convention with `export function proxy()` and standard config matcher.
- **Choice**: Option 2 (`proxy.ts`).
- **Reasons**:
  - Next.js renamed the convention to prevent confusion with Express.js middleware and clarify that the feature acts as a network/edge boundary in front of the application.
  - Adopting `proxy.ts` eliminates deprecation warnings during `npm run build` and ensures long-term alignment with Next.js 16+ API conventions.
  - The routing logic (`NextResponse.next()`) and critical security disclaimer are preserved without behavioral regressions.
- **Consequences**: Root routing logic is maintained in `proxy.ts`. Developers must export `proxy` instead of `middleware`.

---

## ADR-008: Development Quality Tools, Architecture Confinement, and Hook Pipeline

- **Date**: 2026-10-14
- **Status**: Accepted
- **Context**: The frontend codebase requires strict automated quality gates to prevent code quality decay, architectural boundary erosion, secret leaks, and non-conventional git commit histories as the application scales.
- **Options**:
  1. Rely on default Next.js ESLint and manual code reviews.
  2. Implement an automated multi-tier quality pipeline: ESLint 9 Flat Config with type-aware linting (`tsconfig.eslint.json`), custom architecture confinement rules, automated lint fixture verification, Husky 9 Git hooks with Gitleaks secret detection, Commitlint conventional commit enforcement, and Prettier with Tailwind CSS class sorting.
- **Choice**: Option 2.
- **Reasons**:
  - Type-aware TypeScript ESLint rules enforce strict standards (`@typescript-eslint/no-explicit-any`, `no-console`, `@typescript-eslint/no-floating-promises`, `@typescript-eslint/no-misused-promises`, `simple-import-sort`, `jsx-a11y/alt-text`) without polluting production `tsconfig.json`.
  - Architecture confinement rules (`architecture/ui-primitive-confinement`, `architecture/service-calls-only-in-hooks`) prevent UI primitives (`components/ui/**`) from importing higher tiers or business logic, and restrict direct service calls (`services/**`) to React hooks (`hooks/**`).
  - An automated test harness (`scripts/test-lint-rules.mjs` and `lint-fixtures/`) proves deterministically that all architecture and critical quality rules trigger expected errors.
  - Husky Git hooks (`pre-commit`, `commit-msg`) execute Gitleaks secret detection, `lint-staged` autofix and formatting, TypeScript compilation checks, and Conventional Commit validation prior to recording changes.
  - Prettier with `prettier-plugin-tailwindcss` enforces consistent formatting and deterministic Tailwind CSS class ordering.
  - Next.js `proxy.ts` is maintained and explicitly documented as a routing and UX mechanism rather than a security boundary; backend authorization remains authoritative.
- **Consequences**:
  - All commits must pass typecheck, lint, formatting, secret scanning, and commit-msg validation.
  - Developers must have Gitleaks installed locally to commit changes.
  - Architecture boundaries are enforced automatically during linting and in supported IDEs.

---

## ADR-009: Centralized Reusable Validation Primitives with Zod

- **Date**: 2026-10-15
- **Status**: Accepted
- **Context**: User input across frontend forms (e.g., authentication, password reset, account management, profile editing) requires client-side validation to provide immediate feedback. Implementing ad-hoc schemas across different components leads to duplicated logic, inconsistent error messaging, and drift from backend validation rules.
- **Options**:
  1. Define independent inline Zod schemas within individual form components.
  2. Rely solely on HTML5 input attributes and backend validation responses.
  3. Establish centralized, reusable atomic validation schemas in `lib/validation/` using Zod.
- **Choice**: Option 3 (Centralized atomic schemas in `lib/validation/`).
- **Reasons**:
  - Parity with backend constraints: Enforces exact parity with `TechEniac-lms-backend` validation rules (`passwordSchema`, `emailSchema`, `uuidSchema`), guaranteeing identical password complexity (min 10, max 64, uppercase, lowercase, number, special character) and email formats.
  - DRY & Composable: Individual form schemas (login, registration, change password) compose these centralized primitives directly rather than duplicating validation rules.
  - Type Inference: Zod provides automatic TypeScript type inference (`z.infer<typeof schema>`), ensuring end-to-end type safety between form state and validated data.
- **Consequences**:
  - All reusable validation primitives reside in `lib/validation/common.schemas.ts` and are re-exported via `lib/validation/index.ts`.
  - Component forms import shared primitives from `@/lib/validation` when constructing composite form schemas.

---

## ADR-010: GitHub Actions CI Pipeline for Universal Pull Requests

- **Date**: 2026-10-15
- **Status**: Accepted
- **Context**: To guarantee repository integrity, prevent broken builds, and protect against secret leaks before merging code, continuous integration must run on all pull requests and main pushes.
- **Options**:
  1. Trigger CI solely on pull requests targeting `main`.
  2. Rely only on local pre-commit hooks without automated remote CI verification.
  3. Universal pull request workflow triggering on any pull request between any branches plus pushes to `main`.
- **Choice**: Option 3 (Universal pull request trigger with fail-fast stages).
- **Reasons**:
  - Covers all PR branches: Developers frequently open PRs into feature branches or release branches before merging to `main`; running checks on all PRs guarantees defects are caught early regardless of branching path.
  - Fail-fast quality gates: The job executes secret scanning (Gitleaks), deterministic installation (`npm ci`), static typing (`tsc --noEmit`), linting (`eslint --max-warnings=0`), architecture boundary verification (`npm run lint:test-rules`), formatting check (`prettier --check`), and Turbopack production build (`next build`).
  - Next.js build cache: Leverages GitHub Actions caching for `.next/cache` to keep CI run times under 2 minutes.
  - Concurrency management: Automatically cancels stale in-flight runs when new commits are pushed to the same PR.
- **Consequences**:
  - All pull requests require a green CI status check to pass quality review.
  - CI workflow is maintained at `.github/workflows/ci.yml`.

---

## ADR-011: Branching Hierarchy & Protected Branches Strategy

- **Date**: 2026-10-15
- **Status**: Accepted
- **Context**: As development scales across multiple contributors, a disciplined branching strategy is necessary to prevent untested code or direct commits from polluting integration (`dev`), staging (`staging`), and production (`main`) branches.
- **Options**:
  1. Trunk-based development allowing direct commits to `main` by core maintainers.
  2. Single default branch (`main`) with feature branches.
  3. Tiered Gitflow-inspired hierarchy ($\text{main} \leftarrow \text{staging} \leftarrow \text{dev} \leftarrow \text{feat/*}$) with protected branches enforced locally and remotely.
- **Choice**: Option 3 (Tiered branch hierarchy with protected branches).
- **Reasons**:
  - Clear separation of concerns: `main` tracks production releases, `staging` tracks pre-production/QA verification, and `dev` serves as the shared integration target.
  - Multi-tier enforcement: Direct commits to `main`, `staging`, and `dev` are prevented locally via the `.husky/pre-commit` hook and remotely via GitHub branch protection rules.
  - Unified CI: The GitHub Actions CI pipeline runs on every Pull Request between any branches and validates post-merge builds across `main`, `staging`, and `dev`.
- **Consequences**:
  - Developers must work in feature/fix branches (`feat/*`, `fix/*`, `chore/*`) created off `dev`.
  - Direct commits on `main`, `staging`, or `dev` trigger immediate failure in `.husky/pre-commit`.
  - Merging into protected branches requires Pull Requests and passing CI checks.

---

## ADR-012: Domain Statuses Modeled as String Enums & Boundary Normalization

- **Date**: 2026-10-28
- **Status**: Accepted
- **Context**: Domain status types across courses and submissions (e.g. `AssignmentScope`, `SubmissionMode`, `SubmissionStatus`, `AssignmentDerivedStatus`) had inconsistent modeling between string unions and TypeScript enums. Furthermore, submission payloads from backend APIs could contain dual camelCase/snake_case keys (`pdfUrl`/`pdf_url`, `zipUrl`/`zip_url`, `linkUrl`/`url`), causing unsafe `as` casts across consuming components.
- **Options**:
  1. Plain string union aliases throughout the frontend without runtime enum objects.
  2. Ad-hoc dual-key checks and `as string` casts scattered across individual React components.
  3. Standardize domain statuses as TypeScript string enums matching backend entities, and normalize API response/request data at the service boundary (`services/submissions.service.ts`).
- **Choice**: Option 3 (String enums + service boundary normalization).
- **Reasons**:
  - Consistency: Establishes a uniform convention across all LMS domain statuses matching `types/courses.ts` (`AssignmentScope`, `SubmissionMode`) and backend entities (`SubmissionStatus`).
  - Type safety: Eliminates magic strings and typo-prone comparisons across filters, badges, and version histories.
  - Boundary isolation: Normalizing `submissionData` at the service boundary guarantees components consume clean, canonical `{ pdfUrl, zipUrl, linkUrl }` without needing dual-key checks or `as` type assertions.
- **Consequences**:
  - Status types must be exported as string enums in `types/`.
  - API response and payload translation must occur within `services/` rather than leaking into React components.

---

## ADR-013: Strict Role Transition Modal Constraints and Action Disablement

- **Date**: 2026-10-30
- **Status**: Accepted
- **Context**: In alignment with backend business logic (ADR-019), user role modification must adhere to a strict progression: Mentees can only transition to Mentors, Mentors can only transition to Super Admins, and Super Admin accounts cannot be changed. The frontend UI must reflect these constraints across modals and directory tables.
- **Options**:
  1. Display all roles in dropdowns and rely on backend API rejection errors.
  2. Filter target role options dynamically via `ALLOWED_ROLE_TRANSITIONS` in `ChangeRoleModal`, display an informational alert banner for Super Admin accounts, and disable the "Change Role" table action for Super Admin rows.
- **Choice**: Option 2.
- **Reasons**:
  - **Error Prevention & UX Clarity**: Pre-filtering options prevents users from attempting invalid transitions (e.g. Mentee $\rightarrow$ Super Admin or Mentor $\rightarrow$ Mentee).
  - **Visual Feedback**: Super Admin accounts display a clear "Role Modification Restricted" notice, and directory table action buttons are explicitly disabled with descriptive tooltips.
  - **Architectural Parity**: Keeps frontend form validation and dropdown values 100% synchronized with the backend state machine without contract drift.
- **Consequences**:
  - `ChangeRoleModal` filters dropdown options based on `ALLOWED_ROLE_TRANSITIONS`:
    - Mentee $\rightarrow$ `['MENTOR']` only.
    - Mentor $\rightarrow$ `['SUPER_ADMIN']` only.
    - Super Admin $\rightarrow$ `[]` (selection and submit disabled).
  - In `UsersTable`, the "Change Role" button is disabled for `SUPER_ADMIN` rows with tooltip `"Super Admin role cannot be changed"`.
