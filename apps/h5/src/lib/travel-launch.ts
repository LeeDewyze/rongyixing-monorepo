import { fetchTravelApplyStaffOptions, staffPickerOptions } from "@/lib/travel-apply";
import { getWorkflowApiSite, getWorkflowSite } from "@/lib/workflow-site";

export interface TravelLaunchRecord {
  approver: string;
  status: string;
  remark: string;
}

export interface TravelLaunchNode {
  name: string;
  status: string;
}

export interface TravelLaunchView {
  records: TravelLaunchRecord[];
  nodes: TravelLaunchNode[];
  diagramImageUrls: string[];
  notifyTypes: TravelLaunchNotifyType[];
}

export interface TravelLaunchNotifyType {
  value: string;
  label: string;
}

export interface TravelLaunchNotifier {
  id: string;
  name: string;
}

export interface TravelLaunchStep {
  people: string[];
  status: string;
}

function decodeHtmlText(value: string): string {
  return value
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/gi, " ")
    .replace(/&#x([0-9a-f]+);/gi, (_, hex: string) => String.fromCharCode(Number.parseInt(hex, 16)))
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim();
}

function isHeaderRow(cells: string[]): boolean {
  return cells[0] === "审批人" || cells[0] === "姓名";
}

export function parseTravelLaunchNotifyTypes(html: string): TravelLaunchNotifyType[] {
  const select = html.match(
    /<select\b[^>]*(?:task|name)=["']notifyType["'][^>]*>([\s\S]*?)<\/select>/i,
  );
  if (!select) return [];
  const types: TravelLaunchNotifyType[] = [];
  for (const option of select[1].matchAll(/<option\b([^>]*)>([\s\S]*?)<\/option>/gi)) {
    const value = option[1].match(/value=["']([^"']*)["']/i)?.[1] ?? "";
    const label = decodeHtmlText(option[2]);
    if (!value) continue;
    types.push({ value, label: label || value });
  }
  return types;
}

export function notifierDisplayName(label: string): string {
  const dash = label.indexOf("-");
  return dash > 0 ? label.slice(dash + 1).trim() || label : label;
}

const DECORATIVE_IMAGE = /(?:addnotifier|chacha|close|delete|edit|print|tag|log|plus|icon|btn)/i;

export function isTravelLaunchDiagramImage(src: string): boolean {
  if (!src || src.startsWith("data:")) return false;
  if (DECORATIVE_IMAGE.test(src)) return false;
  return /chart|flow|diagram|taskview|getimage|workflow/i.test(src);
}

export function resolveWorkflowAssetUrl(src: string): string {
  if (!src || src.startsWith("data:") || /^https?:\/\//i.test(src)) return src;
  const site = getWorkflowSite();
  return src.startsWith("/") ? `${site}${src}` : `${site}/${src}`;
}

/** "张海肖、李四" or "1796564-张海肖" → individual display names. */
export function splitTravelLaunchPeople(name: string): string[] {
  return name
    .split(/[,，、/;；|]+/)
    .map((part) => part.replace(/^\d{4,}-/, "").trim())
    .filter(Boolean);
}

export function toTravelLaunchSteps(nodes: TravelLaunchNode[]): TravelLaunchStep[] {
  return nodes
    .map((node) => ({
      people: splitTravelLaunchPeople(node.name),
      status: node.status.trim(),
    }))
    .filter((step) => step.people.length > 0 || step.status);
}

export function resolveTravelLaunchDiagram(view: TravelLaunchView): {
  images: string[];
  nodes: TravelLaunchNode[];
  steps: TravelLaunchStep[];
} {
  const images = view.diagramImageUrls
    .filter(isTravelLaunchDiagramImage)
    .map(resolveWorkflowAssetUrl);
  const fromRecords = view.records.map((row) => ({ name: row.approver, status: row.status }));
  const nodes = view.nodes.length >= fromRecords.length ? view.nodes : fromRecords;
  return { images, nodes, steps: toTravelLaunchSteps(nodes) };
}

export function parseTravelLaunchView(html: string): TravelLaunchView {
  const records: TravelLaunchRecord[] = [];
  for (const row of html.matchAll(/<tr\b[^>]*>([\s\S]*?)<\/tr>/gi)) {
    const cells = Array.from(row[1].matchAll(/<t[dh]\b[^>]*>([\s\S]*?)<\/t[dh]>/gi)).map((cell) =>
      decodeHtmlText(cell[1]),
    );
    if (cells.length < 2 || isHeaderRow(cells)) continue;
    records.push({
      approver: cells[0] ?? "",
      status: cells[1] ?? "",
      remark: cells[2] ?? "",
    });
  }

  const nodes: TravelLaunchNode[] = [];
  for (const chunk of html.split(/class=["'][^"']*formdetail-task/i).slice(1)) {
    const status = decodeHtmlText(chunk.match(/status[^>]*>([\s\S]*?)</i)?.[1] ?? "");
    const name = decodeHtmlText(chunk.match(/taskname[^>]*>([\s\S]*?)</i)?.[1] ?? "");
    if (name || status) nodes.push({ name, status });
  }

  const diagramImageUrls = Array.from(
    html.matchAll(/<img\b[^>]*src=["']([^"']+)["'][^>]*>/gi),
    (match) => match[1],
  ).filter(isTravelLaunchDiagramImage);

  return { records, nodes, diagramImageUrls, notifyTypes: parseTravelLaunchNotifyTypes(html) };
}

export function buildTravelLaunchUrl(ticket: string): string {
  const params = new URLSearchParams({ ticket, CheckFlowType: "", FlowTag: "Travel" });
  return `${getWorkflowSite()}/FormTask/Launch?${params.toString()}`;
}

/** Legacy `task.launch` — HTML for 审批图 / 审批记录 / 抄送人. */
export async function fetchTravelFormLaunchHtml(ticket: string, formId: string): Promise<string> {
  const url = new URL(buildTravelLaunchUrl(ticket));
  url.searchParams.set("Id", formId);
  const response = await fetch(url.toString(), {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ id: formId }).toString(),
  });
  if (!response.ok) {
    throw new Error(`加载报审信息失败：HTTP ${response.status}`);
  }
  return response.text();
}

export async function fetchTravelLaunchView(
  ticket: string,
  formId: string,
): Promise<TravelLaunchView> {
  const html = await fetchTravelFormLaunchHtml(ticket, formId);
  return parseTravelLaunchView(html);
}

export function buildTravelLaunchStaffDataUrl(ticket: string): string {
  const params = new URLSearchParams({
    HasNumber: "true",
    OnlyLoadCompany: "true",
    ticket,
    formId: "",
  });
  return `${getWorkflowApiSite()}/StaffCtrl/GetDatas?${params.toString()}`;
}

export async function searchTravelLaunchStaffOptions(ticket: string, keyword: string) {
  const options = await fetchTravelApplyStaffOptions(
    buildTravelLaunchStaffDataUrl(ticket),
    keyword,
  );
  return staffPickerOptions(options);
}
