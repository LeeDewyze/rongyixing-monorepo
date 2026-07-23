// @vitest-environment node
import { describe, expect, it } from "vitest";

import { CredentialType } from "@ryx/shared-types";

import {
  credentialFormFromCredential,
  credentialFormWithFixedName,
  credentialNameMatches,
  emptyCredentialForm,
  normalizeCredentialDate,
  toExternalPassengerApiPayload,
  validateCredentialForm,
} from "./credential-form";

describe("credential form self mode", () => {
  it("locks name to real name", () => {
    const form = emptyCredentialForm();
    const fixed = credentialFormWithFixedName(form, "姜建康");

    expect(fixed.Name).toBe("姜建康");
    expect(credentialNameMatches(fixed, "姜建康")).toBe(true);
    expect(credentialNameMatches({ ...fixed, Name: "张三" }, "姜建康")).toBe(false);
  });

  it("still validates id card rules", () => {
    const form = credentialFormWithFixedName(
      {
        ...emptyCredentialForm(),
        Type: CredentialType.IdCard,
        Number: "412721198511291052",
      },
      "姜建康",
    );

    expect(validateCredentialForm(form, "self")).toBeNull();
  });
});

describe("credential date normalization", () => {
  it("strips time from ISO datetime strings", () => {
    expect(normalizeCredentialDate("1970-01-01T00:00:00")).toBe("1970-01-01");
    expect(normalizeCredentialDate("2023-06-27T00:00:00")).toBe("2023-06-27");
  });

  it("keeps YYYY-MM-DD values unchanged", () => {
    expect(normalizeCredentialDate("2023-06-27")).toBe("2023-06-27");
  });

  it("normalizes dates when building edit form values", () => {
    const form = credentialFormFromCredential({
      Id: "1",
      Birthday: "1970-01-01T00:00:00",
      ExpirationDate: "2023-06-27T00:00:00",
    });

    expect(form.Birthday).toBe("1970-01-01");
    expect(form.ExpirationDate).toBe("2023-06-27");
  });

  it("submits legacy date-only payload fields", () => {
    const payload = toExternalPassengerApiPayload(
      {
        ...emptyCredentialForm(),
        Type: CredentialType.Passport,
        Name: "Test User",
        Number: "E12345678",
        Mobile: "13800138000",
        Birthday: "1970-01-01T00:00:00",
        ExpirationDate: "2023-06-27T00:00:00",
      },
      true,
    );

    expect(payload.Birthday).toBe("1970-01-01");
    expect(payload.ExpirationDate).toBe("2023-06-27");
  });
});
