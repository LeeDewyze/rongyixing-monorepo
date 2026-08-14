import { afterEach, describe, expect, it, vi } from "vitest";

import {
  injectWorkflowEmbedBridge,
  injectWorkflowEmbedScroll,
  injectWorkflowIframeQueryShim,
  injectWorkflowPageTicket,
  isWorkflowBackMessage,
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

  it("injects window.ticket in head before other scripts", () => {
    const html = "<head><title>流程</title></head><body></body>";
    const result = injectWorkflowPageTicket(html, "ticket-abc");
    expect(result).toContain(
      '<head><script type="text/javascript">window.ticket = "ticket-abc";</script>',
    );
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

describe("injectWorkflowIframeQueryShim", () => {
  it("injects query helpers and window.ticket into head", () => {
    const html = "<head><title>流程</title></head><body></body>";
    const result = injectWorkflowIframeQueryShim(html, "ticket=abc&opentype=iframe");
    expect(result).toContain('var __wfSearch = "ticket=abc&opentype=iframe"');
    expect(result).toContain("window.ticket = __wfTicket");
  });
});

describe("injectWorkflowEmbedScroll", () => {
  it("lets the embed document grow so the parent can scroll", () => {
    const result = injectWorkflowEmbedScroll("<head></head><body></body>");
    expect(result).toContain('data-ryx-embed-scroll="true"');
    expect(result).toContain("height: auto !important");
    expect(result).toContain("overflow-x: hidden !important");
    expect(result).toContain("overflow-y: visible !important");
    expect(result).toContain(':has(> [task="tasktab"])');
    expect(result).toContain("flex-direction: row !important");
    expect(result).toContain("border-bottom: 2px solid #2768fa");
    expect(result).toContain("unlock(document.body)");
    expect(result).toContain(".taskinfo");
    expect(result).toContain("data-ryx-taskinfo-modal");
    expect(result).toContain("parent.document");
    expect(result).toContain("关闭");
    expect(result).toContain("overflow-y:auto");
    expect(result).toContain("min-height:0");
    expect(result).not.toContain("data-ryx-taskinfo-mask");
  });
});

describe("injectWorkflowEmbedBridge", () => {
  it("hooks alert for workflow task success", () => {
    const html = "<head></head><body></body>";
    const result = injectWorkflowEmbedBridge(html);
    expect(result).toContain("notifyWorkflowComplete");
    expect(result).toContain('text.indexOf("成功")');
    expect(result).toContain("showEmbedAlert");
    expect(result).toContain("data-ryx-embed-alert");
    expect(result).toContain("patchLocationReload");
    expect(result).not.toContain("window.location.reload = function");
  });
});

describe("isWorkflowBackMessage", () => {
  it("matches legacy back and appCheckGoBack payloads", () => {
    expect(isWorkflowBackMessage({ type: "back", isBack: true })).toBe(true);
    expect(isWorkflowBackMessage({ type: "appCheckGoBack", payload: true })).toBe(true);
    expect(isWorkflowBackMessage({ type: "appCheckCanBack", data: true })).toBe(true);
    expect(isWorkflowBackMessage({ type: "windowclose" })).toBe(true);
    expect(isWorkflowBackMessage({ type: "back" })).toBe(false);
    expect(isWorkflowBackMessage({ type: "appCheckGoBack" })).toBe(false);
    expect(isWorkflowBackMessage(null)).toBe(false);
  });

  it("accepts string truthy flags", () => {
    expect(isWorkflowBackMessage({ type: "back", isBack: "true" })).toBe(true);
    expect(isWorkflowBackMessage({ type: "appCheckGoBack", payload: "1" })).toBe(true);
  });
});
