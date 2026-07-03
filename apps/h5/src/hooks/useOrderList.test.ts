import { OrderListTabId } from "@ryx/shared-types";
import { describe, expect, it } from "vitest";

import { orderListQueryKey } from "./useOrderList";

describe("orderListQueryKey", () => {
  it("includes channel to isolate business and personal order lists", () => {
    expect(orderListQueryKey(OrderListTabId.Train, "all", "tmc")).toEqual([
      "order",
      "list",
      OrderListTabId.Train,
      "all",
      "tmc",
    ]);
    expect(orderListQueryKey(OrderListTabId.Train, "all", "tourist")).toEqual([
      "order",
      "list",
      OrderListTabId.Train,
      "all",
      "tourist",
    ]);
  });
});
