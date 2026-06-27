import { describe, expect, it, vi } from "vitest";

import { createOrderApi } from "./order.js";

describe("train order mutations", () => {
  it("cancelTrain sends legacy Id-only payload", async () => {
    const send = vi.fn().mockResolvedValue(true);
    const api = createOrderApi({ send } as never);

    await api.cancelTrain({ OrderId: "20760000000204", Channel: "客户H5" });

    expect(send).toHaveBeenCalledWith({
      method: "TmcApiOrderUrl-Order-CancelTrain",
      data: { Id: "20760000000204" },
    });
  });
});
