import type { QueryClient } from "@tanstack/react-query";
import type { IdentityDto, StaffDto } from "@ryx/shared-types";
import { AUTH_FLOW_METHODS, TRAVEL_FLOW_METHODS } from "@ryx/api";

import { getApi } from "@/lib/api";
import { getApiMode } from "@/lib/env";
import { clearSession, getTicket } from "@/lib/session";
import { stopSessionGuard } from "@/lib/session-guard";

const FIVE_MINUTES = 5 * 60 * 1000;

export const IDENTITY_QUERY_KEY = ["identity"] as const;
export const BOOKING_PERMISSION_QUERY_KEY = ["booking-permission"] as const;
export const BOOKING_PERMISSION_STAFF_QUERY_KEY = ["booking-permission", "staff"] as const;

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
  const legacyAccount = (staff as StaffDto & { Account?: { Id?: string } } | undefined)?.Account;
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
  if (getApiMode() !== "mock" && !ticket) return;

  if (options.reset) {
    queryClient.removeQueries({ queryKey: IDENTITY_QUERY_KEY });
  }

  const silentUnauthorized = Boolean(options.silentUnauthorized);
  const api = getApi();
  if (silentUnauthorized) {
    const identityResponse = await api.proxy.sendResponse<IdentityDto>({
      method: AUTH_FLOW_METHODS.IDENTITY_GET,
      data: JSON.stringify({ Ticket: ticket ?? "" }),
      skipSign: true,
    });
    if (isUnauthorizedResponse(identityResponse)) {
      clearStartupSession(queryClient);
      return;
    }
    if (!identityResponse.Status) {
      console.warn("[ryx] identity permission preload failed", identityResponse);
      return;
    }
    queryClient.setQueryData(IDENTITY_QUERY_KEY, identityResponse.Data);
    await preloadSelfCredentials(queryClient, api);
    return;
  }

  try {
    await queryClient.fetchQuery({
      queryKey: IDENTITY_QUERY_KEY,
      queryFn: () => api.identity.get(ticket ?? undefined),
      staleTime: FIVE_MINUTES,
    });
    await preloadSelfCredentials(queryClient, api);
  } catch (error) {
    console.warn("[ryx] identity permission preload failed", error);
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
  }

  await Promise.all([
    preloadBusinessStaffPermission(queryClient, { ...options, reset: false }),
    preloadBusinessIdentityPermission(queryClient, { ...options, reset: false }),
  ]);
}
