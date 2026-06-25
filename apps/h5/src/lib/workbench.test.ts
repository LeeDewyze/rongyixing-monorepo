import { describe, expect, it } from "vitest";

import {
  TRAVEL_APPLY_FLOW_URL,
  withTicketParam,
} from "./workbench";

describe("withTicketParam", () => {
  it("sets ticket query param on workflow URL", () => {
    expect(withTicketParam(TRAVEL_APPLY_FLOW_URL, "abc123")).toBe(
      "http://workflow.rtesp.com/Form/Flow?flowtag=Travel&ticket=abc123",
    );
  });

  it("replaces existing ticket", () => {
    expect(
      withTicketParam(
        "http://workflow.rtesp.com/Task/Index?ticket=old",
        "new",
      ),
    ).toBe("http://workflow.rtesp.com/Task/Index?ticket=new");
  });
});
