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

export interface TravelApplyMeta {
  addUrl: string;
  workflowId: string;
  controls: TravelApplyRawControl[];
  travelNumber: TravelApplyOption;
  applicant: TravelApplyOption;
  organization: TravelApplyOption;
  position: TravelApplyOption;
  account: TravelApplyOption;
  policyId: string;
  travelTypes: TravelApplyOption[];
  cities: TravelApplyCity[];
}

export interface TravelApplyFormValues {
  travelTypes: string[];
  reason: string;
  startDate: string;
  endDate: string;
  fromCity: TravelApplyCity;
  toCity: TravelApplyCity;
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

export function defaultTravelApplyDates() {
  const startDate = todayDateString();
  return {
    startDate,
    endDate: addDays(startDate, 1),
  };
}

export async function fetchTravelApplyMeta(ticket: string): Promise<TravelApplyMeta> {
  const html = await fetchText(`${WORKFLOW_SITE}/Form/Flow?flowtag=Travel&ticket=${ticket}`);
  const controls = parseFlowControls(html);
  const addUrl = parseAddUrl(html);
  const workflowId = parseWorkflowId(html);

  const travelTypeControl = findControl(controls, (control) => control.tag === "TravelType");
  const cityControl = findControl(controls, (control) => control.tag === "FromCityName");

  const [
    travelNumber,
    applicant,
    organization,
    position,
    account,
    policy,
    travelTypes,
    cities,
  ] = await Promise.all([
    fetchDefault(findControl(controls, (control) => control.tag === "TravelNumber")),
    fetchDefault(findControl(controls, (control) => control.label === "申请人")),
    fetchDefault(findControl(controls, (control) => control.label === "所属部门")),
    fetchDefault(findControl(controls, (control) => control.label === "所属职位")),
    fetchDefault(findControl(controls, (control) => control.tag === "AccountId")),
    Promise.resolve({ label: "", value: "" }),
    travelTypeControl?.dataUrl
      ? fetchJson<unknown>(travelTypeControl.dataUrl).then(normalizeOptions)
      : Promise.resolve([]),
    cityControl?.dataUrl
      ? fetchJson<unknown>(cityControl.dataUrl).then(normalizeCities)
      : Promise.resolve([]),
  ]);

  return {
    addUrl: toAbsoluteWorkflowUrl(addUrl),
    workflowId,
    controls,
    travelNumber,
    applicant,
    organization,
    position,
    account,
    policyId: policy.value || policy.label,
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

  function fillControl(control: TravelApplyRawControl, slave = "", slaveRow = 0) {
    if (control.controlType === "Slave") {
      for (const child of control.slaves ?? []) {
        fillControl(child, control.tag ?? "", slaveRow);
      }
      return;
    }

    switch (control.tag) {
      case "TravelNumber":
        appendDetail(control, meta.travelNumber.label || meta.travelNumber.value, "", slave, slaveRow);
        return;
      case "TravelType":
        appendDetail(control, values.travelTypes.join(","), "", slave, slaveRow);
        return;
      case "AccountId":
        appendDetail(control, meta.account.label, meta.account.value, slave, slaveRow);
        return;
      case "PolicyId":
        appendDetail(control, meta.policyId, "", slave, slaveRow);
        return;
      case "StartDate":
        appendTime(control, values.startDate, slave, slaveRow);
        return;
      case "EndDate":
        appendTime(control, values.endDate, slave, slaveRow);
        return;
      case "FromCityName":
        appendDetail(control, values.fromCity.label, values.fromCity.value, slave, slaveRow);
        return;
      case "ToCityName":
        appendDetail(control, values.toCity.label, values.toCity.value, slave, slaveRow);
        return;
      default:
        break;
    }

    if (control.label === "申请人") {
      appendDetail(control, meta.applicant.label, meta.applicant.value, slave, slaveRow);
      return;
    }
    if (control.label === "所属部门") {
      appendDetail(control, meta.organization.label, meta.organization.value, slave, slaveRow);
      return;
    }
    if (control.label === "所属职位") {
      appendDetail(control, meta.position.label, meta.position.value, slave, slaveRow);
      return;
    }
    if (control.label === "出差事由") {
      appendDetail(control, values.reason.trim(), "", slave, slaveRow);
    }
  }

  for (const control of meta.controls) {
    fillControl(control);
  }

  return body;
}

export async function submitTravelApply(
  meta: TravelApplyMeta,
  values: TravelApplyFormValues,
): Promise<TravelApplySubmitResult> {
  const body = buildTravelApplyBody(meta, values);
  return fetchJson<TravelApplySubmitResult>(meta.addUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
  });
}

export function validateTravelApply(values: TravelApplyFormValues): string | null {
  if (values.travelTypes.length === 0) return "请选择出差类型";
  if (!values.reason.trim()) return "请填写出差事由";
  if (!values.startDate) return "请选择开始日期";
  if (!values.endDate) return "请选择结束日期";
  if (values.endDate < values.startDate) return "结束日期不能早于开始日期";
  if (!values.fromCity.value) return "请选择出发城市";
  if (!values.toCity.value) return "请选择目的城市";
  return null;
}
