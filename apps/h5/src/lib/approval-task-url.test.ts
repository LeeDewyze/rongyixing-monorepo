import { describe, expect, it, vi } from "vitest";

import { buildApprovalTaskOpenUrl, extractTaskTitle } from "./approval-task-url";

vi.mock("@/lib/session", () => ({
  getTicket: () => "mock-ticket",
}));

vi.mock("@/lib/request-context", () => ({
  getRequestLanguage: () => "cn",
}));

describe("buildApprovalTaskOpenUrl", () => {
  it("appends taskid, ticket, isApp and lang like Legacy", () => {
    const url = buildApprovalTaskOpenUrl({
      id: "task-1",
      name: "【机票】测试",
      handleUrl: "https://approve.example.com/handle",
    });
    expect(url).toContain("taskid=task-1");
    expect(url).toContain("ticket=mock-ticket");
    expect(url).toContain("isApp=true");
    expect(url).toContain("lang=cn");
    expect(url).toContain("opentype=iframe");
  });

  it("reads TaskUrl from legacy Variables when HandleUrl is missing", () => {
    const url = buildApprovalTaskOpenUrl({
      id: "task-2",
      name: "【酒店】测试",
      handleUrl: "https://approve.example.com/from-variables",
    });
    expect(url).toContain("taskid=task-2");
  });
});

describe("extractTaskTitle", () => {
  it("extracts text inside 【】 like Legacy header", () => {
    expect(extractTaskTitle("【机票】张三 · 北京—上海")).toBe("机票");
  });

  it("falls back to full name when brackets are missing", () => {
    expect(extractTaskTitle("出差申请 · 王五")).toBe("出差申请 · 王五");
  });
});
