import type { FlightSegment } from "@ryx/shared-types";

import trainRouteArrow from "@/assets/train/route-arrow.png";
import { formatFlightTime } from "@/utils/flight-list";
import {
  formatArrivalDateBadge,
  formatFlightListMetaLine,
  shortAirportName,
  shouldShowScarceBadge,
  type FlightCardVariant,
} from "@/utils/flight-list-display";

const FONT = "[font-family:'HarmonyOS_Sans_SC','HarmonyOS_Sans','PingFang_SC',sans-serif]";

const FLIGHT_TIME_CLASS = `whitespace-nowrap text-[16px] font-[500] not-italic leading-[100%] tracking-[0] text-[#010101] ${FONT}`;

const FLIGHT_AIRPORT_CLASS = `truncate text-[14px] font-[400] not-italic leading-[100%] tracking-[0] text-[#666666] ${FONT}`;

const FLIGHT_META_CLASS = `text-[11px] font-[400] not-italic leading-[100%] tracking-[0] text-[#666666] ${FONT}`;

const FLIGHT_DAY_TIP_CLASS = `absolute right-0 bottom-full mb-0.5 whitespace-nowrap text-[10px] font-normal leading-[100%] tracking-[0] text-[#010101] ${FONT}`;

const FLIGHT_PRICE_CLASS = `whitespace-nowrap text-[24px] font-[500] not-italic leading-[100%] tracking-[0] ${FONT}`;

const FLIGHT_PRICE_COLOR_LOWEST = "text-[#34C759]";

const FLIGHT_PRICE_COLOR_DEFAULT = "text-[#FF383C]";

function resolveFlightPriceColor(variant: FlightCardVariant): string {
  return variant === "direct-lowest" ? FLIGHT_PRICE_COLOR_LOWEST : FLIGHT_PRICE_COLOR_DEFAULT;
}

const FLIGHT_SCARCE_BADGE_CLASS = `flex h-4 min-w-[36px] shrink-0 items-center justify-center whitespace-nowrap rounded border border-[#FF383C] bg-[#FF383C1A] px-1 text-[10px] font-normal leading-[100%] tracking-[0] text-[#FF383C] ${FONT}`;

const DIRECT_LOWEST_CARD_CLASS =
  "bg-white bg-[linear-gradient(184.36deg,#D7FFF0_5.34%,#FFFFFF_98.28%)] bg-[length:100%_48px] bg-top bg-no-repeat";

function DirectLowestBadge() {
  return (
    <span
      className={`absolute left-0 top-0 z-[1] flex h-4 min-w-[54px] items-center justify-center rounded-tl-lg bg-[#34C759] px-1.5 text-[10px] font-normal leading-[100%] tracking-[0] text-white ${FONT}`}
    >
      直飞低价
    </span>
  );
}

interface FlightSegmentCardProps {
  segment: FlightSegment;
  variant?: FlightCardVariant;
  loading?: boolean;
  onClick?: () => void;
}

function FlightRouteMiddle({ transfer = false }: { transfer?: boolean }) {
  return (
    <div className="flex flex-col items-center gap-0.5">
      <img
        src={trainRouteArrow}
        alt=""
        width={56}
        height={12}
        className="h-3 w-14 shrink-0 object-contain"
        aria-hidden
      />
      {transfer ? (
        <span
          className={`text-[10px] font-medium leading-[100%] tracking-[0] text-[#5099fe] ${FONT}`}
        >
          转
        </span>
      ) : (
        <span className="h-3" aria-hidden />
      )}
    </div>
  );
}

function TransferLowestBadge({ label }: { label: string }) {
  return (
    <span className="inline-block rounded-md bg-[#fff3e6] px-2 py-0.5 text-[11px] font-medium text-[#f97316]">
      {label}
    </span>
  );
}

function formatAirportLabel(
  airportName: string | undefined,
  cityName: string | undefined,
  terminal: string | undefined,
): string {
  const airport = shortAirportName(airportName ?? cityName);
  const term = terminal?.trim() ?? "";
  return term ? `${airport} ${term}` : airport;
}

export function FlightSegmentCard({
  segment,
  variant = "direct",
  loading = false,
  onClick,
}: FlightSegmentCardProps) {
  const isDirectLowest = variant === "direct-lowest";
  const isTransferLowest = variant === "transfer-lowest";
  const isTransfer = variant === "transfer" || isTransferLowest;
  const priceColor = resolveFlightPriceColor(variant);
  const metaLine = formatFlightListMetaLine(segment);
  const arrivalDayTip = formatArrivalDateBadge(segment.TakeoffTime, segment.ArrivalTime);

  const topGradient = isDirectLowest
    ? DIRECT_LOWEST_CARD_CLASS
    : isTransferLowest
      ? "bg-gradient-to-b from-[#fff7ed] to-white"
      : "bg-white";

  const contentPadding = isDirectLowest
    ? "pb-2 pt-[26px]"
    : isTransferLowest
      ? "pb-2 pt-2"
      : "pb-2 pt-4";

  return (
    <button
      type="button"
      disabled={loading}
      onClick={onClick}
      className={`relative z-0 min-h-[96px] w-full overflow-hidden rounded-lg text-left shadow-[0_2px_8px_rgba(0,0,0,0.06)] transition active:scale-[0.99] disabled:pointer-events-none disabled:opacity-60 ${topGradient}`}
    >
      {isDirectLowest ? <DirectLowestBadge /> : null}

      {isTransferLowest ? (
        <div className="px-3 pt-2.5">
          <TransferLowestBadge label="中转低价" />
        </div>
      ) : null}

      <div className={`relative z-[1] px-3 ${contentPadding}`}>
        <div className="flex items-center justify-between gap-2">
          <div className="flex min-w-0 flex-1 items-start gap-2.5">
            <div className="flex shrink-0 flex-col gap-2">
              <p className={FLIGHT_TIME_CLASS}>{formatFlightTime(segment.TakeoffTime)}</p>
              <p className={FLIGHT_AIRPORT_CLASS}>
                {formatAirportLabel(
                  segment.FromAirportName,
                  segment.FromCityName,
                  segment.FromTerminal,
                )}
              </p>
            </div>

            <div className="flex shrink-0 flex-col items-center gap-0.5 px-2.5">
              <span className="h-3" aria-hidden />
              <FlightRouteMiddle transfer={isTransfer} />
            </div>

            <div className="flex shrink-0 flex-col gap-2">
              <div className="relative w-fit">
                <p className={FLIGHT_TIME_CLASS}>{formatFlightTime(segment.ArrivalTime)}</p>
                {arrivalDayTip ? (
                  <span className={FLIGHT_DAY_TIP_CLASS}>{arrivalDayTip}</span>
                ) : null}
              </div>
              <p className={FLIGHT_AIRPORT_CLASS}>
                {formatAirportLabel(segment.ToAirportName, segment.ToCityName, segment.ToTerminal)}
              </p>
            </div>
          </div>

          <div className="flex shrink-0 items-center justify-end gap-1 pl-1">
            {shouldShowScarceBadge(segment) ? (
              <span className={FLIGHT_SCARCE_BADGE_CLASS}>剩{segment.RemainSeats}张</span>
            ) : null}
            <p className={`${FLIGHT_PRICE_CLASS} ${priceColor}`}>¥{segment.LowestFare ?? "-"}</p>
          </div>
        </div>

        <div className="mt-3 flex min-w-0 items-center gap-2">
          {segment.AirlineSrc ? (
            <img src={segment.AirlineSrc} alt="" className="size-4 shrink-0 object-contain" />
          ) : (
            <span className="flex size-4 shrink-0 items-center justify-center rounded-full bg-[#eef3ff] text-[8px] font-bold text-[#5099fe]">
              {(segment.Airline ?? segment.AirlineName ?? "航").slice(0, 1)}
            </span>
          )}
          {metaLine ? (
            <div className={`min-w-0 flex-1 truncate ${FLIGHT_META_CLASS}`}>{metaLine}</div>
          ) : null}
        </div>
      </div>
    </button>
  );
}
