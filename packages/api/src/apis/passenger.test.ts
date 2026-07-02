import { describe, expect, it, vi } from "vitest";

import { createPassengerApi } from "./passenger.js";

describe("createPassengerApi", () => {
  it("uses TMC credentials by default", async () => {
    const send = vi.fn().mockResolvedValue([]);
    const api = createPassengerApi({ send } as never);

    await api.getCredentials("acc-1");

    expect(send).toHaveBeenCalledWith({
      method: "TmcApiHomeUrl-Credentials-List",
      data: { accountId: "acc-1" },
    });
  });

  it("uses tourist book credentials when channel is tourist", async () => {
    const send = vi.fn().mockResolvedValue({ Credentials: [] });
    const api = createPassengerApi({ send } as never);

    await api.getCredentials({ accountId: "p-1", channel: "tourist" });

    expect(send).toHaveBeenCalledWith({
      method: "TmcTouristBookUrl-Home-Credentials",
      data: { accountId: "p-1" },
    });
  });
});
