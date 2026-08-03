import { describe, expect, it } from "vitest";

import { buildAuthorizedLinkmans, parseSearchLinkmanOption, validateAuthorizedContacts } from "./flight-book-contacts";

describe("parseSearchLinkmanOption", () => {
  it("parses legacy email|mobile|accountId value", () => {
    expect(
      parseSearchLinkmanOption({
        Text: "李四",
        Value: "lisi@example.com|13900139000|acc-2",
      }),
    ).toEqual({
      accountId: "acc-2",
      name: "李四",
      email: "lisi@example.com",
      mobile: "13900139000",
      notifyLanguage: "cn",
    });
  });

  it("parses proxy |mobile|accountId value without email", () => {
    expect(
      parseSearchLinkmanOption({
        Text: "申晓杰",
        Value: "|19528280621|96200000000002",
      }),
    ).toEqual({
      accountId: "96200000000002",
      name: "申晓杰",
      mobile: "19528280621",
      notifyLanguage: "cn",
    });
  });

  it("returns null for invalid value", () => {
    expect(parseSearchLinkmanOption({ Text: "x", Value: "invalid" })).toBeNull();
  });
});

describe("validateAuthorizedContacts", () => {
  it("requires name and mobile or email", () => {
    expect(
      validateAuthorizedContacts([
        { accountId: "acc-1", name: "", mobile: "13900139000", notifyLanguage: "cn" },
      ]),
    ).toMatch(/Name不能为空/);
    expect(
      validateAuthorizedContacts([
        { accountId: "acc-1", name: "李四", notifyLanguage: "cn" },
      ]),
    ).toMatch(/Mobile不能为空/);
    expect(
      validateAuthorizedContacts([
        { accountId: "acc-1", name: "李四", email: "a@b.com", notifyLanguage: "cn" },
      ]),
    ).toBeNull();
  });
});

describe("buildAuthorizedLinkmans", () => {
  it("maps contacts to linkman dto", () => {
    expect(
      buildAuthorizedLinkmans([
        {
          accountId: "acc-2",
          name: "李四",
          mobile: "13900139000",
          email: "lisi@example.com",
          notifyLanguage: "en",
        },
      ]),
    ).toEqual([
      {
        Id: "acc-2",
        Name: "李四",
        Mobile: "13900139000",
        Email: "lisi@example.com",
        MessageLang: "en",
      },
    ]);
  });
});
