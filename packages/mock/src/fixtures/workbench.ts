/** Sanitized from docs/api/fixtures/travel-proxy/workbench-load-response.json */
export const MOCK_WORKBENCH_LOAD = {
  因公出行: [
    { Name: "机票", ImageUrl: "", Url: { path: "tmc-flight-search" } },
    { Name: "火车票", ImageUrl: "", Url: { path: "tmc-train-search" } },
    { Name: "酒店", ImageUrl: "", Url: { path: "tmc-hotel-search" } },
  ],
  因私出行: [
    { Name: "国内机票-因私", ImageUrl: "", Url: { path: "public-flight-search" } },
    { Name: "火车票-因私", ImageUrl: "", Url: { path: "public-train-search" } },
    { Name: "酒店", ImageUrl: "", Url: { path: "public-hotel-search" } },
  ],
  出差申请: [
    {
      Name: "我的审批",
      ImageUrl: "",
      Url: {
        url: "http://workflow.rtesp.com/Task/Index",
        path: "path://tmc-approval-task",
        tag: "TmcFlow",
        isBlank: true,
      },
    },
    {
      Name: "出差申请",
      ImageUrl: "",
      Url: {
        url: "http://workflow.rtesp.com/Form/Flow?flowtag=Travel",
        tag: "TmcFlow",
        isBlank: true,
      },
    },
  ],
};
