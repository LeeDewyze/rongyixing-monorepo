import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

import { CityPicker, ResourcePicker } from "@/components/search";
import { usePageHeader } from "@/components/layout";
import {
  useSubmitTravelApply,
  useModifyTravelApply,
  useTravelApplyMeta,
} from "@/hooks/useTravelApply";
import { useHomeBack } from "@/lib/app-back";
import { formatDateLabel, parseLocalDate } from "@/lib/date-search";
import { formatApiError } from "@/lib/formatApiError";
import { getTicket } from "@/lib/session";
import {
  defaultTravelApplySegment,
  defaultTravelApplyTraveler,
  fetchTravelFormData,
  parseFormDataToValues,
  staffPickerOptions,
  travelCityPickerAdapter,
  validateTravelApply,
  type TravelApplyCity,
  type TravelApplySegment,
  type TravelApplyTraveler,
} from "@/lib/travel-apply";

type CityPickerTarget = { segmentIndex: number; field: "from" | "to" };

function tripDaysBetween(startDate: string, endDate: string): number {
  const start = parseLocalDate(startDate)?.getTime() ?? 0;
  const end = parseLocalDate(endDate)?.getTime() ?? 0;
  const diff = Math.round((end - start) / 86400000);
  return Math.max(1, diff + 1);
}

function ChevronRightIcon() {
  return (
    <svg viewBox="0 0 16 16" className="size-4 shrink-0 text-[#C4C9D4]" aria-hidden>
      <path
        d="M6 3l5 5-5 5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 12 12" className="size-3" aria-hidden>
      <path
        d="M2 6l3 3 5-5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function SwapIcon() {
  return (
    <svg viewBox="0 0 20 20" className="size-4" aria-hidden>
      <path
        d="M14 4l3 3-3 3M6 16l-3-3 3-3M17 7H7M3 13h10"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg viewBox="0 0 16 16" className="size-4" aria-hidden>
      <path
        d="M8 3v10M3 8h10"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

function ApplyPageSkeleton() {
  return (
    <div className="min-h-full" style={{ background: "var(--brand-form-header-gradient)" }}>
      <div className="h-40" />
      <div className="-mt-6 space-y-3 px-4 pb-24">
        {[1, 2, 3].map((key) => (
          <div
            key={key}
            className="animate-pulse rounded-2xl bg-white p-4 shadow-[0_4px_20px_rgba(15,23,42,0.06)]"
          >
            <div className="mb-4 h-4 w-24 rounded bg-[#EEF2F7]" />
            <div className="space-y-3">
              <div className="h-10 rounded-lg bg-[#F3F5F9]" />
              <div className="h-10 rounded-lg bg-[#F3F5F9]" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function SectionCard({
  title,
  subtitle,
  action,
  children,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="overflow-hidden rounded-2xl bg-white shadow-[0_4px_20px_rgba(15,23,42,0.06)]">
      <div className="flex items-start justify-between gap-3 border-b border-[#F0F2F5] px-4 py-3">
        <div>
          <h2 className="text-[15px] font-semibold text-brand-title">{title}</h2>
          {subtitle ? <p className="mt-0.5 text-xs text-[#9CA3AF]">{subtitle}</p> : null}
        </div>
        {action}
      </div>
      <div className="px-4">{children}</div>
    </section>
  );
}

function MetaChip({ label, value }: { label: string; value: string }) {
  if (!value) return null;
  return (
    <div className="min-w-0 flex-1 rounded-xl bg-white/35 px-3 py-2 shadow-[0_4px_18px_rgba(39,104,250,0.10)] ring-1 ring-white/35">
      <p className="truncate text-[11px] text-brand-title/55">{label}</p>
      <p className="truncate text-sm font-medium text-brand-title">{value}</p>
    </div>
  );
}

function DateRow({
  label,
  value,
  minDate,
  onChange,
}: {
  label: string;
  value: string;
  minDate?: string;
  onChange: (date: string) => void;
}) {
  return (
    <label className="flex items-center justify-between border-b border-[#F3F4F6] py-3.5 last:border-b-0">
      <span className="text-sm text-[#6B7280]">{label}</span>
      <div className="text-right">
        <input
          type="date"
          value={value}
          min={minDate}
          onChange={(event) => onChange(event.target.value)}
          className="border-0 bg-transparent p-0 text-right text-[15px] font-semibold text-brand-title outline-none [color-scheme:light]"
        />
        <p className="mt-0.5 text-xs text-[#9CA3AF]">{formatDateLabel(value)}</p>
      </div>
    </label>
  );
}

function AddRowButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-dashed border-[#C7D7FE] bg-[#F8FAFF] py-3 text-sm font-medium text-brand-primary active:bg-[#EEF4FF]"
      onClick={onClick}
    >
      <PlusIcon />
      {label}
    </button>
  );
}

function SegmentRouteCard({
  segment,
  onPickFrom,
  onPickTo,
  onSwap,
}: {
  segment: TravelApplySegment;
  onPickFrom: () => void;
  onPickTo: () => void;
  onSwap: () => void;
}) {
  return (
    <div className="relative my-3 rounded-xl bg-gradient-to-r from-[#F8FAFF] to-[#F3F8FF] p-4">
      <button
        type="button"
        className="absolute right-3 top-1/2 flex size-9 -translate-y-1/2 items-center justify-center rounded-full border border-[#DCE8FF] bg-white text-brand-primary shadow-sm active:scale-95"
        aria-label="交换出发与目的城市"
        onClick={onSwap}
      >
        <SwapIcon />
      </button>

      <button
        type="button"
        className="flex w-[calc(100%-2.5rem)] items-center justify-between py-2 text-left"
        onClick={onPickFrom}
      >
        <div>
          <p className="text-[11px] uppercase tracking-wide text-[#9CA3AF]">出发</p>
          <p className="mt-0.5 text-[18px] font-semibold text-brand-title">{segment.fromCity.label}</p>
        </div>
        <ChevronRightIcon />
      </button>

      <div className="my-2 h-px w-[calc(100%-2.5rem)] bg-gradient-to-r from-transparent via-[#DCE8FF] to-transparent" />

      <button
        type="button"
        className="flex w-[calc(100%-2.5rem)] items-center justify-between py-2 text-left"
        onClick={onPickTo}
      >
        <div>
          <p className="text-[11px] uppercase tracking-wide text-[#9CA3AF]">目的</p>
          <p className="mt-0.5 text-[18px] font-semibold text-brand-title">{segment.toCity.label}</p>
        </div>
        <ChevronRightIcon />
      </button>
    </div>
  );
}

const TRAVEL_MINE_APPROVAL_PATH = "/travel/approval?tab=mine";

export function TravelApplyPage() {
  const navigate = useNavigate();
  const goHome = useHomeBack();
  usePageHeader({ visible: false });
  const [searchParams] = useSearchParams();
  const editId = searchParams.get("editId") || null;

  const ticket = getTicket();
  const metaQuery = useTravelApplyMeta();
  const submitApply = useSubmitTravelApply(metaQuery.data);
  const modifyApply = useModifyTravelApply(metaQuery.data);
  const pickerAdapter = useMemo(() => travelCityPickerAdapter(), []);
  const [travelTypes, setTravelTypes] = useState<string[]>([]);
  const [reason, setReason] = useState("");
  const [travelers, setTravelers] = useState<TravelApplyTraveler[]>([]);
  const [segments, setSegments] = useState<TravelApplySegment[]>([]);
  const [pickerTarget, setPickerTarget] = useState<CityPickerTarget | null>(null);
  const [staffPickerIndex, setStaffPickerIndex] = useState<number | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [loadingEdit, setLoadingEdit] = useState(false);

  const isEditing = Boolean(editId);
  const meta = metaQuery.data;
  const staffOptions = useMemo(
    () => (meta ? staffPickerOptions(meta.staffOptions) : []),
    [meta],
  );
  const totalTripDays = segments.reduce(
    (sum, segment) => sum + tripDaysBetween(segment.startDate, segment.endDate),
    0,
  );

  // Load existing form for edit — from Form/Get API
  useEffect(() => {
    if (!meta || !editId || travelers.length > 0 || segments.length > 0) return;
    setLoadingEdit(true);

    const ticketVal = getTicket();
    if (!ticketVal) {
      setLoadingEdit(false);
      return;
    }

    fetchTravelFormData(ticketVal, editId)
      .then((controls) => {
        if (!controls) {
          setValidationError("加载申请单数据失败");
          return;
        }
        const parsed = parseFormDataToValues(meta, controls, meta.cities, meta.staffOptions);
        if (!parsed) {
          setValidationError("解析申请单数据失败");
          return;
        }
        setTravelTypes(parsed.travelTypes);
        setReason(parsed.reason);
        // travelers/segments use defaults (API doesn't return slave data)
        setTravelers([defaultTravelApplyTraveler(meta.defaultAccount)]);
        setSegments([defaultTravelApplySegment(meta.cities)]);
      })
      .catch(() => setValidationError("加载申请单数据失败"))
      .finally(() => setLoadingEdit(false));
  }, [meta, editId]);

  // Init for new form
  useEffect(() => {
    if (!meta || editId || travelers.length > 0 || segments.length > 0) return;
    setTravelTypes((prev) => (prev.length ? prev : meta.travelTypes.slice(0, 1).map((it) => it.value)));
    setTravelers((prev) =>
      prev.length ? prev : [defaultTravelApplyTraveler(meta.defaultAccount)],
    );
    setSegments((prev) => (prev.length ? prev : [defaultTravelApplySegment(meta.cities)]));
  }, [meta, editId]);

  function toggleTravelType(value: string) {
    setTravelTypes((prev) =>
      prev.includes(value) ? prev.filter((item) => item !== value) : [...prev, value],
    );
  }

  function updateSegment(index: number, patch: Partial<TravelApplySegment>) {
    setSegments((prev) => prev.map((item, i) => (i === index ? { ...item, ...patch } : item)));
  }

  function swapSegmentCities(index: number) {
    setSegments((prev) =>
      prev.map((item, i) =>
        i === index ? { ...item, fromCity: item.toCity, toCity: item.fromCity } : item,
      ),
    );
  }

  function addTraveler() {
    if (!meta) return;
    setTravelers((prev) => [...prev, defaultTravelApplyTraveler(meta.defaultAccount)]);
  }

  function removeTraveler(index: number) {
    setTravelers((prev) => (prev.length <= 1 ? prev : prev.filter((_, i) => i !== index)));
  }

  function addSegment() {
    if (!meta) return;
    setSegments((prev) => [...prev, defaultTravelApplySegment(meta.cities)]);
  }

  function removeSegment(index: number) {
    setSegments((prev) => (prev.length <= 1 ? prev : prev.filter((_, i) => i !== index)));
  }

  async function handleSubmit() {
    if (!meta) return;
    const values = { travelTypes, reason, travelers, segments };
    const error = validateTravelApply(values);
    if (error) {
      setValidationError(error);
      return;
    }

    setValidationError(null);
    try {
      const result = isEditing
        ? await modifyApply.mutateAsync({ values, formId: editId! })
        : await submitApply.mutateAsync(values);
      if (result.Status) {
        navigate(TRAVEL_MINE_APPROVAL_PATH, { replace: true });
        return;
      }
      setValidationError(result.Message ?? "提交失败");
    } catch {
      // React Query exposes the formatted mutation error below.
    }
  }

  if (!ticket) {
    return (
      <div className="flex min-h-full items-center justify-center bg-[#F5F6F9] p-6">
        <p className="rounded-2xl bg-white px-5 py-4 text-sm text-[#FF4D4F] shadow-sm">
          请先登录后再使用此功能
        </p>
      </div>
    );
  }

  if (metaQuery.isLoading || loadingEdit) {
    return <ApplyPageSkeleton />;
  }

  if (metaQuery.error) {
    return (
      <div className="flex min-h-full items-center justify-center bg-[#F5F6F9] p-6">
        <p className="rounded-2xl bg-[#FFF1F0] px-5 py-4 text-sm text-[#FF4D4F]">
          {formatApiError(metaQuery.error)}
        </p>
      </div>
    );
  }

  if (!meta || travelers.length === 0 || segments.length === 0) {
    return (
      <div className="flex min-h-full items-center justify-center bg-[#F5F6F9] p-6">
        <p className="rounded-2xl bg-[#FFF1F0] px-5 py-4 text-sm text-[#FF4D4F]">
          出差申请表单加载异常
        </p>
      </div>
    );
  }

  const submitError = submitApply.error
    ? formatApiError(submitApply.error)
    : modifyApply.error
      ? formatApiError(modifyApply.error)
      : validationError;
  const travelNumber = meta.travelNumber.label || meta.travelNumber.value;

  return (
    <div className="min-h-full" style={{ background: "var(--brand-form-header-gradient)" }}>
      <div className="relative pb-10 pt-[env(safe-area-inset-top)]">
        <div className="flex items-center px-1">
          <button
            type="button"
            className="flex h-11 w-10 shrink-0 items-center justify-center text-[26px] font-light leading-none text-brand-title active:opacity-70"
            aria-label="返回"
            onClick={goHome}
          >
            ‹
          </button>
          <h1 className="min-w-0 flex-1 truncate text-center text-[17px] font-medium text-brand-title">
            {isEditing ? "编辑出差申请" : "出差申请"}
          </h1>
          <span className="w-10 shrink-0" />
        </div>

        <div className="mt-3 px-4">
          <p className="text-[11px] text-brand-title/60">差旅单号</p>
          <p className="mt-0.5 truncate text-[20px] font-semibold tracking-wide text-brand-title">
            {travelNumber || (isEditing ? editId! : "—")}
          </p>
          <div className="mt-3 flex gap-2">
            <MetaChip label="申请人" value={meta.applicant.label} />
            <MetaChip label="所属部门" value={meta.organization.label} />
          </div>
          {meta.position.label ? (
            <p className="mt-2 text-[11px] text-brand-title/50">{meta.position.label}</p>
          ) : null}
        </div>

      </div>

      <div className="-mt-6 space-y-3 px-4 pb-[calc(5.5rem+env(safe-area-inset-bottom))]">
        <SectionCard title="出差信息" subtitle="选择类型并填写事由">
          <div className="py-3.5">
            <p className="mb-2.5 text-sm text-[#6B7280]">出差类型</p>
            <div className="flex flex-wrap gap-2">
              {meta.travelTypes.map((type) => {
                const active = travelTypes.includes(type.value);
                return (
                  <button
                    key={type.value}
                    type="button"
                    className={`inline-flex items-center gap-1.5 rounded-full border px-3.5 py-2 text-sm transition-colors ${
                      active
                        ? "border-brand-primary bg-[#EEF4FF] font-medium text-brand-primary shadow-[0_2px_8px_rgba(39,104,250,0.12)]"
                        : "border-[#E8ECF2] bg-[#FAFBFC] text-[#4B5563] hover:bg-[#F3F4F6] hover:border-[#D1D5DB] active:bg-[#E8ECF2]"
                    }`}
                    onClick={() => toggleTravelType(type.value)}
                  >
                    {active ? <CheckIcon /> : null}
                    {type.label}
                  </button>
                );
              })}
            </div>
          </div>

          <label className="block border-t border-[#F3F4F6] py-3.5">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-sm text-[#6B7280]">出差事由</span>
              <span className="text-xs text-[#C4C9D4]">{reason.length}/200</span>
            </div>
            <textarea
              value={reason}
              rows={3}
              maxLength={200}
              placeholder="请简要说明出差目的，如项目支持、客户拜访等"
              className="w-full resize-none rounded-xl border border-[#E8ECF2] bg-[#FAFBFC] px-3.5 py-3 text-sm leading-relaxed text-brand-title outline-none transition-colors placeholder:text-[#C4C9D4] focus:border-brand-primary focus:bg-white focus:ring-2 focus:ring-brand-primary/10"
              onChange={(event) => setReason(event.target.value)}
            />
          </label>
        </SectionCard>

        <SectionCard
          title="出差人"
          subtitle={`共 ${travelers.length} 人`}
          action={
            <button
              type="button"
              className="shrink-0 rounded-full px-3 py-1 text-xs font-medium text-brand-primary active:bg-[#EEF4FF]"
              onClick={addTraveler}
            >
              添加
            </button>
          }
        >
          <div className="divide-y divide-[#F3F4F6]">
            {travelers.map((traveler, index) => (
              <div key={`traveler-${index}`} className="flex items-center gap-2 py-3.5">
                <button
                  type="button"
                  className="flex min-w-0 flex-1 items-center justify-between text-left"
                  onClick={() => setStaffPickerIndex(index)}
                >
                  <div>
                    <p className="text-xs text-[#9CA3AF]">
                      {travelers.length > 1 ? `出差人 ${index + 1}` : "出差人"}
                    </p>
                    <p className="mt-0.5 truncate text-sm font-medium text-brand-title">
                      {traveler.account.label || "请选择出差人"}
                    </p>
                  </div>
                  <ChevronRightIcon />
                </button>
                {travelers.length > 1 ? (
                  <button
                    type="button"
                    className="shrink-0 rounded-lg px-2 py-1 text-xs text-[#EF4444] active:bg-[#FEF2F2]"
                    onClick={() => removeTraveler(index)}
                  >
                    删除
                  </button>
                ) : null}
              </div>
            ))}
          </div>
          <div className="pb-4">
            <AddRowButton label="添加出差人" onClick={addTraveler} />
          </div>
        </SectionCard>

        <SectionCard
          title="行程信息"
          subtitle={
            segments.length > 1
              ? `共 ${segments.length} 段 · 合计 ${totalTripDays} 天`
              : `共 ${tripDaysBetween(segments[0]!.startDate, segments[0]!.endDate)} 天`
          }
          action={
            <button
              type="button"
              className="shrink-0 rounded-full px-3 py-1 text-xs font-medium text-brand-primary active:bg-[#EEF4FF]"
              onClick={addSegment}
            >
              添加
            </button>
          }
        >
          {segments.map((segment, index) => (
            <div
              key={`segment-${index}`}
              className={index > 0 ? "border-t border-[#F0F2F5] pt-1" : undefined}
            >
              <div className="flex items-center justify-between py-3">
                <p className="text-sm font-medium text-brand-title">
                  {segments.length > 1 ? `行程 ${index + 1}` : "行程"}
                </p>
                {segments.length > 1 ? (
                  <button
                    type="button"
                    className="rounded-lg px-2 py-1 text-xs text-[#EF4444] active:bg-[#FEF2F2]"
                    onClick={() => removeSegment(index)}
                  >
                    删除
                  </button>
                ) : null}
              </div>

              <SegmentRouteCard
                segment={segment}
                onPickFrom={() => setPickerTarget({ segmentIndex: index, field: "from" })}
                onPickTo={() => setPickerTarget({ segmentIndex: index, field: "to" })}
                onSwap={() => swapSegmentCities(index)}
              />

              <DateRow
                label="开始日期"
                value={segment.startDate}
                onChange={(startDate) =>
                  updateSegment(index, {
                    startDate,
                    endDate: segment.endDate < startDate ? startDate : segment.endDate,
                  })
                }
              />
              <DateRow
                label="结束日期"
                value={segment.endDate}
                minDate={segment.startDate}
                onChange={(endDate) => updateSegment(index, { endDate })}
              />
            </div>
          ))}
          <div className="pb-4 pt-1">
            <AddRowButton label="添加行程" onClick={addSegment} />
          </div>
        </SectionCard>

        {submitError ? (
          <div className="rounded-2xl border border-[#FECACA] bg-[#FFF1F0] px-4 py-3.5 text-sm text-[#DC2626]">
            {submitError}
          </div>
        ) : null}
      </div>

      <div className="fixed inset-x-0 bottom-0 border-t border-border bg-white/95 px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3 backdrop-blur-md">
        <button
          type="button"
          disabled={submitApply.isPending || modifyApply.isPending}
          className="flex h-[50px] w-full items-center justify-center rounded-full bg-gradient-to-r from-brand-btn-start to-brand-btn-end text-[16px] font-medium text-white shadow-[0_8px_24px_rgba(39,104,250,0.28)] transition-opacity disabled:opacity-60 active:opacity-90"
          onClick={() => void handleSubmit()}
        >
          {submitApply.isPending || modifyApply.isPending
            ? "提交中…"
            : isEditing
              ? "保存修改"
              : "提交申请"}
        </button>
      </div>

      <CityPicker
        open={pickerTarget != null}
        items={meta.cities}
        title={
          pickerTarget?.field === "from"
            ? "选择出发城市"
            : pickerTarget?.field === "to"
              ? "选择目的城市"
              : "选择城市"
        }
        historyKey="ryx_history_travel_cities"
        searchPlaceholder="搜索城市名称"
        hotTitle="热门城市"
        historyTitle="历史记录"
        onClose={() => setPickerTarget(null)}
        onSelect={(city: TravelApplyCity) => {
          if (!pickerTarget) return;
          const patch =
            pickerTarget.field === "from" ? { fromCity: city } : { toCity: city };
          updateSegment(pickerTarget.segmentIndex, patch);
        }}
        {...pickerAdapter}
      />

      <ResourcePicker
        open={staffPickerIndex != null}
        options={staffOptions}
        title="选择出差人"
        placeholder="搜索姓名或工号"
        onClose={() => setStaffPickerIndex(null)}
        onSelect={(option) => {
          if (staffPickerIndex == null) return;
          const account = meta.staffOptions.find((item) => item.value === option.id) ?? {
            label: option.label,
            value: option.id,
          };
          setTravelers((prev) =>
            prev.map((item, index) =>
              index === staffPickerIndex ? { account, policyId: undefined } : item,
            ),
          );
        }}
      />
    </div>
  );
}
