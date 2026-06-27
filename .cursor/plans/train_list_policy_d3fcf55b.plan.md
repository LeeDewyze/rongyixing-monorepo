---
name: Train list policy
overview: Phase 1 — train list Home-Policy 差标 + compliant navigation. Phase 2 — `/train/book` fill-order page (Initialize/Book, 12306 vs direct submit). Aligns with tmc-train-list_ryx / tmc-train-book_ryx and design PNGs.
todos:
  - id: phase1-types-api
    content: "Phase 1: train-policy types, SeatType enum on TrainSeat, getPolicy + buildTrainPolicyTrainsPayload, mock policy handler"
    status: completed
  - id: phase1-policy-lib
    content: "Phase 1: train-book-policy.ts — resolvePolicySeatType (berth normalization), applyTrainPolicyColors, button classes, exceed alert + tests"
    status: completed
  - id: phase1-list
    content: "Phase 1: Wire policy into TrainListPage; compliant 预订 → saveTrainBookSelection + navigate /train/book; block exceed alert"
    status: completed
  - id: phase2-book-api
    content: "Phase 2: train-book types, initializeBook/submitBook/12306 API, train-book-adapter, mock Initialize/Book fixtures"
    status: completed
  - id: phase2-book-ui
    content: "Phase 2: TrainBookPage + summary + conditional TrainBookSeatPicker (only G/D seat classes) + footer; reuse flight book sections"
    status: completed
  - id: phase2-book-submit
    content: "Phase 2: Dual submit DTO paths (IsOfficialBooked), checkPay, post-book → /home/orders?tab=train"
    status: completed
  - id: verify
    content: Manual mock list→book→submit; h5/api tests; lint + typecheck
    status: completed
isProject: false
---

# Train List Policy + Book Page

Design refs: [`docs/需求实施/火车票/火车票查询列表.png`](docs/需求实施/火车票/火车票查询列表.png), [`docs/需求实施/火车票/火车票-填写订单.png`](docs/需求实施/火车票/火车票-填写订单.png). Legacy: `tmc-train-list_ryx`, `tmc-train-book_ryx`.

## Phased delivery

| Phase       | Scope              | Delivers                                                             |
| ----------- | ------------------ | -------------------------------------------------------------------- |
| **Phase 1** | Part A — List 差标 | Policy colors, exceed block, session save, navigate to `/train/book` |
| **Phase 2** | Part B — Book page | Initialize/Book UI, 12306/direct submit, post-book to orders tab     |

Phase 1 can ship independently; book page guard redirects if session empty.

---

## Part A — List 差标

### Policy rules (legacy `filterPassengerPolicyTrains`)

| Condition               | Color       | Bookable (non-agent)                                                                         |
| ----------------------- | ----------- | -------------------------------------------------------------------------------------------- |
| No `Rules`              | `success`   | Yes → navigate to book                                                                       |
| `Rules` + `IsAllowBook` | `warning`   | Yes (违规可订)                                                                               |
| `IsAllowBook === false` | `danger`    | **No** — [`HotelPolicyAlertDialog`](apps/h5/src/components/hotel/HotelPolicyAlertDialog.tsx) |
| No match                | `secondary` | Yes (blue default)                                                                           |

**Match key:** `TrainNo + SeatType` (numeric enum — **not** `SeatTypeName`).

Legacy list matching (`tmc-train.service.ts:280-282`):

```ts
policyTrains.find((p) => p.TrainNo == train.TrainNo && p.SeatType == seat.SeatType);
```

### Berth / 卧铺 SeatType normalization (critical)

Legacy has separate enums per berth tier (`TrainSeatType`: `HardBerthUp=4`, `HardBerth=5`, `HardBerthDown=6`, `SoftBerthUp=7`, `SoftBerth=8`, …). API policy responses may use the **parent** berth type while list UI shows one aggregated row (e.g.「硬卧」+ `BedInfos`).

**H5 must implement `resolvePolicySeatType(seat)` in [`train-book-policy.ts`](apps/h5/src/lib/train-book-policy.ts):**

1. Prefer numeric `seat.SeatType` from `Home-Search` normalization (preserve on `TrainSeat`).
2. Map berth variants → parent type for policy lookup (e.g. HardBerthUp/Mid/Down → HardBerth enum used by API).
3. Fallback: strip `上|中|下` suffix from `SeatTypeName` only when enum missing (defensive).

**Separate concern — Initialize/Book payload:** Legacy `searchAsync` stores `OriginalSearchResultSeats` with stripped `SeatTypeName` (line 932) and `bookTrain` replaces `Train.Seats` with that snapshot before submit (line 1346-1350). H5 book adapter must mirror this for Initialize/Book, **not** for list policy matching.

### Policy API request body

Define [`buildTrainPolicyTrainsPayload(trains)`](packages/api/src/apis/train.ts) — **trimmed** JSON (like flight/hotel policy), not full entity with nulls.

Minimum fields per train:

- `TrainNo`, `TrainCode`, `StartTime`, `ArrivalTime`, `FromStation`/`ToStation` codes or names
- `Seats[]`: `{ SeatType, SeatTypeName, SalesPrice/Price, Count, BedInfos? }`
- For berths: use `OriginalSearchResultSeats` shape — `SeatTypeName` with 上/中/下 stripped when serializing for Policy **if** API expects aggregated names (mirror legacy search side effect)

Request: `{ Passengers, Trains: JSON.stringify(payload), TravelFromId? }`, Version `2.0`.

### List → book handoff

When `isTrainSeatBookable(color, isAgent)`:

1. `saveTrainBookSelection({ searchParams, train, seat, policy, passengers })`
2. `navigate('/train/book')`

---

## Part B — Train book page (`/train/book`)

### UI ( [`火车票-填写订单.png`](docs/需求实施/火车票/火车票-填写订单.png) )

| Section                                            | Component                                                      |
| -------------------------------------------------- | -------------------------------------------------------------- |
| Header                                             | `填写订单` + back                                              |
| Summary                                            | `TrainBookSummary` — route, date/train, timeline, seat + price |
| 选择坐席                                           | `TrainBookSeatPicker` — **conditional** (see below)            |
| 旅客信息                                           | Reuse flight passenger components                              |
| 通知语言 / 服务费 / 授权账号 / 出差信息 / 支付方式 | Reuse flight book sections                                     |
| Footer                                             | 同意须知 + 总价明细 + **12306预定** + **生成订单**             |

### 12306预定 vs 生成订单 — full DTO differences

Legacy [`tmc-train-book_ryx.base.page.ts`](beeantmobile-main/projects/ryx) — both call same `bookTrain(bookDto)` but differ in pre-submit flags:

| Field / step                                   | 12306预定 (`bookTrainBy12306`)                                  | 生成订单 (direct)                     |
| ---------------------------------------------- | --------------------------------------------------------------- | ------------------------------------- |
| Pre-check                                      | `checkAndBind12306()` → bind/SMS modal if unverified            | Skip 12306 gate                       |
| `bookDto.IsOfficialBooked`                     | `true`                                                          | `false`                               |
| `bookDto.AccountNumber`                        | From `initialBookDto.AccountNumber12306` after verify           | Cleared (`AccountNumber12306 = null`) |
| `initialBookDto.AccountNumber12306.IsIdentity` | Set from official path                                          | N/A                                   |
| Error retry                                    | `MessageCodeValidate` → re-open 12306 sheet                     | Same API errors, no 12306 retry       |
| Shared                                         | `fillBookPassengers`, `fillBookLinkmans`, same `Train-Book` API | same                                  |

**Shared DTO fields from `fillBookPassengers` (both paths):**

- `Passengers[].Train` — full train entity; **replace `Seats` with `OriginalSearchResultSeats`** (stripped berth names) before submit
- `Passengers[].Train.BookSeatType` — selected seat `SeatType` enum (original, not normalized)
- `Passengers[].Train.BookSeatLocation` — seat picker code; prefix `"1"` if legacy rule applies
- `Passengers[].Policy` / `IllegalPolicy` — from `trainPolicy.Rules.join(",")`
- `Passengers[].Credentials`, `Mobile`, `MessageLang`, approval/outnumber fields
- `bookDto.TravelPayType`, `AgentId`, `Linkmans` (authorized contacts)

Implement in [`train-book.ts`](apps/h5/src/lib/train-book.ts):

- `buildTrainInitBookDto(...)` — first Initialize
- `buildTrainOrderBookDto(..., { isOfficialBooked, accountNumber12306 })` — Book submit variant

Footer button visibility from Initialize: `IsShowOfficalBooked` / `IsShowDirectBooked`.

### Conditional seat picker (skip when not selectable)

Legacy [`canSelectSeat`](beeantmobile-main/projects/ryx/src/app/tmc/tmc-train/tmc-train-book_ryx/tmc-train-book_ryx.base.page.ts) — only these `TrainSeatType` values show the「选择坐席」block:

- `SecondClassSeat` (二等座) — layout A/B/C + D/F
- `FirstClassSeat` (一等座) — A/C + D/F
- `BusinessSeat` (商务座) — A/C + F
- `SpecialSeat` (特等座) — A/C + F

**All other seat types skip the picker** but the book page is fully functional:

| Seat examples       | UI                                    | Submit                                   |
| ------------------- | ------------------------------------- | ---------------------------------------- |
| 硬座、无座          | No `TrainBookSeatPicker`              | `BookSeatLocation` omitted / `""`        |
| 硬卧/软卧/动卧等    | No picker (berth tier chosen on list) | Same — no A/B/C/D/F                      |
| 二等/一等/商务/特等 | Show picker per design PNG            | Optional preference; empty = auto-assign |

Implement [`canSelectTrainSeat(seatType)`](apps/h5/src/lib/train-book.ts) mirroring legacy. In `TrainBookPage`:

```tsx
{canSelectTrainSeat(selection.seat.SeatType) ? (
  <TrainBookSeatPicker ... />
) : null}
```

**Do not block submit** when picker is hidden or when user leaves seat preference empty (legacy `chooseNumber` may stay 0). Show orange disclaimer in summary when picker is visible:「如果本次列车剩余座位无法满足，系统将自动分配席位」.

DTO: only set `Train.BookSeatLocation` when user picked a letter; prefix `"1"` when present (legacy `fillBookPassengers`). `BookSeatType` always comes from list-selected `SeatType`.

### Post-submit navigation (decided)

**Phase 2 default:** `navigate('/home/orders?tab=train', { state: { bookedOrderId, product: 'train' } })` + toast — matches flight「save order」path and existing [`OrdersTabPage`](apps/h5/src/pages/home/OrdersTabPage.tsx) toast handling.

**Not in initial scope:** `/train/result/:orderId` or `/orders/train/:orderId` (deferred until train order detail page exists).

### New / modified files

Same as prior plan — see Phase 2 todos. Key additions:

- [`packages/shared-types/src/train-book.ts`](packages/shared-types/src/train-book.ts)
- [`packages/api/src/apis/train-book-adapter.ts`](packages/api/src/apis/train-book-adapter.ts) — includes `stripTrainEntityForBook`, `buildOriginalSearchResultSeats`
- [`apps/h5/src/lib/train-book.ts`](apps/h5/src/lib/train-book.ts) — dual submit builders

---

## Part C — Mock

- List: train `1999`, 软卧 policy `IsAllowBook: false`, `Rules: ['违反座位类型']`
- Mock seats include numeric `SeatType` enums aligned with `TrainSeatType`
- Book Initialize: dual footer flags, PayTypes, ServiceFees
- Book submit: returns `OrderId`

---

## Deferred

- `OrderTrainDetailPage` `/orders/train/:id`
- 改签 ExchangeInitialize/ExchangeBook
- Mandatory insurance UI
- Multi-passenger replace modal on list
- `Home-Schedule` modal
- `/train/result/:orderId` intermediate page

---

## Verification

**Phase 1:** 申晓杰 → K train → 软卧 pink + alert; 硬座 green → `/train/book` session set

**Phase 2:**

- 二等座 path: seat picker visible; optional A–F; submit with/without `BookSeatLocation`
- 硬座 / 软卧 path: **no seat picker**; summary + passengers + pay + submit still work
- 生成订单 → orders tab toast; 12306 path sets `IsOfficialBooked`

Tests: `train-book-policy.test.ts` (berth SeatType normalization), `train-book.test.ts` (`canSelectTrainSeat`, DTO builders with/without `BookSeatLocation`), API adapter tests

Update [`docs/api/PAGE-API-MATRIX.md`](docs/api/PAGE-API-MATRIX.md) when each phase completes.
