---
name: Web Account Bundle
overview: "Pad/PC account bundle: /mine profile tab, profile center, settings/security (incl. account deletion), notices, contact, bank cards. Copy H5 hooks/lib; profile UI per docs/需求实施/pad-pc/我的tab/我的.png. Parent roadmap: web_h5_gap_roadmap."
todos:
  - id: profile-foundation
    content: "Copy profile hooks/libs/assets (useMemberProfile, useAccount, useProfileCenter, avatar, profile-menu, profile-assets)"
    status: pending
  - id: profile-mine-page
    content: "WebProfilePage at /mine — UI per docs/需求实施/pad-pc/我的tab/我的.png; replace PlaceholderPage"
    status: pending
  - id: profile-center
    content: "WebProfileCenterPage at /profile/center — avatar crop dialog, name edit, org info"
    status: pending
  - id: credentials-wire
    content: "Wire profile menu → /credentials (implemented in booking bundle) or include credential list if booking bundle not done"
    status: pending
  - id: settings-foundation
    content: "Copy account-settings, account-deletion libs + hooks; routes /settings/* (7 pages)"
    status: pending
  - id: settings-pages
    content: "Web settings pages — security, mobile, password, devices, notifications, account deletion"
    status: pending
  - id: notice-contact
    content: "Routes /notice, /notice/:id, /contact; copy pages + contact-us.ts"
    status: pending
  - id: bank-cards
    content: "Routes /bank-cards, /bank-cards/new, /bank-cards/:cardId; copy account-card pages + useAccountCards"
    status: pending
  - id: verify
    content: "typecheck + test + build; /mine → settings → deletion flow smoke; notice list from home strip if travel bundle done"
    status: pending
isProject: false
---

# Web Account Bundle Plan

**Parent:** [web_h5_gap_roadmap](web_h5_gap_roadmap_bfb8aee6.plan.md) — Bundle B (P1, after or parallel to booking bundle)

**Goal:** Replace `/mine` placeholder and deliver H5-equivalent profile, settings, notices, contact, and bank cards on Pad/PC.

**Recommended order:** Execute after [web_booking_bundle](web_booking_bundle.plan.md) so `/credentials` from passenger plan is already live. If running in parallel, include credential list in this bundle instead of `credentials-wire` todo.

## Principles

| Layer | Source |
|-------|--------|
| Behavior | H5 `pages/profile`, `pages/settings`, `pages/notice`, `pages/contact`, `pages/account-card` + hooks/libs |
| Profile UI | [`docs/需求实施/pad-pc/我的tab/我的.png`](docs/需求实施/pad-pc/我的tab/我的.png) |
| Settings / notice | No dedicated Pad mockups — use 我的 tab visual language (cards, rows, `WebShell` inset) |

## Phase 1 — Profile / 我的

### Routes

```
/mine                 → WebProfilePage (replaces PlaceholderPage)
/profile/center
```

### Copy from H5

- [`ProfileTabPage`](apps/h5/src/pages/home/ProfileTabPage.tsx) logic
- [`pages/profile/ProfileCenterPage.tsx`](apps/h5/src/pages/profile/ProfileCenterPage.tsx)
- `components/profile/*` (rebuild layout for wide shell)
- [`config/profile-menu.tsx`](apps/h5/src/config/profile-menu.tsx), `profile-assets.ts`
- hooks: `useMemberProfile`, `useAccount`, `useProfileCenter`
- `lib/avatar.ts`

### UI spec

- Primary: [`我的.png`](docs/需求实施/pad-pc/我的tab/我的.png) — header (avatar, balance, messages), service grid (flight/train/hotel order shortcuts), menu list
- H5 uses stacked mobile layout; web uses wider grid inside [`WebShell`](apps/web/src/components/WebShell.tsx) with [`WEB_MAIN_PADDING_CLASS`](apps/web/src/components/WebShell.tsx)

### Menu targets

| Item | Route |
|------|-------|
| 证件管理 | `/credentials` |
| 银行卡信息 | `/bank-cards` |
| 联系我们 | `/contact` |
| 设置 | `/settings` |

## Phase 2 — Settings & account security

### Routes (all under `RequireAuth`)

```
/settings
/settings/security
/settings/mobile
/settings/password
/settings/devices
/settings/notifications
/settings/account-deletion
```

### Copy from H5

- `pages/settings/*`
- `lib/account-settings.ts`, `account-deletion.ts`
- hooks: `useAccountSettings`, `useAccountSecurity`, `useAccountDeletion`, `useLoginDevices`
- Align with [account_deletion_feature](account_deletion_feature_00b59b9a.plan.md) behavior (H5 reference)

### Web UI

- List hub + detail forms as centered cards or full-width rows in main area
- `ProfileAvatarCropSheet` → Dialog variant for web

## Phase 3 — Notices & contact

### Routes

```
/notice
/notice/:noticeId
/contact
```

### Copy from H5

- `pages/notice/*`, `pages/contact/ContactUsPage.tsx`
- `lib/contact-us.ts`

**Note:** Home notice strip lives in [web_travel_bundle](web_travel_bundle.plan.md); this bundle provides the destination pages. If travel bundle runs first, it may stub notices — merge here.

## Phase 4 — Bank cards

### Routes

```
/bank-cards
/bank-cards/new
/bank-cards/:cardId
```

### Copy from H5

- `pages/account-card/*`
- hook: `useAccountCards`

## Verification

```bash
pnpm --filter web typecheck && pnpm --filter web test && pnpm --filter web build && pnpm audit
```

Manual:

- `/mine` matches 我的 mockup at pad/pc breakpoints
- Profile menu → each sub-route
- Settings → account deletion happy path (mock)
- Notice list + detail readable on wide layout

## Dependencies

| Depends on | Reason |
|------------|--------|
| [web_booking_bundle](web_booking_bundle.plan.md) (soft) | `/credentials` route from passenger phase |
| Orders (done) | Profile service grid links to `/orders?tab=` |

## Out of scope

- Booking list/book pages
- Business travel / `/travel/*` ([web_travel_bundle](web_travel_bundle.plan.md))
- Mobile / device login
