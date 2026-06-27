import type { ReactNode } from "react";
import type { FlightFare } from "@ryx/shared-types";

import {
  fareBaggageText,
  formatCabinInfoLine,
  formatFareSalesPrice,
  prepareFlightFareForDisplay,
  prepareFlightFareRulesForSheet,
  type FlightFareRuleSheetRow,
} from "@/lib/flight-detail";

interface FlightFareRulesSheetProps {
  open: boolean;
  fare: FlightFare | null;
  onClose: () => void;
}

function SheetCloseButton({ onClose }: { onClose: () => void }) {
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

function resolveRuleAccent(name?: string): string {
  const label = name?.trim() ?? "";
  if (label.includes("退票")) return "bg-[#FF4D4F]";
  if (label.includes("改期") || label.includes("改签")) return "bg-[#EA580C]";
  if (label.includes("行李") || label.includes("托运")) return "bg-[#52C41A]";
  return "bg-brand-primary";
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

function RuleSectionCard({
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

function CabinSummaryCard({
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

function FeeDetailList({ details }: { details: NonNullable<FlightFareRuleSheetRow["Details"]> }) {
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

function RuleSection({ rule }: { rule: FlightFareRuleSheetRow }) {
  const title = rule.Name?.trim() || "其他规定";
  const accentClass = resolveRuleAccent(rule.Name);
  const hasDetails = Boolean(rule.Details?.length);
  const hasDescription = Boolean(rule.Description?.trim());

  if (!hasDetails && !hasDescription) return null;

  return (
    <RuleSectionCard title={title} accentClass={accentClass}>
      {hasDescription ? (
        <p className="text-[13px] leading-[1.65] text-[#666666]">{rule.Description}</p>
      ) : null}
      {hasDetails ? (
        <div className={hasDescription ? "mt-2.5" : ""}>
          <FeeDetailList details={rule.Details!} />
        </div>
      ) : null}
    </RuleSectionCard>
  );
}

export function FlightFareRulesSheet({ open, fare, onClose }: FlightFareRulesSheetProps) {
  if (!open || !fare) return null;

  const cabin = prepareFlightFareForDisplay(fare);
  const rules = prepareFlightFareRulesForSheet(fare);
  const cabinLine = formatCabinInfoLine(fare);
  const baggage = fareBaggageText(fare);
  const price = formatFareSalesPrice(cabin.SalesPrice);
  const visibleRules = rules.filter(
    (rule) => Boolean(rule.Description?.trim()) || Boolean(rule.Details?.length),
  );
  const baggageOnlyRules = visibleRules.filter((rule) => {
    const name = rule.Name?.trim() ?? "";
    return name.includes("行李") || name.includes("托运");
  });
  const policyRules = visibleRules.filter((rule) => !baggageOnlyRules.includes(rule));
  const showBaggageInSummary = Boolean(baggage) && baggageOnlyRules.length === 0;

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end bg-black/45">
      <button type="button" className="flex-1" aria-label="关闭" onClick={onClose} />
      <div
        className="flex max-h-[65vh] flex-col overflow-hidden rounded-t-[20px] bg-white pb-[max(0.75rem,env(safe-area-inset-bottom))] shadow-[0_-10px_40px_rgba(0,0,0,0.12)]"
        role="dialog"
        aria-modal="true"
        aria-labelledby="flight-fare-rules-title"
      >
        <div className="flex justify-center pt-2" aria-hidden>
          <span className="h-1 w-9 rounded-full bg-[#E0E0E0]" />
        </div>

        <div className="flex shrink-0 items-center gap-2 px-4 pb-2 pt-0.5">
          <div className="size-8 shrink-0" aria-hidden />
          <p
            id="flight-fare-rules-title"
            className="min-w-0 flex-1 text-center text-[17px] font-semibold text-[#333333]"
          >
            退改签详情
          </p>
          <SheetCloseButton onClose={onClose} />
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-3 pt-0.5">
          {visibleRules.length === 0 && !cabinLine && !baggage ? (
            <p className="py-8 text-center text-[13px] text-[#999999]">暂无退改签政策信息</p>
          ) : (
            <div className="space-y-2.5">
              {cabinLine ? (
                <CabinSummaryCard
                  cabinLine={cabinLine}
                  price={price || undefined}
                  baggage={showBaggageInSummary ? baggage : undefined}
                  isAgreement={cabin.IsAgreement}
                />
              ) : null}

              {policyRules.map((rule, index) => (
                <RuleSection key={`${rule.Name ?? "rule"}-${index}`} rule={rule} />
              ))}

              {baggageOnlyRules.map((rule, index) => (
                <RuleSection key={`baggage-${rule.Name ?? "rule"}-${index}`} rule={rule} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
