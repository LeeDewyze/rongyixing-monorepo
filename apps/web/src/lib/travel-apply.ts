import { addDays, todayDateString } from "@/lib/date-search";
import { getBpmExpenseSite, getWorkflowSite } from "@/lib/workflow-site";

export interface TravelApplyRawControl {
  id: string | null;
  label: string | null;
  tag: string | null;
  controlType: string;
  defaultUrl?: string;
  dataUrl?: string;
  slaves?: TravelApplyRawControl[] | null;
}

export interface TravelApplyOption {
  label: string;
  value: string;
}

export interface TravelApplyCity extends TravelApplyOption {
  pinyin?: string;
  searchValue?: string | null;
  isHot?: boolean;
}

export interface TravelApplyTraveler {
  account: TravelApplyOption;
  policyId?: string;
}

export interface TravelApplySegment {
  startDate: string;
  endDate: string;
  fromCity: TravelApplyCity;
  toCity: TravelApplyCity;
}

export interface TravelApplyMeta {
  addUrl: string;
  /** Legacy `window.SendUrl` — POST with `Id` + `IsIgnoreWarning` after Form/Add. */
  sendUrl: string;
  workflowId: string;
  controls: TravelApplyRawControl[];
  travelNumber: TravelApplyOption;
  applicant: TravelApplyOption;
  organization: TravelApplyOption;
  position: TravelApplyOption;
  /** Default traveler from StaffCtrl/DefaultData (current user). */
  defaultAccount: TravelApplyOption;
  staffDataUrl: string;
  staffOptions: TravelApplyOption[];
  policyDefaultUrl: string;
  travelTypes: TravelApplyOption[];
  cities: TravelApplyCity[];
}

export interface TravelApplyFormValues {
  travelTypes: string[];
  reason: string;
  travelers: TravelApplyTraveler[];
  segments: TravelApplySegment[];
}

export interface TravelApplySubmitResult {
  Status: boolean;
  Message: string | null;
  Data?: {
    Id?: number;
  };
}

export interface TravelApplySubmitOptions {
  /** Legacy `#isSend` — when true (default), call TravelTask/Send after save. */
  submitForApproval?: boolean;
}

interface FlowFormDefaultValue {
  label?: string | null;
  value?: string | number | null;
  Text?: string | null;
  Value?: string | number | null;
  Data?: FlowFormDefaultValue | FlowFormDefaultValue[] | string | number | null;
}

function toAbsoluteWorkflowUrl(url: string): string {
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  return `${getWorkflowSite()}${url.startsWith("/") ? "" : "/"}${url}`;
}

/**
 * Workflow answers an unusable ticket with a 302 to the login site, and both hosts send
 * `Access-Control-Allow-Origin: *`, so fetch silently resolves with the login page HTML.
 */
function isLoginRedirect(response: Response): boolean {
  if (!response.redirected) return false;
  try {
    return new URL(response.url).hostname.startsWith("login.");
  } catch {
    return false;
  }
}

async function fetchText(url: string, init?: RequestInit): Promise<string> {
  let response: Response;
  try {
    response = await fetch(url, init);
  } catch (error) {
    throw new Error(error instanceof Error ? error.message : "接口请求失败");
  }
  if (isLoginRedirect(response)) {
    throw new Error("登录已过期，请重新登录");
  }
  if (!response.ok) {
    throw new Error(`请求失败(${response.status})`);
  }
  return response.text();
}

async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const text = await fetchText(url, init);
  if (!text.trim()) return null as T;
  return JSON.parse(text) as T;
}

function parseFlowControls(html: string): TravelApplyRawControl[] {
  const match = html.match(/var datas\s*=\s*(\[[\s\S]*?\])\s*;/);
  if (!match?.[1]) {
    throw new Error("未解析到出差申请表单字段");
  }
  return JSON.parse(match[1]) as TravelApplyRawControl[];
}

function parseSendUrl(html: string): string {
  const match = html.match(/SendUrl\s*=\s*"([^"]+)"/);
  return match?.[1] ?? "";
}

function parseAddUrl(html: string): string {
  const match = html.match(/AddUrl\s*:\s*"([^"]+)"/);
  if (!match?.[1]) {
    throw new Error("未解析到出差申请提交地址");
  }
  return match[1];
}

function parseWorkflowId(html: string): string {
  return html.match(/WorkflowId\s*=\s*['"]([^'"]+)['"]/)?.[1] ?? "318";
}

function findControl(
  controls: TravelApplyRawControl[],
  predicate: (control: TravelApplyRawControl) => boolean,
): TravelApplyRawControl | undefined {
  for (const control of controls) {
    if (predicate(control)) return control;
    const nested = findControl(control.slaves ?? [], predicate);
    if (nested) return nested;
  }
  return undefined;
}

function normalizeDefaultValue(value: FlowFormDefaultValue | null): TravelApplyOption {
  const raw = value?.Data ?? value;
  const item = Array.isArray(raw) ? raw[0] : raw;
  if (item == null || typeof item === "string" || typeof item === "number") {
    const text = item == null ? "" : String(item);
    return { label: text, value: text };
  }
  const label = item.label ?? item.Text ?? "";
  const number = item.value ?? item.Value ?? "";
  return { label: label ?? "", value: number == null ? "" : String(number) };
}

function normalizeOptions(value: unknown): TravelApplyOption[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      const row = item as {
        label?: string;
        value?: string | number;
        Text?: string;
        Value?: string | number;
      };
      const label = row.label ?? row.Text ?? "";
      const optionValue = row.value ?? row.Value ?? label;
      if (!label) return null;
      return { label, value: String(optionValue) };
    })
    .filter((item): item is TravelApplyOption => item != null);
}

function normalizeCities(value: unknown): TravelApplyCity[] {
  if (!Array.isArray(value)) return [];
  return value
    .map<TravelApplyCity | null>((item) => {
      if (!item || typeof item !== "object") return null;
      const row = item as {
        label?: string;
        value?: string | number;
        pinyin?: string;
        searchValue?: string | null;
        isHot?: boolean;
      };
      if (!row.label || row.value == null) return null;
      return {
        label: row.label,
        value: String(row.value),
        pinyin: row.pinyin,
        searchValue: row.searchValue,
        isHot: Boolean(row.isHot),
      };
    })
    .filter((item): item is TravelApplyCity => item != null);
}

async function fetchDefault(
  control: TravelApplyRawControl | undefined,
): Promise<TravelApplyOption> {
  if (!control?.defaultUrl) return { label: "", value: "" };
  try {
    return normalizeDefaultValue(await fetchJson<FlowFormDefaultValue>(control.defaultUrl));
  } catch {
    return { label: "", value: "" };
  }
}

function appendQueryParam(url: string, key: string, value: string): string {
  const separator = url.includes("?") ? "&" : "?";
  return `${url}${separator}${encodeURIComponent(key)}=${encodeURIComponent(value)}`;
}

/** Workflow StaffCtrl/GetDatas uses `name` for server-side staff filtering. */
export async function fetchTravelApplyStaffOptions(
  staffDataUrl: string,
  keyword: string,
): Promise<TravelApplyOption[]> {
  if (!staffDataUrl) return [];
  const trimmed = keyword.trim();
  const url = trimmed ? appendQueryParam(staffDataUrl, "name", trimmed) : staffDataUrl;
  return normalizeOptions(await fetchJson<unknown>(url));
}

/** Resolve travel policy id for a staff account (workflow StaffCtrl/GetDefaultPolicy). */
export async function fetchTravelApplyPolicy(
  policyDefaultUrl: string,
  accountId: string,
): Promise<string> {
  if (!policyDefaultUrl || !accountId) return "";
  const candidates = [
    appendQueryParam(policyDefaultUrl, "value", accountId),
    appendQueryParam(policyDefaultUrl, "accountId", accountId),
    policyDefaultUrl,
  ];
  for (const url of candidates) {
    try {
      const raw = await fetchJson<FlowFormDefaultValue>(url);
      const picked = normalizeDefaultValue(raw);
      const id = picked.value || picked.label;
      if (id) return id;
    } catch {
      // try next candidate
    }
  }
  return "";
}

export function defaultTravelApplyDates() {
  const startDate = todayDateString();
  return {
    startDate,
    endDate: addDays(startDate, 1),
  };
}

export function findTravelApplyCity(
  cities: TravelApplyCity[],
  name: string,
  fallback?: TravelApplyCity,
): TravelApplyCity {
  return cities.find((city) => city.label === name) ?? fallback ?? cities[0];
}

export function emptyTravelApplyCity(): TravelApplyCity {
  return { label: "", value: "" };
}

export function defaultTravelApplySegment(_cities: TravelApplyCity[]): TravelApplySegment {
  const dates = defaultTravelApplyDates();
  return {
    ...dates,
    fromCity: emptyTravelApplyCity(),
    toCity: emptyTravelApplyCity(),
  };
}

export function defaultTravelApplyTraveler(defaultAccount: TravelApplyOption): TravelApplyTraveler {
  return { account: defaultAccount };
}

export function emptyTravelApplyTraveler(): TravelApplyTraveler {
  return { account: { label: "", value: "" } };
}

export function resolveTravelApplyCityByLabel(
  cities: TravelApplyCity[],
  label: string,
): TravelApplyCity {
  const trimmed = label.trim();
  if (!trimmed) return emptyTravelApplyCity();
  return cities.find((city) => city.label === trimmed) ?? { label: trimmed, value: "" };
}

export function resolveTravelApplyStaffByLabel(
  staffOptions: TravelApplyOption[],
  label: string,
): TravelApplyOption {
  const trimmed = label.trim();
  if (!trimmed) return { label: "", value: "" };
  return staffOptions.find((staff) => staff.label === trimmed) ?? { label: trimmed, value: "" };
}

function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&#x([0-9a-fA-F]+);/g, (_, hex: string) => String.fromCodePoint(parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, num: string) => String.fromCodePoint(Number(num)))
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"');
}

function normalizeDetailDate(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return "";
  return trimmed.slice(0, 10);
}

function stripHtmlTags(value: string): string {
  return value.replace(/<[^>]+>/g, "").trim();
}

function parseDetailFieldsFromBlock(block: string): Record<string, string> {
  const fields: Record<string, string> = {};

  const desktopFieldRe =
    /class="element-tip">([^<]+)<\/div>\s*<div class="element-content"[^>]*>\s*([\s\S]*?)<\/div>/g;
  let match: RegExpExecArray | null;
  while ((match = desktopFieldRe.exec(block)) !== null) {
    const label = decodeHtmlEntities(match[1].trim());
    fields[label] = decodeHtmlEntities(stripHtmlTags(match[2]));
  }
  if (Object.keys(fields).length > 0) return fields;

  // Mobile Form/Detail emits `<tr >` (space before `>`) and may wrap cell text on the next line.
  const mobileRowRe =
    /<tr\b[^>]*>\s*<td\b[^>]*>([\s\S]*?)<\/td>\s*<td\b([^>]*)>([\s\S]*?)<\/td>\s*<\/tr>/gi;
  while ((match = mobileRowRe.exec(block)) !== null) {
    const nameMatch = match[2].match(/detailCtrlName="([^"]*)"/i);
    const label = decodeHtmlEntities((nameMatch?.[1] ?? match[1]).trim());
    const value = decodeHtmlEntities(stripHtmlTags(match[3]));
    if (label) fields[label] = value;
  }

  return fields;
}

function pushParsedDetailSection(
  title: string,
  fields: Record<string, string>,
  accounts: Record<string, string>[],
  details: Record<string, string>[],
): void {
  if (title.startsWith("TravelAccount")) accounts.push(fields);
  if (title.startsWith("TravelDetail")) details.push(fields);
}

/** Legacy Form/Detail HTML — slave rows are rendered but not returned by Form/Get JSON. */
export function parseTravelFormDetailHtml(html: string): {
  accounts: Record<string, string>[];
  details: Record<string, string>[];
} {
  const accounts: Record<string, string>[] = [];
  const details: Record<string, string>[] = [];

  if (/<span class="formDetail-title">\s*Travel(?:Account|Detail)/i.test(html)) {
    const blocks = html.split(/<span class="formDetail-title">/i).slice(1);
    for (const block of blocks) {
      const titleMatch = block.match(/^([^<]+)</);
      if (!titleMatch) continue;
      const title = decodeHtmlEntities(titleMatch[1].trim());
      pushParsedDetailSection(title, parseDetailFieldsFromBlock(block), accounts, details);
    }
    if (accounts.length > 0 || details.length > 0) {
      return { accounts, details };
    }
  }

  const mobileSectionRe =
    /<div[^>]*detailCtrlType="(TravelAccount|TravelDetail)"[^>]*>([\s\S]*?)(?=<div[^>]*detailCtrlType="Travel|$)/gi;
  let sectionMatch: RegExpExecArray | null;
  while ((sectionMatch = mobileSectionRe.exec(html)) !== null) {
    const type = sectionMatch[1];
    const block = sectionMatch[2];
    const numMatch = block.match(/Travel(?:Account|Detail)(\d+)/i);
    const title = numMatch ? `${type}${numMatch[1]}` : type;
    pushParsedDetailSection(title, parseDetailFieldsFromBlock(block), accounts, details);
  }

  return { accounts, details };
}

export async function fetchTravelApplyMeta(ticket: string): Promise<TravelApplyMeta> {
  const html = await fetchText(`${getWorkflowSite()}/Form/Flow?flowtag=Travel&ticket=${ticket}`);
  const controls = parseFlowControls(html);
  const addUrl = parseAddUrl(html);
  const sendUrl = parseSendUrl(html);
  const workflowId = parseWorkflowId(html);

  const travelTypeControl = findControl(controls, (control) => control.tag === "TravelType");
  const cityControl = findControl(controls, (control) => control.tag === "FromCityName");
  const accountControl = findControl(controls, (control) => control.tag === "AccountId");
  const policyControl = findControl(controls, (control) => control.tag === "PolicyId");

  const [
    travelNumber,
    applicant,
    organization,
    position,
    defaultAccount,
    staffOptions,
    travelTypes,
    cities,
  ] = await Promise.all([
    fetchDefault(findControl(controls, (control) => control.tag === "TravelNumber")),
    fetchDefault(findControl(controls, (control) => control.label === "申请人")),
    fetchDefault(findControl(controls, (control) => control.label === "所属部门")),
    fetchDefault(findControl(controls, (control) => control.label === "所属职位")),
    fetchDefault(accountControl),
    accountControl?.dataUrl
      ? fetchJson<unknown>(accountControl.dataUrl).then(normalizeOptions)
      : Promise.resolve([]),
    travelTypeControl?.dataUrl
      ? fetchJson<unknown>(travelTypeControl.dataUrl).then(normalizeOptions)
      : Promise.resolve([]),
    cityControl?.dataUrl
      ? fetchJson<unknown>(cityControl.dataUrl).then(normalizeCities)
      : Promise.resolve([]),
  ]);

  const mergedStaff =
    defaultAccount.value && !staffOptions.some((item) => item.value === defaultAccount.value)
      ? [defaultAccount, ...staffOptions]
      : staffOptions;

  return {
    addUrl: toAbsoluteWorkflowUrl(addUrl),
    sendUrl: toAbsoluteWorkflowUrl(sendUrl),
    workflowId,
    controls,
    travelNumber,
    applicant,
    organization,
    position,
    defaultAccount,
    staffDataUrl: accountControl?.dataUrl ?? "",
    staffOptions: mergedStaff,
    policyDefaultUrl: policyControl?.defaultUrl ?? "",
    travelTypes,
    cities,
  };
}

export function travelCityPickerAdapter() {
  return {
    getId: (city: TravelApplyCity) => city.value,
    getCode: (city: TravelApplyCity) => city.value,
    getName: (city: TravelApplyCity) => city.label,
    getPinyin: (city: TravelApplyCity) => city.pinyin,
    getIsHot: (city: TravelApplyCity) => Boolean(city.isHot),
    getSearchValues: (city: TravelApplyCity) =>
      [city.value, city.label, city.pinyin, city.searchValue].filter(Boolean) as string[],
  };
}

export function staffPickerOptions(staff: TravelApplyOption[]) {
  return staff.map((item) => {
    const dashIndex = item.label.indexOf("-");
    const number = dashIndex > 0 ? item.label.slice(0, dashIndex) : "";
    const name = dashIndex > 0 ? item.label.slice(dashIndex + 1) : item.label;
    return {
      id: item.value,
      label: item.label,
      searchText: [item.value, item.label, number, name].filter(Boolean).join(" "),
    };
  });
}

async function resolveTravelersWithPolicy(
  meta: TravelApplyMeta,
  travelers: TravelApplyTraveler[],
): Promise<TravelApplyTraveler[]> {
  if (!meta.policyDefaultUrl) return travelers;
  return Promise.all(
    travelers.map(async (traveler) => {
      if (traveler.policyId) return traveler;
      const policyId = await fetchTravelApplyPolicy(meta.policyDefaultUrl, traveler.account.value);
      return { ...traveler, policyId };
    }),
  );
}

export function buildTravelApplyBody(
  meta: TravelApplyMeta,
  values: TravelApplyFormValues,
): URLSearchParams {
  const body = new URLSearchParams();
  body.append("Workflow.Id", meta.workflowId);
  body.append("Tag", "Travel");
  body.append("Name", "出差申请");
  body.append("formvalues", String(meta.controls.length));
  body.append("LastId", "");
  body.append("LastDateTime", "");
  body.append("ListCount", "");

  let detailIndex = 0;
  let timeIndex = 0;
  let sequence = 0;

  const accountSlave = findControl(meta.controls, (c) => c.tag === "TravelAccount");
  const detailSlave = findControl(meta.controls, (c) => c.tag === "TravelDetail");

  function appendDetail(
    control: TravelApplyRawControl,
    content: string,
    number = "",
    slave = "",
    slaveRow = 0,
  ) {
    body.append(`FormDetails[${detailIndex}].Id`, control.id ?? "");
    body.append(`FormDetails[${detailIndex}].Slave`, slave);
    body.append(`FormDetails[${detailIndex}].SlaveRow`, String(slaveRow));
    body.append(`FormDetails[${detailIndex}].Name`, control.label ?? "");
    body.append(`FormDetails[${detailIndex}].Tag`, control.tag ?? "");
    body.append(`FormDetails[${detailIndex}].Content`, content);
    body.append(`FormDetails[${detailIndex}].Sequence`, String(sequence++));
    body.append(`FormDetails[${detailIndex}].Number`, number);
    detailIndex += 1;
  }

  function appendTime(control: TravelApplyRawControl, time: string, slave = "", slaveRow = 0) {
    body.append(`FormTimes[${timeIndex}].Id`, control.id ?? "");
    body.append(`FormTimes[${timeIndex}].Slave`, slave);
    body.append(`FormTimes[${timeIndex}].SlaveRow`, String(slaveRow));
    body.append(`FormTimes[${timeIndex}].Name`, control.label ?? "");
    body.append(`FormTimes[${timeIndex}].Tag`, control.tag ?? "");
    body.append(`FormTimes[${timeIndex}].Time`, time);
    body.append(`FormTimes[${timeIndex}].Sequence`, String(sequence++));
    body.append(`FormTimes[${timeIndex}].Number`, "");
    timeIndex += 1;
  }

  function fillTravelAccountField(
    control: TravelApplyRawControl,
    traveler: TravelApplyTraveler,
    slaveRow: number,
  ) {
    switch (control.tag) {
      case "AccountId":
        appendDetail(
          control,
          traveler.account.label,
          traveler.account.value,
          "TravelAccount",
          slaveRow,
        );
        return;
      case "PolicyId":
        appendDetail(control, traveler.policyId ?? "", "", "TravelAccount", slaveRow);
        return;
      default:
        break;
    }
  }

  function fillTravelDetailField(
    control: TravelApplyRawControl,
    segment: TravelApplySegment,
    slaveRow: number,
  ) {
    switch (control.tag) {
      case "StartDate":
        appendTime(control, segment.startDate, "TravelDetail", slaveRow);
        return;
      case "EndDate":
        appendTime(control, segment.endDate, "TravelDetail", slaveRow);
        return;
      case "FromCityName":
        appendDetail(
          control,
          segment.fromCity.label,
          segment.fromCity.value,
          "TravelDetail",
          slaveRow,
        );
        return;
      case "ToCityName":
        appendDetail(control, segment.toCity.label, segment.toCity.value, "TravelDetail", slaveRow);
        return;
      default:
        break;
    }
  }

  function fillMainField(control: TravelApplyRawControl) {
    switch (control.tag) {
      case "TravelNumber":
        appendDetail(control, meta.travelNumber.label || meta.travelNumber.value);
        return;
      case "TravelType":
        appendDetail(control, values.travelTypes.join(","));
        return;
      default:
        break;
    }

    if (control.label === "申请人") {
      appendDetail(control, meta.applicant.label, meta.applicant.value);
      return;
    }
    if (control.label === "所属部门") {
      appendDetail(control, meta.organization.label, meta.organization.value);
      return;
    }
    if (control.label === "所属职位") {
      appendDetail(control, meta.position.label, meta.position.value);
      return;
    }
    if (control.label === "出差事由") {
      appendDetail(control, values.reason.trim());
    }
  }

  for (const control of meta.controls) {
    if (control.controlType === "Slave") {
      if (control.tag === "TravelAccount") {
        values.travelers.forEach((traveler, row) => {
          for (const child of accountSlave?.slaves ?? control.slaves ?? []) {
            fillTravelAccountField(child, traveler, row);
          }
        });
      } else if (control.tag === "TravelDetail") {
        values.segments.forEach((segment, row) => {
          for (const child of detailSlave?.slaves ?? control.slaves ?? []) {
            fillTravelDetailField(child, segment, row);
          }
        });
      }
      continue;
    }
    fillMainField(control);
  }

  return body;
}

/** Legacy `window.SendUrl` — expense-bpm TravelTask/Send. */
export function buildTravelSendUrl(ticket: string): string {
  const params = new URLSearchParams({ ticket, CheckFlowType: "", FlowTag: "Travel" });
  return `${getBpmExpenseSite()}/TravelTask/Send?${params.toString()}`;
}

/** Legacy `window.RemoveUrl` — workflow Form/Remove. */
export function buildTravelRemoveUrl(ticket: string): string {
  const params = new URLSearchParams({
    SaveNotifyUrl: "",
    ticket,
    CheckFlowType: "",
    FlowTag: "Travel",
  });
  return `${getWorkflowSite()}/Form/Remove?${params.toString()}`;
}

async function postTravelSend(
  sendUrl: string,
  formId: string | number,
): Promise<TravelApplySubmitResult> {
  const url = appendQueryParam(sendUrl, "Id", String(formId));
  return fetchJson<TravelApplySubmitResult>(url, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ IsIgnoreWarning: "true" }).toString(),
  });
}

/** Legacy `task.saveSend` / list `task.send` — submit saved form for approval. */
export async function sendTravelApplyForApproval(
  meta: TravelApplyMeta,
  formId: string | number,
): Promise<TravelApplySubmitResult> {
  const ticket = new URL(meta.addUrl).searchParams.get("ticket") ?? "";
  const sendUrl = meta.sendUrl || (ticket ? buildTravelSendUrl(ticket) : "");
  if (!sendUrl) {
    return { Status: false, Message: "未解析到出差申请报审地址" };
  }
  return postTravelSend(sendUrl, formId);
}

/** List-page 报审 — same TravelTask/Send as create-page immediate submit. */
export async function sendTravelApplyForApprovalByTicket(
  ticket: string,
  formId: string | number,
): Promise<TravelApplySubmitResult> {
  return postTravelSend(buildTravelSendUrl(ticket), formId);
}

async function saveAndMaybeSendTravelApply(
  meta: TravelApplyMeta,
  saveUrl: string,
  body: URLSearchParams,
  options: TravelApplySubmitOptions,
  formIdForSend?: string | number,
): Promise<TravelApplySubmitResult> {
  const submitForApproval = options.submitForApproval ?? true;
  const saveResult = await fetchJson<TravelApplySubmitResult>(saveUrl, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });

  if (!saveResult.Status || !submitForApproval) {
    return saveResult;
  }

  const formId = formIdForSend ?? saveResult.Data?.Id;
  if (formId == null) {
    return { Status: false, Message: "保存成功但未返回表单 ID", Data: saveResult.Data };
  }

  const sendResult = await sendTravelApplyForApproval(meta, formId);
  if (!sendResult.Status) {
    return {
      Status: false,
      Message: sendResult.Message ?? "报审失败",
      Data: saveResult.Data,
    };
  }

  return saveResult;
}

export async function submitTravelApply(
  meta: TravelApplyMeta,
  values: TravelApplyFormValues,
  options: TravelApplySubmitOptions = {},
): Promise<TravelApplySubmitResult> {
  const travelers = await resolveTravelersWithPolicy(meta, values.travelers);
  const body = buildTravelApplyBody(meta, { ...values, travelers });
  return saveAndMaybeSendTravelApply(meta, meta.addUrl, body, options);
}

// ── Form/Get + Form/Detail 加载（编辑反填） ─────────────────────────────
// Form/Get JSON 不返回 slave 行数据（slaveDatas 为空），需从 Form/Detail HTML 解析行程/出差人。

/** Form/Get 返回的控件数组（同 Form/Flow 的 var datas 结构）。 */
export type FormGetResponse = TravelApplyRawControl[];

export interface TravelApplyEditValues {
  travelTypes: string[];
  reason: string;
  travelers: TravelApplyTraveler[];
  segments: TravelApplySegment[];
}

/** 通过 Form/Get 加载已有表单主表字段。 */
export async function fetchTravelFormData(
  ticket: string,
  formId: string,
): Promise<FormGetResponse | null> {
  const params = new URLSearchParams({ ticket, CheckFlowType: "", FlowTag: "Travel", Id: formId });
  const url = `${getWorkflowSite()}/Form/Get?${params.toString()}`;
  try {
    const raw = await fetchJson<unknown>(url);
    if (!raw) return null;
    // Form/Get returns [{ datas: [...] }, {name, value}, ...]
    let controls: unknown[];
    if (Array.isArray(raw)) {
      if (
        raw.length > 0 &&
        raw[0] &&
        typeof raw[0] === "object" &&
        "datas" in (raw[0] as Record<string, unknown>)
      ) {
        controls = (raw[0] as Record<string, unknown[]>).datas as unknown[];
      } else {
        controls = raw as unknown[];
      }
    } else if (
      typeof raw === "object" &&
      raw !== null &&
      "datas" in (raw as Record<string, unknown>)
    ) {
      controls = (raw as Record<string, unknown[]>).datas as unknown[];
    } else {
      return null;
    }
    if (!Array.isArray(controls)) return null;
    return controls as TravelApplyRawControl[];
  } catch {
    return null;
  }
}

/** Legacy Form/Detail — contains rendered slave rows for edit backfill. */
export async function fetchTravelFormDetailHtml(ticket: string, formId: string): Promise<string> {
  const params = new URLSearchParams({
    Id: formId,
    ticket,
    CheckFlowType: "",
    FlowTag: "Travel",
  });
  const url = `${getWorkflowSite()}/Form/Detail?${params.toString()}`;
  return fetchText(url);
}

function parseTravelersFromDetail(
  meta: TravelApplyMeta,
  accounts: Record<string, string>[],
): TravelApplyTraveler[] {
  return accounts
    .map<TravelApplyTraveler | null>((row) => {
      const account = resolveTravelApplyStaffByLabel(meta.staffOptions, row["出差人"] ?? "");
      if (!account.label && !account.value) return null;
      const policyId = row.PolicyId?.trim();
      return policyId ? { account, policyId } : { account };
    })
    .filter((item): item is TravelApplyTraveler => item != null);
}

function parseSegmentsFromDetail(
  meta: TravelApplyMeta,
  details: Record<string, string>[],
): TravelApplySegment[] {
  return details.map((row) => ({
    startDate: normalizeDetailDate(row["开始日期"] ?? ""),
    endDate: normalizeDetailDate(row["结束日期"] ?? ""),
    fromCity: resolveTravelApplyCityByLabel(meta.cities, row["出发城市"] ?? ""),
    toCity: resolveTravelApplyCityByLabel(meta.cities, row["目的城市"] ?? ""),
  }));
}

async function resolveTravelersPolicies(
  meta: TravelApplyMeta,
  travelers: TravelApplyTraveler[],
): Promise<TravelApplyTraveler[]> {
  if (!meta.policyDefaultUrl) return travelers;
  return Promise.all(
    travelers.map(async (traveler) => {
      if (traveler.policyId || !traveler.account.value) return traveler;
      const policyId = await fetchTravelApplyPolicy(meta.policyDefaultUrl, traveler.account.value);
      return policyId ? { ...traveler, policyId } : traveler;
    }),
  );
}

/** Load main + slave fields for edit screen. */
export async function fetchTravelFormEditValues(
  ticket: string,
  formId: string,
  meta: TravelApplyMeta,
): Promise<TravelApplyEditValues | null> {
  const [controls, detailHtml] = await Promise.all([
    fetchTravelFormData(ticket, formId),
    fetchTravelFormDetailHtml(ticket, formId),
  ]);
  const main = controls ? parseFormDataToValues(meta, controls) : null;
  if (!main) return null;

  const { accounts, details } = parseTravelFormDetailHtml(detailHtml);
  const travelers = await resolveTravelersPolicies(meta, parseTravelersFromDetail(meta, accounts));
  const segments = parseSegmentsFromDetail(meta, details);

  return {
    ...main,
    travelers,
    segments,
  };
}

/** 从控件中读取 defaultValue，兼容 string / {label, value} 格式。 */
function readControlDefault(control: TravelApplyRawControl): string {
  const extended = control as unknown as { defaultValue?: unknown; value?: unknown };
  const raw = extended.defaultValue ?? extended.value;
  if (raw == null) return "";
  if (typeof raw === "string") return raw;
  if (typeof raw === "object") {
    const obj = raw as {
      label?: string;
      value?: string | number;
      Text?: string;
      Value?: string | number;
    };
    return String(obj.value ?? obj.Value ?? obj.label ?? obj.Text ?? "");
  }
  return String(raw);
}

export function readTravelNumberFromFormGet(
  controls: FormGetResponse | null | undefined,
): string | undefined {
  if (!controls?.length) return undefined;
  const control =
    controls.find((item) => item.tag === "TravelNumber" && !item.slaves) ??
    controls.find((item) => item.label === "差旅单号" && !item.slaves);
  if (!control) return undefined;
  const value = readControlDefault(control).trim();
  return value || undefined;
}

/** 从 Form/Get 响应中提取主表字段（出差类型、事由）。 */
export function parseFormDataToValues(
  _meta: TravelApplyMeta,
  controls: FormGetResponse,
): { travelTypes: string[]; reason: string } | null {
  if (!Array.isArray(controls) || controls.length === 0) return null;

  const travelTypeCtrl = controls.find((c) => c.tag === "TravelType" && !c.slaves);
  const travelTypes = travelTypeCtrl
    ? readControlDefault(travelTypeCtrl)
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
    : [];

  const reasonCtrl = controls.find((c) => c.label === "出差事由" && !c.slaves);
  const reason = reasonCtrl ? readControlDefault(reasonCtrl) : "";

  return { travelTypes, reason };
}

// ── 修改（Form/Modify） ────────────────────────────────────────────────

/** Submit travel form edit via Form/Modify. */
export async function modifyTravelApply(
  meta: TravelApplyMeta,
  values: TravelApplyFormValues,
  formId: string | number,
  options: TravelApplySubmitOptions = {},
): Promise<TravelApplySubmitResult> {
  const modifyUrl = meta.addUrl.replace("/Form/Add?", "/Form/Modify?");
  const travelers = await resolveTravelersWithPolicy(meta, values.travelers);
  const body = buildTravelApplyBody(meta, { ...values, travelers });
  body.append("Id", String(formId));
  return saveAndMaybeSendTravelApply(meta, modifyUrl, body, options, formId);
}

// ── 删除（Form/Remove） ────────────────────────────────────────────────

/** Delete a saved travel form (legacy weber Remove — POST body `id`). */
export async function deleteTravelApply(
  ticket: string,
  formId: string | number,
): Promise<TravelApplySubmitResult> {
  const body = new URLSearchParams({ id: String(formId) });
  return fetchJson<TravelApplySubmitResult>(buildTravelRemoveUrl(ticket), {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
}

// ── 撤回（FormTask/Revoke） ────────────────────────────────────────────

/** Revoke/withdraw a submitted travel form. */
export async function revokeTravelApply(
  ticket: string,
  formId: string | number,
): Promise<TravelApplySubmitResult> {
  const params = new URLSearchParams({
    ticket,
    CheckFlowType: "",
    FlowTag: "Travel",
  });
  const url = `${getWorkflowSite()}/FormTask/Revoke?${params.toString()}`;
  const body = new URLSearchParams({ Id: String(formId) });
  return fetchJson<TravelApplySubmitResult>(url, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
}

/** Status values where revoke is allowed: pending approval (2 or 4). */
export function isTravelFormRevokable(status?: string | number, statusName?: string): boolean {
  const label = statusName?.trim();
  if (
    label &&
    (label.includes("通过") ||
      label.includes("关闭") ||
      label.includes("驳回") ||
      label.includes("取消"))
  ) {
    return false;
  }
  const s = typeof status === "string" ? Number(status) : (status ?? 0);
  return s === 2 || s === 4;
}

function travelFormStatusCode(status?: string | number): number {
  return typeof status === "string" ? Number(status) : (status ?? 0);
}

/** Saved but not submitted — legacy list shows 等待报送 (Status=3). */
export function isTravelFormWaitingSubmit(status?: string | number): boolean {
  return travelFormStatusCode(status) === 3;
}

/** List-page 报审 — only while waiting to submit. */
export function isTravelFormSendable(status?: string | number): boolean {
  return isTravelFormWaitingSubmit(status);
}

/** List-page 删除 — only while waiting to submit. */
export function isTravelFormDeletable(status?: string | number): boolean {
  return isTravelFormWaitingSubmit(status);
}

/** Edit allowed: 等待报送(3) or 已驳回(5). */
export function isTravelFormEditable(status?: string | number): boolean {
  const s = travelFormStatusCode(status);
  return s === 3 || s === 5;
}

export function validateTravelApply(values: TravelApplyFormValues): string | null {
  if (values.travelTypes.length === 0) return "请选择出差类型";
  if (!values.reason.trim()) return "请填写出差事由";
  if (values.travelers.length === 0) return "请添加出差人";
  const travelerIds = values.travelers.map((item) => item.account.value).filter(Boolean);
  if (new Set(travelerIds).size !== travelerIds.length) return "出差人不能重复";
  if (values.travelers.some((item) => !item.account.value)) return "请选择出差人";
  if (values.segments.length === 0) return "请添加行程";
  for (let index = 0; index < values.segments.length; index += 1) {
    const segment = values.segments[index];
    const label = values.segments.length > 1 ? `行程 ${index + 1}` : "行程";
    if (!segment.startDate) return `请选择${label}开始日期`;
    if (!segment.endDate) return `请选择${label}结束日期`;
    if (segment.endDate < segment.startDate) return `${label}结束日期不能早于开始日期`;
    if (!segment.fromCity.value) return `请选择${label}出发城市`;
    if (!segment.toCity.value) return `请选择${label}目的城市`;
  }
  return null;
}
