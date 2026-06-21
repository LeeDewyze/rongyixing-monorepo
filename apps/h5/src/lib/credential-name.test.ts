// @vitest-environment node
import { describe, expect, it } from "vitest";

import {
  CREDENTIAL_NAME_MAX_UNITS,
  credentialNameTotalUnits,
  normalizeCredentialName,
} from "./credential-name";

describe("normalizeCredentialName", () => {
  it("strips spaces and middle dots per rule 4/6", () => {
    expect(normalizeCredentialName("买买提·张三")).toBe("买买提张三");
    expect(normalizeCredentialName("张 三")).toBe("张三");
  });

  it("truncates to 30 units with Han=2", () => {
    const han15 = "张".repeat(15);
    expect(credentialNameTotalUnits(han15)).toBe(30);
    expect(normalizeCredentialName(han15)).toBe(han15);

    const han16 = "张".repeat(16);
    expect(normalizeCredentialName(han16)).toBe(han15);
    expect(credentialNameTotalUnits(normalizeCredentialName(han16))).toBe(
      CREDENTIAL_NAME_MAX_UNITS,
    );
  });

  it("counts English as 1 unit each", () => {
    const english30 = "A".repeat(30);
    expect(normalizeCredentialName(english30)).toBe(english30);
    expect(normalizeCredentialName("A".repeat(31))).toBe(english30);
  });
});
