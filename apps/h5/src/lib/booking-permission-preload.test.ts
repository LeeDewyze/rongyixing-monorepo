import { beforeEach, describe, expect, it, vi } from "vitest";
import { QueryClient } from "@tanstack/react-query";
import type { IdentityDto } from "@ryx/shared-types";

const mocks = vi.hoisted(() => ({
  getTicket: vi.fn<() => string | null>(),
  identityResponse: vi.fn(),
  staffCredentials: vi.fn(),
}));

vi.mock("@/lib/api", () => ({
  getApi: () => ({
    identity: { get: vi.fn() },
    proxy: { sendResponse: mocks.identityResponse },
    passenger: { getStaffCredentials: mocks.staffCredentials },
  }),
}));

vi.mock("@/lib/env", () => ({
  getApiMode: () => "proxy",
}));

vi.mock("@/lib/session", () => ({
  clearSession: vi.fn(),
  getTicket: mocks.getTicket,
}));

vi.mock("@/lib/session-guard", () => ({
  stopSessionGuard: vi.fn(),
}));

import {
  IDENTITY_QUERY_KEY,
  preloadBusinessStaffPermission,
  preloadBusinessIdentityPermission,
  restoreBusinessIdentityPermission,
} from "./booking-permission-preload";

function createMemoryStorage() {
  const values = new Map<string, string>();
  return {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => values.set(key, value),
    removeItem: (key: string) => values.delete(key),
  };
}

const identity: IdentityDto = {
  Ticket: "identity-ticket",
  Id: "identity-user",
  Name: "测试用户",
};

describe("booking identity permission preload", () => {
  beforeEach(() => {
    mocks.getTicket.mockReset();
    mocks.identityResponse.mockReset();
    mocks.staffCredentials.mockReset();
    mocks.staffCredentials.mockResolvedValue([]);
    vi.stubGlobal("sessionStorage", createMemoryStorage());
  });

  it("restores the ticket-matched identity snapshot", () => {
    mocks.getTicket.mockReturnValue("restore-ticket");
    sessionStorage.setItem(
      "ryx_identity_permission",
      JSON.stringify({ ticket: "restore-ticket", data: identity }),
    );
    const queryClient = new QueryClient();

    expect(restoreBusinessIdentityPermission(queryClient)).toBe(true);
    expect(queryClient.getQueryData(IDENTITY_QUERY_KEY)).toEqual(identity);
  });

  it("refreshes a ticket only once during one app entry", async () => {
    mocks.getTicket.mockReturnValue("single-refresh-ticket");
    mocks.identityResponse.mockResolvedValue({ Status: true, Data: identity });
    const queryClient = new QueryClient();

    await preloadBusinessIdentityPermission(queryClient);
    await preloadBusinessIdentityPermission(queryClient);

    expect(mocks.identityResponse).toHaveBeenCalledTimes(1);
    expect(queryClient.getQueryData(IDENTITY_QUERY_KEY)).toEqual(identity);
    expect(JSON.parse(sessionStorage.getItem("ryx_identity_permission") ?? "null")).toEqual({
      ticket: "single-refresh-ticket",
      data: identity,
    });
  });

  it("retries a failed Identity/Get after ten seconds", async () => {
    vi.useFakeTimers();
    try {
      mocks.getTicket.mockReturnValue("retry-ticket");
      mocks.identityResponse
        .mockResolvedValueOnce({ Status: false, Code: "Failure", Message: "暂时失败" })
        .mockResolvedValueOnce({ Status: true, Data: identity });
      const queryClient = new QueryClient();

      await preloadBusinessIdentityPermission(queryClient);
      expect(mocks.identityResponse).toHaveBeenCalledTimes(1);

      await vi.advanceTimersByTimeAsync(10_000);

      expect(mocks.identityResponse).toHaveBeenCalledTimes(2);
      expect(queryClient.getQueryData(IDENTITY_QUERY_KEY)).toEqual(identity);
    } finally {
      vi.useRealTimers();
    }
  });

  it("restores Staff/Get from the ticket-matched 60-minute cache", async () => {
    mocks.getTicket.mockReturnValue("staff-cache-ticket");
    sessionStorage.setItem(
      "ryx_staff_permission",
      JSON.stringify({
        ticket: "staff-cache-ticket",
        savedAt: Date.now(),
        data: { AccountId: "account-1", BookType: "Self", Name: "测试用户" },
      }),
    );
    const queryClient = new QueryClient();

    await preloadBusinessStaffPermission(queryClient, { preloadCredentials: false });

    expect(mocks.identityResponse).not.toHaveBeenCalled();
  });

  it("retries a failed Staff/Get after ten seconds without clearing the session", async () => {
    vi.useFakeTimers();
    try {
      mocks.getTicket.mockReturnValue("staff-retry-ticket");
      mocks.identityResponse
        .mockResolvedValueOnce({ Status: false, Code: "NOLOGIN", Message: "登陆超时" })
        .mockResolvedValueOnce({
          Status: true,
          Data: { AccountId: "account-1", BookType: "Self", Name: "测试用户" },
        });
      const queryClient = new QueryClient();

      await preloadBusinessStaffPermission(queryClient, { preloadCredentials: false });
      expect(mocks.identityResponse).toHaveBeenCalledTimes(1);

      await vi.advanceTimersByTimeAsync(10_000);

      expect(mocks.identityResponse).toHaveBeenCalledTimes(2);
      expect(queryClient.getQueryData(["booking-permission", "staff", "staff-retry-ticket"])).toEqual(
        { AccountId: "account-1", BookType: "Self", Name: "测试用户" },
      );
    } finally {
      vi.useRealTimers();
    }
  });
});
