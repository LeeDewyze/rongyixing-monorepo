import type { ApprovalTask } from "@ryx/shared-types";

import { getRequestLanguage } from "@/lib/request-context";
import { getTicket } from "@/lib/session";

const WORKFLOW_SITE = "http://workflow.rtesp.com";

const TRAVEL_FORM_STATUS: Record<number, string> = {
  1: "草稿",
  2: "审批中",
  3: "已通过",
  4: "审批中",
  5: "已驳回",
  6: "已关闭",
};

type FormDetailRow = {
  Name?: string;
  Content?: string;
  Id?: number | string;
};

type TravelFormRow = {
  Id?: number | string;
  Name?: string;
  Status?: number;
  Number?: string;
  FormDetails?: FormDetailRow[];
};

function readFormDetail(form: TravelFormRow, name: string): string {
  return form.FormDetails?.find((row) => row.Name === name)?.Content?.trim() ?? "";
}

function parseDetailIdFromBlock(block: string): string {
  const match =
    block.match(/Form\/Detail\?[^"'<>]*(?:^|[?&])Id=(\d+)/i) ??
    block.match(/Form\/Detail\?Id=(\d+)/i);
  return match?.[1] ?? "";
}

function resolveFormId(form: TravelFormRow, detailId: string): string {
  if (detailId) return detailId;
  if (form.Id != null && `${form.Id}` !== "0") {
    return String(form.Id);
  }
  return "";
}

/** Legacy Form/Detail — Id is the form entity id, not FormDetails field id. */
export function buildTravelFormDetailUrl(ticket: string, formId: string): string {
  const params = new URLSearchParams({
    Id: formId,
    opentype: "",
    ticket,
    CheckFlowType: "",
    FlowTag: "",
  });
  return `${WORKFLOW_SITE}/Form/Detail?${params.toString()}`;
}

/** Legacy open-url iframe params for embedded workflow pages. */
export function buildTravelFormDetailOpenUrl(formId: string): string | undefined {
  const ticket = getTicket();
  if (!ticket || !formId) return undefined;
  const params = new URLSearchParams({
    Id: formId,
    ticket,
    CheckFlowType: "",
    FlowTag: "",
    lang: getRequestLanguage(),
    isApp: "true",
    opentype: "iframe",
  });
  return `${WORKFLOW_SITE}/Form/Detail?${params.toString()}`;
}

/** Legacy workflow `Form/List?FlowTag=Travel` — applications submitted by current user. */
export function parseTravelFormListHtml(html: string, ticket: string): ApprovalTask[] {
  const tasks: ApprovalTask[] = [];
  const blocks = html.split(/<div class="mytask-task"/i).slice(1);

  for (const block of blocks) {
    const formDataMatch = block.match(/form-data='([^']+)'/);
    if (!formDataMatch?.[1]) continue;

    let form: TravelFormRow;
    try {
      form = JSON.parse(formDataMatch[1]) as TravelFormRow;
    } catch {
      continue;
    }

    const id = resolveFormId(form, parseDetailIdFromBlock(block));
    if (!id) continue;

    const travelNumber = readFormDetail(form, "差旅单号") || form.Number || "";
    const reason = readFormDetail(form, "出差事由");
    const status = form.Status;
    const statusName =
      (typeof status === "number" ? TRAVEL_FORM_STATUS[status] : undefined) ??
      (status != null ? String(status) : undefined);

    tasks.push({
      id,
      name: reason ? `${form.Name ?? "出差申请"} · ${reason}` : (form.Name ?? "出差申请"),
      number: travelNumber || undefined,
      status,
      statusName,
      tag: "Travel",
      url: buildTravelFormDetailUrl(ticket, id),
    });
  }

  return tasks;
}

export async function fetchMyTravelApplications(ticket: string): Promise<ApprovalTask[]> {
  const params = new URLSearchParams({
    ticket,
    CheckFlowType: "",
    FlowTag: "Travel",
  });
  const response = await fetch(`${WORKFLOW_SITE}/Form/List?${params.toString()}`);
  if (!response.ok) {
    throw new Error(`加载我的申请失败：HTTP ${response.status}`);
  }
  const html = await response.text();
  return parseTravelFormListHtml(html, ticket);
}
