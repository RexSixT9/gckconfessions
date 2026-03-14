# Modular Structure (Reduced Complexity)

This repository now follows clearer module boundaries for the split apps.

## Apps

- `apps/public`: public-facing experience (landing + submit + public APIs)
- `apps/admin`: moderation/admin experience (admin UI + admin APIs)

## Internal module boundaries per app

- `src/app/*`: routes, layouts, route handlers (framework layer)
- `components/*`: UI and presentation modules
- `components/ui/*`: reusable design-system primitives
- `lib/*`: utilities, security, auth, DB helpers (service layer)
- `models/*`: data schemas/models (data layer)
- `types/*`: local type declarations

## Import conventions

Use these aliases (configured in each app `tsconfig.json`):

- `@/app/*`
- `@/components/*`
- `@/lib/*`
- `@/models/*`
- `@/types/*`

Compatibility alias still exists:

- `@/*`

## Simplifications applied

1. Single className utility module per app
- Keep: `lib/utils.ts`
- Removed duplicate: `lib/cn.ts`

2. UI entrypoint module per app
- Added `components/ui/index.ts`
- Prefer imports from `@/components/ui` instead of deep paths

## Rules for future changes

1. Do not add duplicate utility files with overlapping responsibility.
2. Prefer module entrypoints (`index.ts`) for common UI imports.
3. Keep domain logic in `lib/*`, keep route handlers thin.
4. Keep admin-only logic in `apps/admin` and public-only logic in `apps/public`.
5. If a utility is needed by both apps, copy intentionally or move to a shared package in a future step.
