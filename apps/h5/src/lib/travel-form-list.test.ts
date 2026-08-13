import { describe, expect, it, vi } from "vitest";

import {
  buildTravelFormDetailOpenUrl,
  fetchTravelNumberByApprovalTask,
  fetchTravelNumberByFormId,
  parseFormIdFromWorkflowHtml,
  parseTravelFormListHtml,
  parseTravelFormStatusFromDetailHtml,
  parseTravelNumberFromWorkflowHtml,
} from "./travel-form-list";

vi.mock("@/lib/session", () => ({
  getTicket: () => "fresh-ticket",
}));

vi.mock("@/lib/request-context", () => ({
  getRequestLanguage: () => "cn",
}));

vi.mock("@/lib/workflow-embed", () => ({
  isWorkflowEmbedUrl: () => true,
  fetchWorkflowEmbedSrcdoc: vi.fn(),
}));

import { fetchWorkflowEmbedSrcdoc } from "@/lib/workflow-embed";

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

  it("ignores internal workflow Number when 差旅单号 is missing", () => {
    const html = `
      <div class="mytask-task" form-data='{"Name":"出差申请","Tag":"Travel","Status":3,"Number":"d857e32007e74aa0b458cc9bed3f17b3","FormDetails":[{"Name":"出差事由","Content":"项目出差"}]}'>
        <a href="http://workflow.rtesp.com/Form/Detail?Id=23540000000004&amp;opentype=&amp;ticket=old&amp;CheckFlowType=&amp;FlowTag=">查看详情</a>
      </div>
    `;

    const tasks = parseTravelFormListHtml(html, "mock-ticket");
    expect(tasks[0]?.number).toBeUndefined();
  });

  it("ignores numeric form entity id when 差旅单号 is missing", () => {
    const html = `
      <div class="mytask-task" form-data='{"Name":"出差申请","Tag":"Travel","Status":3,"Number":"24080000000532","FormDetails":[{"Name":"出差事由","Content":"项目出差"}]}'>
        <a href="http://workflow.rtesp.com/Form/Detail?Id=24080000000532&amp;opentype=&amp;ticket=old&amp;CheckFlowType=&amp;FlowTag=">查看详情</a>
      </div>
    `;

    const tasks = parseTravelFormListHtml(html, "mock-ticket");
    expect(tasks[0]?.number).toBeUndefined();
  });

  it("reads travel number from FormDetails Tag TravelNumber", () => {
    const html = `
      <div class="mytask-task" form-data='{"Name":"出差申请","Tag":"Travel","Status":3,"FormDetails":[{"Tag":"TravelNumber","Number":"Travel202608110945131796564"}]}'>
        <a href="http://workflow.rtesp.com/Form/Detail?Id=24080000000532&amp;opentype=&amp;ticket=old&amp;CheckFlowType=&amp;FlowTag=">查看详情</a>
      </div>
    `;

    const tasks = parseTravelFormListHtml(html, "mock-ticket");
    expect(tasks[0]?.number).toBe("Travel202608110945131796564");
  });

  it("parses travel form status from Form/Detail basic info block", () => {
    const html = `
      <span class="formDetail-title">基础信息</span>
      <div class="element-tip">状态</div>
      <div class="element-content">审批通过</div>
      <span class="formDetail-title">TravelDetail1</span>
    `;

    expect(parseTravelFormStatusFromDetailHtml(html)).toBe("审批通过");
  });

  it("parses travel form status when element-tip has ctrlType attributes", () => {
    const html = `
      <span class="formDetail-title">基础信息</span>
      <div class="element-tip" ctrlType="_base_status">状态</div>
      <div class="element-content">&#x5BA1;&#x6279;&#x901A;&#x8FC7;</div>
    `;

    expect(parseTravelFormStatusFromDetailHtml(html)).toBe("审批通过");
  });

  it("parses travel form status from detailCtrlType on element-content", () => {
    const html = `
      <span class="formDetail-title">基础信息</span>
      <div class="element-tip">状态</div>
      <div class="element-content" detailCtrlType="_base_status">&#x5BA1;&#x6279;&#x901A;&#x8FC7;</div>
    `;

    expect(parseTravelFormStatusFromDetailHtml(html)).toBe("审批通过");
  });

  it("parses travel number from Form/Detail html form-data", () => {
    const html = `
      <div form-data='{"Name":"出差申请","Tag":"Travel","Status":4,"FormDetails":[{"Name":"差旅单号","Content":"Travel202608110945131796564"}]}'>
        <a href="http://workflow.rtesp.com/Form/Detail?Id=24080000000532&amp;ticket=old">详情</a>
      </div>
    `;

    expect(parseTravelNumberFromWorkflowHtml(html, "24080000000532")).toBe(
      "Travel202608110945131796564",
    );
  });

  it("loads travel number from approval task embed html", async () => {
    vi.mocked(fetchWorkflowEmbedSrcdoc).mockResolvedValue(`
      <div form-data='{"Name":"出差申请","Tag":"Travel","FormDetails":[{"Name":"差旅单号","Content":"Travel202608110945131796564"}]}'></div>
    `);

    const number = await fetchTravelNumberByApprovalTask({
      id: "44880000000013",
      name: "孙雪向您发起了【出差申请】审批流程",
      tag: "Travel",
      handleUrl: "http://workflow.rtesp.com/FormTask/Handle?flowtag=Travel",
    });

    expect(number).toBe("Travel202608110945131796564");
  });

  it("loads travel number via FormId from handle page when form-data is missing", async () => {
    vi.mocked(fetchWorkflowEmbedSrcdoc).mockResolvedValue(`
      <script>window.FormId = "24080000000532";</script>
    `);

    const fetchMock = vi.spyOn(globalThis, "fetch").mockImplementation(async (input) => {
      const url = String(input);
      if (url.includes("/Form/Detail?")) {
        return new Response(
          `<div form-data='{"FormDetails":[{"Name":"差旅单号","Content":"Travel202608110945131796564"}]}'></div>`,
          { status: 200 },
        );
      }
      return new Response("{}", { status: 404 });
    });

    const number = await fetchTravelNumberByApprovalTask({
      id: "44880000000013",
      name: "孙雪向您发起了【出差申请】审批流程",
      tag: "Travel",
      handleUrl: "http://workflow.rtesp.com/FormTask/Handle?flowtag=Travel",
    });

    fetchMock.mockRestore();
    expect(number).toBe("Travel202608110945131796564");
  });

  it("parses FormId from workflow bootstrap script", () => {
    expect(parseFormIdFromWorkflowHtml('window.FormId = "24080000000532";')).toBe("24080000000532");
  });

  it("parses travel number from FormTask/Handle where labels are html entities", () => {
    const html = `
      <div class="element">
        <div class="element-tip">&#x5DEE;&#x65C5;&#x5355;&#x53F7;</div>
        <div class="element-content" detailCtrlTag="TravelNumber" detailCtrlName="&#x5DEE;&#x65C5;&#x5355;&#x53F7;">
Travel202608121111523157173                                </div>
      </div>
    `;

    expect(parseTravelNumberFromWorkflowHtml(html)).toBe("Travel202608121111523157173");
  });

  it("returns undefined for a handle page without form detail content", () => {
    const html = `<html><body><div class="element">no form rendered</div></body></html>`;
    expect(parseTravelNumberFromWorkflowHtml(html)).toBeUndefined();
  });

  it("loads distinct travel numbers per form id from Form/Detail", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockImplementation(async (input) => {
      const url = String(input);
      if (url.includes("Id=24080000000531")) {
        return new Response(
          `<div form-data='{"FormDetails":[{"Name":"差旅单号","Content":"Travel202608121111523157173"}]}'></div>`,
          { status: 200 },
        );
      }
      if (url.includes("Id=24080000000532")) {
        return new Response(
          `<div form-data='{"FormDetails":[{"Name":"差旅单号","Content":"Travel202608121201131796564"}]}'></div>`,
          { status: 200 },
        );
      }
      return new Response("{}", { status: 404 });
    });

    const first = await fetchTravelNumberByFormId("ticket", "24080000000531");
    const second = await fetchTravelNumberByFormId("ticket", "24080000000532");
    fetchMock.mockRestore();

    expect(first).toBe("Travel202608121111523157173");
    expect(second).toBe("Travel202608121201131796564");
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
