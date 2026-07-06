import type { ReactNode } from "react";

import { Dialog, DialogContent, DialogTitle } from "@ryx/ui/components/ui/dialog";

import { ORDER_FONT } from "@/config/order-assets";
import type { FlightFareRuleSheetRow } from "@/lib/flight-detail";

export function FareRulesSheetCloseButton({ onClose }: { onClose: () => void }) {
  return (
    <button
      type="button"
      className="flex size-8 items-center justify-center rounded-full bg-[#F5F6F9] text-[#999999] hover:bg-[#EBEDF0]"
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

/** Centered dialog variant of H5 bottom sheet — same props for order bill/explain reuse. */
export function FareRulesBottomSheet({
  open,
  title,
  titleId,
  onClose,
  children,
}: FareRulesBottomSheetProps) {
  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent
        className={`flex max-h-[min(85vh,640px)] w-full max-w-lg flex-col gap-0 overflow-hidden p-0 sm:max-w-lg ${ORDER_FONT}`}
        aria-labelledby={titleId}
      >
        <div className="flex shrink-0 items-center gap-2 border-b border-[#EEEEEE] px-4 py-3">
          <div className="size-8 shrink-0" aria-hidden />
          <DialogTitle
            id={titleId}
            className="min-w-0 flex-1 text-center text-[17px] font-semibold text-[#333333]"
          >
            {title}
          </DialogTitle>
          <FareRulesSheetCloseButton onClose={onClose} />
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-3">{children}</div>
      </DialogContent>
    </Dialog>
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
