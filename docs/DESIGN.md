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

## H5 Order List Tabs

### v1 Recorded

- Layout: one row with six tabs, ordered as `因公机票 / 因公火车 / 因公酒店 / 因私机票 / 因私火车 / 因私酒店`.
- Group signal: center divider between public and private groups.
- Selection: neutral active text plus underline; personal group underline may use green.
- Tradeoff: direct but text-heavy; six labels are crowded on mobile and repeat “因公/因私”.

### v2 Trial

- Layout: two-level selector.
- Level 1 ownership: `企业 / 个人`.
- Level 2 product: `机票 / 火车 / 酒店`.
- Scope remains below as `全部 / 待出行`.
- Goal: remove repeated “因公/因私” wording while preserving public/private distinction through hierarchy and selected state.

### v3 Hierarchy Refinement

- Ownership is a compact centered segmented control, visually lighter than product tabs.
- Product tabs are the primary navigation and carry the active underline.
- Active underline follows channel tone: enterprise uses RYX blue, personal uses green.
- Scope is a small content-level filter aligned near the list instead of a full-width third navigation row.

### v4 Compact Filter Row

- Product tabs remain the first row and continue to own the page-level category navigation.
- Ownership and scope filters share one row below the product tabs: ownership on the left, scope on the right.
- Both lower-row controls use equal compact segmented widths to read as auxiliary filters, reducing the previous three-row stack.

## H5 Travel List Chrome

Use `FlightListPage` as the reference implementation for dense travel result lists, including the hotel list migration.

Reference files:
- `apps/h5/src/pages/flight/FlightListPage.tsx`
- `apps/h5/src/components/flight/FlightListHeader.tsx`
- `apps/h5/src/components/flight/FlightListDateStrip.tsx`
- `apps/h5/src/components/flight/FlightListToolbar.tsx`
- `apps/h5/src/components/flight/FlightSegmentCard.tsx`
- `apps/h5/src/components/flight/FlightFilterSheet.tsx`
- `apps/h5/src/components/flight/flight-filter-sheet.css`

### Page Shell

- Use a full viewport root: `relative h-dvh overflow-hidden bg-[#F5F6F9]`.
- Keep the navigation/search header fixed at the top with `z-50`, `max-w-lg`, and safe-area padding.
- Scroll only the content container below the measured header height, not the whole body.
- When a modify/search/filter sheet is open, lock the content scroller with `overflow-hidden`.
- Use content padding `px-3 py-3` and bottom padding that accounts for fixed bottom actions plus `env(safe-area-inset-bottom)`.

### Header Pattern

- Compact result-list headers use `bg-gradient-to-b from-brand-header-start to-brand-header-end`.
- Header content should be one line: back action, central query summary, right-side contextual action.
- Query summaries should be tappable and open a modify-search sheet instead of navigating away when the user is editing the current list.
- For hotel list, map this to: back action, `城市 · 入住-离店 · 关键词/地标`, and passenger/profile action as product context requires.

### Secondary Strip

- Use a sticky strip immediately under the fixed header for frequently changed list context.
- Flight uses `FlightListDateStrip`; hotel should use the same density for stay dates or a compact date/city strip rather than a tall card.
- Active items use the primary button gradient and white text; inactive items stay transparent with dark text.
- Calendar/date entry remains a fixed-width control on the right with a subtle blue gradient and left shadow.

### Result Cards

- Cards are full-width buttons with `rounded-lg`, white surface, and subtle shadow.
- Use `active:scale-[0.99]` for tap feedback and `disabled:opacity-60` for loading transitions.
- Keep information dense and scannable:
  - Primary facts in the top row.
  - Price/value anchored to the right.
  - Secondary metadata in a single truncated row.
  - Badges sit at the card edge or as compact inline pills, never as large banners.
- Special-value cards may use a shallow top gradient only across the upper 48px, as in the direct-lowest flight card.
- For hotel cards, preserve this hierarchy: image/label block, hotel name + score/star row, address/distance metadata, price anchored right.

### Bottom Toolbar

- Use a fixed bottom toolbar for cross-list filtering and sorting when controls affect the whole result set.
- Toolbar surface: white, top border, subtle upward shadow, safe-area padding.
- Keep three to four equal-width icon+label actions.
- Active labels use brand blue; inactive labels use muted text.
- Toggle sort labels should reflect state, e.g. `从低到高` / `从高到低`, not only “价格”.

### Filter Sheet

- Prefer the flight filter sheet structure for complex list filtering:
  - Full-screen fixed dialog wrapper.
  - Blurred dark backdrop.
  - Bottom sheet panel at `65dvh`.
  - 16px top corner radius.
  - Small drag handle.
  - Gradient header fading into page background.
  - Optional quick toggles under the title.
  - White rounded body with left category rail and right content pane.
  - Fixed footer with outline reset and primary gradient confirm.
- Category rail active state uses white background, brand text, and a 3px gradient left marker.
- Dirty categories use a small brand dot.
- Selected rows use pale blue fill, brand text, and custom radio/checkbox controls.
- Motion: 320ms sheet translate and backdrop fade; include `prefers-reduced-motion`.

### Hotel List Mapping

- Hotel should reuse the travel list chrome rather than the current partial sticky hotel header when implementing full legacy behavior.
- Legacy top filter tabs (`推荐 / 星级价格 / 位置区域 / 筛选`) may become:
  - bottom toolbar actions for `筛选 / 距离区域 / 价格 / 推荐`, or
  - a sticky strip under the header if product requires parity.
- If both sticky tabs and bottom toolbar are considered, prefer one primary control surface to avoid duplicate filters.
- Complex hotel filters should use the filter sheet body/rail pattern; do not create several unrelated popovers.

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
- 2026-07-02 - Travel order detail shell: aligned hotel, flight, and train order details with form-page chrome by using the form gradient root, a transparent fixed header, and an independent hidden-scroll content area.
- 2026-07-02 - FlightBookPage shell: aligned flight booking with train booking by using the form-page gradient root, fixed transparent header, independent hidden-scroll content, and train-style white section cards.
- 2026-07-04 - OrderPayPage shell: aligned the shared payment selection page with credential management chrome using the form gradient root, transparent tokenized header, white payment sections, selected pale-blue channel rows, and a fixed primary gradient CTA.
- 2026-07-05 - PassengerSelectAlertDialog polish: aligned the blocking one-action prompt with the RYX Blue alert pattern by using a 16px panel radius, blurred backdrop, softer tokenized notice surface, gradient pill CTA, and explicit hover/active/focus-visible states.
- 2026-06-27 - Form gradient layout principle: documented why form pages must use root-level `--brand-form-header-gradient` plus card overlap instead of a tall `brand-header-start` to `brand-header-end` block.
- 2026-06-27 - TravelApprovalPage list shell: replaced the flat white tab strip with a page-level form gradient header, segmented approval tabs, lifted task cards, and tokenized task status treatments while preserving remote approval workflows.
- 2026-06-27 - TravelApprovalPage header simplification: removed duplicate approval summary copy and the standalone pending counter from the gradient header; kept pending count only inside the tab badge.
- 2026-06-27 - PassengerCredentialForm pickers: aligned gender with the credential-type bottom sheet pattern and replaced native date inputs with a mobile bottom-sheet year/month/day picker for consistent H5 form interaction.
- 2026-06-28 - OrderList flight tickets: expanded flight order cards to render ticket-level rows and actions, matching legacy multi-ticket order behavior while keeping the existing card shell and order-level footer.
- 2026-06-28 - OrderList product scope: removed car from H5 order entry tabs and profile order shortcuts; kept backend car mapping defensive while exposing only flight, train, and hotel.
- 2026-06-28 - OrderList train and hotel actions: expanded train order cards to ticket-level rows/actions and moved train refund/cancel plus hotel cancel into list-level dialogs to match legacy list behavior.
- 2026-06-28 - ConfirmDialog compact header: aligned alert icon and title on one row and changed body copy to left alignment so wrapped destructive prompts keep a stable reading edge.
- 2026-06-28 - ContactUsPage chrome: moved contact page onto the shared SettingsPageChrome/form-gradient shell and refreshed the customer-service card to match profile/settings surfaces.
- 2026-06-28 - AccountCard management: migrated legacy bank-card list/add/edit/delete into H5 with form-gradient pages, card-number masking, bottom-sheet bank selection, and shared confirmation dialog.
- 2026-06-28 - ProfileCenterPage: connected the profile header personal-center entry to a settings-style detail page showing legacy member/staff profile fields and credential management navigation.
- 2026-06-28 - ProfileAvatarCropSheet: added a standalone crop-before-upload avatar sheet for the profile center, using local file preview, drag/zoom cropping, and legacy-aligned upload payloads.
- 2026-06-28 - Notice list/detail pages: moved notice screens to the shared form-gradient shell with custom page headers and denser announcement cards for clearer list scanning.
- 2026-06-28 - Home notice strip: restyled the homepage bulletin entry to an orange pill banner with orange typography and horn icon, matching the provided legacy reference.
- 2026-06-28 - Home notice strip rotation: made the homepage bulletin entry cycle through multiple notices automatically, removing the timestamp and animating entries vertically from bottom to top.
- 2026-06-29 - PassengerSelectPage chrome: added a form-tone variant to the shared picker shell so the passenger selection header aligns with credential list form-gradient pages while preserving the default city picker chrome.
- 2026-06-29 - Travel list chrome: documented `FlightListPage` as the H5 reference for result-list pages, including fixed gradient headers, compact sticky context strips, dense cards, fixed bottom toolbar, and the 65dvh filter sheet pattern for the hotel list migration.
- 2026-06-30 - HotelListPage shell: migrated the hotel list to the H5 travel list chrome with a fixed gradient query header, sticky compact search strip, full-viewport internal scroller, and fixed four-action bottom toolbar; complex hotel filters remain scheduled for later steps.
- 2026-06-30 - HotelListPage pagination: moved the list data flow to an infinite query using `PageIndex/PageSize`, added pull-to-refresh, bottom sentinel loading, no-more state, and query-change scroll reset while keeping filter actions as inactive entry points for later steps.
- 2026-06-30 - HotelList price/star filters: added a hotel list bottom sheet for recommended sorting, star multi-select, hotel type, preset price ranges, and custom prices; the sheet reuses the flight filter rail/panel chrome and keeps area/brand/facility filters for the next step.
- 2026-06-30 - HotelList condition filters: connected `Condition-Gets` to the hotel list sheet, adding location, brand, theme, service, and facility categories with dirty markers, loading/error/empty states, and API parameter mapping for `Geos`, `Brands`, `Themes`, `Services`, and `Facilities`.
- 2026-06-30 - HotelList card context: completed dense hotel cards with GreenCloud-over-Tmc badge priority, score, star, address, distance, right-anchored price, and detail URL context handoff for date, city, price, hotel type, and travel form.
- 2026-06-30 - HotelList business context: added hotel passenger/staff-city request context and a compact free-stay policy notice with modal explanation, visible only when TMC config allows it and hidden for agent hotel mode.
- 2026-06-30 - HotelList location filter parity: upgraded location filtering to the legacy three-column structure for type, metro line, and station while keeping `Geos/searchGeoId` API mapping unchanged.
- 2026-06-30 - HotelList brand filter parity: changed brand filtering from a flat option list to legacy grouped sections for popular, economy, comfort, high-end, and luxury brands; each section supports local clear while the request continues to submit one `Brands` array.
- 2026-06-30 - HotelList filter entry grouping: scoped the bottom toolbar entries into basic filters (`sort/star/category/price`), location-only filters, and amenity filters (`brand/theme/service/facility`); single-section sheets hide the outer rail so location categories occupy the first visible column.
- 2026-06-30 - HotelList location dirty marker: location category buttons now show a small brand dot when any child geo under that category is selected, matching the filter rail dirty-state pattern inside the custom location panel.

## H5 Dialog And Sheet Inventory

Before creating any new dialog, sheet, toast, or modal-like surface, first check this inventory and reuse or extend an existing component when the interaction intent matches. New one-off dialogs should be the exception: add one only when the existing structure cannot express the content, action model, or visual hierarchy without becoming confusing.

### Reuse Decision Rules

- Use `ConfirmDialog` for destructive or irreversible confirmations with cancel/confirm actions.
- Use `PassengerSelectAlertDialog` for blocking acknowledgement prompts in passenger, booking, or submit flows where the user only needs to read a message and tap confirm.
- Use `PageToast` for short, non-blocking success/error feedback that does not require acknowledgement.
- Use a bottom sheet for selection, filtering, long detail text, bills, or forms that need more than one compact message.
- Prefer extending an existing product sheet/dialog if the behavior belongs to that product domain; extract a shared primitive only after two or more domains need the same structure.
- Server-returned business messages should be displayed as returned unless product copy explicitly requires mapping; do not silently rewrite backend `Message` values in a new dialog.

### Existing Reusable Surfaces

| Component | File | Use For | Notes |
| --- | --- | --- | --- |
| `ConfirmDialog` | `apps/h5/src/components/ConfirmDialog.tsx` | Delete, cancel, submit confirmation, two-action blocking decisions | Shared alert dialog; compact icon/title header; used by credential, passenger, bank-card, order, and train booking flows. |
| `PassengerSelectAlertDialog` | `apps/h5/src/components/passenger/PassengerSelectAlertDialog.tsx` | Blocking friendly prompt with one confirm action | Used by passenger selection and booking submit errors; suitable for server business failures such as train duplicate-trip messages. |
| `PageToast` | `apps/h5/src/components/layout/PageToast.tsx` | Non-blocking page feedback | Prefer for transient list/detail actions where the user can continue without a modal. |
| `FlightListTimeoutDialog` | `apps/h5/src/components/flight/FlightListTimeoutDialog.tsx` | Flight list timeout acknowledgement | Product-specific timeout surface; reuse only for the same timeout pattern. |
| `FlightPolicyAlertDialog` | `apps/h5/src/components/flight/FlightPolicyAlertDialog.tsx` | Flight policy, sold-out, or cabin booking blocking prompt | Thin flight-domain wrapper over the shared policy alert presentation; use instead of browser `alert` in flight cabin policy flows. |
| `HotelPolicyAlertDialog` | `apps/h5/src/components/hotel/HotelPolicyAlertDialog.tsx` | Hotel/train policy or rule alert text | Use when policy copy needs formatted alert content, not for generic errors. |
| `HotelBookWarmReminderDialog` | `apps/h5/src/components/hotel/HotelBookWarmReminderDialog.tsx` | Hotel booking warm reminder | Product-specific reminder with richer header/content. |
| `HotelPassengerRequiredDialog` | `apps/h5/src/components/hotel/HotelPassengerRequiredDialog.tsx` | Hotel guest required prompt | Product-specific missing-passenger acknowledgement. |
| `HotelOrderCancelDialog` / `HotelOrderSmsSheet` | `apps/h5/src/components/order/hotel/HotelOrderSmsSheet.tsx` | Hotel cancel confirmation and SMS verification | Use for hotel order cancellation, especially SMS-required cancellation. |
| `FlightOrderCancelDialog` | `apps/h5/src/components/order/flight/FlightOrderCancelDialog.tsx` | Flight order cancel confirmation | Product-specific order action dialog. |
| `FlightOrderRefundDialog` | `apps/h5/src/components/order/flight/FlightOrderRefundDialog.tsx` | Flight refund reason/form | Product-specific order action form dialog. |
| `TrainOrderCancelDialog` | `apps/h5/src/components/order/train/TrainOrderCancelDialog.tsx` | Train order/ticket cancel confirmation | Product-specific order action dialog. |
| `TrainOrderIssueDialog` | `apps/h5/src/components/order/train/TrainOrderIssueDialog.tsx` | Train issue confirmation | Product-specific order action dialog. |
| `TrainOrderRefundDialog` | `apps/h5/src/components/order/train/TrainOrderRefundDialog.tsx` | Train refund confirmation/form | Product-specific order action dialog. |

### Existing Bottom Sheet Families

| Family | Components | Use For |
| --- | --- | --- |
| Travel list filters | `FlightFilterSheet`, `FlightPolicyFilterSheet`, `PolicyFilterSheet`, `TrainFilterSheet`, `HotelListFilterSheet`, `HotelPolicyFilterSheet` | Complex filter, category rail, dirty state, reset and confirm footer. |
| Search/date modification | `CalendarPickerSheet`, `FlightModifySearchSheet`, `TrainModifySearchSheet`, `HotelStayDatePickerSheet` | Date and route/stay edits within list pages. |
| Booking selectors | `FlightBookPickerSheet`, `FlightBookApproverSheet`, `FlightBookOrganizationSheet`, `FlightBookCostCenterSheet`, `FlightOutNumberPickerSheet`, `FlightBookNotifyLanguageSheet`, `FlightBookCredentialSheet`, `FlightBookAddContactSheet` | Booking-page pickers and form-bound selection. |
| Passenger and credential | `CredentialTypeSheet`, `CredentialNameRulesDialog`, `SelectedPassengersSheet`, credential form gender/date sheets | Passenger credential selection, rule explanation, selected passenger preview. |
| Bills and rules | `FlightBookBillSheet`, `TrainBookBillSheet`, `HotelBookBillSheet`, `FlightFareRulesSheet`, `FareRulesBottomSheet`, `FlightInsuranceDetailSheet`, order bill/explain sheets | Price breakdowns, fare rules, insurance/rule detail content. |
| Hotel booking | `HotelBookArrivalTimeSheet`, `HotelBookNoticeSheet`, `HotelBookGuaranteeAgreementSheet` | Hotel arrival, notice, guarantee agreement content. |
| Profile/settings/contact | `ProfileAvatarCropSheet`, `ChangeEmailSheet`, `LegalDocumentSheet` | Account/profile editing and legal document display. |

## Components

- `apps/h5/src/components/H5Shell.tsx` - base H5 shell with page background and scroll container.
- `apps/h5/src/components/ConfirmDialog.tsx` - shared confirmation modal with compact icon/title header and left-aligned body copy.
- `apps/h5/src/components/passenger/PassengerSelectAlertDialog.tsx` - shared one-action blocking prompt for passenger selection, booking validation, and backend business messages.
- `apps/h5/src/components/layout/AppHeader.tsx` - shared app header, supports brand and hotel tones.
- `apps/h5/src/components/passenger/PassengerCredentialForm.tsx` - credential form with unified bottom-sheet pickers for credential type, gender, birthday, and expiration date.
- `apps/h5/src/pages/contact/ContactUsPage.tsx` - contact/legal/service page using the shared settings chrome and form-gradient shell.
- `apps/h5/src/pages/credential/CredentialListPage.tsx` - reference implementation for form-page gradient background.
- `apps/h5/src/pages/account-card/AccountCardListPage.tsx` - bank-card management list with loading, empty, error, edit, delete, and add states.
- `apps/h5/src/pages/account-card/AccountCardFormPage.tsx` - bank-card add/edit form with preview card, bottom-sheet bank picker, validation, save, and delete confirmation.
- `apps/h5/src/pages/profile/ProfileCenterPage.tsx` - personal center detail page for member/staff profile fields and credential management entry.
- `apps/h5/src/components/profile/ProfileAvatarCropSheet.tsx` - avatar crop sheet with local preview, drag/zoom crop controls, and confirm-before-upload flow.
- `apps/h5/src/pages/notice/NoticeListPage.tsx` - notice list page with custom header, refresh action, loading/error/empty states, and announcement cards.
- `apps/h5/src/pages/notice/NoticeDetailPage.tsx` - notice detail page with custom header and legacy-style content surface.
- `apps/h5/src/pages/travel/TravelApplyPage.tsx` - travel application form page using page-level form gradient.
- `apps/h5/src/pages/travel/TravelApprovalPage.tsx` - travel approval list shell using page-level gradient header and segmented tabs.
- `apps/h5/src/components/travel/ApprovalTaskList.tsx` - approval task list cards with status pills, skeleton, error, empty, and load-more states.
- `apps/h5/src/components/order/OrderListCard.tsx` - order list card with flight ticket-level rows/actions and shared transport/hotel bodies.
- `apps/h5/src/components/search/PickerShell.tsx` - shared full-screen picker chrome with default and form-gradient tones.
- `apps/h5/src/pages/flight/FlightListPage.tsx` - reference travel result-list chrome for H5 list pages.
- `apps/h5/src/components/flight/FlightFilterSheet.tsx` - reference complex list filter sheet with category rail, dirty state, reset, and confirm footer.
- `apps/h5/src/components/flight/FlightSegmentCard.tsx` - reference dense result card with right-anchored price, compact metadata, value badges, and tap feedback.
- `apps/h5/src/components/flight/FlightPolicyAlertDialog.tsx` - flight-domain wrapper for policy blocking prompts, reusing the shared warm-reminder policy dialog presentation.
- `apps/h5/src/pages/hotel/HotelListPage.tsx` - hotel result list using the travel list shell with fixed header, sticky query strip, internal scrolling, and bottom toolbar.
- `apps/h5/src/components/hotel/HotelListHeader.tsx` - compact hotel list query header with back, summary, and profile actions.
- `apps/h5/src/components/hotel/HotelListToolbar.tsx` - fixed hotel list bottom toolbar for recommended, price/star, location, and filter entry points.
- `apps/h5/src/components/hotel/HotelListFilterSheet.tsx` - hotel sorting and price/star filter sheet built on the travel-list filter chrome.
- `apps/h5/src/components/hotel/HotelListItem.tsx` - dense hotel result card with thumbnail badge, score/star row, address/distance metadata, price anchor, and tap feedback.
- `apps/h5/src/lib/hotel-list-filters.ts` - hotel list filter state, option constants, dirty checks, and API parameter mapping.
- `apps/h5/src/lib/hotel-list-context.ts` - hotel list passenger AccountId, staff city, and free-stay TMC context helpers.

## Non-Goals

- No Figma sync.
- No image generation.
- No token rewrite unless `packages/ui/src/styles/globals.css` changes.
