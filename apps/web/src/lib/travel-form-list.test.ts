import { describe, expect, it, vi } from "vitest";

import {
  buildTravelFormDetailOpenUrl,
  parseTravelFormListHtml,
} from "./travel-form-list";

vi.mock("@/lib/session", () => ({
  getTicket: () => "fresh-ticket",
}));

vi.mock("@/lib/request-context", () => ({
  getRequestLanguage: () => "cn",
}));

describe("parseTravelFormListHtml", () => {
  it("uses Form/Detail Id from list HTML, not FormDetails field id", () => {
    const html = `
      <div class="mytask-task" form-data='{"Name":"出差申请","Tag":"Travel","Status":3,"FormDetails":[{"Name":"差旅单号","Content":"Travel20260610152027003","Id":23540000000031},{"Name":"出差事由","Content":"项目出差"}]}'>
        <a href="http://workflow.rtesp.com/Form/Detail?Id=23540000000004&amp;opentype=&amp;ticket=old&amp;CheckFlowType=&amp;FlowTag=">查看详情</a>
      </div>
    `;

    const tasks = parseTravelFormListHtml(html, "mock-ticket");
    expect(tasks).toHaveLength(1);
    expect(tasks[0]?.id).toBe("23540000000004");
    expect(tasks[0]?.number).toBe("Travel20260610152027003");
    expect(tasks[0]?.name).toBe("出差申请 · 项目出差");
    expect(tasks[0]?.statusName).toBe("等待报送");
    expect(tasks[0]?.url).toContain("Id=23540000000004");
  });

  it("parses mobile workflow markup that uses navlist instead of mytask-task", () => {
    const html = `
      <div class="navlist" form-data='{"Name":"出差申请","Tag":"Travel","Status":3,"FormDetails":[{"Name":"差旅单号","Content":"Travel202608061114233157173"}],"Id":24080000000517}'>
        <div class="list touch">
          <a href="https://workflow.rongtrip.cn/Form/Detail?Id=24080000000517&amp;opentype=&amp;ticket=old&amp;CheckFlowType=&amp;FlowTag=">
            详情
          </a>
        </div>
      </div>
    `;

    const tasks = parseTravelFormListHtml(html, "mock-ticket");
    expect(tasks).toHaveLength(1);
    expect(tasks[0]?.id).toBe("24080000000517");
    expect(tasks[0]?.number).toBe("Travel202608061114233157173");
  });
});

describe("buildTravelFormDetailOpenUrl", () => {
  it("rebuilds iframe detail URL with fresh ticket and legacy embed params", () => {
    const url = buildTravelFormDetailOpenUrl("23540000000004");
    expect(url).toContain("Id=23540000000004");
    expect(url).toContain("ticket=fresh-ticket");
    expect(url).toContain("opentype=iframe");
    expect(url).toContain("isApp=true");
    expect(url).toContain("lang=cn");
  });
});
