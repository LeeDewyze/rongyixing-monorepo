#!/usr/bin/env node
/**
 * Capture travel Form/Add + FormTask/Approval submit contracts.
 *
 * Outputs:
 *   docs/api/fixtures/travel-proxy/submit-api-contract.json
 *   docs/api/fixtures/travel-proxy/form-field-schema.json
 *
 * Usage:
 *   pnpm --filter @ryx/api build
 *   TRAVEL_PROXY_USER=T18610773065 TRAVEL_PROXY_PASS=Temp123456 \
 *     TRAVEL_PROXY_APPROVE_USER=T289G003 TRAVEL_PROXY_APPROVE_PASS=Temp123456 \
 *     node packages/api/scripts/capture-travel-submit.mjs
 *
 * Set TRAVEL_SUBMIT_DRY_RUN=1 to skip live Form/Add (document structure only).
 * Set TRAVEL_APPROVE_DRY_RUN=1 to skip live Approval POST.
 */
import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { createApi } from "../dist/index.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const FIXTURE_DIR = join(__dirname, "../../../docs/api/fixtures/travel-proxy");

const APPLY_USER = process.env.TRAVEL_PROXY_USER ?? "T18610773065";
const APPLY_PASS = process.env.TRAVEL_PROXY_PASS ?? "Temp123456";
const APPROVE_USER = process.env.TRAVEL_PROXY_APPROVE_USER ?? "T289G003";
const APPROVE_PASS = process.env.TRAVEL_PROXY_APPROVE_PASS ?? "Temp123456";
const BASE = process.env.TRAVEL_PROXY_BASE ?? "http://app.rtesp.com";
const WORKFLOW_SITE = process.env.TRAVEL_WORKFLOW_SITE ?? "http://workflow.rtesp.com";

const SUBMIT_DRY = process.env.TRAVEL_SUBMIT_DRY_RUN === "1";
const APPROVE_DRY = process.env.TRAVEL_APPROVE_DRY_RUN === "1";

const TICKET_RE = /ticket=[a-f0-9]{32}/gi;

function save(name, data) {
  mkdirSync(FIXTURE_DIR, { recursive: true });
  const path = join(FIXTURE_DIR, `${name}.json`);
  writeFileSync(path, JSON.stringify(data, null, 2), "utf8");
  console.log(`saved ${path}`);
}

function redact(value) {
  if (typeof value === "string") return value.replace(TICKET_RE, "ticket=***REDACTED***");
  if (Array.isArray(value)) return value.map(redact);
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, redact(v)]));
  }
  return value;
}

function parseFormDatas(html) {
  const m = html.match(/var datas\s*=\s*(\[[\s\S]*?\])\s*;/);
  if (!m?.[1]) return [];
  return JSON.parse(m[1]);
}

function flattenFields(datas, slave = "", slaveRow = 0) {
  const out = [];
  for (const d of datas) {
    if (d.controlType === "Slave") {
      for (const child of d.slaves ?? []) {
        out.push(...flattenFields([child], d.tag, slaveRow));
      }
      out.push({ tag: d.tag, label: d.label, controlType: "Slave", slave: "", slaveRow: 0 });
    } else {
      out.push({
        tag: d.tag,
        label: d.label,
        controlType: d.controlType,
        slave,
        slaveRow,
        defaultUrl: d.defaultUrl ? redact(d.defaultUrl) : undefined,
        dataUrl: d.dataUrl ? redact(d.dataUrl) : undefined,
      });
    }
  }
  return out;
}

async function fetchDefault(url) {
  if (!url) return null;
  try {
    const text = await (await fetch(url)).text();
    try {
      return JSON.parse(text);
    } catch {
      return text;
    }
  } catch {
    return null;
  }
}

function pickDefault(def) {
  if (!def) return { content: "", number: "" };
  const row = def.Data ?? def;
  if (Array.isArray(row)) {
    const first = row[0];
    return {
      content: first?.Text ?? first?.label ?? "",
      number: String(first?.Value ?? first?.value ?? ""),
    };
  }
  return {
    content: row.label ?? row.text ?? row.Text ?? row.Name ?? "",
    number: String(row.value ?? row.Value ?? row.Id ?? ""),
  };
}

function buildFormAddBody(datas, values = {}) {
  const fd = new URLSearchParams();
  fd.append("Workflow.Id", "318");
  fd.append("Tag", "Travel");
  fd.append("Name", "出差申请");
  fd.append("formvalues", "8");
  fd.append("LastId", "");
  fd.append("LastDateTime", "");
  fd.append("ListCount", "");

  let detailIdx = 0;
  let timeIdx = 0;
  let seq = 0;

  const appendDetail = (data, content, number = "", slave = "", slaveRow = 0) => {
    fd.append(`FormDetails[${detailIdx}].Id`, data.id ?? "");
    fd.append(`FormDetails[${detailIdx}].Slave`, slave ?? "");
    fd.append(`FormDetails[${detailIdx}].SlaveRow`, String(slaveRow ?? 0));
    fd.append(`FormDetails[${detailIdx}].Name`, data.label ?? "");
    fd.append(`FormDetails[${detailIdx}].Tag`, data.tag ?? "");
    fd.append(`FormDetails[${detailIdx}].Content`, content ?? "");
    fd.append(`FormDetails[${detailIdx}].Sequence`, String(seq++));
    fd.append(`FormDetails[${detailIdx}].Number`, number ?? "");
    detailIdx++;
  };

  const appendTime = (data, time, slave = "", slaveRow = 0) => {
    fd.append(`FormTimes[${timeIdx}].Id`, data.id ?? "");
    fd.append(`FormTimes[${timeIdx}].Slave`, slave ?? "");
    fd.append(`FormTimes[${timeIdx}].SlaveRow`, String(slaveRow ?? 0));
    fd.append(`FormTimes[${timeIdx}].Name`, data.label ?? "");
    fd.append(`FormTimes[${timeIdx}].Tag`, data.tag ?? "");
    fd.append(`FormTimes[${timeIdx}].Time`, time ?? "");
    fd.append(`FormTimes[${timeIdx}].Sequence`, String(seq++));
    fd.append(`FormTimes[${timeIdx}].Number`, "");
    timeIdx++;
  };

  async function fillField(data, slave = "", slaveRow = 0) {
    const ct = data.controlType;
    const tag = data.tag;
    if (ct === "Slave") {
      for (const child of data.slaves ?? []) {
        await fillField(child, data.tag, slaveRow);
      }
      return;
    }

    const override = tag ? values[tag] : values[data.label];
    if (override != null) {
      if (ct === "Date") appendTime(data, override, slave, slaveRow);
      else if (typeof override === "object") appendDetail(data, override.content, override.number, slave, slaveRow);
      else appendDetail(data, String(override), "", slave, slaveRow);
      return;
    }

    const def = await fetchDefault(data.defaultUrl);
    const picked = pickDefault(def);

    switch (ct) {
      case "Input":
        appendDetail(data, picked.content || picked.number, "", slave, slaveRow);
        break;
      case "Combo":
        appendDetail(data, picked.content, picked.number, slave, slaveRow);
        break;
      case "Check":
        appendDetail(data, "国内机票", "", slave, slaveRow);
        break;
      case "Textarea":
        appendDetail(data, "出差事由-抓包测试", "", slave, slaveRow);
        break;
      case "Hidden":
        appendDetail(data, picked.number || picked.content, "", slave, slaveRow);
        break;
      case "Date":
        appendTime(data, tag === "EndDate" ? "2026-06-30" : "2026-06-25", slave, slaveRow);
        break;
      case "Abc":
        if (tag === "FromCityName") appendDetail(data, "北京", "1101", slave, slaveRow);
        else if (tag === "ToCityName") appendDetail(data, "上海", "3101", slave, slaveRow);
        else appendDetail(data, picked.content, picked.number, slave, slaveRow);
        break;
      default:
        break;
    }
  }

  return { fd, fillField, counters: () => ({ detailIdx, timeIdx, seq }) };
}

function urlSearchParamsToObject(params) {
  const obj = {};
  for (const [k, v] of params.entries()) {
    if (obj[k] === undefined) obj[k] = v;
    else if (Array.isArray(obj[k])) obj[k].push(v);
    else obj[k] = [obj[k], v];
  }
  return obj;
}

async function loginApi(user, pass) {
  let ticket = "";
  const api = createApi({
    baseUrl: BASE,
    mode: "proxy",
    appId: "com.ronglvonline.app",
    getTicket: () => ticket,
    getTicketName: () => "ticket",
    getDomain: () => "rtesp.com",
    getLanguage: () => "cn",
    getExtraFields: () => ({ root: "rl" }),
  });
  const login = await api.authProxy.login({
    Name: user,
    Password: pass,
    Device: "travel-submit-capture",
    DeviceName: "travel-submit-capture",
  });
  ticket = login.Ticket ?? "";
  if (!ticket) throw new Error(`Login failed: ${user}`);
  return { api, ticket, name: login.Name };
}

async function captureFormAdd(apply) {
  const html = await (await fetch(`${WORKFLOW_SITE}/Form/Flow?flowtag=Travel&ticket=${apply.ticket}`)).text();
  const addUrl = html.match(/AddUrl:\s*"([^"]+)"/)?.[1];
  const getUrl = html.match(/GetUrl:"([^"]+)"/)?.[1];
  const datas = parseFormDatas(html);
  const fields = flattenFields(datas);

  const { fd, fillField } = buildFormAddBody(datas);
  for (const d of datas) await fillField(d);

  const requestSample = urlSearchParamsToObject(fd);
  let submitResult = null;
  if (!SUBMIT_DRY && addUrl) {
    const res = await fetch(addUrl, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: fd,
    });
    submitResult = await res.json();
  }

  const travelTypes = await fetchDefault(
    `http://expense-bpm.rtesp.com/TravelTask/GetTravelType?ticket=${apply.ticket}&formId=`,
  );

  return redact({
    account: { user: APPLY_USER, name: apply.name },
    formFlowUrl: `${WORKFLOW_SITE}/Form/Flow?flowtag=Travel&ticket={ticket}`,
    addUrlTemplate: redact(addUrl),
    getUrlTemplate: redact(getUrl),
    contentType: "application/x-www-form-urlencoded",
    encoding: "flowform.js FillFormDatas → FormDetails[] + FormTimes[]",
    topLevelFields: ["Workflow.Id", "Tag", "Name", "formvalues", "LastId", "LastDateTime", "ListCount"],
    formDetailsShape: {
      "FormDetails[n].Id": "string",
      "FormDetails[n].Slave": "TravelAccount|TravelDetail|empty",
      "FormDetails[n].SlaveRow": "0-based row in slave table",
      "FormDetails[n].Name": "field label",
      "FormDetails[n].Tag": "field tag (may be empty for 申请人/部门/职位/事由)",
      "FormDetails[n].Content": "display value; Check = comma-separated labels e.g. 国内机票",
      "FormDetails[n].Sequence": "0..n",
      "FormDetails[n].Number": "Combo/Abc hidden id",
    },
    formTimesShape: {
      "FormTimes[n].Tag": "StartDate|EndDate",
      "FormTimes[n].Time": "YYYY-MM-DD",
    },
    fields,
    fieldCount: fields.length,
    travelTypes: Array.isArray(travelTypes)
      ? travelTypes.map((t) => ({ label: t.Text ?? t.label, value: t.Value ?? t.value ?? t.Text }))
      : travelTypes,
    requestSample,
    submitResult,
    successResponse: { Status: true, Message: null, Data: { Id: "number — new form id" } },
    validationErrors: [
      { trigger: "empty POST", Message: "任务表单名称不能为空且长度不能超过100" },
      { trigger: "flat TravelType=国内机票", Message: "出差类型必填" },
    ],
    notes: [
      "Do NOT POST flat field names (TravelType=…); server expects FormDetails/FormTimes arrays.",
      "Check control Content is comma-separated checkbox labels, not numeric ids.",
      "Date fields use FormTimes, not FormDetails.",
    ],
  });
}

async function captureApproval(approve) {
  const pending = await approve.api.approval.getOrderTasks({
    type: 1,
    pageIndex: 0,
    pageSize: 5,
    name: "",
  });
  const task = pending.find((t) => t.tag === "Travel") ?? pending[0];
  if (!task) {
    return redact({ account: { user: APPROVE_USER, name: approve.name }, error: "no pending travel task" });
  }

  const handleUrl = `${WORKFLOW_SITE}/FormTask/Handle?flowtag=Travel&taskid=${task.id}&ticket=${approve.ticket}&isApp=true&lang=cn`;
  const html = await (await fetch(handleUrl)).text();
  const approvalPath = html.match(/window\.ApprovalUrl\s*=\s*"([^"]+)"/)?.[1];
  const taskIdFromPage = html.match(/window\.TaskId\s*=\s*'([^']+)'/)?.[1];
  const sign = html.match(/window\.sign\s*=\s*'([^']*)'/)?.[1] ?? "";

  const approvalUrl = approvalPath?.startsWith("http")
    ? approvalPath
    : `${WORKFLOW_SITE}${approvalPath}`;

  const getStaffsUrl = `${WORKFLOW_SITE}/FormTask/GetStaffs?taskid=${task.id}&ticket=${approve.ticket}`;
  const staffsGet = await (await fetch(getStaffsUrl)).text();
  const staffsPost = await (
    await fetch(getStaffsUrl, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: "name=",
    })
  ).text();

  const requestSample = {
    taskId: taskIdFromPage ?? task.id,
    channel: "",
    remark: "审批备注",
    isPass: "true|false",
    sign,
    level: "",
    notifiers: "",
  };

  let approveResult = null;
  let rejectResult = null;
  if (!APPROVE_DRY && approvalUrl) {
    const approveBody = new URLSearchParams({
      taskId: String(task.id),
      channel: "",
      remark: "抓包测试-通过",
      isPass: "true",
      sign,
      level: "",
      notifiers: "",
    });
    const res = await fetch(approvalUrl, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: approveBody,
    });
    approveResult = await res.json();

    const rejectBody = new URLSearchParams({
      taskId: String(task.id),
      channel: "",
      remark: "抓包测试-驳回",
      isPass: "false",
      sign,
      level: "",
      notifiers: "",
    });
    const res2 = await fetch(approvalUrl, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: rejectBody,
    });
    try {
      rejectResult = await res2.json();
    } catch {
      rejectResult = await res2.text();
    }
  }

  return redact({
    account: { user: APPROVE_USER, name: approve.name },
    taskSample: {
      id: task.id,
      name: task.name,
      number: task.number,
      tag: task.tag,
      handleUrl: task.handleUrl,
    },
    handleUrlTemplate:
      "{WorkflowWebsiteUrl}/FormTask/Handle?flowtag=Travel&taskid={taskId}&ticket={ticket}&isApp=true&lang=cn",
    detailUrlTemplate:
      "{WorkflowWebsiteUrl}/FormTask/Detail?flowtag=Travel&taskId={taskId}&sign={sign}&ticket={ticket}",
    approvalUrlTemplate: "{WorkflowWebsiteUrl}/FormTask/Approval?ticket={ticket}",
    contentType: "multipart/form-data (browser) or application/x-www-form-urlencoded",
    requestFields: {
      taskId: "required — from window.TaskId",
      isPass: "true=通过, false=拒绝",
      remark: "textarea task=remark, max 50",
      sign: "from window.sign (often empty on Handle page)",
      channel: "optional",
      level: "optional radio",
      notifiers: "JSON string [{Id,Name}] or empty",
      "FormDetails[]": "only if flowForm has editable fields on approval (Travel handle: datas=[])",
    },
    requestSample,
    getStaffs: {
      get: { url: "{WorkflowWebsiteUrl}/FormTask/GetStaffs?taskid={taskId}&ticket={ticket}", sample: staffsGet.slice(0, 300) },
      post: {
        url: "same",
        body: "name={search}",
        contentType: "application/x-www-form-urlencoded",
        sample: staffsPost.slice(0, 300),
      },
    },
    approveResult,
    rejectResult,
    successResponse: { Status: true, Message: null },
    alreadyHandledResponse: { Status: false, Message: "任务已经处理" },
    permissionError: "您没有权限查看或者任务已经过期",
    notes: [
      "Handle URL must include flowtag=Travel&taskid=…; handleUrl from task list alone is insufficient.",
      "Approval uses task.js task.handle → POST window.ApprovalUrl with FormData.",
    ],
  });
}

async function main() {
  const apply = await loginApi(APPLY_USER, APPLY_PASS);
  const approve = await loginApi(APPROVE_USER, APPROVE_PASS);

  const formAdd = await captureFormAdd(apply);
  const approval = await captureApproval(approve);

  const contract = redact({
    version: "2026-06-25",
    capturedAt: new Date().toISOString(),
    accounts: {
      apply: formAdd.account,
      approve: approval.account,
    },
    formAdd,
    approval,
  });

  save("submit-api-contract", contract);
  save("form-field-schema", {
    fields: formAdd.fields,
    travelTypes: formAdd.travelTypes,
    formAddContract: {
      url: formAdd.addUrlTemplate,
      topLevelFields: formAdd.topLevelFields,
      formDetailsShape: formAdd.formDetailsShape,
      formTimesShape: formAdd.formTimesShape,
      requestSampleKeys: Object.keys(formAdd.requestSample ?? {}).slice(0, 30),
      submitResult: formAdd.submitResult,
    },
    approvalContract: {
      url: approval.approvalUrlTemplate,
      requestFields: approval.requestFields,
      approveResult: approval.approveResult,
    },
  });

  console.log("\nSummary:");
  console.log("  Form/Add fields:", formAdd.fieldCount);
  console.log("  Form/Add submit:", formAdd.submitResult?.Status ?? (SUBMIT_DRY ? "dry-run" : "n/a"));
  console.log("  Approval task:", approval.taskSample?.id ?? "none");
  console.log("  Approval result:", approval.approveResult?.Status ?? (APPROVE_DRY ? "dry-run" : "n/a"));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
