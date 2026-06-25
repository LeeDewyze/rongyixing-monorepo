import { describe, expect, it } from "vitest";

import {
  injectWorkflowPageTicket,
  isWorkflowEmbedUrl,
  prepareWorkflowSrcdoc,
} from "./workflow-embed";

describe("isWorkflowEmbedUrl", () => {
  it("matches workflow.rtesp.com detail URLs", () => {
    expect(
      isWorkflowEmbedUrl(
        "http://workflow.rtesp.com/Form/Detail?Id=1&ticket=abc&opentype=iframe",
      ),
    ).toBe(true);
    expect(isWorkflowEmbedUrl("http://example.com/page")).toBe(false);
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
