import { afterEach, describe, expect, it, vi } from "vitest";

import {
  buildTravelApplyBody,
  defaultTravelApplySegment,
  emptyTravelApplyTraveler,
  fetchTravelApplyMeta,
  staffPickerOptions,
  validateTravelApply,
  type TravelApplyMeta,
} from "./travel-apply";

const meta: TravelApplyMeta = {
  addUrl: "http://workflow.rtesp.com/Form/Add?ticket=test&FlowTag=Travel",
  workflowId: "318",
  travelNumber: { label: "Travel001", value: "Travel001" },
  applicant: { label: "姜茗豪", value: "40390000000011" },
  organization: { label: "技术部", value: "A001" },
  position: { label: "", value: "" },
  defaultAccount: { label: "1611558-姜茗豪", value: "40390000000011" },
  staffOptions: [
    { label: "1611558-姜茗豪", value: "40390000000011" },
    { label: "007-范梦杭", value: "3680000000003" },
  ],
  policyDefaultUrl: "http://api-workflow.rtesp.com/StaffCtrl/GetDefaultPolicy?ticket=test",
  travelTypes: [{ label: "国内机票", value: "国内机票" }],
  cities: [
    { label: "北京", value: "1101" },
    { label: "上海", value: "3101" },
    { label: "广州", value: "4401" },
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
  it("encodes single traveler and segment as FormDetails and FormTimes", () => {
    const body = buildTravelApplyBody(meta, {
      travelTypes: ["国内机票"],
      reason: "客户拜访",
      travelers: [{ account: meta.defaultAccount, policyId: "policy-1" }],
      segments: [
        {
          startDate: "2026-06-25",
          endDate: "2026-06-30",
          fromCity: { label: "北京", value: "1101" },
          toCity: { label: "上海", value: "3101" },
        },
      ],
    });

    expect(body.get("Workflow.Id")).toBe("318");
    expect(body.get("formvalues")).toBe("8");
    expect(body.get("FormDetails[4].Tag")).toBe("TravelType");
    expect(body.get("FormDetails[4].Content")).toBe("国内机票");
    expect(body.get("FormDetails[6].Slave")).toBe("TravelAccount");
    expect(body.get("FormDetails[6].SlaveRow")).toBe("0");
    expect(body.get("FormDetails[6].Tag")).toBe("AccountId");
    expect(body.get("FormDetails[6].Number")).toBe("40390000000011");
    expect(body.get("FormDetails[7].Tag")).toBe("PolicyId");
    expect(body.get("FormDetails[7].Content")).toBe("policy-1");
    expect(body.get("FormTimes[0].Slave")).toBe("TravelDetail");
    expect(body.get("FormTimes[0].SlaveRow")).toBe("0");
    expect(body.get("FormTimes[0].Tag")).toBe("StartDate");
    expect(body.get("FormTimes[0].Time")).toBe("2026-06-25");
    expect(body.get("FormDetails[8].Tag")).toBe("FromCityName");
    expect(body.get("FormDetails[8].Number")).toBe("1101");
  });

  it("encodes multiple travelers and segments with incrementing SlaveRow", () => {
    const body = buildTravelApplyBody(meta, {
      travelTypes: ["国内机票", "火车票"],
      reason: "多段出差",
      travelers: [
        { account: meta.defaultAccount, policyId: "p1" },
        { account: { label: "007-范梦杭", value: "3680000000003" }, policyId: "p2" },
      ],
      segments: [
        {
          startDate: "2026-06-25",
          endDate: "2026-06-26",
          fromCity: { label: "北京", value: "1101" },
          toCity: { label: "上海", value: "3101" },
        },
        {
          startDate: "2026-06-27",
          endDate: "2026-06-28",
          fromCity: { label: "上海", value: "3101" },
          toCity: { label: "广州", value: "4401" },
        },
      ],
    });

    expect(body.get("FormDetails[6].SlaveRow")).toBe("0");
    expect(body.get("FormDetails[6].Number")).toBe("40390000000011");
    expect(body.get("FormDetails[8].SlaveRow")).toBe("1");
    expect(body.get("FormDetails[8].Number")).toBe("3680000000003");
    expect(body.get("FormDetails[8].Content")).toBe("007-范梦杭");

    expect(body.get("FormTimes[0].SlaveRow")).toBe("0");
    expect(body.get("FormTimes[0].Time")).toBe("2026-06-25");
    expect(body.get("FormTimes[2].SlaveRow")).toBe("1");
    expect(body.get("FormTimes[2].Tag")).toBe("StartDate");
    expect(body.get("FormTimes[2].Time")).toBe("2026-06-27");
    expect(body.get("FormDetails[12].SlaveRow")).toBe("1");
    expect(body.get("FormDetails[12].Tag")).toBe("FromCityName");
    expect(body.get("FormDetails[12].Number")).toBe("3101");
    expect(body.get("FormDetails[13].Tag")).toBe("ToCityName");
    expect(body.get("FormDetails[13].Number")).toBe("4401");
  });

  it("validates required business fields", () => {
    expect(
      validateTravelApply({
        travelTypes: [],
        reason: "",
        travelers: [{ account: meta.defaultAccount }],
        segments: [
          {
            startDate: "2026-06-25",
            endDate: "2026-06-30",
            fromCity: { label: "北京", value: "1101" },
            toCity: { label: "上海", value: "3101" },
          },
        ],
      }),
    ).toBe("请选择出差类型");
  });

  it("rejects duplicate travelers", () => {
    expect(
      validateTravelApply({
        travelTypes: ["国内机票"],
        reason: "测试",
        travelers: [{ account: meta.defaultAccount }, { account: meta.defaultAccount }],
        segments: [
          {
            startDate: "2026-06-25",
            endDate: "2026-06-30",
            fromCity: { label: "北京", value: "1101" },
            toCity: { label: "上海", value: "3101" },
          },
        ],
      }),
    ).toBe("出差人不能重复");
  });

  it("emptyTravelApplyTraveler requires selection before submit", () => {
    expect(emptyTravelApplyTraveler().account.value).toBe("");
    expect(
      validateTravelApply({
        travelTypes: ["国内机票"],
        reason: "测试",
        travelers: [{ account: meta.defaultAccount }, emptyTravelApplyTraveler()],
        segments: [
          {
            startDate: "2026-06-25",
            endDate: "2026-06-30",
            fromCity: { label: "北京", value: "1101" },
            toCity: { label: "上海", value: "3101" },
          },
        ],
      }),
    ).toBe("请选择出差人");
  });

  it("indexes staff picker search by number and name", () => {
    const options = staffPickerOptions([
      { label: "007-范梦杭", value: "3680000000003" },
      { label: "1611558-姜茗豪", value: "40390000000011" },
    ]);

    expect(options[0]?.searchText).toContain("007");
    expect(options[0]?.searchText).toContain("范梦杭");
    expect(options[1]?.searchText).toContain("姜茗豪");
  });

  it("defaultTravelApplySegment leaves cities unselected", () => {
    const segment = defaultTravelApplySegment(meta.cities);
    expect(segment.fromCity).toEqual({ label: "", value: "" });
    expect(segment.toCity).toEqual({ label: "", value: "" });
    expect(
      validateTravelApply({
        travelTypes: ["国内机票"],
        reason: "测试",
        travelers: [{ account: meta.defaultAccount }],
        segments: [segment],
      }),
    ).toBe("请选择行程出发城市");
  });
});

describe("travel apply workflow site", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  function stubApiConfig(workflowWebsiteUrl?: string) {
    const setting = {
      Token: "",
      Urls: workflowWebsiteUrl ? { WorkflowWebsiteUrl: workflowWebsiteUrl } : {},
    };
    vi.stubGlobal("localStorage", {
      getItem: (key: string) => (key === "ryx_api_config" ? JSON.stringify(setting) : null),
      setItem: () => {},
    });
  }

  function stubFetch(response: Partial<Response>) {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      redirected: false,
      url: "",
      text: async () => "",
      ...response,
    });
    vi.stubGlobal("fetch", fetchMock);
    return fetchMock;
  }

  it("resolves Form/Flow against WorkflowWebsiteUrl from ApiConfig", async () => {
    stubApiConfig("https://workflow.rongtrip.cn");
    const fetchMock = stubFetch({
      text: async () => 'var datas = [];\nAddUrl: "/Form/Add?ticket=t"',
    });

    await fetchTravelApplyMeta("ticket-1");

    expect(fetchMock).toHaveBeenCalledWith(
      "https://workflow.rongtrip.cn/Form/Flow?flowtag=Travel&ticket=ticket-1",
      undefined,
    );
  });

  it("reports an expired session when workflow redirects to the login site", async () => {
    stubApiConfig("https://workflow.rongtrip.cn");
    stubFetch({
      redirected: true,
      url: "https://login.rongtrip.cn/?url=https%3A%2F%2Fworkflow.rongtrip.cn%2FForm%2FFlow",
      text: async () => "<html><title>用户登录</title></html>",
    });

    await expect(fetchTravelApplyMeta("expired")).rejects.toThrow("登录已过期，请重新登录");
  });
});
