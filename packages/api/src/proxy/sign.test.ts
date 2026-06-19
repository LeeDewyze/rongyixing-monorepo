import { describe, expect, it } from "vitest";

import { computeSign, serializeData } from "./sign.js";

describe("computeSign", () => {
  it("matches beeant md5(Data + Timestamp + Token)", () => {
    const data = JSON.stringify({ HotelId: "H1" });
    const sign = computeSign(data, 1710000000, "test-token");
    expect(sign).toMatch(/^[a-f0-9]{32}$/);
    expect(sign).toBe(computeSign(data, 1710000000, "test-token"));
  });

  it("uses empty string when data is undefined", () => {
    expect(computeSign("", 1710000000, "token")).toBe(
      computeSign(serializeData(undefined), 1710000000, "token"),
    );
  });
});

describe("serializeData", () => {
  it("stringifies objects", () => {
    expect(serializeData({ a: 1 })).toBe('{"a":1}');
  });

  it("passes through strings", () => {
    expect(serializeData('{"a":1}')).toBe('{"a":1}');
  });
});
