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

  it("does not use ConsumerId as travel task number", () => {
    const task = normalizeApprovalTask({
      Id: "44880000000013",
      Name: "申晓杰向您发起了【出差申请】审批流程",
      Number: "ced7a3f33cf3400cae1f6d2186e2942b",
      ConsumerId: "23510000000033",
      Tag: "Travel",
      StatusName: "处理中",
    });
    expect(task.number).toBeUndefined();
  });

  it("uses TravelNumber for travel approval tasks", () => {
    const task = normalizeApprovalTask({
      Id: "44880000000013",
      Name: "申晓杰向您发起了【出差申请】审批流程",
      ConsumerId: "23510000000033",
      TravelNumber: "Travel202608110945131796564",
      Tag: "Travel",
      StatusName: "处理中",
    });
    expect(task.number).toBe("Travel202608110945131796564");
  });

  it("reads TravelNumber from legacy Variables for travel tasks", () => {
    const task = normalizeApprovalTask({
      Id: "44880000000013",
      Name: "申晓杰向您发起了【出差申请】审批流程",
      ConsumerId: "23510000000033",
      Variables: JSON.stringify({ TravelNumber: "Travel202608110945131796564" }),
      Tag: "Travel",
      StatusName: "处理中",
    });
    expect(task.number).toBe("Travel202608110945131796564");
  });

  it("uses OrderId for non-travel order approval tasks", () => {
    const task = normalizeApprovalTask({
      Id: "99",
      Name: "【机票】测试",
      Number: "a1b2c3d4e5f6478990abcdef12345678",
      OrderId: "44880000000099",
      Tag: "Flight",
      StatusName: "待审批",
    });
    expect(task.number).toBe("44880000000099");
  });

  it("keeps consumerId for travel form lookup", () => {
    const task = normalizeApprovalTask({
      Id: "44880000000013",
      ConsumerId: "23510000000033",
      Tag: "Travel",
      StatusName: "处理中",
    });
    expect(task.consumerId).toBe("23510000000033");
    expect(task.number).toBeUndefined();
  });
});
