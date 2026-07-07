/**
 * Layout tokens for pages rendered inside WebShell's right-hand main column.
 * Use h-full (not h-dvh) and sticky headers (not fixed inset-x-0) so content
 * stays beside the left sidebar instead of spanning the full viewport.
 *
 * Overlay pickers (e.g. CalendarPickerSheet) use position:absolute and must be
 * rendered as direct children of WEB_PAGE_ROOT (or another relative h-full root).
 */

/** Page root — fills the main column below optional PageHeaderSlot. */
export const WEB_PAGE_ROOT = "relative flex h-full min-h-0 flex-col overflow-hidden bg-[#F5F6F9]";

/** Scrollable content between sticky header and bottom toolbar. */
export const WEB_PAGE_BODY =
  "min-h-0 flex-1 overflow-y-auto overscroll-y-contain [-webkit-overflow-scrolling:touch]";

/** In-page header/toolbar pinned to top of the main column. */
export const WEB_PAGE_STICKY_HEADER = "sticky top-0 z-50 shrink-0 w-full";

/** Full-width chrome inner (headers, toolbar grids) — pad/PC main column, not H5 max-w-lg. */
export const WEB_PAGE_FULL_WIDTH = "w-full";

/** Bottom action/filter bar within the page column. */
export const WEB_PAGE_BOTTOM_BAR =
  "z-40 shrink-0 w-full border-t border-[#eeeeee] bg-white pb-[max(0.25rem,env(safe-area-inset-bottom))] shadow-[0_-2px_8px_rgba(0,0,0,0.04)]";

/** Picker / form shell — fills main column (not viewport-fixed). */
export const WEB_PAGE_PICKER_ROOT = "flex h-full min-h-0 w-full flex-col overflow-hidden";
