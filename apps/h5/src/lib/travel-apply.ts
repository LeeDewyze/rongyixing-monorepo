import { addDays, todayDateString } from "@/lib/date-search";

const WORKFLOW_SITE = "http://workflow.rtesp.com";

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
  workflowId: string;
  controls: TravelApplyRawControl[];
  travelNumber: TravelApplyOption;
  applicant: TravelApplyOption;
  organization: TravelApplyOption;
  position: TravelApplyOption;
  /** Default traveler from StaffCtrl/DefaultData (current user). */
  defaultAccount: TravelApplyOption;
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

interface FlowFormDefaultValue {
  label?: string | null;
  value?: string | number | null;
  Text?: string | null;
  Value?: string | number | null;
  Data?: FlowFormDefaultValue | FlowFormDefaultValue[] | string | number | null;
}

function toAbsoluteWorkflowUrl(url: string): string {
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  return `${WORKFLOW_SITE}${url.startsWith("/") ? "" : "/"}${url}`;
}

async function fetchText(url: string, init?: RequestInit): Promise<string> {
  let response: Response;
  try {
    response = await fetch(url, init);
  } catch (error) {
    throw new Error(error instanceof Error ? error.message : "接口请求失败");
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
      const row = item as { label?: string; value?: string | number; Text?: string; Value?: string | number };
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

async function fetchDefault(control: TravelApplyRawControl | undefined): Promise<TravelApplyOption> {
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

export function defaultTravelApplySegment(cities: TravelApplyCity[]): TravelApplySegment {
  const dates = defaultTravelApplyDates();
  return {
    ...dates,
    fromCity: findTravelApplyCity(cities, "北京"),
    toCity: findTravelApplyCity(cities, "上海", cities[1]),
  };
}

export function defaultTravelApplyTraveler(defaultAccount: TravelApplyOption): TravelApplyTraveler {
  return { account: defaultAccount };
}

export async function fetchTravelApplyMeta(ticket: string): Promise<TravelApplyMeta> {
  const html = await fetchText(`${WORKFLOW_SITE}/Form/Flow?flowtag=Travel&ticket=${ticket}`);
  const controls = parseFlowControls(html);
  const addUrl = parseAddUrl(html);
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
    workflowId,
    controls,
    travelNumber,
    applicant,
    organization,
    position,
    defaultAccount,
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
  return staff.map((item) => ({
    id: item.value,
    label: item.label,
    searchText: item.label,
  }));
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
        appendDetail(
          control,
          segment.toCity.label,
          segment.toCity.value,
          "TravelDetail",
          slaveRow,
        );
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

export async function submitTravelApply(
  meta: TravelApplyMeta,
  values: TravelApplyFormValues,
): Promise<TravelApplySubmitResult> {
  const travelers = await resolveTravelersWithPolicy(meta, values.travelers);
  const body = buildTravelApplyBody(meta, { ...values, travelers });
  return fetchJson<TravelApplySubmitResult>(meta.addUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
  });
}

// ── Form/Get 解析（编辑反填） ──────────────────────────────────────────

/** Raw form field from Form/Get response. */
interface FormGetDetail {
  Name?: string;
  Tag?: string | null;
  Content?: string;
  Number?: string;
  Slave?: string;
  SlaveRow?: number;
}

/** Raw time field from Form/Get response. */
interface FormGetTime {
  Tag?: string | null;
  Time?: string;
  Slave?: string;
  SlaveRow?: number;
}

/** Raw Form/Get response shape. */
interface FormGetResponse {
  Id?: number;
  Name?: string;
  Tag?: string;
  Status?: number;
  FormDetails?: FormGetDetail[];
  FormTimes?: FormGetTime[];
}

/** Fetch existing travel form data for editing. */
export async function fetchTravelFormData(
  ticket: string,
  formId: string,
): Promise<FormGetResponse | null> {
  const params = new URLSearchParams({ ticket, CheckFlowType: "", FlowTag: "Travel" });
  const url = `${WORKFLOW_SITE}/Form/Get?${params.toString()}`;
  const raw = await fetchJson<{ Data?: FormGetResponse; Status: boolean }>(url);
  if (!raw) return null;
  const data = raw.Data ?? raw;
  if (!data || typeof data !== "object") return null;
  return data as FormGetResponse;
}

/** Parse Form/Get response into form values for edit re-fill. */
export function parseFormDataToValues(
  meta: TravelApplyMeta,
  formData: FormGetResponse,
  cities: TravelApplyCity[],
  staffOptions: TravelApplyOption[],
): TravelApplyFormValues | null {
  const details = formData.FormDetails ?? [];
  const times = formData.FormTimes ?? [];

  function findDetail(tag?: string | null, label?: string): FormGetDetail | undefined {
    return details.find((d) =>
      tag ? d.Tag === tag : d.Name === label,
    );
  }

  function findTime(tag: string, slaveRow = 0): FormGetTime | undefined {
    return times.find((t) => t.Tag === tag && (t.SlaveRow ?? 0) === slaveRow);
  }

  // travelTypes
  const travelTypeDetail = findDetail("TravelType");
  const travelTypes = travelTypeDetail?.Content
    ? travelTypeDetail.Content.split(",").map((s) => s.trim()).filter(Boolean)
    : [];

  // reason
  const reasonDetail = findDetail(null, "出差事由");
  const reason = reasonDetail?.Content ?? "";

  // travelers — group by SlaveRow from TravelAccount slaves
  const accountDetails = details.filter((d) => d.Slave === "TravelAccount");
  const travelerRows = new Set(accountDetails.map((d) => d.SlaveRow ?? 0));
  const travelers: TravelApplyTraveler[] = [];
  const sortedRows = [...travelerRows].sort((a, b) => a - b);
  for (const row of sortedRows) {
    const accountDetail = accountDetails.find(
      (d) => d.Tag === "AccountId" && (d.SlaveRow ?? 0) === row,
    );
    const policyDetail = accountDetails.find(
      (d) => d.Tag === "PolicyId" && (d.SlaveRow ?? 0) === row,
    );
    if (!accountDetail) continue;

    const label = accountDetail.Content ?? "";
    const value = accountDetail.Number ?? "";
    // find matching staff option or use raw value
    const match = staffOptions.find(
      (s) => s.value === value || s.label === label,
    );
    const account = match ?? { label, value };
    travelers.push({
      account,
      policyId: policyDetail?.Content || policyDetail?.Number,
    });
  }

  // segments — group by SlaveRow from TravelDetail slaves
  const detailTimes = times.filter((t) => t.Slave === "TravelDetail");
  const detailDetails = details.filter((d) => d.Slave === "TravelDetail");
  const segmentRows = new Set([
    ...detailTimes.map((t) => t.SlaveRow ?? 0),
    ...detailDetails.map((d) => d.SlaveRow ?? 0),
  ]);
  const segments: TravelApplySegment[] = [];
  const sortedSegmentRows = [...segmentRows].sort((a, b) => a - b);
  for (const row of sortedSegmentRows) {
    const start = findTime("StartDate", row);
    const end = findTime("EndDate", row);
    const fromDetail = detailDetails.find(
      (d) => d.Tag === "FromCityName" && (d.SlaveRow ?? 0) === row,
    );
    const toDetail = detailDetails.find(
      (d) => d.Tag === "ToCityName" && (d.SlaveRow ?? 0) === row,
    );

    if (!start && !end && !fromDetail && !toDetail) continue;

    const findCity = (label?: string, number?: string): TravelApplyCity => {
      return (
        cities.find((c) => c.value === number || c.label === label) ?? {
          label: label ?? "",
          value: number ?? "",
        }
      );
    };

    segments.push({
      startDate: start?.Time ?? "",
      endDate: end?.Time ?? "",
      fromCity: findCity(fromDetail?.Content, fromDetail?.Number),
      toCity: findCity(toDetail?.Content, toDetail?.Number),
    });
  }

  if (travelers.length === 0) {
    travelers.push(defaultTravelApplyTraveler(meta.defaultAccount));
  }
  if (segments.length === 0) {
    segments.push(defaultTravelApplySegment(cities));
  }

  return { travelTypes, reason, travelers, segments };
}

// ── 修改（Form/Modify） ────────────────────────────────────────────────

/** Submit travel form edit via Form/Modify. */
export async function modifyTravelApply(
  meta: TravelApplyMeta,
  values: TravelApplyFormValues,
  formId: string | number,
): Promise<TravelApplySubmitResult> {
  const modifyUrl = meta.addUrl.replace("/Form/Add?", "/Form/Modify?");
  const travelers = await resolveTravelersWithPolicy(meta, values.travelers);
  const body = buildTravelApplyBody(meta, { ...values, travelers });
  body.append("Id", String(formId));
  return fetchJson<TravelApplySubmitResult>(modifyUrl, {
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
  const url = `${WORKFLOW_SITE}/FormTask/Revoke?${params.toString()}`;
  const body = new URLSearchParams({ Id: String(formId) });
  return fetchJson<TravelApplySubmitResult>(url, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
}

/** Status values where revoke is allowed: 草稿(1), 审批中(2 or 4). */
export function isTravelFormRevokable(status?: string | number): boolean {
  const s = typeof status === "string" ? Number(status) : (status ?? 0);
  return s === 1 || s === 2 || s === 4;
}

/** Status values where edit is allowed: 草稿(1), 已驳回(5). */
export function isTravelFormEditable(status?: string | number): boolean {
  const s = typeof status === "string" ? Number(status) : (status ?? 0);
  return s === 1 || s === 5;
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
