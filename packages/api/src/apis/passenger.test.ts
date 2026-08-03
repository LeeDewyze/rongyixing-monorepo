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
    const send = vi.fn().mockResolvedValue({ "p-1": [] });
    const api = createPassengerApi({ send } as never);

    await api.getCredentials({ accountId: "p-1", channel: "tourist" });

    expect(send).toHaveBeenCalledWith({
      method: "TmcTouristBookUrl-Home-Credentials",
      data: { AccountIds: "p-1" },
    });
  });

  it("normalizes tourist credentials map response", async () => {
    const send = vi.fn().mockResolvedValue({
      "p-1": [{ Id: "cred-1", Name: "张三", Number: "110101199001011234" }],
    });
    const api = createPassengerApi({ send } as never);

    await expect(api.getCredentials({ accountId: "p-1", channel: "tourist" })).resolves.toEqual([
      { Id: "cred-1", Name: "张三", Number: "110101199001011234" },
    ]);
  });
});
