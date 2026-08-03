import { describe, expect, it } from "vitest";

import { injectLegalDocumentInterceptors, toFetchableLegalDocumentUrl } from "./legal-document.js";

describe("toFetchableLegalDocumentUrl", () => {
  it("keeps same-origin URLs unchanged", () => {
    expect(
      toFetchableLegalDocumentUrl("https://app.example.com/privacy/ryx/privacy.html", {
        pageOrigin: "https://app.example.com",
      }),
    ).toBe("https://app.example.com/privacy/ryx/privacy.html");
  });

  it("rewrites cross-origin URLs through the dev proxy", () => {
    expect(
      toFetchableLegalDocumentUrl("https://app.rongtrip.cn/privacy/ryx/privacy.html", {
        pageOrigin: "http://localhost:5173",
        useDevProxy: true,
      }),
    ).toBe("/legal-doc/privacy/ryx/privacy.html");
  });
});

describe("injectLegalDocumentInterceptors", () => {
  it("injects base href and external-link click handler", () => {
    const html =
      '<html><head></head><body><a href="https://www.aboutcookies.org/">Cookies</a></body></html>';
    const prepared = injectLegalDocumentInterceptors(
      html,
      "https://app.rongtrip.cn/privacy/ryx/privacy.html",
    );

    expect(prepared).toContain('<base href="https://app.rongtrip.cn/privacy/ryx/privacy.html">');
    expect(prepared).toContain('var docOrigin = "https://app.rongtrip.cn"');
    expect(prepared).toContain('window.open(el.href, "_blank", "noopener,noreferrer")');
  });
});
