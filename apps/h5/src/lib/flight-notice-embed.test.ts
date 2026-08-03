import { describe, expect, it } from "vitest";

import {
  decodeNoticeHtmlResponse,
  prepareFlightNoticeSrcdoc,
} from "./flight-notice-embed";

describe("decodeNoticeHtmlResponse", () => {
  it("decodes UTF-8 payloads", () => {
    const utf8 = new TextEncoder().encode("<html><body>notice</body></html>");
    expect(decodeNoticeHtmlResponse(utf8.buffer)).toContain("notice");
  });

  it("decodes UTF-16LE BOM payloads", () => {
    const text = "<p>notice</p>";
    const bytes = new Uint8Array(2 + text.length * 2);
    bytes[0] = 0xff;
    bytes[1] = 0xfe;
    for (let i = 0; i < text.length; i += 1) {
      const code = text.charCodeAt(i);
      bytes[2 + i * 2] = code & 0xff;
      bytes[2 + i * 2 + 1] = code >> 8;
    }
    expect(decodeNoticeHtmlResponse(bytes.buffer)).toBe(text);
  });
});

describe("prepareFlightNoticeSrcdoc", () => {
  it("injects viewport, mobile styles, and base href", () => {
    const html = "<html><head><title>t</title></head><body>content</body></html>";
    const result = prepareFlightNoticeSrcdoc(
      html,
      "http://shared.rtesp.com/file/common/flightbooking_instructions.html",
    );

    expect(result).toContain('name="viewport"');
    expect(result).toContain('href="http://shared.rtesp.com/file/common/"');
    expect(result).toContain("overflow-x: hidden");
    expect(result).toContain("content");
  });
});
