import type { ReactNode } from "react";

import { HOTEL_DETAIL_FONT } from "@/components/hotel/hotel-detail-chrome";
import type { FlightFareRuleSheetRow } from "@/lib/flight-detail";

export function FareRulesSheetCloseButton({ onClose }: { onClose: () => void }) {
  return (
    <button
      type="button"
      className="flex size-8 items-center justify-center rounded-full bg-[#F5F6F9] text-[#999999] active:bg-[#EBEDF0]"
      aria-label="关闭"
      onClick={onClose}
    >
      <svg
        viewBox="0 0 20 20"
        className="size-4"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        aria-hidden
      >
        <path d="M6 6l8 8M14 6l-8 8" strokeLinecap="round" />
      </svg>
    </button>
  );
}

interface FareRulesBottomSheetProps {
  open: boolean;
  title: string;
  titleId?: string;
  onClose: () => void;
  children: ReactNode;
}

export function FareRulesBottomSheet({
  open,
  title,
  titleId,
  onClose,
  children,
}: FareRulesBottomSheetProps) {
  if (!open) return null;

  return (
    <div
      className={`fixed inset-0 z-50 flex flex-col justify-end bg-black/45 ${HOTEL_DETAIL_FONT}`}
    >
      <button type="button" className="flex-1" aria-label="关闭" onClick={onClose} />
      <div
        className="flex max-h-[70vh] flex-col overflow-hidden rounded-t-[20px] bg-white pb-[max(0.75rem,env(safe-area-inset-bottom))] shadow-[0_-10px_40px_rgba(0,0,0,0.12)]"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
      >
        <div className="flex justify-center pt-2" aria-hidden>
          <span className="h-1 w-9 rounded-full bg-[#E0E0E0]" />
        </div>

        <div className="flex shrink-0 items-center gap-2 px-4 pb-2 pt-0.5">
          <div className="size-8 shrink-0" aria-hidden />
          <p
            id={titleId}
            className="min-w-0 flex-1 text-center text-[17px] font-semibold text-[#333333]"
          >
            {title}
          </p>
          <FareRulesSheetCloseButton onClose={onClose} />
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-3 pt-0.5">{children}</div>
      </div>
    </div>
  );
}

function resolveRuleAccent(name?: string): string {
  const label = name?.trim() ?? "";
  if (label.includes("退票")) return "bg-[#FF4D4F]";
  if (label.includes("改期") || label.includes("改签")) return "bg-[#EA580C]";
  if (label.includes("行李") || label.includes("托运")) return "bg-[#52C41A]";
  return "bg-[#2768FA]";
}

function isFreeFeeValue(value: string): boolean {
  const normalized = value.replace(/\s/g, "");
  return /￥0([./人]|$)/.test(normalized) || normalized === "0" || normalized === "免费";
}

function formatFeeDisplay(value: unknown): { text: string; isFree: boolean } {
  const text = String(value ?? "").trim();
  if (!text) return { text: "—", isFree: false };
  return { text, isFree: isFreeFeeValue(text) };
}

function FareRuleSectionCard({
  title,
  accentClass,
  children,
}: {
  title: string;
  accentClass: string;
  children: ReactNode;
}) {
  return (
    <section className="overflow-hidden rounded-xl bg-[#F8F9FC] ring-1 ring-[#EEF1F6]">
      <div className="flex items-center gap-2 border-b border-[#EEF1F6] bg-white/70 px-3.5 py-2">
        <span className={`h-3.5 w-[3px] shrink-0 rounded-full ${accentClass}`} />
        <h3 className="text-[14px] font-semibold text-[#333333]">{title}</h3>
      </div>
      <div className="px-3.5 py-2.5">{children}</div>
    </section>
  );
}

function FareRuleFeeDetailList({
  details,
}: {
  details: NonNullable<FlightFareRuleSheetRow["Details"]>;
}) {
  return (
    <div className="overflow-hidden rounded-lg bg-white ring-1 ring-[#EEF1F6]">
      {details.map((detail, index) => {
        const { text, isFree } = formatFeeDisplay(detail.value);
        const isLast = index === details.length - 1;
        return (
          <div
            key={`${detail.name}-${text}-${index}`}
            className={`flex items-start justify-between gap-3 px-3 py-2 ${
              isLast ? "" : "border-b border-[#F0F2F5]"
            }`}
          >
            <span className="min-w-0 flex-1 text-[13px] leading-[1.5] text-[#666666]">
              {detail.name}
            </span>
            {isFree ? (
              <span className="shrink-0 rounded-md bg-[#F6FFED] px-2 py-0.5 text-[12px] font-medium text-[#389E0D]">
                免费
              </span>
            ) : (
              <span className="shrink-0 text-right text-[13px] font-semibold tabular-nums text-[#333333]">
                {text}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}

export function FareRuleSection({ rule }: { rule: FlightFareRuleSheetRow }) {
  const title = rule.Name?.trim() || "其他规定";
  const accentClass = resolveRuleAccent(rule.Name);
  const hasDetails = Boolean(rule.Details?.length);
  const hasDescription = Boolean(rule.Description?.trim());

  if (!hasDetails && !hasDescription) return null;

  return (
    <FareRuleSectionCard title={title} accentClass={accentClass}>
      {hasDescription ? (
        <p className="text-[13px] leading-[1.65] text-[#666666]">{rule.Description}</p>
      ) : null}
      {hasDetails ? (
        <div className={hasDescription ? "mt-2.5" : ""}>
          <FareRuleFeeDetailList details={rule.Details!} />
        </div>
      ) : null}
    </FareRuleSectionCard>
  );
}

export function FareRuleCabinSummaryCard({
  cabinLine,
  price,
  baggage,
  isAgreement,
}: {
  cabinLine: string;
  price?: string;
  baggage?: string;
  isAgreement?: boolean;
}) {
  return (
    <div className="rounded-xl bg-gradient-to-br from-[#F8FAFF] to-[#F5F6F9] px-3.5 py-2.5 ring-1 ring-[#E8EDF5]">
      <div className="flex items-start justify-between gap-3">
        <p className="min-w-0 flex-1 text-[14px] font-semibold leading-snug text-[#333333]">
          {cabinLine}
        </p>
        {price ? (
          <p className="shrink-0 text-[18px] font-bold leading-none text-[#DE6F00]">
            <span className="text-[12px] font-semibold">¥</span>
            {price}
          </p>
        ) : null}
      </div>
      {isAgreement ? (
        <span className="mt-2 inline-flex rounded bg-[#EEF3FF] px-1.5 py-0.5 text-[11px] font-semibold text-[#5099FE]">
          协议价
        </span>
      ) : null}
      {baggage ? (
        <div className="mt-2.5 flex items-start gap-2">
          <span className="mt-0.5 shrink-0 rounded-md bg-white/80 px-1.5 py-0.5 text-[10px] font-medium text-[#52C41A] ring-1 ring-[#D9F7BE]">
            行李
          </span>
          <p className="text-[12px] leading-[1.55] text-[#666666]">{baggage}</p>
        </div>
      ) : null}
    </div>
  );
}

export function FareRuleSectionList({ rules }: { rules: FlightFareRuleSheetRow[] }) {
  const visibleRules = rules.filter(
    (rule) => Boolean(rule.Description?.trim()) || Boolean(rule.Details?.length),
  );

  if (visibleRules.length === 0) {
    return <p className="py-8 text-center text-[13px] text-[#999999]">暂无退改签政策信息</p>;
  }

  return (
    <div className="space-y-2.5">
      {visibleRules.map((rule, index) => (
        <FareRuleSection key={`${rule.Name ?? "rule"}-${index}`} rule={rule} />
      ))}
    </div>
  );
}
