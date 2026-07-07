import { describe, expect, it } from "vitest";
import type { PassengerBookInfo, PassengerCredential } from "@ryx/shared-types";

import { credentialsMatch, isSelected } from "./passenger-select-logic";

const selectedCredential: PassengerCredential = {
  Id: "staff-1",
  Name: "申晓杰",
  Number: "410928199001015121",
  HideNumber: "410928********5121",
  Type: 1,
};

const listCredential: PassengerCredential = {
  Id: "staff-1",
  Name: "申晓杰",
  HideNumber: "410928********5121",
  Type: 1,
};

describe("credentialsMatch", () => {
  it("matches by credential id when list row hides full number", () => {
    expect(credentialsMatch(selectedCredential, listCredential)).toBe(true);
  });

  it("matches by masked number when ids differ but hide numbers align", () => {
    expect(
      credentialsMatch({ ...selectedCredential, Id: "a" }, { ...listCredential, Id: "b" }),
    ).toBe(true);
  });

  it("does not match different passengers", () => {
    expect(
      credentialsMatch(listCredential, {
        Id: "staff-2",
        Name: "Other",
        HideNumber: "110101********1234",
        Type: 1,
      }),
    ).toBe(false);
  });

  it("matches when persisted credential lost its type but number aligns", () => {
    expect(
      credentialsMatch(
        {
          Id: "",
          Name: "申晓杰",
          Number: "410928199001015121",
        },
        {
          Id: "staff-1",
          Name: "申晓杰",
          HideNumber: "410928********5121",
          Type: 1,
          CredentialsTypeName: "身份证",
        },
      ),
    ).toBe(true);
  });

  it("does not conflate one person's id card and passport by account", () => {
    expect(
      credentialsMatch(
        {
          Id: "idcard-1",
          AccountId: "acc-1",
          Name: "申晓杰",
          Number: "410928199001015121",
          Type: 1,
        },
        {
          Id: "passport-1",
          AccountId: "acc-1",
          Name: "申晓杰",
          Number: "EB6812394",
          Type: 2,
        },
      ),
    ).toBe(false);
  });

  it("matches full and masked identity numbers when ids differ", () => {
    expect(
      credentialsMatch(
        {
          Id: "cred-a",
          Name: "申晓杰",
          Number: "410928199001015121",
          Type: 1,
        },
        {
          Id: "cred-b",
          Name: "申晓杰",
          HideNumber: "410928********5121",
          Type: 1,
        },
      ),
    ).toBe(true);
  });
});

describe("isSelected", () => {
  it("marks list credential selected when persisted entry has full number", () => {
    const selected: PassengerBookInfo[] = [
      {
        id: "staff-1",
        passenger: { Id: "staff-1", Name: "申晓杰" },
        credential: selectedCredential,
      },
    ];

    expect(isSelected(selected, listCredential)).toBe(true);
  });
});
