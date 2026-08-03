import type { HotelPolicyColor, HotelRoomPlan } from "@ryx/shared-types";

import { HOTEL_DETAIL_FONT } from "@/components/hotel/hotel-detail-chrome";
import {
  getHotelPlanBookButtonPresentation,
  getHotelPlanPayTypeLabel,
  isHotelPlanBookable,
} from "@/lib/hotel-book-policy";

interface HotelDetailPlanRowProps {
  plan: HotelRoomPlan;
  policyColor?: HotelPolicyColor;
  isAgent?: boolean;
  onBook: () => void;
  onShowCancelRule?: (message: string) => void;
  isLast?: boolean;
  loading?: boolean;
  policyChecked?: boolean;
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

function cancelChipClass(cancelLabel: string): string {
  if (cancelLabel === "不可取消") {
    return "bg-[#FFF7ED] text-[#EA580C] ring-1 ring-[#FFEDD5]";
  }
  return "bg-[#F5F3FF] text-[#8B7FD4] ring-1 ring-[#EDE9FE]";
}

function resolveCancelRuleMessage(plan: HotelRoomPlan): string {
  const descriptions = plan.RoomPlanRules?.map((item) => item.Description?.trim()).filter(Boolean) ?? [];
  if (descriptions.length) {
    return descriptions.join("，");
  }

  const rateRule = plan.VariablesObj?.RoomRateRule;
  if (typeof rateRule === "string" && rateRule.trim()) {
    return rateRule.trim();
  }

  return plan.CancelPolicy?.trim() ?? "";
}

export function HotelDetailPlanRow({
  plan,
  policyColor,
  isAgent = false,
  onBook,
  onShowCancelRule,
  isLast = false,
  loading = false,
  policyChecked = false,
}: HotelDetailPlanRowProps) {
  const breakfast = formatBreakfastLabel(plan.Breakfast);
  const cancelLabel = formatCancelPolicyLabel(plan.CancelPolicy);
  const cancelRuleMessage = resolveCancelRuleMessage(plan);
  const payLabel = getHotelPlanPayTypeLabel(plan);
  const awaitingPolicy = !policyChecked;
  const displayColor = policyColor ?? (policyChecked ? "success" : undefined);
  const displayBookable = isHotelPlanBookable(displayColor, isAgent, policyChecked);
  const button = getHotelPlanBookButtonPresentation(
    displayColor,
    displayBookable,
    payLabel,
    isAgent,
  );

  return (
    <div
      className={`mx-3 rounded-lg bg-white p-3 ring-1 ring-[#ECEEF2] shadow-[0_1px_4px_rgba(0,0,0,0.03)] ${HOTEL_DETAIL_FONT} ${
        isLast ? "mb-3" : "mb-2"
      }`}
    >
      <div className="flex items-stretch gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-[14px] font-semibold leading-snug text-[#1A1A1A]">{plan.PlanName}</p>

          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            <span className="inline-flex h-[20px] items-center rounded-full bg-[#EEF4FF] px-2 text-[10px] font-medium leading-none text-brand-primary ring-1 ring-[#D6E4FF]">
              专票
            </span>
            {cancelRuleMessage ? (
              <button
                type="button"
                className={`inline-flex h-[20px] cursor-pointer appearance-none items-center rounded-full border-0 px-2 text-left text-[10px] font-medium leading-none transition-opacity active:opacity-70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary/30 ${cancelChipClass(cancelLabel)}`}
                onClick={() => onShowCancelRule?.(cancelRuleMessage)}
              >
                {cancelLabel}
              </button>
            ) : (
              <span
                className={`inline-flex h-[20px] items-center rounded-full px-2 text-[10px] font-medium leading-none ${cancelChipClass(cancelLabel)}`}
              >
                {cancelLabel}
              </span>
            )}
            {breakfast ? (
              <span className="inline-flex h-[20px] items-center rounded-full bg-[#F5F6F9] px-2 text-[10px] leading-none text-[#666666] ring-1 ring-[#ECEEF2]">
                {breakfast}
              </span>
            ) : null}
          </div>
        </div>

        <div className="flex shrink-0 flex-col items-end justify-between gap-2">
          <div className={`flex items-baseline ${button.priceClass}`}>
            <span className="text-[11px] font-medium">¥</span>
            <span className="text-[22px] font-semibold leading-none tracking-tight">
              {Math.round(plan.Price)}
            </span>
          </div>

          {loading || awaitingPolicy ? (
            <div className="flex h-[52px] w-[62px] items-center justify-center rounded-lg bg-[#F3F4F6] text-[11px] text-[#999999]">
              校验中
            </div>
          ) : (
            <div className="flex w-[62px] shrink-0 flex-col items-center">
              <button
                type="button"
                aria-disabled={button.disabled}
                onClick={onBook}
                className={`flex h-[30px] w-[62px] items-center justify-center rounded-md border px-0.5 text-center ${button.shellClass} ${button.topLabelClass} ${button.topClass} active:opacity-90 ${
                  button.disabled ? "cursor-not-allowed" : ""
                }`}
              >
                {button.topLabel}
              </button>
              {button.bottomLabel ? (
                <span
                  className={`mt-0.5 min-h-[16px] text-center text-[10px] font-medium leading-4 ${button.bottomClass}`}
                >
                  {button.bottomLabel}
                </span>
              ) : null}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
