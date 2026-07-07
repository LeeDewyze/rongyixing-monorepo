import { describe, expect, it } from "vitest";

import {
  TRAIN_APPROVAL_APPROVER,
  TRAIN_APPROVAL_EXCEED_APPROVER,
  TRAIN_APPROVAL_EXCEED_FREE,
  TRAIN_APPROVAL_FREE,
  TRAIN_APPROVAL_NONE,
  resolveTrainPassengerApprovalId,
  shouldAllowSelectTrainApprover,
  shouldShowTrainApproveNode,
  shouldShowTrainSkipApprove,
} from "@/lib/train-book-approval";

const staffWithApprover = {
  Approvers: [{ Name: "王审批", Type: 1, Tag: "1", AccountId: "ap-1" }],
};

describe("shouldShowTrainApproveNode", () => {
  it("matches legacy isShowApprove for fixed approver mode", () => {
    expect(
      shouldShowTrainApproveNode({ Tmc: { TrainApprovalType: TRAIN_APPROVAL_APPROVER } }),
    ).toBe(true);
    expect(
      shouldShowTrainApproveNode(
        { Tmc: { TrainApprovalType: TRAIN_APPROVAL_EXCEED_APPROVER } },
        { Rules: ["超标"] },
      ),
    ).toBe(true);
    expect(shouldShowTrainApproveNode({ Tmc: { TrainApprovalType: TRAIN_APPROVAL_FREE } })).toBe(
      false,
    );
    expect(shouldShowTrainApproveNode({ Tmc: { TrainApprovalType: TRAIN_APPROVAL_NONE } })).toBe(
      false,
    );
  });
});

describe("shouldAllowSelectTrainApprover", () => {
  it("blocks manual picker when staff has fixed approvers", () => {
    expect(
      shouldAllowSelectTrainApprover({
        init: { Tmc: { TrainApprovalType: TRAIN_APPROVAL_APPROVER } },
        staff: staffWithApprover,
      }),
    ).toBe(false);
  });

  it("allows manual picker when staff has no approvers in fixed mode", () => {
    expect(
      shouldAllowSelectTrainApprover({
        init: { Tmc: { TrainApprovalType: TRAIN_APPROVAL_APPROVER } },
        staff: { Approvers: [] },
      }),
    ).toBe(true);
  });

  it("allows free approval when staff exists", () => {
    expect(
      shouldAllowSelectTrainApprover({
        init: { Tmc: { TrainApprovalType: TRAIN_APPROVAL_FREE } },
        staff: staffWithApprover,
      }),
    ).toBe(true);
  });

  it("blocks exchange book approver picker", () => {
    expect(
      shouldAllowSelectTrainApprover({
        init: { Tmc: { TrainApprovalType: TRAIN_APPROVAL_FREE } },
        staff: staffWithApprover,
        isExchangeBook: true,
      }),
    ).toBe(false);
  });

  it("blocks exceed-policy picker for non-whitelist guests", () => {
    expect(
      shouldAllowSelectTrainApprover({
        init: { Tmc: { TrainApprovalType: TRAIN_APPROVAL_EXCEED_FREE } },
        policy: { Rules: ["超标"] },
        staff: staffWithApprover,
        passenger: { id: "guest", isNotWhitelist: true } as never,
      }),
    ).toBe(false);
  });

  it("allows exceed-policy free picker for whitelist passenger with rules", () => {
    expect(
      shouldAllowSelectTrainApprover({
        init: { Tmc: { TrainApprovalType: TRAIN_APPROVAL_EXCEED_FREE } },
        policy: { Rules: ["超标"] },
        staff: staffWithApprover,
        passenger: { id: "emp", isNotWhitelist: false } as never,
      }),
    ).toBe(true);
  });
});

describe("shouldShowTrainSkipApprove", () => {
  it("shows skip checkbox only when init allows and approval UI is visible", () => {
    expect(
      shouldShowTrainSkipApprove({
        init: { isSkipApprove: true, Tmc: { TrainApprovalType: TRAIN_APPROVAL_APPROVER } },
        staff: staffWithApprover,
      }),
    ).toBe(true);

    expect(
      shouldShowTrainSkipApprove({
        init: { isSkipApprove: false, Tmc: { TrainApprovalType: TRAIN_APPROVAL_FREE } },
        staff: staffWithApprover,
      }),
    ).toBe(false);
  });
});

describe("resolveTrainPassengerApprovalId", () => {
  it("uses selected id for manual picker", () => {
    expect(
      resolveTrainPassengerApprovalId({
        showPicker: true,
        form: { approvalId: "ap-1" } as never,
      }),
    ).toBe("ap-1");
  });

  it("falls back to zero when fixed approver chain is used", () => {
    expect(
      resolveTrainPassengerApprovalId({
        showPicker: false,
        form: { approvalId: "ap-1" } as never,
      }),
    ).toBe("0");
  });
});
