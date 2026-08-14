import { afterEach, describe, expect, it, vi } from "vitest";

import { getApiRoot, getRequestExtraFields } from "./request-context";

describe("request root", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it("prefers the business build root over a stale URL root", () => {
    vi.stubEnv("VITE_API_ROOT", "www");
    vi.stubGlobal("location", { search: "?root=rl&ticket=t" });
    vi.stubGlobal("localStorage", { getItem: () => null });

    expect(getApiRoot()).toBe("www");
    expect(getRequestExtraFields()).toMatchObject({ root: "www" });
    expect(getRequestExtraFields()).not.toHaveProperty("ticket");
  });

  it("uses the URL root when no build root is configured", () => {
    vi.stubEnv("VITE_API_ROOT", "");
    vi.stubGlobal("location", { search: "?root=www" });
    vi.stubGlobal("localStorage", { getItem: () => null });

    expect(getApiRoot()).toBe("www");
    expect(getRequestExtraFields()).toMatchObject({ root: "www" });
  });
});
