import { describe, expect, it } from "vitest";

import {
  FLIGHT_APPROVAL_APPROVER,
  FLIGHT_APPROVAL_EXCEED_APPROVER,
  FLIGHT_APPROVAL_EXCEED_FREE,
  FLIGHT_APPROVAL_FREE,
  FLIGHT_APPROVAL_NONE,
  shouldAllowSelectApprover,
  shouldShowApproveNode,
  shouldShowTravelSection,
} from "@/lib/flight-book-approval";

const staffWithApprover = {
  Approvers: [{ Name: "王审批", Type: 1, Tag: "1" }],
};

describe("shouldShowTravelSection", () => {
  it("shows when expense types exist", () => {
    expect(
      shouldShowTravelSection({
        expenseTypes: [{ Id: "1", Name: "机票" }],
        outNumberFieldCount: 0,
      }),
    ).toBe(true);
  });

  it("shows when policy rules exist for whitelist passenger", () => {
    expect(
      shouldShowTravelSection({
        policy: { Rules: ["超出差标"] },
        passenger: { id: "p1", isNotWhitelist: false } as never,
        outNumberFieldCount: 0,
      }),
    ).toBe(true);
  });

  it("hides policy-only section for non-whitelist guest", () => {
    expect(
      shouldShowTravelSection({
        policy: { Rules: ["超出差标"] },
        passenger: { id: "p1", isNotWhitelist: true } as never,
        outNumberFieldCount: 0,
      }),
    ).toBe(false);
  });

  it("shows when outnumber fields exist even without title triggers", () => {
    expect(
      shouldShowTravelSection({
        outNumberFieldCount: 1,
      }),
    ).toBe(true);
  });

  it("shows fixed approver node when approval type is Approver", () => {
    expect(
      shouldShowTravelSection({
        init: { Tmc: { FlightApprovalType: FLIGHT_APPROVAL_APPROVER } },
        staff: staffWithApprover,
        outNumberFieldCount: 0,
      }),
    ).toBe(true);
  });
});

describe("shouldShowApproveNode", () => {
  it("matches legacy isShowApprove for fixed approver mode", () => {
    expect(shouldShowApproveNode({ Tmc: { FlightApprovalType: FLIGHT_APPROVAL_APPROVER } })).toBe(
      true,
    );
    expect(
      shouldShowApproveNode(
        { Tmc: { FlightApprovalType: FLIGHT_APPROVAL_EXCEED_APPROVER } },
        { Rules: ["超标"] },
      ),
    ).toBe(true);
    expect(shouldShowApproveNode({ Tmc: { FlightApprovalType: FLIGHT_APPROVAL_FREE } })).toBe(
      false,
    );
    expect(shouldShowApproveNode({ Tmc: { FlightApprovalType: FLIGHT_APPROVAL_NONE } })).toBe(
      false,
    );
  });
});

describe("shouldAllowSelectApprover", () => {
  it("allows free approval when staff exists", () => {
    expect(
      shouldAllowSelectApprover({
        init: { Tmc: { FlightApprovalType: FLIGHT_APPROVAL_FREE } },
        staff: staffWithApprover,
      }),
    ).toBe(true);
  });

  it("blocks exceed-policy picker for non-whitelist guests", () => {
    expect(
      shouldAllowSelectApprover({
        init: { Tmc: { FlightApprovalType: FLIGHT_APPROVAL_EXCEED_FREE } },
        policy: { Rules: ["超标"] },
        staff: staffWithApprover,
        passenger: { id: "guest", isNotWhitelist: true } as never,
      }),
    ).toBe(false);
  });

  it("allows exceed-policy free picker for whitelist passenger with rules", () => {
    expect(
      shouldAllowSelectApprover({
        init: { Tmc: { FlightApprovalType: FLIGHT_APPROVAL_EXCEED_FREE } },
        policy: { Rules: ["超标"] },
        staff: staffWithApprover,
        passenger: { id: "emp", isNotWhitelist: false } as never,
      }),
    ).toBe(true);
  });
});
