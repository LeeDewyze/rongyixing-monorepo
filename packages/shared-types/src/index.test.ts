import { describe, expect, it } from "vitest";
import type { ApiResponse } from "./index.js";

describe("shared-types", () => {
  it("defines ApiResponse shape", () => {
    const response: ApiResponse<{ id: string }> = {
      data: { id: "1" },
      success: true,
    };
    expect(response.success).toBe(true);
  });
});
