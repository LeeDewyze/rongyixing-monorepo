# Hotel Book API — Legacy vs Monorepo

Endpoint: `TmcApiBookUrl-Hotel-Book` (`http://book-api-tmc.rtesp.com/Hotel/Book` via proxy).

Method in monorepo: `getApi().hotel.submitBook(dto)`.

## Submit flow

| Step            | Legacy ryx                                | Monorepo H5                                           |
| --------------- | ----------------------------------------- | ----------------------------------------------------- |
| Validate form   | `fillBookPassengers` / `fillBookLinkmans` | `validateHotelBookForms`                              |
| Warm reminder   | `warranty` dialog                         | `HotelBookWarmReminderDialog`                         |
| Build DTO       | `onBook()` in book page + service         | `buildHotelOrderBookDto`                              |
| Final transform | `TmcHotelRyxService.onBook`               | `prepareHotelBookSubmitDto`                           |
| API call        | `hotelService.onBook(bookDto)`            | `hotel.submitBook`                                    |
| Post-submit     | `checkPay` → pay or order list            | `pollHotelCheckPay` → `/hotel/pay` or `/hotel/result` |

## Root-level fields

| Field           | Legacy                         | Monorepo                       | Builder                                            |
| --------------- | ------------------------------ | ------------------------------ | -------------------------------------------------- |
| `Channel`       | `"客户H5"` from `getChannel()` | `"客户H5"`                     | `HOTEL_BOOK_CHANNEL` / `prepareHotelBookSubmitDto` |
| `TravelPayType` | Promoted from first passenger  | Same                           | `buildHotelOrderBookDto`                           |
| `IsFromOffline` | `false` (H5)                   | `false`                        | `buildHotelOrderBookDto`                           |
| `Linkmans`      | Aggregated authorized contacts | Root array (not per passenger) | `buildAuthorizedLinkmans` → `dto.Linkmans`         |
| `TravelFormId`  | From travel form selection     | Same                           | `buildHotelInitBookDto`                            |
| `AgentId`       | Agent picker when enabled      | Same                           | `buildHotelInitBookDto`                            |
| `Passengers`    | One per room/guest             | Same                           | `buildHotelInitBookDto` + form merge               |

## Passenger fields

| Field                                   | Legacy                              | Monorepo                                         |
| --------------------------------------- | ----------------------------------- | ------------------------------------------------ |
| `ApprovalId`                            | `number` (0 when skip / empty)      | Coerced in `prepareHotelBookSubmitDto`           |
| `MessageLang`                           | `"cn"` / `"en"` / `""`              | Global or per-form `notifyLanguage`              |
| `CardName` / `CardNumber` / `TicketNum` | Empty strings                       | Empty strings                                    |
| `Credentials`                           | Full credential + `Policy`          | `buildSubmitCredentials` + enriched number       |
| `CustomerName`                          | Guest name (`Name\|roommate`)       | Same                                             |
| `Mobile` / `Email`                      | Form contact fields                 | `resolvePassengerFormMobile/Email`               |
| `IllegalReason` / `IllegalPolicy`       | Form + empty policy                 | Same                                             |
| `CostCenterCode/Name`                   | Form or defaults from init          | Form fields                                      |
| `OrganizationName/Code`                 | Form or staff org                   | Form fields                                      |
| `OutNumbers`                            | `null` or map                       | `null` or map                                    |
| `TravelType`                            | `1` (business) typical              | `resolveFlightTravelType()`                      |
| `TravelPayType`                         | Per passenger + root                | Per passenger + root                             |
| `IsSkipApprove`                         | From approver UI                    | Same                                             |
| `OrderHotelType`                        | `1` (domestic)                      | `HOTEL_ORDER_HOTEL_TYPE_DOMESTIC`                |
| `CheckinTime`                           | Arrival time slot                   | Global `arrivalTime`                             |
| `RoomPlan`                              | Full plan restored by `Key`         | Built from session `selection.plan` + hotel meta |
| `Policy`                                | Staff travel policy object          | From passenger when present                      |
| `OrderCard`                             | Credit card (room 1, self-pay late) | First passenger when `showCreditCard`            |

## RoomPlan fields (critical for supplier booking)

Captured in `HotelBookSelection` from detail API and mapped in `buildHotelInitRoomPlan`:

| Field                             | Purpose                                        |
| --------------------------------- | ---------------------------------------------- |
| `Key`                             | Legacy cache key to restore full plan          |
| `BookCode` / `BookType`           | Supplier book identifiers                      |
| `SupplierNumber` / `SupplierType` | Supplier routing                               |
| `Variables`                       | JSON string (arrival slots, cancel rule, etc.) |
| `RoomPlanRules`                   | Cancel policy descriptions                     |
| `RoomPlanPrices`                  | Nightly breakdown                              |
| `Room.Id` / `Room.Name`           | Physical room                                  |
| `Room.Hotel`                      | `Id`, `Name`, `Address`, `Phone`, `CityCode`   |

## Legacy sample payload

A captured legacy request is stored below (trimmed for reference). Full JSON was recorded from ryx H5 book submit.

```json
{
  "IsFromOffline": false,
  "Linkmans": [],
  "Channel": "客户H5",
  "TravelPayType": 1,
  "Passengers": [
    {
      "ApprovalId": 0,
      "MessageLang": "cn",
      "CustomerName": "SUN/XUE",
      "CheckinTime": "2026-06-26 14:00",
      "TravelType": 1,
      "TravelPayType": 1,
      "OrderHotelType": 1,
      "RoomPlan": { "Key": "...", "BookCode": "...", "BookType": 13 }
    }
  ]
}
```

See the raw capture at the bottom of this file (single-line JSON from production).

## Implementation files

| Layer            | Path                                                          |
| ---------------- | ------------------------------------------------------------- |
| DTO builders     | `apps/h5/src/lib/hotel-book.ts`                               |
| Session snapshot | `apps/h5/src/lib/hotel-book-session.ts`                       |
| Book page submit | `apps/h5/src/pages/hotel/HotelBookPage.tsx` → `executeSubmit` |
| API              | `packages/api/src/apis/hotel.ts` → `submitBook`               |
| Types            | `packages/shared-types/src/hotel.ts`                          |
| Tests            | `apps/h5/src/lib/hotel-book.test.ts`                          |

## Auth note

Unauthenticated calls return `Code: "NoLogin"`. Submit requires a valid proxy session (login first).

---

## Raw legacy capture

```
(Paste from ryx network tab — see git history for full payload)
```
