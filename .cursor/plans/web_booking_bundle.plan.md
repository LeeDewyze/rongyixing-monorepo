---
name: Web Booking Bundle
overview: "Pad/PC booking migration bundle: shell nav + passenger/credentials + full flight/train/hotel search→book→pay chains. Copy H5 hooks/lib; rebuild UI from docs/需求实施/pad-pc/{机票,火车票,酒店}/. Parent roadmap: web_h5_gap_roadmap. Prerequisite: orders migration done."
todos:
  - id: shell-nav
    content: "Shell: 404 route, legacy-route-registry expansion, delete HomePage.tsx scaffold; decide <768px policy (H5 banner vs bottom tabs)"
    status: completed
  - id: passenger-foundation
    content: "Copy passenger/credential libs+hooks; routes /passenger/select, /passenger/credential, /credentials; Web dialogs not H5 sheets"
    status: completed
  - id: flight-foundation
    content: "Copy flight-book libs+hooks from H5; add flight booking routes to routes.tsx"
    status: completed
  - id: flight-list-cabins
    content: "WebFlightListPage + cabins — UI per docs/需求实施/pad-pc/机票/机票查询.png; filter/modify-search as Dialog"
    status: completed
  - id: flight-book-pay
    content: "WebFlightBookPage + result + pay redirect — UI per 飞机票填写订单.png; unify pay → /orders/flight/:id/pay"
    status: completed
  - id: train-foundation
    content: "Copy train-book libs+hooks; routes /train/list, /train/book, /train/pay/:orderId"
    status: completed
  - id: train-list-book
    content: "WebTrainListPage + book — UI per docs/需求实施/pad-pc/火车票/*.png; support ?exchange=1 for order exchange"
    status: completed
  - id: hotel-foundation
    content: "Copy hotel-book libs+hooks+filters+gallery; add hotel booking routes"
    status: completed
  - id: hotel-list-detail
    content: "WebHotelListPage + keyword + detail + images + room — UI per 酒店查询.png / 酒店下单.png"
    status: completed
  - id: hotel-book-pay
    content: "WebHotelBookPage + result + pay — align save-order redirect with order pay routes"
    status: completed
  - id: verify
    content: "typecheck + test + build; manual pad/pc vs mockups; home search → list smoke; train exchange from order detail"
    status: completed
isProject: false
---

# Web Booking Bundle Plan

**Parent:** [web_h5_gap_roadmap](web_h5_gap_roadmap_bfb8aee6.plan.md) — Bundle A (P0, execute first)

**Goal:** Unblock [`WebHomePage`](apps/web/src/pages/home/WebHomePage.tsx) search navigation and complete pre-order flows for flight, train, hotel on Pad/PC.

**Done already (do not redo):** home search UI ([`web_pad_pc_home`](web_pad_pc_home_ade48bb4.plan.md)), orders ([`web_orders_migration`](web_orders_migration_377e4e0e.plan.md)).

## Principles

| Layer | Source |
|-------|--------|
| Behavior | Copy H5 `hooks/` + `lib/` into `apps/web/src/` |
| UI | [`docs/需求实施/pad-pc/机票/`](docs/需求实施/pad-pc/机票/), [`火车票/`](docs/需求实施/pad-pc/火车票/), [`酒店/`](docs/需求实施/pad-pc/酒店/), [`切图/`](docs/需求实施/pad-pc/切图/) |
| Interaction | Dialog / web panels (same as orders migration), not H5 full-screen sheets |

## Phase 1 — Shell + shared passenger (blocks all booking)

### 1.1 Shell nav

- Catch-all 404 in [`routes.tsx`](apps/web/src/app/routes.tsx)
- Expand [`legacy-route-registry.ts`](apps/web/src/lib/legacy-route-registry.ts) for new booking paths
- Remove dead [`HomePage.tsx`](apps/web/src/pages/HomePage.tsx)
- **Decision:** keep current `<768px` H5 banner, or add bottom tabs — document choice in PR

### 1.2 Passenger & credentials

**Routes:**

```
/passenger/select?forType=&returnTo=
/passenger/credential
/credentials
```

**Copy from H5:**

- `pages/passenger/*`, `pages/credential/CredentialListPage.tsx`
- `components/passenger/*`
- `lib/credential-form.ts`, `credential-name.ts`, `passenger-credential-nav.ts`
- hooks: `usePassenger`, `usePassengerCredential`, `usePassengerSelection`, `useCredentialList`

**Web UI:** full-page or wide dialog layout inside `WebShell`; reuse [`passenger-selection.ts`](apps/web/src/lib/passenger-selection.ts) already copied for train exchange.

## Phase 2 — Flight booking

### Routes

```
/flight/list
/flight/select-city          (optional if CityPickerDialog suffices from list)
/flight/:flightId/cabins
/flight/book
/flight/result/:orderId
/flight/pay/:orderId         → prefer redirect to /orders/flight/:orderId/pay
```

### Copy from H5

- `lib/flight-book*.ts`, `flight-list-session.ts`, `flight-list-timeout-dialog.ts`, `flight-cabin-policy.ts`, `flight-cabins-preflight.ts`, `flight-policy-session.ts`, `flight-self-book.ts`
- hooks: `useFlightBook`, `useFlightBookPassengerForms`, `useFlightListPageEffects`, `useFlightPriceTimeout`, `useBookOrgCostVisibility`
- `components/flight/*` (logic reference only — rebuild as `WebFlight*`)

### UI mockups

- List: [`机票查询.png`](docs/需求实施/pad-pc/机票/机票查询.png)
- Book: [`飞机票填写订单.png`](docs/需求实施/pad-pc/机票/飞机票填写订单.png)
- Cabins: no PNG — two-column or inline expand on `pc:`

### Verify

- Home flight search button → `/flight/list` works
- 因公/因私 channel preserved through list → book → order pay

## Phase 3 — Train booking

### Routes

```
/train/list
/train/book
/train/pay/:orderId
```

### Copy from H5

- `lib/train-book*.ts`
- hooks: `useTrainBook`, `useTrainBookPassengerForms`
- `components/train/*` (filter/sort/schedule — convert sheets to Dialog)

### UI mockups

- [`火车票查询.png`](docs/需求实施/pad-pc/火车票/火车票查询.png)
- [`火车票填写订单.png`](docs/需求实施/pad-pc/火车票/火车票填写订单.png)

### Critical

- `/train/list?exchange=1` must work — fixes broken link from [`WebOrderTrainDetailPage`](apps/web/src/pages/order/WebOrderTrainDetailPage.tsx) / [`startTrainExchangeFlow`](apps/web/src/lib/train-order-actions.ts)

## Phase 4 — Hotel booking

### Routes

```
/hotel/list
/hotel/keyword
/hotel/:hotelId
/hotel/:hotelId/images
/hotel/:hotelId/room/:roomId
/hotel/:hotelId/book
/hotel/result/:orderId
/hotel/pay/:orderId
```

Standalone `/hotel` search optional (home panel already covers entry).

### Copy from H5

- `lib/hotel-book*.ts`, `hotel-list-filters.ts`, `hotel-list-context.ts`, `hotel-date-range.ts`, `hotel-gallery-session.ts`, `hotel-book-guarantee-agreement.ts`
- hooks: `useHotelBook`, `useHotelBookPassengerForms`, `useHotelDetailSections`
- Extend existing [`useHotelList.ts`](apps/web/src/hooks/useHotelList.ts) usage in new pages

### UI mockups

- [`酒店查询.png`](docs/需求实施/pad-pc/酒店/酒店查询.png)
- [`酒店下单.png`](docs/需求实施/pad-pc/酒店/酒店下单.png)

## Verification

```bash
pnpm --filter web typecheck && pnpm --filter web test && pnpm --filter web build && pnpm audit
```

Manual:

- Pad 768px + PC 1440px vs domain PNGs
- Home → list → book → pay → order detail (each product)
- Train exchange from existing order detail
- `apps/h5` unchanged

## Out of scope

- Car / 用车
- Profile, settings, travel approval (see [web_account_bundle](web_account_bundle.plan.md), [web_travel_bundle](web_travel_bundle.plan.md))
