// @vitest-environment node
import { describe, expect, it } from "vitest";

import { CredentialType } from "@ryx/shared-types";

import {
  credentialFormWithFixedName,
  credentialNameMatches,
  emptyCredentialForm,
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
