# Development Conventions

## Branch Hierarchy & Workflow

The repository follows a tiered branch hierarchy:

$$\text{main (Production)} \longleftarrow \text{staging (Pre-production)} \longleftarrow \text{dev (Integration)} \longleftarrow \text{feature/fix branches}$$

- **`main`**: Production-ready code only. Direct commits prohibited.
- **`staging`**: Pre-production testing and QA. Direct commits prohibited.
- **`dev`**: Daily integration branch. Direct commits prohibited.
- **Feature / Maintenance Branches**: Branched off `dev` using semantic prefixes:
  - `feat/<short-description>`: New client feature or page.
  - `fix/<short-description>`: Bug fix in UI or client state.
  - `chore/<short-description>`: Tooling, dependency updates, maintenance.
  - `docs/<short-description>`: Documentation changes.
  - `refactor/<short-description>`: Code restructuring without UI behavior changes.
  - `test/<short-description>`: Adding or modifying automated tests.

## Commit Standards

Follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

- Format: `<type>(<optional scope>): <description>`
- Examples:
  - `feat(layout): add authenticated dashboard sidebar`
  - `fix(auth): handle expired refresh token redirect`
  - `chore(deps): update next to 16.4.0`

## Pull Request Discipline

- **Protected Branches**: Direct commits to `main`, `staging`, and `dev` are strictly prohibited locally via Husky pre-commit hooks and remotely via GitHub branch protection rules. All changes must arrive via Pull Requests.
- **Diff Size**: Pull requests should ideally remain under ~400 lines of changed code to facilitate thorough, high-quality peer review.
- **Merge Strategy**: Merges occur via reviewed and CI-passed Pull Requests with Conventional Commits, preserving commit history and PR traceability across tiers.

## TypeScript Standards

- Strict mode is fully enabled. Do not use `any` — use `unknown` with type narrowing or generic constraints.
- `noUncheckedIndexedAccess` is active: all indexed access (`array[i]` or `record[key]`) evaluates as `T | undefined`.
- `noImplicitOverride` is active: class method overrides must use the `override` keyword.
- `exactOptionalPropertyTypes` is active: optional properties cannot be passed explicit `undefined` unless specifically typed as `T | undefined`.

## Styling & Components

- **Reusable UI Primitives**: Follow [.agent/rules/ui-components.md](rules/ui-components.md). Never render raw HTML `<button>`, headings (`<h1>`..`<h6>`), paragraphs (`<p>`), or inline tags (`<span>`, `<code>`). Always import and use `<Button>`, `<Typography>` (or semantic exports `H1`, `H2`, `H3`, `H4`, `P`, `Span`, `Code`), `<Modal>`, `<Input>`, and `<Label>` from `@/components/ui/` or `@/components/patterns/`.
- **Strict Typography Policy**: Universal 'Plus Jakarta Sans' across all views, forms, tables, headers, and controls. Never use monospace or `font-mono`. Follow [.agent/rules/typography.md](rules/typography.md).
- **Tailwind CSS**: Use utility classes directly in JSX. Extract repeated UI patterns into `components/ui/` or `components/patterns/` rather than inventing ad-hoc CSS classes.
- **Component File Structure**: Use PascalCase for component filenames (`UserProfileCard.tsx`). Use standard camelCase for utility and hook files (`useAuth.ts`, `formatDate.ts`).
- **No `console.log`**: Avoid `console.log` in committed application code.
