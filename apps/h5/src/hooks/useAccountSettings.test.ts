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

import { logoutMutationFn } from "./useAccountSettings";

describe("logoutMutationFn", () => {
  beforeEach(() => {
    authLogoutMock.mockReset();
    authLogoutMock.mockResolvedValue(true);
    accountLogoutMock.mockReset();
  });

  it("calls only authProxy.logout (ApiLoginUrl-Home-Logout)", async () => {
    await logoutMutationFn();

    expect(authLogoutMock).toHaveBeenCalledTimes(1);
    expect(accountLogoutMock).not.toHaveBeenCalled();
  });
});
