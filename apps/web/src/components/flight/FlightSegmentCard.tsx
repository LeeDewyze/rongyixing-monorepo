import type { FlightSegment } from "@ryx/shared-types";

import trainRouteArrow from "@/assets/train/route-arrow.png";
import { formatFlightTime } from "@/utils/flight-list";
import {
  formatArrivalDayOffsetLabel,
  formatFlightAgreementAirlineLabel,
  formatFlightListAirlineFlightLabel,
  formatFlightListAirportLine,
  formatFlightListMealLabel,
  formatFlightListPlaneSubtitle,
  formatFlightListPriceLabel,
  formatFlightRouteMiddleDisplay,
  shouldShowScarceBadge,
  type FlightCardVariant,
} from "@/utils/flight-list-display";

const FONT = "[font-family:'HarmonyOS_Sans_SC','HarmonyOS_Sans','PingFang_SC',sans-serif]";

const FLIGHT_TIME_CLASS = `whitespace-nowrap text-[24px] font-[500] not-italic leading-[100%] tracking-[0] text-[#010101] ${FONT}`;

const FLIGHT_AIRPORT_CLASS = `truncate text-[16px] font-[400] not-italic leading-[100%] tracking-[0] text-[#666666] ${FONT}`;

const FLIGHT_AIRLINE_CLASS = `truncate text-[20px] font-[500] not-italic leading-[100%] tracking-[0] text-[#010101] ${FONT}`;

const FLIGHT_PLANE_CLASS = `whitespace-nowrap text-[14px] font-[400] not-italic leading-[100%] tracking-[0] text-[#666666] ${FONT}`;

const FLIGHT_DAY_OFFSET_CLASS = `ml-1 whitespace-nowrap text-[16px] font-[400] not-italic leading-[100%] tracking-[0] text-[#666666] ${FONT}`;

const FLIGHT_PRICE_CLASS = `whitespace-nowrap text-[24px] font-[500] not-italic leading-none tracking-[0] pc:text-[26px] ${FONT}`;

const FLIGHT_PRICE_COLOR_LOWEST = "text-[#34C759]";

const FLIGHT_PRICE_COLOR_DEFAULT = "text-[#FF383C]";

function resolveFlightPriceColor(variant: FlightCardVariant): string {
  return variant === "direct-lowest" ? FLIGHT_PRICE_COLOR_LOWEST : FLIGHT_PRICE_COLOR_DEFAULT;
}

const FLIGHT_SCARCE_BADGE_CLASS = `flex h-5 min-w-[40px] shrink-0 items-center justify-center whitespace-nowrap rounded border border-[#FF383C] bg-[#FF383C1A] px-1.5 text-[10px] font-normal leading-none tracking-[0] text-[#FF383C] ${FONT}`;

const FLIGHT_AGREEMENT_AIRLINE_CLASS = `inline-flex h-5 items-center justify-center whitespace-nowrap rounded border border-[#34C759] bg-[#34C7591A] px-2 text-[11px] font-normal leading-none tracking-[0] text-[#34C759] ${FONT}`;

/** Airline column keeps a stable width so times align, but grows for long plane/meal text. */
const FLIGHT_CARD_GRID_CLASS =
  "grid w-full grid-cols-[minmax(18rem,max-content)_minmax(0,1fr)_auto] items-center gap-x-5 pc:grid-cols-[minmax(21rem,max-content)_minmax(0,1fr)_auto] pc:gap-x-6";

const FLIGHT_ROUTE_ROW_CLASS =
  "grid w-max max-w-full grid-cols-[5.75rem_5.5rem_5.75rem] items-center gap-x-5 pc:grid-cols-[6.25rem_6rem_6.25rem] pc:gap-x-6";

const FLIGHT_ROUTE_TIME_COL_CLASS = "min-w-0";

const FLIGHT_ROUTE_ARROW_COL_CLASS = "w-full";

const DIRECT_LOWEST_GRADIENT_STYLE = {
  background:
    "linear-gradient(180deg, #D7FFF0 0%, rgba(215, 255, 240, 0.72) 38%, rgba(215, 255, 240, 0.28) 62%, rgba(215, 255, 240, 0.06) 82%, transparent 100%)",
};

function DirectLowestGradient() {
  return (
    <div
      className="pointer-events-none absolute inset-x-0 top-0 z-0 h-14 rounded-t-lg"
      style={DIRECT_LOWEST_GRADIENT_STYLE}
      aria-hidden
    />
  );
}

function DirectLowestBadge() {
  return (
    <span
      className={`absolute left-0 top-0 z-[2] flex h-5 min-w-[56px] items-center justify-center rounded-tl-lg bg-[#34C759] px-2 text-[11px] font-normal leading-none tracking-[0] text-white ${FONT}`}
    >
      直飞低价
    </span>
  );
}

interface FlightSegmentCardProps {
  segment: FlightSegment;
  variant?: FlightCardVariant;
  loading?: boolean;
  isExchange?: boolean;
  onClick?: () => void;
}

const AIRLINE_LOGO_CLASS = "size-12 shrink-0 object-contain";

function AirlineLogo({ segment }: { segment: FlightSegment }) {
  const fallback = (segment.Airline ?? segment.AirlineName ?? "航").slice(0, 1);

  if (segment.AirlineSrc) {
    return <img src={segment.AirlineSrc} alt="" className={AIRLINE_LOGO_CLASS} />;
  }

  return (
    <span
      className={`flex ${AIRLINE_LOGO_CLASS} items-center justify-center rounded-full bg-[#EEF3FF] text-[17px] font-bold text-brand-accent`}
    >
      {fallback}
    </span>
  );
}

function FlightRouteMiddle({ segment }: { segment: FlightSegment }) {
  const { durationLabel, routeLabel } = formatFlightRouteMiddleDisplay(segment);

  return (
    <div
      className={`flex flex-col items-center justify-center gap-1 ${FLIGHT_ROUTE_ARROW_COL_CLASS}`}
    >
      {durationLabel ? (
        <span className={`text-[11px] font-normal leading-none text-[#999999] ${FONT}`}>
          {durationLabel}
        </span>
      ) : null}
      <img
        src={trainRouteArrow}
        alt=""
        width={56}
        height={12}
        className="h-3 w-14 shrink-0 object-contain"
        aria-hidden
      />
      {routeLabel ? (
        <span
          className={`whitespace-nowrap text-center text-[11px] font-medium leading-none tracking-[0] text-brand-accent ${FONT}`}
        >
          {routeLabel}
        </span>
      ) : null}
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

function BookActionChip({ loading }: { loading: boolean }) {
  return (
    <span
      className={`inline-flex h-10 w-[120px] shrink-0 items-center justify-center rounded-lg bg-gradient-to-l from-[#2768FA] to-[#33A1F9] text-[14px] font-medium leading-none text-white shadow-[0_2px_8px_rgba(39,104,250,0.24)] ${FONT}`}
      aria-hidden
    >
      {loading ? "…" : "订票"}
    </span>
  );
}

export function FlightSegmentCard({
  segment,
  variant = "direct",
  loading = false,
  isExchange = false,
  onClick,
}: FlightSegmentCardProps) {
  const isDirectLowest = variant === "direct-lowest";
  const isTransferLowest = variant === "transfer-lowest";
  const priceColor = resolveFlightPriceColor(variant);
  const priceLabel = formatFlightListPriceLabel(segment, isExchange);
  const airlineFlightLabel = formatFlightListAirlineFlightLabel(segment);
  const planeSubtitle = formatFlightListPlaneSubtitle(segment);
  const mealLabel = formatFlightListMealLabel(segment.Meal);
  const planeMetaLine = [planeSubtitle, mealLabel].filter(Boolean).join(" | ");
  const agreementAirlineLabel = formatFlightAgreementAirlineLabel(segment);
  const arrivalDayOffset = formatArrivalDayOffsetLabel(segment.TakeoffTime, segment.ArrivalTime);

  const cardSurfaceClass = isDirectLowest
    ? "bg-white"
    : isTransferLowest
      ? "bg-gradient-to-b from-[#fff7ed] to-white"
      : "bg-white";

  const cardRadiusClass = isDirectLowest ? "rounded-lg" : "rounded-xl";

  const contentPadding = isDirectLowest ? "py-4 pl-4 pr-4 pt-7" : "p-4";

  return (
    <button
      type="button"
      disabled={loading}
      onClick={onClick}
      className={`relative z-0 min-h-[100px] w-full overflow-hidden text-left shadow-[0_2px_8px_rgba(0,0,0,0.06)] ring-1 ring-black/[0.03] transition hover:shadow-[0_4px_12px_rgba(0,0,0,0.08)] active:scale-[0.995] disabled:pointer-events-none disabled:opacity-60 ${cardRadiusClass} ${cardSurfaceClass}`}
    >
      {isDirectLowest ? <DirectLowestGradient /> : null}
      {isDirectLowest ? <DirectLowestBadge /> : null}

      {isTransferLowest ? (
        <div className="absolute left-4 top-3 z-[2]">
          <TransferLowestBadge label="中转低价" />
        </div>
      ) : null}

      <div className={`relative z-[1] ${contentPadding} ${isTransferLowest ? "pt-9" : ""}`}>
        <div className={FLIGHT_CARD_GRID_CLASS}>
          <div className="flex items-center gap-3 pc:gap-4">
            <AirlineLogo segment={segment} />
            <div className="flex flex-col gap-2">
              {airlineFlightLabel ? (
                <p className={FLIGHT_AIRLINE_CLASS}>{airlineFlightLabel}</p>
              ) : null}
              {planeMetaLine ? <p className={FLIGHT_PLANE_CLASS}>{planeMetaLine}</p> : null}
            </div>
          </div>

          <div className={FLIGHT_ROUTE_ROW_CLASS}>
            <div className={`flex flex-col items-start gap-2 ${FLIGHT_ROUTE_TIME_COL_CLASS}`}>
              <p className={FLIGHT_TIME_CLASS}>{formatFlightTime(segment.TakeoffTime)}</p>
              <p className={`w-full ${FLIGHT_AIRPORT_CLASS}`}>
                {formatFlightListAirportLine(
                  segment.FromCityName,
                  segment.FromAirportName,
                  segment.FromTerminal,
                )}
              </p>
            </div>

            <FlightRouteMiddle segment={segment} />

            <div className={`flex flex-col items-start gap-2 ${FLIGHT_ROUTE_TIME_COL_CLASS}`}>
              <p className={FLIGHT_TIME_CLASS}>
                {formatFlightTime(segment.ArrivalTime)}
                {arrivalDayOffset ? (
                  <span className={FLIGHT_DAY_OFFSET_CLASS}>{arrivalDayOffset}</span>
                ) : null}
              </p>
              <p className={`w-full ${FLIGHT_AIRPORT_CLASS}`}>
                {formatFlightListAirportLine(
                  segment.ToCityName,
                  segment.ToAirportName,
                  segment.ToTerminal,
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pc:gap-4">
            {shouldShowScarceBadge(segment) ? (
              <span className={FLIGHT_SCARCE_BADGE_CLASS}>剩{segment.RemainSeats}张</span>
            ) : null}
            <div className="flex min-w-[5.5rem] flex-col items-end gap-1">
              {priceLabel ? (
                <p className={`${FLIGHT_PRICE_CLASS} ${priceColor}`}>¥{priceLabel}</p>
              ) : null}
              {agreementAirlineLabel ? (
                <span className={FLIGHT_AGREEMENT_AIRLINE_CLASS}>{agreementAirlineLabel}</span>
              ) : null}
            </div>
            <BookActionChip loading={loading} />
          </div>
        </div>
      </div>
    </button>
  );
}
