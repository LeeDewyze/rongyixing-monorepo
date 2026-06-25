#!/usr/bin/env node
/**
 * Proxy probe: login → Workbench-Load → travel/approval APIs.
 *
 * Usage:
 *   pnpm --filter @ryx/api build
 *   TRAVEL_PROXY_USER=Test15011350510 TRAVEL_PROXY_PASS=Temp123456 \
 *     node packages/api/scripts/verify-travel-proxy.mjs
 */
import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { createApi } from "../dist/index.js";
import { APPROVAL_FLOW_METHODS } from "../dist/methods/approval-flow.js";
import { TMC_METHODS } from "../dist/methods/tmc.js";
import { TRAVEL_FLOW_METHODS } from "../dist/methods/travel-flow.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const FIXTURE_DIR = join(__dirname, "../../../docs/api/fixtures/travel-proxy");

const USER = process.env.TRAVEL_PROXY_USER ?? "T289G003";
const PASS = process.env.TRAVEL_PROXY_PASS ?? "Temp123456";
const BASE = process.env.TRAVEL_PROXY_BASE ?? "http://app.rtesp.com";

function log(step, data) {
  console.log(`\n=== ${step} ===`);
  console.log(JSON.stringify(data, null, 2).slice(0, 8000));
}

function save(name, data) {
  mkdirSync(FIXTURE_DIR, { recursive: true });
  const path = join(FIXTURE_DIR, `${name}.json`);
  writeFileSync(path, JSON.stringify(data, null, 2), "utf8");
  console.log(`saved ${path}`);
}

function flattenWorkbench(raw) {
  if (!raw || typeof raw !== "object") return [];
  return Object.entries(raw).flatMap(([group, items]) => {
    const list = Array.isArray(items) ? items : [];
    return list.map((item) => ({
      group,
      name: item?.Name,
      url: item?.Url,
      imageUrl: item?.ImageUrl,
      tag: item?.Url?.tag,
    }));
  });
}

function findWorkbenchEntry(entries, keywords) {
  return entries.filter((entry) => {
    const hay = `${entry.group ?? ""}${entry.name ?? ""}${JSON.stringify(entry.url ?? "")}`.toLowerCase();
    return keywords.some((k) => hay.includes(k.toLowerCase()));
  });
}

let ticket = "";

const api = createApi({
  baseUrl: BASE,
  mode: "proxy",
  appId: "com.ronglvonline.app",
  getTicket: () => ticket,
  getTicketName: () => "ticket",
  getDomain: () => "rtesp.com",
  getLanguage: () => "cn",
  getExtraFields: () => ({ root: "rl", IsShowLoading: "true" }),
});

async function main() {
  const login = await api.authProxy.login({
    Name: USER,
    Password: PASS,
    Device: "travel-proxy-probe",
    DeviceName: "travel-proxy-probe",
  });
  ticket = login.Ticket ?? "";
  if (!ticket) throw new Error(`Login failed for ${USER}`);
  save("login-response", { user: USER, ticketPreview: `${ticket.slice(0, 12)}…`, name: login.Name });
  log("login", { Name: login.Name, Ticket: `${ticket.slice(0, 12)}…` });

  const cfg = await api.proxy.loadApiConfig();
  save("api-config", cfg);

  const workbench = await api.proxy.send({
    method: TMC_METHODS.WORKBENCH_LOAD,
    data: {},
  });
  save("workbench-load-response", workbench);
  const entries = flattenWorkbench(workbench);
  save("workbench-entries", entries);
  log("workbench-travel-related", findWorkbenchEntry(entries, ["出差", "审批", "business", "travel", "apply"]));

  const travelUrl = await api.travel.getTravelUrl({
    staffNumber: null,
    staffOutNumber: null,
    name: null,
    travelType: "Flight",
  });
  save("get-travel-url-response", travelUrl);

  const pendingTasks = await api.approval.getOrderTasks({
    type: 1,
    pageIndex: 0,
    pageSize: 5,
  });
  save("order-task-list-pending", pendingTasks);

  const history = await api.approval.getWorkflowHistory({ pageIndex: 0, pageSize: 5 });
  save("workflow-history-list", history);

  const waiting = await api.approval.getWaitingTaskCount();
  save("waiting-task-count", { count: waiting });

  // Probe candidate apply methods (best-effort; may 404 on ryx).
  const candidates = [
    "FeatureRonglvUrl-jyx-GetTravelForms",
    "FeatureRonglvUrl-jyx-SaveTravelForms",
    "Tmc.Api.ForwardUrl-Yjx-GetTravelForms",
    "BpmApiExpenseUrl-Home-List",
  ];
  const probeResults = {};
  for (const method of candidates) {
    try {
      probeResults[method] = await api.proxy.send({
        method,
        data: {},
      });
    } catch (error) {
      probeResults[method] = { error: String(error) };
    }
  }
  save("apply-method-probes", probeResults);
  log("apply-method-probes", probeResults);

  console.log("\nOK — fixtures written to docs/api/fixtures/travel-proxy/");
}

main().catch((err) => {
  console.error("\nFAILED:", err);
  process.exit(1);
});
