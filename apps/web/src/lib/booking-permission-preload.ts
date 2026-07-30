import type { QueryClient } from "@tanstack/react-query";
import type { StaffDto } from "@ryx/shared-types";

import { getApi } from "@/lib/api";
import { getApiMode } from "@/lib/env";
import { getTicket } from "@/lib/session";

const FIVE_MINUTES = 5 * 60 * 1000;

export const IDENTITY_QUERY_KEY = ["identity"] as const;
export const BOOKING_PERMISSION_QUERY_KEY = ["booking-permission"] as const;
export const BOOKING_PERMISSION_STAFF_QUERY_KEY = ["booking-permission", "staff"] as const;

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

/**
 * Warm the legacy Staff.Get booking permission before route pages render.
 * This keeps self-book-only pages from briefly taking the normal passenger flow.
 */
export async function preloadBusinessBookingPermission(
  queryClient: QueryClient,
  options: { reset?: boolean } = {},
): Promise<void> {
  const ticket = getTicket();
  if (getApiMode() !== "mock" && !ticket) return;

  if (options.reset) {
    queryClient.removeQueries({ queryKey: IDENTITY_QUERY_KEY });
    queryClient.removeQueries({ queryKey: BOOKING_PERMISSION_QUERY_KEY });
  }

  const api = getApi();
  const [identityResult, staffResult] = await Promise.allSettled([
    queryClient.fetchQuery({
      queryKey: IDENTITY_QUERY_KEY,
      queryFn: () => api.identity.get(ticket ?? undefined),
      staleTime: FIVE_MINUTES,
    }),
    queryClient.fetchQuery({
      queryKey: BOOKING_PERMISSION_STAFF_QUERY_KEY,
      queryFn: () => api.travel.getStaff(),
      staleTime: FIVE_MINUTES,
    }),
  ]);

  if (identityResult.status === "rejected" || staffResult.status === "rejected") {
    console.warn("[ryx] booking permission preload failed", {
      identity: identityResult.status === "rejected" ? identityResult.reason : undefined,
      staff: staffResult.status === "rejected" ? staffResult.reason : undefined,
    });
  }

  if (staffResult.status !== "fulfilled") return;

  const identity = identityResult.status === "fulfilled" ? identityResult.value : undefined;
  const staff = staffResult.value;
  const accountId = staffAccountId(staff, identity);
  if (!isSelfBookTypeValue(staff.BookType) || !accountId) return;

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
