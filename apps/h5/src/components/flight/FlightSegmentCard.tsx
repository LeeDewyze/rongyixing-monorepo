import type { FlightSegment } from "@ryx/shared-types";

import { formatFlightTime } from "@/utils/flight-list";

interface FlightSegmentCardProps {
  segment: FlightSegment;
  recommended?: boolean;
  onClick?: () => void;
}

export function FlightSegmentCard({
  segment,
  recommended = false,
  onClick,
}: FlightSegmentCardProps) {
  const tags: string[] = [];
  if (segment.IsStop) tags.push("经停");
  if (segment.IsTransfer) tags.push("中转");
  if (segment.IsAgreement) tags.push("协议价");
  if (segment.isLowestPrice && !recommended) tags.push("当日低价");

  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full rounded-xl border bg-card p-4 text-left shadow-sm transition active:scale-[0.99] ${
        recommended ? "border-primary ring-1 ring-primary/20" : ""
      }`}
    >
      {recommended && (
        <p className="mb-2 text-xs font-medium text-primary">直飞低价推荐</p>
      )}
      <div className="mb-3 flex items-start justify-between gap-2">
        <div>
          <p className="font-semibold">
            {segment.AirlineName} {segment.Number}
          </p>
          <p className="text-xs text-muted-foreground">
            {segment.PlaneType}
            {tags.length ? ` · ${tags.join(" · ")}` : ""}
          </p>
        </div>
        <p className="text-lg font-bold text-primary">
          ¥{segment.LowestFare ?? "-"}
        </p>
      </div>
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0 text-center">
          <p className="text-xl font-semibold">{formatFlightTime(segment.TakeoffTime)}</p>
          <p className="truncate text-xs text-muted-foreground">
            {segment.FromAirportName ?? segment.FromCityName}
            {segment.FromTerminal ? ` ${segment.FromTerminal}` : ""}
          </p>
        </div>
        <div className="shrink-0 px-1 text-center text-xs text-muted-foreground">
          {segment.FlyTimeName ?? segment.FlyTime ?? "--"}
        </div>
        <div className="min-w-0 text-center">
          <p className="text-xl font-semibold">{formatFlightTime(segment.ArrivalTime)}</p>
          <p className="truncate text-xs text-muted-foreground">
            {segment.ToAirportName ?? segment.ToCityName}
            {segment.ToTerminal ? ` ${segment.ToTerminal}` : ""}
          </p>
        </div>
      </div>
    </button>
  );
}
