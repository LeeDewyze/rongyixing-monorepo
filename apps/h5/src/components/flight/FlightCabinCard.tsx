import type { FlightFare } from "@ryx/shared-types";

import { FLIGHT_CABINS_FONT } from "@/components/flight/flight-cabins-chrome";
import type { FlightCabinPolicyColor } from "@/lib/flight-cabin-policy";
import {
  fareRemainCount,
  formatCabinInfoLine,
  formatFareSalesPrice,
  isFlightFareBookable,
  prepareFlightFareForDisplay,
  shouldShowFareRemainCount,
} from "@/lib/flight-detail";

interface FlightCabinCardProps {
  fare: FlightFare;
  policyColor?: FlightCabinPolicyColor;
  policyHint?: string;
  policyBlocked?: boolean;
  soldOut?: boolean;
  onBook: (fare: FlightFare) => void;
  onShowRules?: (fare: FlightFare) => void;
}

function resolveCardRingClass(color: FlightCabinPolicyColor): string {
  switch (color) {
    case "success":
      return "ring-[#34C759]/25";
    case "warning":
      return "ring-[#de6f00]/25";
    case "danger":
      return "ring-[#ff383c]/25";
    default:
      return "ring-[#ECEEF2]";
  }
}

function resolvePolicyHintClass(color: FlightCabinPolicyColor): string {
  switch (color) {
    case "success":
      return "bg-[#F0FDF4] text-[#15803D]";
    case "warning":
      return "bg-[#FFF7ED] text-[#C2410C]";
    case "danger":
      return "bg-[#FFF1F0] text-[#DC2626]";
    default:
      return "bg-[#F5F6F9] text-[#666666]";
  }
}

function resolveBookButtonClass(
  color: FlightCabinPolicyColor,
  options: { soldOut: boolean; policyBlocked: boolean },
): string {
  if (options.soldOut) return "bg-[#cccccc]";
  if (options.policyBlocked) return "bg-[#f5a8a8] opacity-90";
  switch (color) {
    case "success":
      return "bg-[#34C759] active:opacity-90";
    case "warning":
      return "bg-[#de6f00] active:opacity-90";
    case "danger":
      return "bg-[#ff383c] active:opacity-90";
    default:
      return "bg-[linear-gradient(270deg,#2768FA_0%,#33A1F9_100%)] shadow-[0_2px_8px_rgba(39,104,250,0.22)] active:opacity-90";
  }
}

export function FlightCabinCard({
  fare,
  policyColor = "default",
  policyHint,
  policyBlocked = false,
  soldOut,
  onBook,
  onShowRules,
}: FlightCabinCardProps) {
  const cabin = prepareFlightFareForDisplay(fare);
  const remain = fareRemainCount(cabin);
  const showRemain = shouldShowFareRemainCount(cabin);
  const isSoldOut = soldOut ?? !isFlightFareBookable(cabin);

  return (
    <div
      className={`overflow-hidden rounded-xl bg-white px-3.5 pb-3 pt-3.5 ring-1 shadow-[0_1px_4px_rgba(0,0,0,0.03)] ${FLIGHT_CABINS_FONT} ${resolveCardRingClass(policyColor)}`}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
            <div className="flex items-baseline gap-0.5 text-[24px] font-medium leading-none tracking-normal text-[#FF383C]">
              <span>¥</span>
              <span>{formatFareSalesPrice(cabin.SalesPrice)}</span>
            </div>
            {cabin.IsAgreement ? (
              <span className="rounded-full bg-[#EEF4FF] px-2 py-0.5 text-[10px] font-medium text-[#2768FA] ring-1 ring-[#D6E4FF]">
                协议价
              </span>
            ) : null}
          </div>

          <p className="mt-1.5 text-[14px] font-medium leading-snug text-[#1A1A1A]">
            {formatCabinInfoLine(cabin)}
          </p>
        </div>

        <button
          type="button"
          disabled={isSoldOut}
          className={`min-w-[4.75rem] shrink-0 self-center rounded-full px-4 py-2 text-[13px] font-medium text-white disabled:opacity-100 ${resolveBookButtonClass(
            policyColor,
            { soldOut: isSoldOut, policyBlocked },
          )}`}
          onClick={() => onBook(cabin)}
        >
          {isSoldOut ? "售罄" : "预订"}
        </button>
      </div>

      {policyHint ? (
        <p
          className={`mt-2.5 rounded-lg px-2.5 py-2 text-[12px] leading-snug ${resolvePolicyHintClass(policyColor)}`}
        >
          {policyHint}
        </p>
      ) : null}

      <div className="mt-3 flex items-center gap-3 border-t border-[#EEF1F6] pt-2.5">
        {showRemain && remain != null ? (
          <span className="inline-flex h-5 items-center rounded-full bg-[#F5F6F9] px-2 text-[10px] text-[#666666] ring-1 ring-[#ECEEF2]">
            余票{remain}张
          </span>
        ) : null}
        <button
          type="button"
          className="ml-auto inline-flex shrink-0 items-center gap-0.5 text-[12px] font-medium text-[#2768FA] active:opacity-70"
          onClick={() => onShowRules?.(cabin)}
        >
          退改签政策详情
          <span className="text-[14px] leading-none" aria-hidden>
            ›
          </span>
        </button>
      </div>
    </div>
  );
}
