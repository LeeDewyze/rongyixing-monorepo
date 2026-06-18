# CLAUDE.md — Agent Instructions

## Repository Overview

RongYiXing monorepo (`@ryx` scope) with pnpm workspaces.

```
apps/h5               → @ryx/h5   (mobile H5)
apps/web              → @ryx/web  (Pad + PC)
packages/api          → @ryx/api  (HTTP client & endpoints)
packages/ui           → @ryx/ui   (shadcn components)
packages/shared-types → @ryx/shared-types
```

## Cursor Rules

Standards live in `.cursor/rules/`:

| Rule | Scope |
|------|-------|
| `core-project.mdc` | Always — placement, language, commands |
| `git-commits.mdc` | Always — conventional commits, pre-commit checks |
| `typescript-standards.mdc` | TS/TSX — bundler vs NodeNext, naming |
| `testing.mdc` | Tests — colocated `*.test.ts`, mocks, 80% target |
| `api-layer.mdc` | API & DTO layering |
| `monorepo-packages.mdc` | Package dependency boundaries |
| `responsive-layout.mdc` | Breakpoints, Pad/PC/H5, touch |
| `react-components.mdc` | React structure, routing |
| `error-handling.mdc` | Loading / error / empty states |
| `styling.mdc` | Tailwind v4, tokens, shadcn |
| `accessibility.mdc` | a11y, touch, keyboard, ARIA |
| `vite-env.mdc` | Vite env, assets, ports |
| `performance.mdc` | Lazy routes, images |

## Development Conventions

- All code and comments in **English**
- UI: mobile → `apps/h5`; Pad/PC → `apps/web`
- Shared UI → `packages/ui`; API → `packages/api`; DTOs → `packages/shared-types`
- App bootstrap: `apps/*/src/lib/env.ts`, `apps/*/src/lib/api.ts` (`getApi()`)

## Tech Stack

- React 19 + Vite 6 + TypeScript
- Tailwind CSS v4 (`@tailwindcss/vite`)
- shadcn/ui in `packages/ui`
- react-router-dom v7

## Breakpoints (Web)

- Pad: 768px – 1439px (`pad:`)
- PC: ≥ 1440px (`pc:`)
- Touch: `pointer-coarse:` (44px targets); `hover-hover:` for hover

## Commands

```bash
pnpm install && pnpm dev:h5 && pnpm dev:web
pnpm build && pnpm test && pnpm typecheck && pnpm audit
```

## Security

Run `pnpm audit` before merging. Fix critical/high vulnerabilities.
