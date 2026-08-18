import { describe, expect, it } from "vitest";

import { readResourceCache, writeResourceCache } from "./resource-cache.js";

function createStorage() {
  const values = new Map<string, string>();
  return {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => values.set(key, value),
  };
}

describe("resource cache", () => {
  it("round-trips resource data and its update time", () => {
    const storage = createStorage();
    writeResourceCache("resource", ["value"], storage, 123);

    expect(readResourceCache<string[]>("resource", storage)).toEqual({
      data: ["value"],
      updatedAt: 123,
    });
  });

  it("ignores malformed records", () => {
    const storage = createStorage();
    storage.setItem("resource", JSON.stringify({ data: [] }));

    expect(readResourceCache("resource", storage)).toBeNull();
  });
});
