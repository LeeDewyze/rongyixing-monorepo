import { afterEach, describe, expect, it, vi } from "vitest";

import {
  injectWorkflowPageTicket,
  isWorkflowEmbedUrl,
  prepareWorkflowSrcdoc,
} from "./workflow-embed";

describe("isWorkflowEmbedUrl", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("matches workflow detail URLs of the test environment", () => {
    vi.stubEnv("VITE_API_BASE_URL", "http://app.rtesp.com");
    expect(
      isWorkflowEmbedUrl("http://workflow.rtesp.com/Form/Detail?Id=1&ticket=abc&opentype=iframe"),
    ).toBe(true);
    expect(isWorkflowEmbedUrl("https://workflow.rongtrip.cn/Form/Detail?Id=1&ticket=abc")).toBe(
      true,
    );
    expect(isWorkflowEmbedUrl("http://example.com/page")).toBe(false);
  });

  it("matches workflow detail URLs of the production environment", () => {
    vi.stubEnv("VITE_API_BASE_URL", "https://app.rongtrip.cn");
    expect(isWorkflowEmbedUrl("https://workflow.rongtrip.cn/Form/Detail?Id=1")).toBe(true);
    expect(isWorkflowEmbedUrl("http://workflow.rtesp.com/Form/Detail?Id=1&ticket=abc")).toBe(true);
  });
});

describe("injectWorkflowPageTicket", () => {
  it("injects window.ticket beside FormNumber before detail.js runs", () => {
    const html = `
      <script type="text/javascript">
        window.FormId = "23540000000006";
        window.FormNumber = "78a17b6e03994729824ca9790bf958e9";
      </script>
      <script type="text/javascript" src="/js/detail.js"></script>
    `;

    const result = injectWorkflowPageTicket(html, "27311fa3cb3f43daa216405d0a285d70");
    expect(result).toContain('window.ticket = "27311fa3cb3f43daa216405d0a285d70";');
    expect(result.indexOf("window.ticket")).toBeLessThan(result.indexOf("/js/detail.js"));
  });

  it("does not duplicate ticket when already present", () => {
    const html = 'window.ticket = "existing";';
    expect(injectWorkflowPageTicket(html, "new")).toBe(html);
  });
});

describe("prepareWorkflowSrcdoc", () => {
  it("adds base href for relative workflow assets", () => {
    const html = "<head><title>流程</title></head><body></body>";
    expect(prepareWorkflowSrcdoc(html, "http://workflow.rtesp.com")).toContain(
      '<base href="http://workflow.rtesp.com/">',
    );
  });
});
