# Design System - RYX Blue

## Stack

- framework: Vite + React
- styling: Tailwind CSS v4 via `@ryx/ui/globals.css`
- components: local React components plus `@ryx/ui`
- animation: CSS transitions where needed
- icons: inline SVG and bitmap assets from `apps/h5/src/assets`

## Source Of Truth

- Design spec: `docs/融易蓝设计规范.md`
- Token implementation: `packages/ui/src/styles/globals.css`
- H5 shell: `apps/h5/src/components/H5Shell.tsx`
- Header plumbing: `apps/h5/src/components/layout`

## Tokens

| Role | CSS Variable | Value | Tailwind / Usage |
| --- | --- | --- | --- |
| Brand primary | `--brand-primary` | `#2768FA` | `text-brand-primary`, `border-brand-primary`, focus rings |
| Title text | `--brand-title` | `#010101` | `text-brand-title` on light surfaces |
| Button gradient start | `--brand-btn-start` | `#33A1F9` | `from-brand-btn-start` |
| Button gradient end | `--brand-btn-end` | `#2768FA` | `to-brand-btn-end` |
| Header gradient start | `--brand-header-start` | `#5099fe` | `from-brand-header-start` |
| Header gradient end | `--brand-header-end` | `#6aabff` | `to-brand-header-end` |
| Form header start | `--brand-form-header-start` | `#7AB1FF` | use through `--brand-form-header-gradient` |
| Form header end | `--brand-form-header-end` | `#F5F6F9` | page base after the first 200px |
| Page background | `--brand-form-header-end` | `#F5F6F9` | default H5 content background |

## Core Patterns

### RYX Primary Button

Use for the dominant page action such as submit, pay, save, confirm.

```tsx
className="bg-gradient-to-r from-brand-btn-start to-brand-btn-end text-white"
```

Rules:
- Keep text white and medium weight.
- Prefer rounded full or rounded-lg according to the surrounding page pattern.
- Include active and disabled states.

### RYX Navigation Header

Use for compact top bars where the header itself is the surface.

```tsx
className="bg-gradient-to-b from-brand-header-start to-brand-header-end"
```

Rules:
- Use this for navigation bars and list headers.
- Do not use this as a tall form-page hero; the two blue values are close and can read as flat.
- Use white text on dark header surfaces, or `text-brand-title` when the surface is lightened.

### RYX Form Page Background

Use for full-screen form pages such as credentials, passenger edit, and travel apply.

```tsx
style={{ background: "var(--brand-form-header-gradient)" }}
```

Rules:
- Apply this to the page root, not only to the header block.
- Let the first card overlap the gradient with a small negative top margin when the page needs depth.
- Use `text-brand-title` on the header when the gradient fades toward `#F5F6F9`.
- Metadata chips should use translucent white surfaces with dark text, not white text directly on the fade.

## Form Gradient Layout Principle

The form-page gradient is a page-level depth system, not a header decoration.

When a page needs the same layered feel as credentials management:

1. Put `var(--brand-form-header-gradient)` on the page root.
2. Render the title/header content transparently over that root background.
3. Let the first white card overlap the gradient tail with a small negative top margin.
4. Keep the gradient visible behind both the header copy and the beginning of the content area.
5. Use dark text or translucent white chips on the fade; avoid white text directly on the light end of the gradient.

Avoid this pattern for tall form pages:

```tsx
<div className="bg-gradient-to-b from-brand-header-start to-brand-header-end">
  ...
</div>
```

`--brand-header-start` and `--brand-header-end` are close blues, so a tall block using only those two tokens can read as a flat solid blue. If the first white card starts exactly after that block, the page creates a hard horizontal cut instead of a natural fade. In that case, switch to the form-page gradient on the root and overlap the first card into the gradient area.

### RYX Title

```tsx
className="text-brand-title"
```

Rules:
- Use on light or fading backgrounds.
- Avoid hardcoded `#111827` for new H5 work unless matching a legacy surface exactly.

### RYX Links, Tags, And Selection

```tsx
className="text-brand-primary"
className="border-brand-primary"
```

Rules:
- Use brand primary for selected pills, inline links, add/remove affordances, and focus states.
- Selected pills should pair brand border/text with a pale blue fill.

## H5 Layout Rules

- Page background defaults to `#F5F6F9`; use tokenized gradients when a page has a branded top area.
- Cards use white surfaces with 12-16px radius and subtle shadow.
- Repeated page sections should not become nested cards.
- Form/list pages should reserve bottom safe-area padding when a fixed footer action exists.
- Mobile spacing defaults: horizontal page padding 16px, vertical card gap 12px.
- Header-safe content must include `pt-[env(safe-area-inset-top)]` when rendered outside `AppHeader`.

## When To Choose Which Gradient

| Scenario | Use |
| --- | --- |
| Compact sticky app bar | `from-brand-header-start to-brand-header-end` |
| Full-page form header fading into content | `var(--brand-form-header-gradient)` |
| Main CTA button | `from-brand-btn-start to-brand-btn-end` |
| In-card decorative blue surface | Prefer low-opacity brand-blue gradient, verify contrast |

## Decisions

- 2026-06-27 - init: Vite React Tailwind app detected in `apps/h5`; shared design tokens come from `packages/ui`.
- 2026-06-27 - TravelApplyPage header: aligned the page-level header background with `--brand-form-header-gradient`, overlapped the first form card into the gradient area, and changed metadata chips to light glass surfaces for contrast.
- 2026-06-27 - RYX Blue design contract: promoted `docs/融易蓝设计规范.md` into this project-level `DESIGN.md`; CSS token values remain in `packages/ui/src/styles/globals.css`.
- 2026-06-27 - Form gradient layout principle: documented why form pages must use root-level `--brand-form-header-gradient` plus card overlap instead of a tall `brand-header-start` to `brand-header-end` block.

## Components

- `apps/h5/src/components/H5Shell.tsx` - base H5 shell with page background and scroll container.
- `apps/h5/src/components/layout/AppHeader.tsx` - shared app header, supports brand and hotel tones.
- `apps/h5/src/pages/credential/CredentialListPage.tsx` - reference implementation for form-page gradient background.
- `apps/h5/src/pages/travel/TravelApplyPage.tsx` - travel application form page using page-level form gradient.

## Non-Goals

- No Figma sync.
- No image generation.
- No token rewrite unless `packages/ui/src/styles/globals.css` changes.
