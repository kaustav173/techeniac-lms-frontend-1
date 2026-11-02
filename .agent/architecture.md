# Frontend Architecture

## Overview

`TechEniac-lms-frontend` is the web client for the TechEniac Learning Management System. It is built as a single decoupled client repository interacting with `TechEniac-lms-backend` via its versioned REST API (`/api/v1`).

## Core Tech Stack

- **Runtime**: Node.js 24 LTS (see `.nvmrc` and `package.json` engines)
- **Framework**: Next.js 16 (App Router with Turbopack)
- **UI Library**: React 19
- **Language**: TypeScript in strict mode (`strict: true`, `noUncheckedIndexedAccess: true`, `noImplicitOverride: true`, `exactOptionalPropertyTypes: true`)
- **Styling**: Tailwind CSS v4 (`@tailwindcss/turbopack`)
- **Module & Import Alias**: ECMAScript Modules (ESM) with import alias `@/*` pointing to project root

## Directory Organization & Responsibilities

- **`app/`**: Next.js App Router structure:
  - `(public)/`: Unauthenticated public pages (e.g. landing page, public course catalog).
  - `(auth)/`: Authenticated user application routes (e.g. student dashboard, course consumption, instructor studio, admin settings).
  - `layout.tsx`: Root HTML shell and font configuration.
  - `error.tsx`: Root client-side error boundary with retry capability.
  - `not-found.tsx`: Global 404 handler.
- **`components/`**: Four-tier component architecture:
  - `ui/`: Primitive, domain-agnostic UI building blocks (buttons, inputs, dialogs, badges).
  - `patterns/`: Reusable composite UI patterns (data tables, form containers, filter bars).
  - `layout/`: Global and route group layout scaffolding (navigation bars, sidebars, footers).
  - `app/`: Feature-specific composite views tied directly to LMS pages.
- **`hooks/`**: Custom, reusable React hooks for UI interactions and device capabilities.
- **`services/`**: API interaction services connecting to `NEXT_PUBLIC_API_BASE_URL` (`/api/v1`).
- **`lib/`**: Generic pure utility functions, client library wrappers, and client-side validation schemas (`lib/validation/`).
- **`context/`**: React contexts reserved strictly for localized client-only UI state (theme, sidebar toggle) and root session propagation. Contexts are thin state containers and must never call services directly; all service invocations reside exclusively in `hooks/` (e.g. `hooks/useAuthProvider.ts`).
- **`proxy.ts`**: Edge routing/proxy placeholder for early UX redirects (Next.js 16 convention replacing deprecated `middleware.ts`).

## Architectural Principles

1. **Server State vs Client State**:
   - Server state (courses, users, enrollments) will be managed and cached exclusively via TanStack Query (planned for installation in upcoming data fetching PR). It is never copied into or synchronized with local global state managers.
2. **Contract-Driven Typing**:
   - Types for backend resources and API payloads will be generated from the backend's OpenAPI contract rather than manually typed to prevent interface drift (planned code generation pipeline in upcoming PR).
3. **Decoupled Repositories**:
   - The frontend remains fully autonomous from the backend repository, communicating only over standardized HTTP/REST APIs.
4. **Security Boundary Distinction**:
   - Frontend route protection and proxy are UX conveniences. The backend is the sole source of authorization and validation.
