import type { Trafficline } from "@ryx/shared-types";

import { displayCityName } from "@/lib/flight-search";

interface FlightCityPairFieldProps {
  fromCity: Trafficline;
  toCity: Trafficline;
  swapping?: boolean;
  onSelectFrom: () => void;
  onSelectTo: () => void;
  onSwap: () => void;
  className?: string;
}

/** From / swap / to city selector row. */
export function FlightCityPairField({
  fromCity,
  toCity,
  swapping = false,
  onSelectFrom,
  onSelectTo,
  onSwap,
  className = "",
}: FlightCityPairFieldProps) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <button
        type="button"
        className="flex-1 text-left text-2xl font-semibold text-primary"
        onClick={onSelectFrom}
      >
        {displayCityName(fromCity)}
      </button>
      <button
        type="button"
        aria-label="交换出发到达"
        className={`rounded-full p-2 text-primary transition-transform ${swapping ? "rotate-180" : ""}`}
        onClick={onSwap}
      >
        ⇄
      </button>
      <button
        type="button"
        className="flex-1 text-right text-2xl font-semibold text-primary"
        onClick={onSelectTo}
      >
        {displayCityName(toCity)}
      </button>
    </div>
  );
}
