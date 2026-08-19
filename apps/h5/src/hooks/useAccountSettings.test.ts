import { beforeEach, describe, expect, it, vi } from "vitest";

const authLogoutMock = vi.fn();
const accountLogoutMock = vi.fn();

vi.mock("@/lib/api", () => ({
  getApi: () => ({
    authProxy: {
      logout: authLogoutMock,
    },
    account: {
      logout: accountLogoutMock,
    },
  }),
  resetApi: vi.fn(),
}));

vi.mock("@/lib/session", () => ({
  getTicket: () => "ticket-1",
}));

vi.mock("@/lib/request-context", () => ({
  getTicketName: () => "ticket",
}));

import { logoutMutationFn } from "./useAccountSettings";

describe("logoutMutationFn", () => {
  beforeEach(() => {
    authLogoutMock.mockReset();
    authLogoutMock.mockResolvedValue(true);
    accountLogoutMock.mockReset();
  });

  it("calls only authProxy.logout (ApiLoginUrl-Home-Logout)", async () => {
    await logoutMutationFn();

    expect(authLogoutMock).toHaveBeenCalledWith({ ticket: "ticket-1", ticketName: "ticket" });
    expect(accountLogoutMock).not.toHaveBeenCalled();
  });
});
