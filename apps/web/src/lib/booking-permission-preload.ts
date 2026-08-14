import type { QueryClient } from "@tanstack/react-query";
import type { IdentityDto, StaffDto } from "@ryx/shared-types";
import { AUTH_FLOW_METHODS, TRAVEL_FLOW_METHODS } from "@ryx/api";

import { getApi } from "@/lib/api";
import { getApiMode } from "@/lib/env";
import { clearSession, getTicket } from "@/lib/session";
import { stopSessionGuard } from "@/lib/session-guard";

const FIVE_MINUTES = 5 * 60 * 1000;
const IDENTITY_RETRY_INTERVAL_MS = 10_000;

export const IDENTITY_QUERY_KEY = ["identity"] as const;
export const BOOKING_PERMISSION_QUERY_KEY = ["booking-permission"] as const;
export const BOOKING_PERMISSION_STAFF_QUERY_KEY = ["booking-permission", "staff"] as const;

const IDENTITY_PERMISSION_STORAGE_KEY = "ryx_identity_permission";

interface StoredIdentityPermission {
  ticket: string;
  data: IdentityDto;
}

let identityRefreshTicket: string | null = null;
let identityRefreshPromise: Promise<void> | null = null;
let identityRetryTimer: ReturnType<typeof setTimeout> | null = null;
let identityReadyTicket: string | null = null;

export function readStoredBusinessIdentityPermission(ticket: string | null): IdentityDto | null {
  if (!ticket) return null;
  try {
    const raw = sessionStorage.getItem(IDENTITY_PERMISSION_STORAGE_KEY);
    if (!raw) return null;
    const stored = JSON.parse(raw) as Partial<StoredIdentityPermission>;
    if (stored.ticket !== ticket || !stored.data?.Ticket) {
      sessionStorage.removeItem(IDENTITY_PERMISSION_STORAGE_KEY);
      return null;
    }
    return stored.data;
  } catch {
    sessionStorage.removeItem(IDENTITY_PERMISSION_STORAGE_KEY);
    return null;
  }
}

function persistIdentityPermission(ticket: string, data: IdentityDto): void {
  try {
    const stored: StoredIdentityPermission = { ticket, data };
    sessionStorage.setItem(IDENTITY_PERMISSION_STORAGE_KEY, JSON.stringify(stored));
  } catch {
    // Storage can be unavailable in restricted WebViews; the query cache still works.
  }
}

export function restoreBusinessIdentityPermission(queryClient: QueryClient): boolean {
  const ticket = getTicket();
  if (!ticket) return false;
  const identity = readStoredBusinessIdentityPermission(ticket);
  if (!identity) return false;
  queryClient.setQueryData(IDENTITY_QUERY_KEY, identity);
  return true;
}

/** Store an already validated identity, such as the DingTalk login result. */
export function cacheBusinessIdentityPermission(
  queryClient: QueryClient,
  ticket: string,
  identity: IdentityDto,
): void {
  queryClient.setQueryData(IDENTITY_QUERY_KEY, identity);
  persistIdentityPermission(ticket, identity);
  identityRefreshTicket = ticket;
  identityRefreshPromise = null;
  identityReadyTicket = ticket;
  clearIdentityRetryTimer();
}

function clearIdentityRetryTimer(): void {
  if (identityRetryTimer !== null) {
    clearTimeout(identityRetryTimer);
    identityRetryTimer = null;
  }
}

function resetIdentityPermissionState(): void {
  clearIdentityRetryTimer();
  identityRefreshTicket = null;
  identityRefreshPromise = null;
  identityReadyTicket = null;
}

/** Stop the background Identity/Get retry for the current application session. */
export function stopBusinessIdentityPermissionRefresh(): void {
  resetIdentityPermissionState();
}

interface BookingPermissionPreloadOptions {
  reset?: boolean;
  silentUnauthorized?: boolean;
  preloadCredentials?: boolean;
}

export function bookingPermissionSelfCredentialsQueryKey(accountId: string | undefined) {
  return ["booking-permission", "self-credentials", accountId] as const;
}

export function isSelfBookTypeValue(value: StaffDto["BookType"] | null | undefined): boolean {
  if (value == null) return false;
  const normalized = String(value).trim().toLowerCase();
  return normalized === "1" || normalized === "self";
}

export function present(value: unknown): string | undefined {
  if (value == null) return undefined;
  const normalized = String(value).trim();
  if (!normalized || normalized === "undefined" || normalized === "null") return undefined;
  return normalized;
}

function staffAccountId(staff: StaffDto | undefined, identity?: { Id?: string }) {
  const legacyAccount = (staff as (StaffDto & { Account?: { Id?: string } }) | undefined)?.Account;
  return present(staff?.AccountId) ?? present(legacyAccount?.Id) ?? present(identity?.Id);
}

function isUnauthorizedLike(code: string | undefined, message: string): boolean {
  return code?.trim().toLowerCase() === "nologin" || message.includes("登陆超时");
}

function isUnauthorizedResponse(response: {
  Status: boolean;
  Code?: string | null;
  Message?: string | null;
}): boolean {
  return !response.Status && isUnauthorizedLike(response.Code ?? undefined, response.Message ?? "");
}

function clearStartupSession(queryClient: QueryClient): void {
  stopSessionGuard();
  clearSession();
  queryClient.clear();
}

async function preloadSelfCredentials(
  queryClient: QueryClient,
  api: ReturnType<typeof getApi>,
): Promise<void> {
  const staff = queryClient.getQueryData<StaffDto>(BOOKING_PERMISSION_STAFF_QUERY_KEY);
  const identity = queryClient.getQueryData<IdentityDto>(IDENTITY_QUERY_KEY);
  const accountId = staffAccountId(staff, identity);
  if (!staff || !isSelfBookTypeValue(staff.BookType) || !accountId) return;

  await queryClient
    .prefetchQuery({
      queryKey: bookingPermissionSelfCredentialsQueryKey(accountId),
      queryFn: () => api.passenger.getStaffCredentials({ AccountId: accountId }),
      staleTime: FIVE_MINUTES,
    })
    .catch((error) => {
      console.warn("[ryx] self passenger credential preload failed", error);
    });
}

export async function preloadBusinessStaffPermission(
  queryClient: QueryClient,
  options: BookingPermissionPreloadOptions = {},
): Promise<void> {
  const ticket = getTicket();
  if (getApiMode() !== "mock" && !ticket) return;

  if (options.reset) {
    queryClient.removeQueries({ queryKey: BOOKING_PERMISSION_QUERY_KEY });
    queryClient.removeQueries({ queryKey: BOOKING_PERMISSION_STAFF_QUERY_KEY });
    queryClient.removeQueries({ queryKey: IDENTITY_QUERY_KEY });
    resetIdentityPermissionState();
  }

  const silentUnauthorized = Boolean(options.silentUnauthorized);
  const api = getApi();
  if (silentUnauthorized) {
    const staffResponse = await api.proxy.sendResponse<StaffDto>({
      method: TRAVEL_FLOW_METHODS.STAFF_GET,
      data: undefined,
      requestFields: { forceRefresh: true },
    });
    if (isUnauthorizedResponse(staffResponse)) {
      clearStartupSession(queryClient);
      return;
    }
    if (!staffResponse.Status) {
      console.warn("[ryx] staff permission preload failed", staffResponse);
      return;
    }
    queryClient.setQueryData(BOOKING_PERMISSION_STAFF_QUERY_KEY, staffResponse.Data);
    if (options.preloadCredentials !== false) {
      await preloadSelfCredentials(queryClient, api);
    }
    return;
  }

  try {
    await queryClient.fetchQuery({
      queryKey: BOOKING_PERMISSION_STAFF_QUERY_KEY,
      queryFn: () => api.travel.getStaff(),
      staleTime: FIVE_MINUTES,
    });
    if (options.preloadCredentials !== false) {
      await preloadSelfCredentials(queryClient, api);
    }
  } catch (error) {
    console.warn("[ryx] staff permission preload failed", error);
  }
}

export async function preloadBusinessIdentityPermission(
  queryClient: QueryClient,
  options: BookingPermissionPreloadOptions = {},
): Promise<void> {
  const ticket = getTicket();
  if (!ticket) return;

  if (options.reset) {
    queryClient.removeQueries({ queryKey: IDENTITY_QUERY_KEY });
    resetIdentityPermissionState();
  }

  if (identityRefreshTicket === ticket) {
    await identityRefreshPromise;
    return;
  }

  restoreBusinessIdentityPermission(queryClient);
  identityRefreshTicket = ticket;
  await runBusinessIdentityPermissionRefresh(queryClient, ticket);
}

function isCurrentIdentityRefresh(ticket: string): boolean {
  return identityRefreshTicket === ticket && getTicket() === ticket;
}

function scheduleBusinessIdentityPermissionRetry(queryClient: QueryClient, ticket: string): void {
  if (!isCurrentIdentityRefresh(ticket) || identityReadyTicket === ticket || identityRetryTimer)
    return;
  identityRetryTimer = setTimeout(() => {
    identityRetryTimer = null;
    void runBusinessIdentityPermissionRefresh(queryClient, ticket);
  }, IDENTITY_RETRY_INTERVAL_MS);
}

async function runBusinessIdentityPermissionRefresh(
  queryClient: QueryClient,
  ticket: string,
): Promise<void> {
  if (!isCurrentIdentityRefresh(ticket) || identityReadyTicket === ticket) return;
  if (identityRefreshPromise) {
    await identityRefreshPromise;
    return;
  }

  const api = getApi();
  const refresh = (async () => {
    try {
      // Identity/Get is a best-effort permission refresh, never a login-state decision.
      const response = await api.proxy.sendResponse<IdentityDto>({
        method: AUTH_FLOW_METHODS.IDENTITY_GET,
        data: JSON.stringify({ Ticket: ticket }),
        skipSign: true,
      });
      if (!isCurrentIdentityRefresh(ticket)) return;
      if (!response.Status || !response.Data?.Ticket) {
        console.warn("[ryx] identity permission preload failed", response);
        scheduleBusinessIdentityPermissionRetry(queryClient, ticket);
        return;
      }

      queryClient.setQueryData(IDENTITY_QUERY_KEY, response.Data);
      persistIdentityPermission(ticket, response.Data);
      identityReadyTicket = ticket;
      clearIdentityRetryTimer();
      await preloadSelfCredentials(queryClient, api);
    } catch (error) {
      if (!isCurrentIdentityRefresh(ticket)) return;
      console.warn("[ryx] identity permission preload failed", error);
      scheduleBusinessIdentityPermissionRetry(queryClient, ticket);
    }
  })();

  identityRefreshPromise = refresh;
  try {
    await refresh;
  } finally {
    if (identityRefreshPromise === refresh) {
      identityRefreshPromise = null;
    }
  }
}

/**
 * Warm the legacy Identity.Get and Staff.Get permissions before route pages render.
 * This keeps self-book-only pages from briefly taking the normal passenger flow.
 */
export async function preloadBusinessBookingPermission(
  queryClient: QueryClient,
  options: BookingPermissionPreloadOptions = {},
): Promise<void> {
  if (options.reset) {
    queryClient.removeQueries({ queryKey: IDENTITY_QUERY_KEY });
    queryClient.removeQueries({ queryKey: BOOKING_PERMISSION_QUERY_KEY });
    queryClient.removeQueries({ queryKey: BOOKING_PERMISSION_STAFF_QUERY_KEY });
    resetIdentityPermissionState();
  }

  await Promise.all([
    preloadBusinessStaffPermission(queryClient, { ...options, reset: false }),
    preloadBusinessIdentityPermission(queryClient, { ...options, reset: false }),
  ]);
}
