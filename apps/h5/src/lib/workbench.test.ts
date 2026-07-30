import { afterEach, describe, expect, it, vi } from "vitest";

import { travelApplyFlowUrl, withTicketParam } from "./workbench";

describe("withTicketParam", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("sets ticket query param on workflow URL", () => {
    vi.stubEnv("VITE_API_BASE_URL", "http://app.rtesp.com");
    expect(withTicketParam(travelApplyFlowUrl(), "abc123")).toBe(
      "http://workflow.rtesp.com/Form/Flow?flowtag=Travel&ticket=abc123",
    );
  });

  it("replaces existing ticket", () => {
    expect(withTicketParam("http://workflow.rtesp.com/Task/Index?ticket=old", "new")).toBe(
      "http://workflow.rtesp.com/Task/Index?ticket=new",
    );
  });
});
