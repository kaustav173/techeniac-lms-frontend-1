# Security Rules

These security rules protect confidential credentials, client runtime integrity, and infrastructure safety for `TechEniac-lms-frontend`.

## Secret Handling & Environment Variables

- **No Secrets in `NEXT_PUBLIC_*`**: Any environment variable prefixed with `NEXT_PUBLIC_` is inlined into the client-side JavaScript bundle and publicly accessible to anyone. Never place API secrets, private encryption keys, service role credentials, or database connection strings in `NEXT_PUBLIC_*`.
- **No Real Secrets**: Never view, read, open, print, edit, or commit real secrets, API keys, or actual `.env` files.
- **`.env.example` Only**: All environment documentation and templates must reside exclusively in `.env.example`.
- **Safe Placeholders**: Always use obvious, unambiguous placeholders (e.g. `http://localhost:4000/api/v1`, `replace-me`) in example files.
- **Git Tracking**: Real environment files (`.env`, `.env.*`) must remain strictly ignored in `.gitignore`, while ensuring `.env.example` is tracked.

## Access Control & Authorization

- **UI Hiding Is Not Access Control**: Hiding a button, masking a menu item, or redirecting via Next.js proxy / client hooks does NOT protect sensitive data or actions. The backend API (`/api/v1`) must independently verify authorization on every HTTP request.
- **Proxy Boundary**: Next.js edge/frontend proxy (formerly middleware) is for lightweight UX routing and redirection only. It is not an authorization boundary.

## Logging & Code Hygiene

- **No `console.log`**: Prohibit `console.log` statements in committed code. Use structured error boundaries and centralized error reporting in production.
- **No Sensitive Data Exposure**: Never log or render sensitive user tokens, passwords, or PII into error boundaries, URL parameters, or client state.
