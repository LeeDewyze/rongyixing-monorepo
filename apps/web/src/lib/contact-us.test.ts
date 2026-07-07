import { describe, expect, it } from "vitest";

import {
  DEFAULT_CONTACT_PHONE,
  getAppPortalBaseUrl,
  getContactUsIframeUrl,
  getLegacyAppDomain,
  getPrivacyPolicyUrl,
  getUserAgreementUrl,
  resolveContactPhone,
  resolveEnvAppBaseUrl,
} from "@/lib/contact-us";

describe("contact-us", () => {
  it("derives legacy app domain from env app base", () => {
    expect(getLegacyAppDomain({ envAppBaseUrl: "http://app.rtesp.com" })).toBe("rtesp.com");
    expect(getLegacyAppDomain({ envAppBaseUrl: "https://app.rongtrip.cn" })).toBe("rongtrip.cn");
  });

  it("builds legacy-aligned iframe and legal URLs", () => {
    const options = { envAppBaseUrl: "http://app.rtesp.com", legacyAppDomain: "rtesp.com" };
    expect(getContactUsIframeUrl(options)).toBe("http://m.rtesp.com/Home/ContactUs");
    expect(getAppPortalBaseUrl(options)).toBe("http://app.rtesp.com");
    expect(getUserAgreementUrl(options)).toBe("http://app.rtesp.com/ryxuseragreement.html");
    expect(getPrivacyPolicyUrl(options)).toBe("http://app.rtesp.com/privacy/ryx/privacy.html");
  });

  it("prefers Setting Urls when provided (H5 improvement)", () => {
    expect(
      getContactUsIframeUrl({
        envAppBaseUrl: "http://app.rtesp.com",
        mobileHomeUrl: "http://m-custom.rtesp.com",
      }),
    ).toBe("http://m-custom.rtesp.com/Home/ContactUs");
    expect(
      getAppPortalBaseUrl({
        envAppBaseUrl: "http://app.rtesp.com",
        clientAppUrl: "https://client.example.com",
      }),
    ).toBe("https://client.example.com");
  });

  it("resolves contact phone with static fallback then API", () => {
    expect(resolveContactPhone()).toBe(DEFAULT_CONTACT_PHONE);
    expect(resolveContactPhone("", "", { Telephone: "400-123-4567" })).toBe("400-123-4567");
    expect(resolveContactPhone("010-11111111", "", { Telephone: "400-123-4567" })).toBe(
      "010-11111111",
    );
    expect(resolveContactPhone("", "13800138000", { Telephone: "400-123-4567" })).toBe(
      "13800138000",
    );
    expect(resolveContactPhone("", "", null)).toBe("");
  });

  it("falls back to production app host when env is unset", () => {
    expect(resolveEnvAppBaseUrl()).toMatch(/^https?:\/\/app\./);
  });
});
