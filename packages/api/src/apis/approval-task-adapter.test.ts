import { describe, expect, it } from "vitest";

import {
  normalizeApprovalTask,
  normalizeApprovalTaskList,
  normalizeWaitingTaskCount,
} from "./approval-task-adapter.js";

describe("approval-task-adapter", () => {
  it("normalizes legacy order task rows with HandleUrl", () => {
    const task = normalizeApprovalTask({
      Id: "1",
      Name: "【机票】测试",
      HandleUrl: "https://example.com/task",
      Variables: JSON.stringify({ Foo: "bar" }),
      StatusName: "待审批",
    });
    expect(task.id).toBe("1");
    expect(task.handleUrl).toBe("https://example.com/task");
    expect(task.url).toBe("https://example.com/task");
  });

  it("unwraps Data envelope for task lists", () => {
    const tasks = normalizeApprovalTaskList({
      Data: [{ Id: "2", Name: "任务" }],
    });
    expect(tasks).toHaveLength(1);
    expect(tasks[0]?.id).toBe("2");
  });

  it("reads waiting task count", () => {
    expect(normalizeWaitingTaskCount({ DataCount: 3 })).toBe(3);
  });
});
