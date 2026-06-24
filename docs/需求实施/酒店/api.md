# Hotel API — Migration Notes (RYX Reference)

Team reference for migrating hotel APIs from legacy **融易行 (RYX)**. When porting behavior, align **request payload shape** (field names, types, formats, serialization)—not only UI logic or variable names.

**Legacy source:** `beeantmobile-main/projects/ryx/src/app/tmc/tmc-hotel/tmc-hotel_ryx.service.ts`  
**Monorepo implementation:** `packages/api/src/apis/hotel.ts`, `apps/h5/src/lib/hotel-book-policy.ts`

---

## Principle

> Referencing RYX means matching the **API contract** (what is sent on the wire), not just copying TypeScript identifiers or page behavior.

Especially for `Home/Policy`, the critical payload is `RoomPlans`: a **JSON string** containing an array of room-plan objects. Missing or mistyping one field (e.g. `SupplierNumber`) can break the entire policy → bookable-state chain.

---

## Call order (detail before policy)

```
Home/Detail succeeds
    → build RoomPlans[] from detail rooms/plans
    → Home/Policy (Passengers, CityCode, optional TravelFromId)
    → match response UniqueIdId to Detail Variables.RoomPlanUniqueId
    → UI: book / exceed / full / no-permission
```

Do not call `Home/Policy` until `Home/Detail` has returned and plan fields (`SupplierNumber`, `BeginDate`, etc.) are available from the detail response.

---

## Home/Policy — request body

| Top-level field | Source (legacy)                                  |
| --------------- | ------------------------------------------------ | ------------------------------------------------------------------------------------------------------ |
| `RoomPlans`     | `JSON.stringify(arr)` — see per-plan table below |
| `Passengers`    | Comma-separated staff `AccountId`s               | **Always all selected staff**, regardless of「过滤差标」UI mode (e.g. `44880000000001,96200000000002`) |
| `CityCode`      | Search destination city code                     |
| `TravelFromId`  | Optional; comma-separated travel form ids        |

### Per-plan object in `RoomPlans` (legacy `getHotelPolicyAsync`)

Built in `tmc-hotel_ryx.service.ts` from each `RoomPlanEntity` (deduped by `Variables.RoomPlanUniqueId` before stringify):

| Field                | Legacy source             | Notes                                                                                                   |
| -------------------- | ------------------------- | ------------------------------------------------------------------------------------------------------- |
| `TotalAmount`        | `plan.TotalAmount`        | Numeric                                                                                                 |
| `Number`             | `plan.Number`             | Often `""` (empty string), not omitted                                                                  |
| **`SupplierNumber`** | **`plan.SupplierNumber`** | **Opaque supplier key string** (e.g. `RM1008773489DPRS...`). Not a price.                               |
| `BeginDate`          | `plan.BeginDate`          | From detail plan, e.g. `2026-06-26T00:00:00`                                                            |
| `EndDate`            | `plan.EndDate`            | From detail plan, e.g. `2026-06-27T00:00:00`                                                            |
| `Room.Id`            | `plan.Room.Id`            | Often numeric in legacy JSON                                                                            |
| `Id`                 | `plan.Id`                 | Only when `Id` exists and is not `"0"`                                                                  |
| `SupplierType`       | `plan.SupplierType`       | When `Id` is empty/`"0"`, or when `SupplierType === 4` (protocol hotel). May be string e.g. `"Dttrip"`. |

`RoomPlanUniqueId` is **not** sent in the Policy request; the server derives `UniqueIdId` in the response from the payload above.

---

## Home/Policy — response matching (legacy)

```typescript
// tmc-hotel_ryx.service.ts — getRoomPlanUniqueId
p.VariablesObj = p.VariablesObj || JSON.parse(p.Variables) || {};
return p.VariablesObj["RoomPlanUniqueId"];

// filterPassengerPolicy / onBookRoomPlan
it.UniqueIdId == getRoomPlanUniqueId(plan);
```

| Response field               | Match rule                                                                                  |
| ---------------------------- | ------------------------------------------------------------------------------------------- |
| `PassengerKey`               | Selected passenger `AccountId`                                                              |
| `HotelPolicies[].UniqueIdId` | `==` Detail `Variables.RoomPlanUniqueId` (loose `==`)                                       |
| `IsAllowBook`                | `false` → exceed / not bookable (non-agent); `true` → bookable (warning if `Rules` present) |

Overrides on the plan: `Variables.FullHouseOrCanBook` containing `full` or `nopermission`.

If a policy row exists for the passenger but **no** `HotelPolicies` entry matches the plan’s `RoomPlanUniqueId`, legacy **does not** set a color → price/book button hidden. Frontend must not invent a match key (e.g. do not concat `UniqueIdId + SupplierNumber` on the client).

---

##「过滤差标」UI vs Policy request (legacy)

Legacy `FilterPassengersPolicyComponent` only changes **which passenger’s policy colors are shown**. It does **not** change the `Home/Policy` request shape:

| UI selection | `Passengers` in request                  | After「确定」                                                                                       |
| ------------ | ---------------------------------------- | --------------------------------------------------------------------------------------------------- |
| 不过滤差标   | All staff `AccountId`s (comma-separated) | `filterPassengerPolicy("")` → **re-call `getPolicy()`** → display all plans as bookable (`success`) |
| 按旅客查看   | Same — still all staff                   | `filterPassengerPolicy(accountId)` → **re-call `getPolicy()`** → colors for that `PassengerKey`     |

Monorepo: `HotelPolicyFilterSheet` confirm → `refetchPolicy()` → plan rows show「校验中」until response → `buildPolicyColorMap` refreshes button state.

---

## Field pitfalls (common migration bugs)

| Field                   | Wrong approach                                   | Correct approach                                             |
| ----------------------- | ------------------------------------------------ | ------------------------------------------------------------ |
| `SupplierNumber`        | `toPrice()` / `Number()` — strips opaque strings | Preserve as **string**; send `""` when empty                 |
| `SupplierType`          | `number` only                                    | `number \| string` (e.g. `"Dttrip"`)                         |
| `Number`                | Omit when empty                                  | Legacy sends **`""`**                                        |
| `BeginDate` / `EndDate` | URL `checkIn` only (`2026-06-26`)                | Plan dates from Detail; append `T00:00:00` when time missing |
| `Room.Id`               | Always string                                    | Use numeric id when value is numeric                         |
| Policy key              | `PlanId`, `RoomId`, or client-side concat        | **`Variables.RoomPlanUniqueId` ↔ `UniqueIdId`** only        |

Rule of thumb: run **price parsers only on amount fields**; treat **identifiers** (`SupplierNumber`, `RoomPlanUniqueId`, `UniqueIdId`) as opaque strings.

---

## Captured payload diff (real hotel, Dttrip)

Same hotel, same passenger (`96200000000002`), same city (`1101`). **Top = legacy RYX; bottom = monorepo before fix.**

### Legacy RYX (correct)

Single plan shape:

```json
{
  "TotalAmount": 540,
  "Number": "",
  "SupplierNumber": "RM1008773489DPRS24754919_8FE52E35AC3FE08F0B1B1ABB1E7DE831",
  "BeginDate": "2026-06-26T00:00:00",
  "EndDate": "2026-06-27T00:00:00",
  "Room": { "Id": 196354 },
  "SupplierType": "Dttrip"
}
```

### Monorepo (incorrect — missing `SupplierNumber`, wrong dates)

```json
{
  "TotalAmount": 540,
  "Number": "",
  "BeginDate": "2026-06-26",
  "EndDate": "2026-06-27",
  "Room": { "Id": "196354" },
  "SupplierType": "Dttrip"
}
```

### Diff summary

| Field                   | Legacy RYX             | Was wrong in monorepo                  | Fixed in                                                                              |
| ----------------------- | ---------------------- | -------------------------------------- | ------------------------------------------------------------------------------------- |
| `SupplierNumber`        | Present (long RM… key) | **Missing** (`toPrice` dropped string) | `toLegacySupplierNumber` in `packages/api`; payload builder in `hotel-book-policy.ts` |
| `BeginDate` / `EndDate` | `…T00:00:00`           | Date only                              | `toLegacyPolicyDate()`                                                                |
| `Room.Id`               | Number                 | String                                 | `toLegacyPolicyRoomId()`                                                              |

Full captured requests (20 plans each) are kept below for regression comparison.

<details>
<summary>Full legacy RYX request (expand)</summary>

```
{"RoomPlans":"[{\"TotalAmount\":540,\"Number\":\"\",\"SupplierNumber\":\"RM1008773489DPRS24754919_8FE52E35AC3FE08F0B1B1ABB1E7DE831\",\"BeginDate\":\"2026-06-26T00:00:00\",\"EndDate\":\"2026-06-27T00:00:00\",\"Room\":{\"Id\":196354},\"SupplierType\":\"Dttrip\"},...]","Passengers":"96200000000002","CityCode":"1101"}
```

</details>

<details>
<summary>Full monorepo request before fix (expand)</summary>

```
{"RoomPlans":"[{\"TotalAmount\":540,\"Number\":\"\",\"BeginDate\":\"2026-06-26\",\"EndDate\":\"2026-06-27\",\"Room\":{\"Id\":\"196354\"},\"SupplierType\":\"Dttrip\"},...]","Passengers":"96200000000002","CityCode":"1101"}
```

</details>

---

## Migration checklist (any hotel / TMC endpoint)

1. **Capture legacy network traffic** — compare field-by-field with monorepo proxy (`/__ryx/...`).
2. **Read `*_ryx.service.ts`** — find `req.Data = { ... }` and any `JSON.stringify` arrays.
3. **Map Detail first** — preserve fields needed for downstream requests (`SupplierNumber`, `BeginDate`, `EndDate`, `Variables`).
4. **Build Policy payload from Detail plans** — not from URL query alone.
5. **Add contract tests** — fixture from captured JSON; assert `buildHotelPolicyRoomPlansPayload()` matches legacy shape.
6. **Verify response join** — `UniqueIdId` vs `RoomPlanUniqueId` for one exceed + one allowed plan.

---

## Code map (monorepo)

| Concern                     | Location                                                                                              |
| --------------------------- | ----------------------------------------------------------------------------------------------------- |
| Detail normalization        | `packages/api/src/apis/hotel.ts` — `normalizeHotelDetailResponse`, `mapLegacyRoomPlan`                |
| Policy payload              | `apps/h5/src/lib/hotel-book-policy.ts` — `buildHotelPolicyRoomPlansPayload`, `buildHotelPolicyParams` |
| Policy colors / book guards | `apps/h5/src/lib/hotel-book-policy.ts` — `buildPolicyColorMap`, `policyItemMatchesPlanUniqueId`       |
| Tests                       | `apps/h5/src/lib/hotel-book-policy.test.ts`, `packages/api/src/apis/hotel.test.ts`                    |

---

## Related docs

- `docs/ryx/酒店模块.md` — legacy flows and method inventory
- `docs/api/domains/hotel.md` — monorepo API surface
- `.cursor/rules/legacy-ryx-reference.mdc` — what to use / not copy from legacy

```
{"RoomPlans":"[{\"TotalAmount\":540,\"Number\":\"\",\"SupplierNumber\":\"RM1008773489DPRS24754919_8FE52E35AC3FE08F0B1B1ABB1E7DE831\",\"BeginDate\":\"2026-06-26T00:00:00\",\"EndDate\":\"2026-06-27T00:00:00\",\"Room\":{\"Id\":196354},\"SupplierType\":\"Dttrip\"},{\"TotalAmount\":604,\"Number\":\"\",\"SupplierNumber\":\"RM1008773489DPRS45966388_B6671D12E5F0C0B1ABA7C36664B4E0C4\",\"BeginDate\":\"2026-06-26T00:00:00\",\"EndDate\":\"2026-06-27T00:00:00\",\"Room\":{\"Id\":196354},\"SupplierType\":\"Dttrip\"},{\"TotalAmount\":632,\"Number\":\"\",\"SupplierNumber\":\"RM1008773489DPRS45966388_BF88A7B3514E6901F88A2E854A421496\",\"BeginDate\":\"2026-06-26T00:00:00\",\"EndDate\":\"2026-06-27T00:00:00\",\"Room\":{\"Id\":196354},\"SupplierType\":\"Dttrip\"},{\"TotalAmount\":658,\"Number\":\"\",\"SupplierNumber\":\"RM1008773489DPRS45966388_5B9A45F8DCF4A1F5532EE1ABD3187401\",\"BeginDate\":\"2026-06-26T00:00:00\",\"EndDate\":\"2026-06-27T00:00:00\",\"Room\":{\"Id\":196354},\"SupplierType\":\"Dttrip\"},{\"TotalAmount\":623,\"Number\":\"\",\"SupplierNumber\":\"RM1008773491DPRS45966388_8E9E9EF271BF3AE59D39262E2CA5FC9F\",\"BeginDate\":\"2026-06-26T00:00:00\",\"EndDate\":\"2026-06-27T00:00:00\",\"Room\":{\"Id\":196355},\"SupplierType\":\"Dttrip\"},{\"TotalAmount\":653,\"Number\":\"\",\"SupplierNumber\":\"RM1008773491DPRS45966388_0191AF8010BF9F7871F9DD778EFB280C\",\"BeginDate\":\"2026-06-26T00:00:00\",\"EndDate\":\"2026-06-27T00:00:00\",\"Room\":{\"Id\":196355},\"SupplierType\":\"Dttrip\"},{\"TotalAmount\":673,\"Number\":\"\",\"SupplierNumber\":\"RM1008773491DPRS24754919_C54C25B441B56CEDBDE25C043103BB8A\",\"BeginDate\":\"2026-06-26T00:00:00\",\"EndDate\":\"2026-06-27T00:00:00\",\"Room\":{\"Id\":196355},\"SupplierType\":\"Dttrip\"},{\"TotalAmount\":676,\"Number\":\"\",\"SupplierNumber\":\"RM1008773491DPRS45966388_22B35C00CDD0910F56D5C370F1731851\",\"BeginDate\":\"2026-06-26T00:00:00\",\"EndDate\":\"2026-06-27T00:00:00\",\"Room\":{\"Id\":196355},\"SupplierType\":\"Dttrip\"},{\"TotalAmount\":643,\"Number\":\"\",\"SupplierNumber\":\"RM1008773490DPRS20784631_FF21996FF3169A99F5B94C1BAAD51FA0\",\"BeginDate\":\"2026-06-26T00:00:00\",\"EndDate\":\"2026-06-27T00:00:00\",\"Room\":{\"Id\":196356},\"SupplierType\":\"Dttrip\"},{\"TotalAmount\":654,\"Number\":\"\",\"SupplierNumber\":\"RM1008773490DPRS45966388_EF2C366498F65674B1B1B2BDAD19CE2C\",\"BeginDate\":\"2026-06-26T00:00:00\",\"EndDate\":\"2026-06-27T00:00:00\",\"Room\":{\"Id\":196356},\"SupplierType\":\"Dttrip\"},{\"TotalAmount\":657,\"Number\":\"\",\"SupplierNumber\":\"RM1008773490DPRS24754919_4784EC097CD8FD3E9E699C0538CAA833\",\"BeginDate\":\"2026-06-26T00:00:00\",\"EndDate\":\"2026-06-27T00:00:00\",\"Room\":{\"Id\":196356},\"SupplierType\":\"Dttrip\"},{\"TotalAmount\":659,\"Number\":\"\",\"SupplierNumber\":\"RM1008773490DPRS24754919_6AD66A664E3472EB7D9F92F5181AA26C\",\"BeginDate\":\"2026-06-26T00:00:00\",\"EndDate\":\"2026-06-27T00:00:00\",\"Room\":{\"Id\":196356},\"SupplierType\":\"Dttrip\"},{\"TotalAmount\":777,\"Number\":\"\",\"SupplierNumber\":\"RM1016769162DPRS20784631_0D1A693740773EF017B6ADB901CBFC4F\",\"BeginDate\":\"2026-06-26T00:00:00\",\"EndDate\":\"2026-06-27T00:00:00\",\"Room\":{\"Id\":196363},\"SupplierType\":\"Dttrip\"},{\"TotalAmount\":791,\"Number\":\"\",\"SupplierNumber\":\"RM1016769162DPRS45966388_DCA032F9500CE3942AFC93E4CD2E746F\",\"BeginDate\":\"2026-06-26T00:00:00\",\"EndDate\":\"2026-06-27T00:00:00\",\"Room\":{\"Id\":196363},\"SupplierType\":\"Dttrip\"},{\"TotalAmount\":821,\"Number\":\"\",\"SupplierNumber\":\"RM1016769162DPRS24754919_9F54CBE9BBD05E883F8B8AEB11D87888\",\"BeginDate\":\"2026-06-26T00:00:00\",\"EndDate\":\"2026-06-27T00:00:00\",\"Room\":{\"Id\":196363},\"SupplierType\":\"Dttrip\"},{\"TotalAmount\":823,\"Number\":\"\",\"SupplierNumber\":\"RM1016769162DPRS24754919_4F597E506021962C29B46510A1D9F190\",\"BeginDate\":\"2026-06-26T00:00:00\",\"EndDate\":\"2026-06-27T00:00:00\",\"Room\":{\"Id\":196363},\"SupplierType\":\"Dttrip\"},{\"TotalAmount\":825,\"Number\":\"\",\"SupplierNumber\":\"RM1016769160DPRS20784631_7155280FDCB0FA74C7F3CD523EF978D5\",\"BeginDate\":\"2026-06-26T00:00:00\",\"EndDate\":\"2026-06-27T00:00:00\",\"Room\":{\"Id\":196364},\"SupplierType\":\"Dttrip\"},{\"TotalAmount\":841,\"Number\":\"\",\"SupplierNumber\":\"RM1016769160DPRS45966388_42B471BE97E1D33E40E345BAA1ED84FD\",\"BeginDate\":\"2026-06-26T00:00:00\",\"EndDate\":\"2026-06-27T00:00:00\",\"Room\":{\"Id\":196364},\"SupplierType\":\"Dttrip\"},{\"TotalAmount\":872,\"Number\":\"\",\"SupplierNumber\":\"RM1016769160DPRS24754919_35F218AB410CEACA2A09D2021D2861B8\",\"BeginDate\":\"2026-06-26T00:00:00\",\"EndDate\":\"2026-06-27T00:00:00\",\"Room\":{\"Id\":196364},\"SupplierType\":\"Dttrip\"},{\"TotalAmount\":874,\"Number\":\"\",\"SupplierNumber\":\"RM1016769160DPRS24754919_BAE20FF08522270B92931ED423D24C12\",\"BeginDate\":\"2026-06-26T00:00:00\",\"EndDate\":\"2026-06-27T00:00:00\",\"Room\":{\"Id\":196364},\"SupplierType\":\"Dttrip\"}]","Passengers":"44880000000001,96200000000002","CityCode":"1101"}
```
