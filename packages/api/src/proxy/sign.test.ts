import { describe, expect, it } from "vitest";

import { buildUnsignedFormBody, createRequestEntity, toFormFields } from "./request-entity.js";
import { computeSign, serializeData, serializeFormData } from "./sign.js";

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

describe("serializeFormData", () => {
  it("coerces plain objects like beeant unsigned proxy posts", () => {
    expect(serializeFormData({})).toBe("[object Object]");
  });
});

describe("buildUnsignedFormBody", () => {
  it("matches beeant getWebSocketUrl form encoding", () => {
    const req = createRequestEntity(
      "ApiHomeUrl-Identity-GetWebSocketUrl",
      {},
      {
        getTicket: () => "6804a2948cd2458cbf86f7d12c24dc46",
        getDomain: () => "rtesp.com",
        getLanguage: () => "cn",
        getExtraFields: () => ({ root: "rl" }),
        token: "41C21104DE0D4A0B8FE4229C822576B4",
      },
    );
    req.IsShowLoading = true;

    const body = buildUnsignedFormBody(req);

    expect(body).toContain("Method=ApiHomeUrl-Identity-GetWebSocketUrl");
    expect(body).toContain("Data=[object Object]");
    expect(body).toContain("root=rl");
    expect(body).toContain("Domain=rtesp.com");
    expect(body).toContain("Ticket=6804a2948cd2458cbf86f7d12c24dc46");
    expect(body).toContain("IsShowLoading=true");
    expect(body).toContain("x-requested-with=XMLHttpRequest");
    expect(body).not.toContain("Token=");
    expect(body).not.toContain("Sign=");
  });
});

describe("toFormFields skipSign", () => {
  it("does not emit Token when includeToken is false", () => {
    const req = createRequestEntity(
      "ApiHomeUrl-Identity-GetWebSocketUrl",
      {},
      {
        getTicket: () => "ticket-id",
        token: "41C21104DE0D4A0B8FE4229C822576B4",
      },
    );
    req.IsShowLoading = true;
    req.root = "rl";

    const fields = toFormFields(req, "", {
      includeSign: false,
      includeToken: false,
      formData: "[object Object]",
    });

    expect(fields.Data).toBe("[object Object]");
    expect(fields.Token).toBeUndefined();
    expect(fields.Sign).toBeUndefined();
    expect(fields.root).toBe("rl");
    expect(fields.IsShowLoading).toBe("true");
  });
});
