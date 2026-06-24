import type { HotelPolicyColor, HotelRoomPlan } from "@ryx/shared-types";

import { policyButtonClassName } from "@/lib/hotel-book-policy";

interface HotelDetailPlanRowProps {
  plan: HotelRoomPlan;
  policyColor?: HotelPolicyColor;
  bookable: boolean;
  onBook: () => void;
  isLast?: boolean;
}

function formatBreakfastLabel(breakfast?: string): string | null {
  if (!breakfast) return "无早";
  if (/无早|不含早/.test(breakfast)) return "无早";
  const match = breakfast.match(/(\d+)\s*份|双早|单早/);
  if (match) {
    if (breakfast.includes("双早")) return "2份早餐";
    if (breakfast.includes("单早")) return "1份早餐";
    return `${match[1]}份早餐`;
  }
  return breakfast;
}

function formatCancelPolicyLabel(cancelPolicy?: string): string {
  if (!cancelPolicy) return "限时取消";
  if (/不可取消|预订后不可|不可退/.test(cancelPolicy)) return "不可取消";
  return "限时取消";
}

function getPayTypeLabel(plan: HotelRoomPlan): string {
  const vars = plan.VariablesObj;
  const fromVars = vars?.PayType ?? vars?.PaymentType ?? vars?.PayTypeName;
  if (fromVars != null && String(fromVars).trim()) return String(fromVars);
  if (plan.PlanName.includes("预付")) return "预付";
  return "预付";
}

function bookButtonStyles(
  bookable: boolean,
  policyColor?: HotelPolicyColor,
): { shell: string; book: string; pay: string } {
  if (!bookable) {
    return {
      shell: "border-[#CCCCCC]",
      book: "bg-[#CCCCCC] text-white",
      pay: "bg-white text-[#CCCCCC]",
    };
  }
  const policyClass = policyButtonClassName(policyColor);
  if (policyClass.includes("FF8C00")) {
    return {
      shell: "border-[#FF8C00]",
      book: "bg-[#FF8C00] text-white",
      pay: "bg-white text-[#FF8C00]",
    };
  }
  if (policyClass.includes("CCCCCC")) {
    return {
      shell: "border-[#CCCCCC]",
      book: "bg-[#CCCCCC] text-white",
      pay: "bg-white text-[#CCCCCC]",
    };
  }
  return {
    shell: "border-[#22C55E]",
    book: "bg-[#22C55E] text-white",
    pay: "bg-white text-[#2768FA]",
  };
}

export function HotelDetailPlanRow({
  plan,
  policyColor,
  bookable,
  onBook,
  isLast = false,
}: HotelDetailPlanRowProps) {
  const breakfast = formatBreakfastLabel(plan.Breakfast);
  const cancelLabel = formatCancelPolicyLabel(plan.CancelPolicy);
  const payLabel = getPayTypeLabel(plan);
  const buttonStyles = bookButtonStyles(bookable, policyColor);

  return (
    <div
      className={`flex items-stretch gap-3 px-3 py-3 ${
        isLast ? "" : "border-b border-dashed border-[#E5E7EB]"
      }`}
    >
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <p className="text-[14px] font-semibold leading-snug text-[#333333]">{plan.PlanName}</p>
          <span className="inline-flex h-[18px] items-center rounded border border-[#2768FA] px-1 text-[10px] leading-none text-[#2768FA]">
            专票
          </span>
          <span className="text-[12px] leading-none text-[#8B7FD4]">{cancelLabel}</span>
        </div>
        {breakfast ? (
          <p className="mt-1.5 text-[12px] leading-none text-[#999999]">{breakfast}</p>
        ) : null}
      </div>

      <div className="flex shrink-0 items-center gap-3">
        <div className="flex items-baseline text-[#2768FA]">
          <span className="text-[12px] font-medium">¥</span>
          <span className="text-[22px] font-semibold leading-none">{Math.round(plan.Price)}</span>
        </div>

        <button
          type="button"
          disabled={!bookable}
          onClick={onBook}
          className={`flex w-[52px] shrink-0 flex-col overflow-hidden rounded-md border ${buttonStyles.shell} disabled:opacity-100`}
        >
          <span
            className={`flex h-[30px] items-center justify-center text-[13px] font-medium ${buttonStyles.book}`}
          >
            预订
          </span>
          <span
            className={`flex h-[22px] items-center justify-center border-t text-[11px] ${buttonStyles.pay} ${buttonStyles.shell}`}
          >
            {payLabel}
          </span>
        </button>
      </div>
    </div>
  );
}
