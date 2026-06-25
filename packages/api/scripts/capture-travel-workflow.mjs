#!/usr/bin/env node
/**
 * Full travel/workflow API capture for ryx H5.
 *
 * Outputs:
 *   docs/api/fixtures/travel-proxy/api-catalog.json   — structured endpoint catalog
 *   docs/api/fixtures/travel-proxy/capture-*.json     — raw responses (tickets redacted)
 *
 * Usage:
 *   pnpm --filter @ryx/api build
 *   TRAVEL_PROXY_USER=Test15011350510 TRAVEL_PROXY_PASS=Temp123456 \
 *     node packages/api/scripts/capture-travel-workflow.mjs
 */
import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { createApi } from "../dist/index.js";
import { TMC_METHODS } from "../dist/methods/tmc.js";
import { TRAVEL_FLOW_METHODS } from "../dist/methods/travel-flow.js";
import { APPROVAL_FLOW_METHODS } from "../dist/methods/approval-flow.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const FIXTURE_DIR = join(__dirname, "../../../docs/api/fixtures/travel-proxy");

const USER = process.env.TRAVEL_PROXY_USER ?? "T289G003";
const PASS = process.env.TRAVEL_PROXY_PASS ?? "Temp123456";
const ALT_USER = process.env.TRAVEL_PROXY_ALT_USER ?? "Test15011350510";
const ALT_PASS = process.env.TRAVEL_PROXY_ALT_PASS ?? "Temp123456";
const BASE = process.env.TRAVEL_PROXY_BASE ?? "http://app.rtesp.com";

const TICKET_RE = /ticket=[a-f0-9]{32}/gi;

function save(name, data) {
  mkdirSync(FIXTURE_DIR, { recursive: true });
  const path = join(FIXTURE_DIR, `${name}.json`);
  writeFileSync(path, JSON.stringify(data, null, 2), "utf8");
  console.log(`saved ${path}`);
}

function redact(value) {
  if (typeof value === "string") {
    return value.replace(TICKET_RE, "ticket=***REDACTED***");
  }
  if (Array.isArray(value)) return value.map(redact);
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, redact(v)]));
  }
  return value;
}

function parseFormFlowHtml(html, ticket) {
  const pick = (pattern) => {
    const m = html.match(pattern);
    return m?.[1] ? redact(m[1]) : undefined;
  };
  const addRuleRaw = html.match(/var AddRule=(\[[\s\S]*?\]);/);
  let addRule = null;
  if (addRuleRaw?.[1]) {
    try {
      addRule = JSON.parse(addRuleRaw[1]);
    } catch {
      addRule = { parseError: true, preview: addRuleRaw[1].slice(0, 500) };
    }
  }
  return {
    workflowId: pick(/WorkflowId\s*=\s*['"]([^'"]+)['"]/),
    layoutTag: pick(/layoutTag\s*=\s*['"]([^'"]+)['"]/),
    flowTag: pick(/<input[^>]+name="Tag"[^>]+value="([^"]+)"/) ?? "Travel",
    getUrl: pick(/GetUrl:"([^"]+)"/),
    addUrl: pick(/AddUrl:\s*"([^"]+)"/),
    modifyUrl: pick(/ModifyUrl:\s*"([^"]+)"/),
    removeUrl: pick(/RemoveUrl:\s*"([^"]+)"/),
    listUrl: pick(/ListUrl:\s*"([^"]+)"/),
    formLayoutDetailPath: pick(/url:\s*"(\/Form\/FormLayoutDetail)"/),
    addRuleFieldCount: Array.isArray(addRule) ? addRule.length : 0,
    addRule,
  };
}

function parseTaskIndexHtml(html) {
  const pick = (pattern) => {
    const m = html.match(pattern);
    return m?.[1] ? redact(m[1]) : undefined;
  };
  return {
    getUrl: pick(/GetUrl\s*:\s*"([^"]+)"/i) ?? pick(/GetUrl:"([^"]+)"/),
    listPath: pick(/url:\s*"(\/Task\/list)"/i),
    transferPath: html.includes("/Task/Transfer") ? "/Task/Transfer" : undefined,
    getPath: html.includes("/Task/get") ? "/Task/get" : undefined,
  };
}

function extractWorkflowApiPaths(html) {
  const paths = new Set();
  for (const m of html.matchAll(/api-workflow\.rtesp\.com(\/[A-Za-z]+\/[A-Za-z]+)/g)) {
    paths.add(m[1]);
  }
  for (const m of html.matchAll(/["'](\/(?:Form|Task)\/[A-Za-z]+)["']/g)) {
    paths.add(m[1]);
  }
  return [...paths].sort();
}

async function httpProbe(label, url, options = {}) {
  const started = Date.now();
  try {
    const res = await fetch(url, {
      redirect: "follow",
      headers: {
        "User-Agent": "ryx-travel-capture/2.0",
        Accept: "application/json, text/html, */*",
        ...(options.headers ?? {}),
      },
      ...options,
    });
    const text = await res.text();
    let parsed = null;
    try {
      parsed = JSON.parse(text);
    } catch {
      parsed = null;
    }
    return redact({
      label,
      method: options.method ?? "GET",
      url: redact(url),
      status: res.status,
      contentType: res.headers.get("content-type"),
      durationMs: Date.now() - started,
      isJson: parsed != null,
      bodyPreview: text.slice(0, 1200),
      bodyLength: text.length,
      json: parsed,
      arrayLength: Array.isArray(parsed) ? parsed.length : undefined,
      dataCount: parsed?.Data != null && Array.isArray(parsed.Data) ? parsed.Data.length : undefined,
    });
  } catch (error) {
    return redact({
      label,
      method: options.method ?? "GET",
      url: redact(url),
      error: String(error),
      durationMs: Date.now() - started,
    });
  }
}

async function probeProxyMethod(api, method, data) {
  try {
    const result = await api.proxy.send({ method, data });
    return redact({
      ok: true,
      method,
      request: data,
      count: Array.isArray(result) ? result.length : undefined,
      sample: Array.isArray(result) ? result.slice(0, 3) : result,
    });
  } catch (error) {
    return redact({ ok: false, method, request: data, error: String(error) });
  }
}

async function probeTaskDetails(api, ticket) {
  const pending = await api.approval.getOrderTasks({ type: 1, pageIndex: 0, pageSize: 1 });
  if (!pending.length) return null;

  const task = pending[0];
  const taskId = task.id;
  const handleBase = task.handleUrl ?? task.url;
  if (!handleBase || !taskId) return null;

  const separator = handleBase.includes("?") ? "&" : "?";
  const handleUrl = `${handleBase}${separator}taskid=${encodeURIComponent(taskId)}&ticket=${encodeURIComponent(ticket)}&isApp=true&lang=cn`;

  const workflowTasks = await api.approval.getWorkflowTasks({ pageIndex: 0, pageSize: 1, name: "" });
  const wfTask = workflowTasks[0];
  let detailUrl = wfTask?.url;
  if (detailUrl && !detailUrl.includes("ticket=")) {
    detailUrl += `${detailUrl.includes("?") ? "&" : "?"}ticket=${encodeURIComponent(ticket)}`;
  }

  const probes = {
    taskSample: {
      id: taskId,
      name: task.name,
      number: task.number,
      statusName: task.statusName,
      tag: task.tag,
      handleUrl: handleBase,
    },
    workflowTaskSample: wfTask
      ? { id: wfTask.id, url: wfTask.url, name: wfTask.name }
      : null,
  };

  probes.handlePage = await httpProbe("task.handle", handleUrl);
  if (detailUrl) {
    probes.detailPage = await httpProbe("task.detail", detailUrl);
  }

  return redact(probes);
}

async function captureAccount(api, user, pass, tag, setTicket) {
  const login = await api.authProxy.login({
    Name: user,
    Password: pass,
    Device: "travel-capture-v2",
    DeviceName: "travel-capture-v2",
  });
  const ticket = login.Ticket ?? "";
  if (!ticket) throw new Error(`Login failed: ${user}`);
  setTicket(ticket);

  const cfg = await api.proxy.loadApiConfig();
  const workflowSite = cfg.Urls?.WorkflowWebsiteUrl ?? "http://workflow.rtesp.com";
  const workflowApi = cfg.Urls?.WorkflowApiUrl ?? "http://api-workflow.rtesp.com";
  const bfsApi = cfg.Urls?.BfsApiUrl ?? "http://api-bfs.rtesp.com";

  const pageReq = { pageIndex: 0, pageSize: 20, name: "" };
  const formQuery = `ticket=${ticket}&CheckFlowType=&FlowTag=Travel`;
  const formIdQuery = `ticket=${ticket}&formId=`;

  const formFlowHtml = await (await fetch(`${workflowSite}/Form/Flow?flowtag=Travel&ticket=${ticket}`)).text();
  const taskIndexHtml = await (await fetch(`${workflowSite}/Task/Index?ticket=${ticket}`)).text();
  const formMeta = parseFormFlowHtml(formFlowHtml, ticket);
  const taskMeta = parseTaskIndexHtml(taskIndexHtml);

  const proxyMethods = {
    workbenchLoad: await probeProxyMethod(api, TMC_METHODS.WORKBENCH_LOAD, {}),
    getTravelUrlFlight: await probeProxyMethod(api, TRAVEL_FLOW_METHODS.GET_TRAVEL_URL, {
      staffNumber: null,
      staffOutNumber: null,
      name: null,
      travelType: "Flight",
    }),
    getTravelUrlHotel: await probeProxyMethod(api, TRAVEL_FLOW_METHODS.GET_TRAVEL_URL, {
      staffNumber: null,
      staffOutNumber: null,
      name: null,
      travelType: "Hotel",
    }),
    orderTaskPending: await probeProxyMethod(api, APPROVAL_FLOW_METHODS.ORDER_TASK_LIST, {
      ...pageReq,
      Type: 1,
    }),
    orderTaskDone: await probeProxyMethod(api, APPROVAL_FLOW_METHODS.ORDER_TASK_LIST, {
      ...pageReq,
      Type: 2,
    }),
    workflowTaskList: await probeProxyMethod(api, APPROVAL_FLOW_METHODS.WORKFLOW_TASK_LIST, pageReq),
    workflowHistoryList: await probeProxyMethod(api, APPROVAL_FLOW_METHODS.WORKFLOW_HISTORY_LIST, pageReq),
    workflowNotifyList: await probeProxyMethod(api, APPROVAL_FLOW_METHODS.WORKFLOW_NOTIFY_LIST, pageReq),
    waitingTaskCount: await probeProxyMethod(api, APPROVAL_FLOW_METHODS.WAITING_TASK_COUNT, {}),
  };

  const workflowHttp = [];
  const push = (item) => workflowHttp.push(item);

  // --- Form site (workflow.rtesp.com) ---
  push(await httpProbe("form.get", `${workflowSite}/Form/Get?${formQuery}`));
  push(await httpProbe("form.list", `${workflowSite}/Form/List?${formQuery}`));
  if (formMeta.layoutTag) {
    const layoutBody = new URLSearchParams({ printerTag: formMeta.layoutTag, ticket });
    push(
      await httpProbe("form.layoutDetail.post", `${workflowSite}/Form/FormLayoutDetail`, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: layoutBody.toString(),
      }),
    );
  }

  // --- Task site ---
  const taskListBody = new URLSearchParams({
    ticket,
    Tag: "TaskAccountIdWaiting",
    Name: "",
    PageSize: "20",
    PageIndex: "0",
  });
  push(
    await httpProbe("task.list.waiting.post", `${workflowSite}/Task/list`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: taskListBody.toString(),
    }),
  );

  // --- Workflow API ctrl endpoints ---
  const ctrlProbes = [
    ["staff.defaultApplicant", `${workflowApi}/StaffCtrl/DefaultApplicant?${formIdQuery}`],
    ["staff.defaultData", `${workflowApi}/StaffCtrl/DefaultData?HasNumber=true&${formIdQuery}`],
    [
      "staff.getDatas",
      `${workflowApi}/StaffCtrl/GetDatas?HasNumber=true&OnlyLoadCompany=true&${formIdQuery}`,
    ],
    ["staff.getDefaultPolicy", `${workflowApi}/StaffCtrl/GetDefaultPolicy?${formIdQuery}`],
    ["city.defaultData", `${workflowApi}/CityCtrl/DefaultData?label=北京&value=1101&${formIdQuery}`],
    ["city.getDatas", `${workflowApi}/CityCtrl/GetDatas?${formIdQuery}`],
    ["org.defaultData", `${workflowApi}/OrganizationCtrl/DefaultData?${formIdQuery}`],
    ["position.defaultData", `${workflowApi}/PositionCtrl/DefaultData?${formIdQuery}`],
    ["task.list.api", `${workflowApi}/Task/List?${formIdQuery}`],
    ["form.get.api", `${workflowApi}/Form/Get?FlowTag=Travel&${formIdQuery.replace("formId=", "formId=")}`],
  ];
  for (const [label, url] of ctrlProbes) {
    push(await httpProbe(label, url));
  }

  // --- BFS upload (referenced by travel form) ---
  push(await httpProbe("bfs.uploadImage.options", `${bfsApi}/Image/Upload?${formIdQuery}`, { method: "OPTIONS" }));

  const discoveredPaths = extractWorkflowApiPaths(formFlowHtml);
  const taskDetailProbe = await probeTaskDetails(api, ticket);

  return redact({
    tag,
    user,
    loginName: login.Name,
    capturedAt: new Date().toISOString(),
    bases: { workflowSite, workflowApi, bfsApi, proxyGateway: BASE },
    formMeta,
    taskMeta,
    discoveredPaths,
    proxyMethods,
    workflowHttp,
    taskDetailProbe,
  });
}

function buildCatalog(primary, secondary) {
  const endpoint = (entry) => ({
    id: entry.id,
    layer: entry.layer,
    h5Route: entry.h5Route,
    method: entry.method,
    urlTemplate: entry.urlTemplate,
    transport: entry.transport,
    request: entry.request,
    responseSample: entry.responseSample,
    status: entry.status,
    notes: entry.notes,
  });

  const pickProxy = (key) => primary.proxyMethods[key];
  const pickHttp = (label) =>
    primary.workflowHttp.find((x) => x.label === label) ??
    secondary?.workflowHttp.find((x) => x.label === label);

  const catalog = {
    version: "2026-06-24",
    accounts: [
      { user: primary.user, name: primary.loginName, tag: primary.tag },
      ...(secondary ? [{ user: secondary.user, name: secondary.loginName, tag: secondary.tag }] : []),
    ],
    layers: {
      proxy: "app.rtesp.com/Home/Proxy — signed form POST with Method name",
      workflowSite: "workflow.rtesp.com — presentation + form/task actions",
      workflowApi: "api-workflow.rtesp.com — ctrl/data JSON endpoints",
      bfsApi: "api-bfs.rtesp.com — attachment/image upload",
    },
    h5EntryMapping: [
      {
        homeButton: "出差申请",
        h5Route: "/travel/apply",
        primaryEndpoints: ["workflow.form.flow", "workflow.form.get", "workflow.form.add", "workflow.form.layoutDetail"],
      },
      {
        homeButton: "我的审批",
        h5Route: "/travel/workflow",
        primaryEndpoints: ["workflow.task.index", "workflow.task.list", "proxy.workflow.taskList"],
      },
      {
        homeButton: "待我审批",
        h5Route: "/travel/approval?tab=pending",
        primaryEndpoints: ["proxy.order.taskList.pending", "proxy.waitingTaskCount", "workflow.task.detail"],
      },
      {
        homeButton: "已审任务",
        h5Route: "/travel/approval?tab=done",
        primaryEndpoints: ["proxy.order.taskList.done", "workflow.task.detail"],
      },
    ],
    endpoints: [
      endpoint({
        id: "proxy.login",
        layer: "proxy",
        h5Route: "/login/password",
        method: "TmcApiLoginUrl-Home-Login",
        urlTemplate: "{ClientAppUrl}/Home/Proxy",
        transport: "Proxy Method",
        request: { Name: "string", Password: "string", Device: "string" },
        responseSample: { Ticket: "uuid", Name: "string" },
        status: "ok",
      }),
      endpoint({
        id: "proxy.workbenchLoad",
        layer: "proxy",
        h5Route: "/travel/*",
        method: TMC_METHODS.WORKBENCH_LOAD,
        urlTemplate: "{ClientAppUrl}/Home/Proxy",
        transport: "Proxy Method",
        request: {},
        responseSample: pickProxy("workbenchLoad")?.sample,
        status: pickProxy("workbenchLoad")?.ok ? "ok" : "error",
        notes: "Resolves 出差申请 / 我的审批 external URLs",
      }),
      endpoint({
        id: "proxy.getTravelUrl",
        layer: "proxy",
        h5Route: "hotel/flight book",
        method: TRAVEL_FLOW_METHODS.GET_TRAVEL_URL,
        urlTemplate: "{ClientAppUrl}/Home/Proxy",
        transport: "Proxy Method",
        request: { staffNumber: null, travelType: "Flight|Hotel|Train" },
        responseSample: pickProxy("getTravelUrlFlight")?.sample,
        status: pickProxy("getTravelUrlFlight")?.ok ? "ok" : "error",
        notes: "Select travel form when booking",
      }),
      endpoint({
        id: "proxy.order.taskList.pending",
        layer: "proxy",
        h5Route: "/travel/approval?tab=pending",
        method: APPROVAL_FLOW_METHODS.ORDER_TASK_LIST,
        urlTemplate: "{ClientAppUrl}/Home/Proxy",
        transport: "Proxy Method",
        request: { Type: 1, PageIndex: 0, PageSize: 20, Name: "" },
        responseSample: pickProxy("orderTaskPending")?.sample,
        status: pickProxy("orderTaskPending")?.ok ? "ok" : "error",
        notes: "TMC order approval tasks; click opens HandleUrl + taskid + ticket",
      }),
      endpoint({
        id: "proxy.order.taskList.done",
        layer: "proxy",
        h5Route: "/travel/approval?tab=done",
        method: APPROVAL_FLOW_METHODS.ORDER_TASK_LIST,
        transport: "Proxy Method",
        request: { Type: 2, PageIndex: 0, PageSize: 20, Name: "" },
        responseSample: pickProxy("orderTaskDone")?.sample,
        status: pickProxy("orderTaskDone")?.ok ? "ok" : "error",
      }),
      endpoint({
        id: "proxy.workflow.taskList",
        layer: "proxy",
        h5Route: "/travel/workflow (native alt)",
        method: APPROVAL_FLOW_METHODS.WORKFLOW_TASK_LIST,
        transport: "Proxy Method",
        request: { PageIndex: 0, PageSize: 20, Name: "" },
        responseSample: pickProxy("workflowTaskList")?.sample,
        status: pickProxy("workflowTaskList")?.ok ? "ok" : "error",
      }),
      endpoint({
        id: "proxy.workflow.historyList",
        layer: "proxy",
        method: APPROVAL_FLOW_METHODS.WORKFLOW_HISTORY_LIST,
        transport: "Proxy Method",
        request: { PageIndex: 0, PageSize: 20, Name: "" },
        responseSample: pickProxy("workflowHistoryList")?.sample,
        status: pickProxy("workflowHistoryList")?.ok ? "ok" : "error",
      }),
      endpoint({
        id: "proxy.workflow.notifyList",
        layer: "proxy",
        method: APPROVAL_FLOW_METHODS.WORKFLOW_NOTIFY_LIST,
        transport: "Proxy Method",
        request: { PageIndex: 0, PageSize: 20, Name: "" },
        responseSample: pickProxy("workflowNotifyList")?.sample,
        status: pickProxy("workflowNotifyList")?.ok ? "ok" : "error",
      }),
      endpoint({
        id: "proxy.waitingTaskCount",
        layer: "proxy",
        h5Route: "/travel/approval",
        method: APPROVAL_FLOW_METHODS.WAITING_TASK_COUNT,
        transport: "Proxy Method",
        request: {},
        responseSample: pickProxy("waitingTaskCount")?.sample,
        status: pickProxy("waitingTaskCount")?.ok ? "ok" : "error",
      }),
      endpoint({
        id: "workflow.form.flow",
        layer: "workflowSite",
        h5Route: "/travel/apply",
        method: "GET",
        urlTemplate: "{WorkflowWebsiteUrl}/Form/Flow?flowtag=Travel&ticket={ticket}",
        transport: "Direct HTTP (HTML)",
        responseSample: { workflowId: primary.formMeta.workflowId, layoutTag: primary.formMeta.layoutTag },
        status: "ok",
        notes: "Embeds winner.weber dynamic form; exposes GetUrl/AddUrl in HTML",
      }),
      endpoint({
        id: "workflow.form.get",
        layer: "workflowSite",
        method: "GET",
        urlTemplate: primary.formMeta.getUrl ?? "{WorkflowWebsiteUrl}/Form/Get?ticket={ticket}&FlowTag=Travel",
        transport: "Direct HTTP (JSON)",
        responseSample: pickHttp("form.get")?.json ?? pickHttp("form.get")?.bodyPreview,
        status: pickHttp("form.get")?.status === 200 ? "ok" : "error",
        notes: "Returns null for new travel application",
      }),
      endpoint({
        id: "workflow.form.add",
        layer: "workflowSite",
        method: "POST",
        urlTemplate: primary.formMeta.addUrl ?? "{WorkflowWebsiteUrl}/Form/Add?ticket={ticket}&FlowTag=Travel",
        transport: "Direct HTTP (form submit)",
        request: "Dynamic fields from weber layout + Workflow.Id=318",
        status: "discovered-not-probed",
        notes: "Submit travel application; do not call in capture script",
      }),
      endpoint({
        id: "workflow.form.layoutDetail",
        layer: "workflowSite",
        method: "POST",
        urlTemplate: "{WorkflowWebsiteUrl}/Form/FormLayoutDetail",
        transport: "Direct HTTP (HTML fragment)",
        request: { printerTag: primary.formMeta.layoutTag, ticket: "{ticket}" },
        responseSample: pickHttp("form.layoutDetail.post")?.bodyPreview,
        status: pickHttp("form.layoutDetail.post")?.status === 200 ? "ok" : "empty",
      }),
      endpoint({
        id: "workflow.task.index",
        layer: "workflowSite",
        h5Route: "/travel/workflow",
        method: "GET",
        urlTemplate: "{WorkflowWebsiteUrl}/Task/Index?ticket={ticket}",
        transport: "Direct HTTP (HTML)",
        responseSample: primary.taskMeta,
        status: "ok",
      }),
      endpoint({
        id: "workflow.task.list",
        layer: "workflowSite",
        method: "POST",
        urlTemplate: "{WorkflowWebsiteUrl}/Task/list",
        transport: "Direct HTTP",
        request: { Tag: "TaskAccountIdWaiting|TaskAccountIdNotified", PageIndex: 0, PageSize: 20, ticket: "{ticket}" },
        responseSample: pickHttp("task.list.waiting.post")?.bodyPreview,
        status: pickHttp("task.list.waiting.post")?.status === 200 ? "ok" : "error",
      }),
      endpoint({
        id: "workflow.task.detail",
        layer: "workflowSite",
        h5Route: "/travel/task",
        method: "GET",
        urlTemplate: "{HandleUrl}?taskid={id}&ticket={ticket}&isApp=true&lang=cn",
        transport: "Direct HTTP / iframe",
        responseSample: primary.taskDetailProbe?.taskSample,
        status: primary.taskDetailProbe ? "ok" : "empty-account",
        notes: "HandleUrl from TmcApiOrderUrl-Task-List; e.g. FormTask/Handle?flowtag=Travel",
      }),
      endpoint({
        id: "workflow.formTask.handle",
        layer: "workflowSite",
        h5Route: "/travel/task",
        method: "GET",
        urlTemplate: "{WorkflowWebsiteUrl}/FormTask/Handle?flowtag=Travel&taskid={id}&ticket={ticket}&isApp=true&lang=cn",
        transport: "Direct HTTP (HTML approval page)",
        responseSample: {
          task: primary.taskDetailProbe?.taskSample,
          pageHints: primary.taskDetailProbe?.handlePage?.bodyPreview?.slice?.(0, 200),
          discovered: ["FormTask/Approval", "FormTask/GetStaffs"],
        },
        status: primary.taskDetailProbe?.handlePage?.status === 200 ? "ok" : "empty-account",
      }),
      endpoint({
        id: "workflow.formTask.detail",
        layer: "workflowSite",
        method: "GET",
        urlTemplate: "{WorkflowWebsiteUrl}/FormTask/Detail?flowtag=Travel&taskId={id}&sign={sign}&ticket={ticket}",
        transport: "Direct HTTP (HTML read-only)",
        responseSample: primary.taskDetailProbe?.workflowTaskSample,
        status: primary.taskDetailProbe?.detailPage?.status === 200 ? "ok" : "empty-account",
        notes: "From WorkflowApiUrl-Task-List item Url (includes sign)",
      }),
      endpoint({
        id: "workflow.ctrl.staffDefaultApplicant",
        layer: "workflowApi",
        method: "GET",
        urlTemplate: "{WorkflowApiUrl}/StaffCtrl/DefaultApplicant?ticket={ticket}&formId=",
        responseSample: pickHttp("staff.defaultApplicant")?.json,
        status: pickHttp("staff.defaultApplicant")?.status === 200 ? "ok" : "error",
      }),
      endpoint({
        id: "workflow.ctrl.staffDefaultData",
        layer: "workflowApi",
        method: "GET",
        urlTemplate: "{WorkflowApiUrl}/StaffCtrl/DefaultData?HasNumber=true&ticket={ticket}&formId=",
        responseSample: pickHttp("staff.defaultData")?.json,
        status: pickHttp("staff.defaultData")?.status === 200 ? "ok" : "error",
      }),
      endpoint({
        id: "workflow.ctrl.staffGetDatas",
        layer: "workflowApi",
        method: "GET",
        urlTemplate: "{WorkflowApiUrl}/StaffCtrl/GetDatas?HasNumber=true&OnlyLoadCompany=true&ticket={ticket}&formId=",
        responseSample: pickHttp("staff.getDatas")?.bodyPreview,
        status: pickHttp("staff.getDatas")?.status === 200 ? "ok" : "error",
      }),
      endpoint({
        id: "workflow.ctrl.cityGetDatas",
        layer: "workflowApi",
        method: "GET",
        urlTemplate: "{WorkflowApiUrl}/CityCtrl/GetDatas?ticket={ticket}&formId=",
        responseSample: {
          count: pickHttp("city.getDatas")?.arrayLength,
          firstItems: pickHttp("city.getDatas")?.json?.slice?.(0, 3),
        },
        status: pickHttp("city.getDatas")?.status === 200 ? "ok" : "error",
      }),
      endpoint({
        id: "workflow.ctrl.orgDefaultData",
        layer: "workflowApi",
        method: "GET",
        urlTemplate: "{WorkflowApiUrl}/OrganizationCtrl/DefaultData?ticket={ticket}&formId=",
        responseSample: pickHttp("org.defaultData")?.json ?? pickHttp("org.defaultData")?.bodyPreview,
        status: pickHttp("org.defaultData")?.status === 200 ? "ok" : "error",
      }),
      endpoint({
        id: "workflow.ctrl.positionDefaultData",
        layer: "workflowApi",
        method: "GET",
        urlTemplate: "{WorkflowApiUrl}/PositionCtrl/DefaultData?ticket={ticket}&formId=",
        responseSample: pickHttp("position.defaultData")?.json ?? pickHttp("position.defaultData")?.bodyPreview,
        status: pickHttp("position.defaultData")?.status === 200 ? "ok" : "error",
      }),
      endpoint({
        id: "bfs.imageUpload",
        layer: "bfsApi",
        method: "POST",
        urlTemplate: "{BfsApiUrl}/Image/Upload?ticket={ticket}&formId=",
        transport: "Direct HTTP (multipart)",
        status: "discovered",
        notes: "Referenced by travel form for attachments",
      }),
    ],
    discoveredPaths: primary.discoveredPaths,
    excludedOnRyx: [
      { method: "FeatureRonglvUrl-jyx-GetTravelForms", reason: "jyx-only; null ref on ryx account" },
      { method: "FeatureRonglvUrl-jyx-SaveTravelForms", reason: "jyx-only" },
      { method: "BpmApiExpenseUrl-Home-List", reason: "HTTP 502 on staging" },
    ],
  };

  return catalog;
}

function createProbeApi(getTicket) {
  return createApi({
    baseUrl: BASE,
    mode: "proxy",
    appId: "com.ronglvonline.app",
    getTicket,
    getTicketName: () => "ticket",
    getDomain: () => "rtesp.com",
    getLanguage: () => "cn",
    getExtraFields: () => ({ root: "rl", IsShowLoading: "true" }),
  });
}

async function main() {
  console.log(`\nCapture v2 · primary=${USER} · alt=${ALT_USER}\n`);

  let primaryTicket = "";
  const primaryApi = createProbeApi(() => primaryTicket);
  const primary = await captureAccount(primaryApi, USER, PASS, "primary", (t) => {
    primaryTicket = t;
  });

  let altTicket = "";
  const altApi = createProbeApi(() => altTicket);
  let secondary = null;
  try {
    secondary = await captureAccount(altApi, ALT_USER, ALT_PASS, "secondary", (t) => {
      altTicket = t;
    });
  } catch (error) {
    console.warn("alt account capture skipped:", error);
  }

  save("capture-primary", primary);
  if (secondary) save("capture-secondary", secondary);

  const catalog = buildCatalog(primary, secondary);
  save("api-catalog", catalog);

  // Keep legacy flat files in sync for existing scripts/docs.
  save("capture-summary", {
    capturedAt: primary.capturedAt,
    user: USER,
    loginName: primary.loginName,
    altUser: secondary?.user,
    altLoginName: secondary?.loginName,
    endpointCount: catalog.endpoints.length,
    discoveredPathCount: catalog.discoveredPaths.length,
    counts: {
      orderTasksPending: primary.proxyMethods.orderTaskPending?.count ?? 0,
      orderTasksDone: primary.proxyMethods.orderTaskDone?.count ?? 0,
      workflowTasks: primary.proxyMethods.workflowTaskList?.count ?? 0,
      workflowHistory: primary.proxyMethods.workflowHistoryList?.count ?? 0,
      workflowNotifies: primary.proxyMethods.workflowNotifyList?.count ?? 0,
      waitingCount: primary.proxyMethods.waitingTaskCount?.sample,
    },
  });

  save("order-task-list-pending", primary.proxyMethods.orderTaskPending?.sample ?? []);
  save("order-task-list-done", primary.proxyMethods.orderTaskDone?.sample ?? []);
  save("workflow-task-list", primary.proxyMethods.workflowTaskList?.sample ?? []);
  save("workflow-history-list", primary.proxyMethods.workflowHistoryList?.sample ?? []);
  save("workflow-notify-list", primary.proxyMethods.workflowNotifyList?.sample ?? []);
  save("workflow-form-meta", {
    formMeta: primary.formMeta,
    taskMeta: primary.taskMeta,
    discoveredPaths: primary.discoveredPaths,
  });
  save("workflow-http-probes", primary.workflowHttp);
  if (primary.taskDetailProbe) save("task-detail-probe", primary.taskDetailProbe);

  console.log("\n=== api-catalog ===");
  console.log(`endpoints: ${catalog.endpoints.length}, discovered paths: ${catalog.discoveredPaths.length}`);
  console.log(JSON.stringify(catalog.endpoints.map((e) => ({ id: e.id, status: e.status, layer: e.layer })), null, 2));
  console.log("\nOK — see docs/api/fixtures/travel-proxy/api-catalog.json");
}

main().catch((err) => {
  console.error("\nFAILED:", err);
  process.exit(1);
});
