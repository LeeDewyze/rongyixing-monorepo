import type { ApprovalTask } from "@ryx/shared-types";

import { buildApprovalTaskOpenUrl } from "@/lib/approval-task-url";
import { getRequestLanguage } from "@/lib/request-context";
import { getTicket } from "@/lib/session";
import { getWorkflowSite } from "@/lib/workflow-site";
import { fetchWorkflowEmbedSrcdoc, isWorkflowEmbedUrl } from "@/lib/workflow-embed";
import {
  fetchTravelFormData,
  fetchTravelFormDetailHtml,
  readTravelNumberFromFormGet,
} from "@/lib/travel-apply";

const TRAVEL_FORM_STATUS: Record<number, string> = {
  1: "草稿",
  2: "待审核",
  3: "等待报送",
  4: "待审核",
  5: "已驳回",
  6: "已关闭",
};

type FormDetailRow = {
  Name?: string;
  Content?: string;
  Number?: string;
  Tag?: string;
  Id?: number | string;
};

type TravelFormRow = {
  Id?: number | string;
  Name?: string;
  Status?: number;
  Number?: string;
  OutNumber?: string;
  FormDetails?: FormDetailRow[];
};

function isInternalWorkflowNumber(value: string): boolean {
  return /^[0-9a-f]{32}$/i.test(value.trim());
}

function isNumericEntityId(value: string): boolean {
  return /^\d{10,}$/.test(value.trim());
}

function isTravelDisplayNumber(value: string): boolean {
  const trimmed = value.trim();
  if (!trimmed) return false;
  if (isInternalWorkflowNumber(trimmed)) return false;
  if (isNumericEntityId(trimmed)) return false;
  return true;
}

function readFormDetail(form: TravelFormRow, name: string): string {
  for (const row of form.FormDetails ?? []) {
    if (row.Name?.trim() !== name) continue;
    const value = row.Content?.trim() || row.Number?.trim() || "";
    if (value) return value;
  }
  return "";
}

function readTravelFormDetail(form: TravelFormRow): string {
  for (const row of form.FormDetails ?? []) {
    const name = row.Name?.trim() ?? "";
    const tag = row.Tag?.trim() ?? "";
    if (name !== "差旅单号" && tag !== "TravelNumber") continue;
    const value = row.Content?.trim() || row.Number?.trim() || "";
    if (value) return value;
  }
  return "";
}

function resolveTravelFormNumber(form: TravelFormRow): string {
  const travelNumber = readTravelFormDetail(form);
  if (travelNumber) return travelNumber;

  const outNumber = form.OutNumber?.trim() ?? "";
  if (isTravelDisplayNumber(outNumber)) return outNumber;

  const formNumber = form.Number?.trim() ?? "";
  if (isTravelDisplayNumber(formNumber)) return formNumber;

  return "";
}

function decodeHtmlAttribute(value: string): string {
  return value
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&#x27;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&amp;/gi, "&");
}

function parseDetailIdFromBlock(block: string): string {
  const match = block.match(/Form\/Detail\?([^"'<>]+)/i);
  if (!match?.[1]) return "";

  const query = decodeHtmlAttribute(match[1]);
  return new URLSearchParams(query).get("Id") ?? "";
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
  return `${getWorkflowSite()}/Form/Detail?${params.toString()}`;
}

/** Legacy open-url iframe params for embedded workflow pages. */
export function buildTravelFormEditUrl(formId: string): string {
  return `/travel/apply?editId=${formId}`;
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
  return `${getWorkflowSite()}/Form/Detail?${params.toString()}`;
}

/** Parse travel number from workflow HTML (Form/List or Form/Detail form-data). */
export function parseTravelNumberFromWorkflowHtml(
  html: string,
  formId?: string,
): string | undefined {
  const formDataMatches = Array.from(html.matchAll(/\bform-data\s*=\s*(['"])([\s\S]*?)\1/gi));

  for (const [index, formDataMatch] of formDataMatches.entries()) {
    const blockStart = formDataMatch.index ?? 0;
    const nextBlockStart = formDataMatches[index + 1]?.index ?? html.length;
    const block = html.slice(blockStart, nextBlockStart);
    const formData = decodeHtmlAttribute(formDataMatch[2] ?? "");
    if (!formData) continue;

    let form: TravelFormRow;
    try {
      form = JSON.parse(formData) as TravelFormRow;
    } catch {
      continue;
    }

    const id = resolveFormId(form, parseDetailIdFromBlock(block));
    if (formId && id && id !== formId) continue;

    const travelNumber = resolveTravelFormNumber(form);
    if (travelNumber) return travelNumber;
  }

  // FormTask/Handle escapes field labels as entities (差旅单号 → &#x5DEE;…), so the rendered
  // detail block can only be matched on the control tag attribute, not the localized label.
  const controlMatch = html.match(/detailCtrlTag=["']TravelNumber["'][^>]*>([\s\S]*?)<\/div>/i);
  if (controlMatch?.[1]) {
    const number = decodeHtmlAttribute(controlMatch[1].replace(/<[^>]+>/g, "").trim());
    if (isTravelDisplayNumber(number)) return number;
  }

  const fieldMatch = html.match(
    /class="element-tip">差旅单号<\/div>\s*<div class="element-content"[^>]*>\s*([\s\S]*?)<\/div>/i,
  );
  if (fieldMatch?.[1]) {
    const number = decodeHtmlAttribute(fieldMatch[1].replace(/<[^>]+>/g, "").trim());
    if (isTravelDisplayNumber(number)) return number;
  }

  return undefined;
}

/** Parse legacy workflow page bootstrap id (FormTask/Handle, Form/Detail). */
export function parseFormIdFromWorkflowHtml(html: string): string | undefined {
  const match = html.match(/window\.FormId\s*=\s*['"](\d+)['"]/);
  return match?.[1];
}

/** Resolve travel number for approval cards — same sources as 我的申请 list parsing. */
export async function fetchTravelNumberByFormId(
  ticket: string,
  formId: string,
): Promise<string | undefined> {
  const detailHtml = await fetchTravelFormDetailHtml(ticket, formId);
  const fromDetail = parseTravelNumberFromWorkflowHtml(detailHtml, formId);
  if (fromDetail) return fromDetail;

  const controls = await fetchTravelFormData(ticket, formId);
  const fromGet = readTravelNumberFromFormGet(controls);
  if (fromGet && isTravelDisplayNumber(fromGet)) return fromGet;

  return undefined;
}

async function resolveTravelNumberFromTaskEmbed(
  task: ApprovalTask,
  ticket: string,
): Promise<string | undefined> {
  const html = await fetchWorkflowEmbedSrcdoc(buildApprovalTaskOpenUrl(task) ?? "");
  if (!html) return undefined;

  const formId = task.consumerId ?? parseFormIdFromWorkflowHtml(html);
  const number = parseTravelNumberFromWorkflowHtml(html, formId);
  if (number) return number;

  if (!formId) return undefined;
  return fetchTravelNumberByFormId(ticket, formId);
}

/** Resolve travel number using the same workflow embed HTML as the approval detail page. */
export async function fetchTravelNumberByApprovalTask(
  task: ApprovalTask,
): Promise<string | undefined> {
  const ticket = getTicket();
  const taskUrl = buildApprovalTaskOpenUrl(task);

  if (taskUrl && isWorkflowEmbedUrl(taskUrl) && ticket) {
    try {
      const number = await resolveTravelNumberFromTaskEmbed(task, ticket);
      if (number) return number;
    } catch {
      // fall through to form id lookup
    }
  }

  if (!ticket) return undefined;

  if (task.consumerId) {
    const number = await fetchTravelNumberByFormId(ticket, task.consumerId);
    if (number) return number;
  }

  if (task.url?.includes("/Form/Detail")) {
    return fetchTravelNumberByFormId(ticket, task.id);
  }

  return undefined;
}

/** Legacy workflow `Form/List?FlowTag=Travel` — applications submitted by current user. */
export function parseTravelFormListHtml(html: string, ticket: string): ApprovalTask[] {
  const tasks: ApprovalTask[] = [];
  const formDataMatches = Array.from(html.matchAll(/\bform-data\s*=\s*(['"])([\s\S]*?)\1/gi));

  for (const [index, formDataMatch] of formDataMatches.entries()) {
    const blockStart = formDataMatch.index ?? 0;
    const nextBlockStart = formDataMatches[index + 1]?.index ?? html.length;
    const block = html.slice(blockStart, nextBlockStart);
    const formData = decodeHtmlAttribute(formDataMatch[2] ?? "");
    if (!formData) continue;

    let form: TravelFormRow;
    try {
      form = JSON.parse(formData) as TravelFormRow;
    } catch {
      continue;
    }

    const id = resolveFormId(form, parseDetailIdFromBlock(block));
    if (!id) continue;

    const travelNumber = resolveTravelFormNumber(form);
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
  const response = await fetch(`${getWorkflowSite()}/Form/List?${params.toString()}`);
  if (!response.ok) {
    throw new Error(`加载我的申请失败：HTTP ${response.status}`);
  }
  const html = await response.text();
  return parseTravelFormListHtml(html, ticket);
}
