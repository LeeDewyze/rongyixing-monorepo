import { QueryClient } from "@tanstack/react-query";
import { beforeEach, describe, expect, it, vi } from "vitest";

const logoutMock = vi.fn();
const clearSessionMock = vi.fn();
const resetApiMock = vi.fn();

vi.mock("@/lib/api", () => ({
  getApi: () => ({
    account: {
      logout: logoutMock,
    },
  }),
  resetApi: () => resetApiMock(),
}));

vi.mock("@/lib/session", () => ({
  clearSession: () => clearSessionMock(),
}));

import { accountDeletionMutationFn, applyAccountDeletionSuccess } from "./useAccountDeletion";

describe("accountDeletionMutationFn", () => {
  beforeEach(() => {
    logoutMock.mockReset();
    logoutMock.mockResolvedValue(true);
  });

  it("calls account.logout without invoking real network", async () => {
    await accountDeletionMutationFn();

    expect(logoutMock).toHaveBeenCalledTimes(1);
    expect(logoutMock).toHaveBeenCalledWith();
  });
});

describe("applyAccountDeletionSuccess", () => {
  beforeEach(() => {
    clearSessionMock.mockReset();
    resetApiMock.mockReset();
  });

  it("clears session, query cache, api client, and navigates to login", () => {
    const navigate = vi.fn();
    const queryClient = new QueryClient();
    const clearSpy = vi.spyOn(queryClient, "clear");

    applyAccountDeletionSuccess({ navigate, queryClient });

    expect(clearSessionMock).toHaveBeenCalledTimes(1);
    expect(clearSpy).toHaveBeenCalledTimes(1);
    expect(resetApiMock).toHaveBeenCalledTimes(1);
    expect(navigate).toHaveBeenCalledWith("/login/password", { replace: true });
  });
});
