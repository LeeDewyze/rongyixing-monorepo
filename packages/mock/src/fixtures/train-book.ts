import type { TrainInitBookResponse, TrainBookResponse } from "@ryx/shared-types";

export function createMockTrainInitBookResponse(): TrainInitBookResponse {
  return {
    OrderAmount: 553,
    ServiceFees: { default: 5 },
    PayTypes: {
      "1": "公司月结",
      "2": "个人支付",
    },
    IllegalReasons: ["出差事由不符", "未提前预订"],
    ExpenseTypes: [
      { Id: "1", Name: "差旅费" },
      { Id: "2", Name: "培训费" },
    ],
    Staffs: [
      {
        Id: "acc-1",
        Name: "申晓杰",
        Account: { Id: "acc-1", Mobile: "13800000001" },
        isAllowSelectApprove: false,
        Approvers: [{ Id: "ap-1", Name: "审批人A", AccountId: "acc-approver" }],
      },
      {
        Id: "acc-2",
        Name: "孙雪",
        Account: { Id: "acc-2", Mobile: "13800000002" },
        isAllowSelectApprove: false,
      },
    ],
    OutNumbers: {},
    isSkipApprove: false,
    IsShowOfficalBooked: true,
    IsShowDirectBooked: true,
    AccountNumber12306: {
      Name: "13812345678",
      IsIdentity: true,
    },
    Tmc: {
      IsShowServiceFee: true,
    },
  };
}

export function createMockTrainBookResponse(): TrainBookResponse {
  return {
    OrderId: "mock-train-order-001",
    OrderNumber: "T202506260001",
    HasTasks: false,
    IsCheckPay: false,
  };
}
