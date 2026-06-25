import { describe, expect, it } from "vitest";

import { buildTravelApplyBody, validateTravelApply, type TravelApplyMeta } from "./travel-apply";

const meta: TravelApplyMeta = {
  addUrl: "http://workflow.rtesp.com/Form/Add?ticket=test&FlowTag=Travel",
  workflowId: "318",
  travelNumber: { label: "Travel001", value: "Travel001" },
  applicant: { label: "姜茗豪", value: "40390000000011" },
  organization: { label: "技术部", value: "A001" },
  position: { label: "", value: "" },
  account: { label: "1611558-姜茗豪", value: "40390000000011" },
  policyId: "",
  travelTypes: [{ label: "国内机票", value: "国内机票" }],
  cities: [
    { label: "北京", value: "1101" },
    { label: "上海", value: "3101" },
  ],
  controls: [
    { id: null, label: "差旅单号", tag: "TravelNumber", controlType: "Input" },
    { id: null, label: "申请人", tag: null, controlType: "Combo" },
    { id: null, label: "所属部门", tag: null, controlType: "Combo" },
    { id: null, label: "所属职位", tag: null, controlType: "Combo" },
    { id: null, label: "出差类型", tag: "TravelType", controlType: "Check" },
    { id: null, label: "出差事由", tag: null, controlType: "Textarea" },
    {
      id: null,
      label: "人员信息",
      tag: "TravelAccount",
      controlType: "Slave",
      slaves: [
        { id: null, label: "出差人", tag: "AccountId", controlType: "Combo" },
        { id: null, label: "PolicyId", tag: "PolicyId", controlType: "Hidden" },
      ],
    },
    {
      id: null,
      label: "行程信息",
      tag: "TravelDetail",
      controlType: "Slave",
      slaves: [
        { id: null, label: "开始日期", tag: "StartDate", controlType: "Date" },
        { id: null, label: "结束日期", tag: "EndDate", controlType: "Date" },
        { id: null, label: "出发城市", tag: "FromCityName", controlType: "Abc" },
        { id: null, label: "目的城市", tag: "ToCityName", controlType: "Abc" },
      ],
    },
  ],
};

describe("travel apply form submit", () => {
  it("encodes flowform controls as FormDetails and FormTimes", () => {
    const body = buildTravelApplyBody(meta, {
      travelTypes: ["国内机票"],
      reason: "客户拜访",
      startDate: "2026-06-25",
      endDate: "2026-06-30",
      fromCity: { label: "北京", value: "1101" },
      toCity: { label: "上海", value: "3101" },
    });

    expect(body.get("Workflow.Id")).toBe("318");
    expect(body.get("formvalues")).toBe("8");
    expect(body.get("FormDetails[4].Tag")).toBe("TravelType");
    expect(body.get("FormDetails[4].Content")).toBe("国内机票");
    expect(body.get("FormDetails[6].Slave")).toBe("TravelAccount");
    expect(body.get("FormDetails[6].Tag")).toBe("AccountId");
    expect(body.get("FormDetails[6].Number")).toBe("40390000000011");
    expect(body.get("FormTimes[0].Slave")).toBe("TravelDetail");
    expect(body.get("FormTimes[0].Tag")).toBe("StartDate");
    expect(body.get("FormTimes[0].Time")).toBe("2026-06-25");
    expect(body.get("FormDetails[8].Tag")).toBe("FromCityName");
    expect(body.get("FormDetails[8].Number")).toBe("1101");
  });

  it("validates required business fields", () => {
    expect(
      validateTravelApply({
        travelTypes: [],
        reason: "",
        startDate: "2026-06-25",
        endDate: "2026-06-30",
        fromCity: { label: "北京", value: "1101" },
        toCity: { label: "上海", value: "3101" },
      }),
    ).toBe("请选择出差类型");
  });
});
