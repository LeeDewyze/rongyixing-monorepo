/** Sanitized from docs/api/fixtures/travel-proxy/workbench-load-response.json */
export const MOCK_WORKBENCH_LOAD = {
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
