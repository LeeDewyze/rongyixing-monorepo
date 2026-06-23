import type { FlightBookSelection } from "@/lib/flight-book-session";
import { formatFlightBookRouteSubtitle } from "@/lib/flight-book-display";
import { FlightRoutePlaneIcon } from "@/components/flight/FlightRoutePlaneIcon";
import { formatFlightTime } from "@/utils/flight-list";
import { shortAirportName } from "@/utils/flight-list-display";

interface FlightBookSummaryProps {
  selection: FlightBookSelection;
  onShowRules: () => void;
}

export function FlightBookSummary({ selection, onShowRules }: FlightBookSummaryProps) {
  const { cabinsQuery, segment } = selection;
  const routeLabel = `${cabinsQuery.fromName} → ${cabinsQuery.toName}`;
  const subtitle = formatFlightBookRouteSubtitle(
    segment.TakeoffTime || cabinsQuery.takeoffTime,
    segment.FlyTimeName || cabinsQuery.flyTimeName,
  );
  const durationLabel = (segment.FlyTimeName || cabinsQuery.flyTimeName || "").replace(/^飞/, "");
  const flightNumber = segment.Number || segment.FlightNumber || cabinsQuery.flightNumber;
  const airlineName = segment.AirlineName || cabinsQuery.airlineName;
  const planeLabel = segment.PlaneTypeDescribe || cabinsQuery.planeTypeDescribe || segment.PlaneType;
  const fromAirport = shortAirportName(segment.FromAirportName || cabinsQuery.fromAirportName);
  const toAirport = shortAirportName(segment.ToAirportName || cabinsQuery.toAirportName);

  return (
    <div className="px-3 pb-3">
      <div className="rounded-xl bg-[linear-gradient(135deg,#24a8ff_0%,#2468f7_100%)] px-3.5 pb-3 pt-3 shadow-[0_8px_18px_rgba(36,104,247,0.22)]">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[20px] font-semibold leading-snug text-white">{routeLabel}</p>
            {subtitle ? <p className="mt-1 text-[13px] text-white/90">{subtitle}</p> : null}
          </div>
          <button
            type="button"
            aria-label="收起航班信息"
            className="mt-1 flex size-5 shrink-0 items-center justify-center rounded-full border border-white/80 text-[14px] leading-none text-white"
          >
            ⌃
          </button>
        </div>

        <div className="mt-3 rounded-lg bg-white px-3 py-3">
          <div className="grid grid-cols-[minmax(0,1fr)_7.5rem_minmax(0,1fr)] items-start gap-x-2">
            <div className="min-w-0">
              <p className="text-[22px] font-semibold leading-none tracking-tight text-[#1a1a1a]">
                {formatFlightTime(segment.TakeoffTime)}
              </p>
              <p className="mt-2 truncate text-[14px] text-[#666666]">{fromAirport}</p>
            </div>

            <div className="pt-0.5 text-center">
              {durationLabel ? (
                <p className="text-[12px] leading-none text-[#999999]">{durationLabel}</p>
              ) : null}
              <div className="mt-1 flex items-center">
                <div className="h-px flex-1 bg-[#d8e7ff]" />
                <FlightRoutePlaneIcon className="mx-1 h-4 w-5 shrink-0" />
                <div className="h-px flex-1 bg-[#d8e7ff]" />
              </div>
              {flightNumber ? (
                <p className="mt-1 text-[12px] leading-none text-[#666666]">{flightNumber}</p>
              ) : null}
            </div>

            <div className="min-w-0 text-right">
              <p className="text-[22px] font-semibold leading-none tracking-tight text-[#1a1a1a]">
                {formatFlightTime(segment.ArrivalTime)}
              </p>
              <p className="mt-2 truncate text-[14px] text-[#666666]">{toAirport}</p>
            </div>
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-[12px] text-[#666666]">
            {segment.AirlineSrc ? (
              <img src={segment.AirlineSrc} alt="" className="size-4 shrink-0 object-contain" />
            ) : (
              <span className="flex size-4 shrink-0 items-center justify-center rounded-full bg-[#fff0f0] text-[9px] font-bold text-[#e64545]">
                {(segment.Airline ?? airlineName ?? "航").slice(0, 1)}
              </span>
            )}
            {airlineName || flightNumber ? <span>{`${airlineName ?? ""}${flightNumber ?? ""}`}</span> : null}
            {planeLabel ? <span>{planeLabel}</span> : null}
          </div>
        </div>

        <button
          type="button"
          className="mt-2 text-[12px] text-white/90 active:opacity-80"
          onClick={onShowRules}
        >
          预订须知和退改签说明&gt;
        </button>
      </div>
    </div>
  );
}
