import { useEffect, useMemo, useState, type ReactNode } from "react";

import { CityPicker } from "@/components/search";
import { usePageHeader } from "@/components/layout";
import { useSubmitTravelApply, useTravelApplyMeta } from "@/hooks/useTravelApply";
import { useHomeBack } from "@/lib/app-back";
import { formatDateLabel, parseLocalDate } from "@/lib/date-search";
import { formatApiError } from "@/lib/formatApiError";
import { getTicket } from "@/lib/session";
import {
  defaultTravelApplyDates,
  travelCityPickerAdapter,
  validateTravelApply,
  type TravelApplyCity,
} from "@/lib/travel-apply";

type CityPickerTarget = "from" | "to";

function findCity(cities: TravelApplyCity[], name: string, fallback?: TravelApplyCity) {
  return cities.find((city) => city.label === name) ?? fallback ?? cities[0];
}

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

function ApplyPageSkeleton() {
  return (
    <div className="min-h-full bg-[#F5F6F9]">
      <div className="h-36 bg-gradient-to-br from-[#2768FA] to-[#33A1F9]" />
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
  children,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
}) {
  return (
    <section className="overflow-hidden rounded-2xl bg-white shadow-[0_4px_20px_rgba(15,23,42,0.06)]">
      <div className="border-b border-[#F0F2F5] px-4 py-3">
        <h2 className="text-[15px] font-semibold text-[#111827]">{title}</h2>
        {subtitle ? <p className="mt-0.5 text-xs text-[#9CA3AF]">{subtitle}</p> : null}
      </div>
      <div className="px-4">{children}</div>
    </section>
  );
}

function MetaChip({ label, value }: { label: string; value: string }) {
  if (!value) return null;
  return (
    <div className="min-w-0 flex-1 rounded-xl bg-white/15 px-3 py-2 backdrop-blur-sm">
      <p className="truncate text-[11px] text-white/75">{label}</p>
      <p className="truncate text-sm font-medium text-white">{value}</p>
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
          className="border-0 bg-transparent p-0 text-right text-[15px] font-semibold text-[#111827] outline-none [color-scheme:light]"
        />
        <p className="mt-0.5 text-xs text-[#9CA3AF]">{formatDateLabel(value)}</p>
      </div>
    </label>
  );
}

export function TravelApplyPage() {
  const goHome = useHomeBack();
  usePageHeader({ title: "出差申请", showBack: true, onBack: goHome });

  const ticket = getTicket();
  const metaQuery = useTravelApplyMeta();
  const submitApply = useSubmitTravelApply(metaQuery.data);
  const pickerAdapter = useMemo(() => travelCityPickerAdapter(), []);
  const [dates, setDates] = useState(() => defaultTravelApplyDates());
  const [travelTypes, setTravelTypes] = useState<string[]>([]);
  const [reason, setReason] = useState("");
  const [fromCity, setFromCity] = useState<TravelApplyCity | null>(null);
  const [toCity, setToCity] = useState<TravelApplyCity | null>(null);
  const [pickerTarget, setPickerTarget] = useState<CityPickerTarget | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [successId, setSuccessId] = useState<number | null>(null);

  const meta = metaQuery.data;
  const tripDays = tripDaysBetween(dates.startDate, dates.endDate);

  useEffect(() => {
    if (!meta) return;
    setTravelTypes((prev) => (prev.length ? prev : meta.travelTypes.slice(0, 1).map((it) => it.value)));
    setFromCity((prev) => prev ?? findCity(meta.cities, "北京"));
    setToCity((prev) => prev ?? findCity(meta.cities, "上海", meta.cities[1]));
  }, [meta]);

  function toggleTravelType(value: string) {
    setTravelTypes((prev) =>
      prev.includes(value) ? prev.filter((item) => item !== value) : [...prev, value],
    );
  }

  function swapCities() {
    if (!fromCity || !toCity) return;
    setFromCity(toCity);
    setToCity(fromCity);
  }

  async function handleSubmit() {
    if (!meta || !fromCity || !toCity) return;
    const values = {
      travelTypes,
      reason,
      startDate: dates.startDate,
      endDate: dates.endDate,
      fromCity,
      toCity,
    };
    const error = validateTravelApply(values);
    if (error) {
      setValidationError(error);
      return;
    }

    setValidationError(null);
    setSuccessId(null);
    try {
      const result = await submitApply.mutateAsync(values);
      if (result.Status) {
        setSuccessId(result.Data?.Id ?? null);
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

  if (metaQuery.isLoading) {
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

  if (!meta || !fromCity || !toCity) {
    return (
      <div className="flex min-h-full items-center justify-center bg-[#F5F6F9] p-6">
        <p className="rounded-2xl bg-[#FFF1F0] px-5 py-4 text-sm text-[#FF4D4F]">
          出差申请表单加载异常
        </p>
      </div>
    );
  }

  const submitError = submitApply.error ? formatApiError(submitApply.error) : validationError;
  const travelNumber = meta.travelNumber.label || meta.travelNumber.value;

  return (
    <div className="min-h-full bg-[#F5F6F9]">
      <div className="bg-gradient-to-br from-[#2768FA] via-[#2B7AFF] to-[#33A1F9] px-4 pb-10 pt-1">
        <p className="text-xs text-white/70">差旅单号</p>
        <p className="mt-1 truncate text-[20px] font-semibold tracking-wide text-white">
          {travelNumber || "—"}
        </p>
        <div className="mt-4 flex gap-2">
          <MetaChip label="申请人" value={meta.applicant.label} />
          <MetaChip label="所属部门" value={meta.organization.label} />
        </div>
        {meta.position.label ? (
          <p className="mt-2 text-xs text-white/65">职位 · {meta.position.label}</p>
        ) : null}
      </div>

      <div className="-mt-5 space-y-3 px-4 pb-[calc(5.5rem+env(safe-area-inset-bottom))]">
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
                        ? "border-[#2768FA] bg-[#EEF4FF] font-medium text-[#2768FA] shadow-[0_2px_8px_rgba(39,104,250,0.12)]"
                        : "border-[#E8ECF2] bg-[#FAFBFC] text-[#4B5563] active:bg-[#F3F4F6]"
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
              className="w-full resize-none rounded-xl border border-[#E8ECF2] bg-[#FAFBFC] px-3.5 py-3 text-sm leading-relaxed text-[#111827] outline-none transition-colors placeholder:text-[#C4C9D4] focus:border-[#2768FA] focus:bg-white focus:ring-2 focus:ring-[#2768FA]/10"
              onChange={(event) => setReason(event.target.value)}
            />
          </label>

          <div className="flex items-center justify-between border-t border-[#F3F4F6] py-3.5">
            <span className="text-sm text-[#6B7280]">出差人</span>
            <span className="text-sm font-medium text-[#111827]">{meta.account.label}</span>
          </div>
        </SectionCard>

        <SectionCard title="行程信息" subtitle={`共 ${tripDays} 天`}>
          <div className="relative my-3 rounded-xl bg-gradient-to-r from-[#F8FAFF] to-[#F3F8FF] p-4">
            <button
              type="button"
              className="absolute right-3 top-1/2 flex size-9 -translate-y-1/2 items-center justify-center rounded-full border border-[#DCE8FF] bg-white text-[#2768FA] shadow-sm active:scale-95"
              aria-label="交换出发与目的城市"
              onClick={swapCities}
            >
              <SwapIcon />
            </button>

            <button
              type="button"
              className="flex w-[calc(100%-2.5rem)] items-center justify-between py-2 text-left"
              onClick={() => setPickerTarget("from")}
            >
              <div>
                <p className="text-[11px] uppercase tracking-wide text-[#9CA3AF]">出发</p>
                <p className="mt-0.5 text-[18px] font-semibold text-[#111827]">{fromCity.label}</p>
              </div>
              <ChevronRightIcon />
            </button>

            <div className="my-2 h-px w-[calc(100%-2.5rem)] bg-gradient-to-r from-transparent via-[#DCE8FF] to-transparent" />

            <button
              type="button"
              className="flex w-[calc(100%-2.5rem)] items-center justify-between py-2 text-left"
              onClick={() => setPickerTarget("to")}
            >
              <div>
                <p className="text-[11px] uppercase tracking-wide text-[#9CA3AF]">目的</p>
                <p className="mt-0.5 text-[18px] font-semibold text-[#111827]">{toCity.label}</p>
              </div>
              <ChevronRightIcon />
            </button>
          </div>

          <DateRow
            label="开始日期"
            value={dates.startDate}
            onChange={(startDate) =>
              setDates((prev) => ({
                startDate,
                endDate: prev.endDate < startDate ? startDate : prev.endDate,
              }))
            }
          />
          <DateRow
            label="结束日期"
            value={dates.endDate}
            minDate={dates.startDate}
            onChange={(endDate) => setDates((prev) => ({ ...prev, endDate }))}
          />
        </SectionCard>

        {successId ? (
          <div className="flex items-start gap-3 rounded-2xl border border-[#ABEFC6] bg-[#ECFDF3] px-4 py-3.5">
            <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-[#17B26A] text-white">
              <CheckIcon />
            </span>
            <div>
              <p className="text-sm font-medium text-[#067647]">提交成功</p>
              <p className="mt-0.5 text-xs text-[#079455]">申请单 ID：{successId}</p>
            </div>
          </div>
        ) : null}

        {submitError ? (
          <div className="rounded-2xl border border-[#FECACA] bg-[#FFF1F0] px-4 py-3.5 text-sm text-[#DC2626]">
            {submitError}
          </div>
        ) : null}
      </div>

      <div className="fixed inset-x-0 bottom-0 border-t border-[#ECECEC] bg-white/95 px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3 backdrop-blur-md">
        <button
          type="button"
          disabled={submitApply.isPending}
          className="flex h-[50px] w-full items-center justify-center rounded-full bg-gradient-to-r from-[#2768FA] to-[#5099FE] text-[16px] font-medium text-white shadow-[0_8px_24px_rgba(39,104,250,0.28)] transition-opacity disabled:opacity-60 active:opacity-90"
          onClick={() => void handleSubmit()}
        >
          {submitApply.isPending ? "提交中…" : "提交申请"}
        </button>
      </div>

      <CityPicker
        open={pickerTarget != null}
        items={meta.cities}
        title={pickerTarget === "from" ? "选择出发城市" : "选择目的城市"}
        historyKey="ryx_history_travel_cities"
        searchPlaceholder="搜索城市名称"
        hotTitle="热门城市"
        historyTitle="历史记录"
        onClose={() => setPickerTarget(null)}
        onSelect={(city) => {
          if (pickerTarget === "from") setFromCity(city);
          if (pickerTarget === "to") setToCity(city);
        }}
        {...pickerAdapter}
      />
    </div>
  );
}
