import { Link } from "react-router-dom";
import type { ProductType } from "@ryx/shared-types";

import { useBusinessSelfBookPassenger } from "@/hooks/useBusinessSelfBookPassenger";
import { isBusinessTravelMode, loadHomeTravelMode } from "@/lib/flight-travel-mode";
import { buildPassengerSelectPath } from "@/lib/passenger-selection";

interface SearchPassengerButtonProps {
  forType: ProductType;
  returnTo: string;
  businessMode?: boolean;
}

export function SearchPassengerButton({
  forType,
  returnTo,
  businessMode,
}: SearchPassengerButtonProps) {
  const enabled = businessMode ?? isBusinessTravelMode(loadHomeTravelMode());
  const { passengers, isSelfBookOnly } = useBusinessSelfBookPassenger(forType, enabled);
  const path = buildPassengerSelectPath(forType, returnTo);

  if (isSelfBookOnly) {
    return (
      <button
        type="button"
        className="flex h-10 min-w-[72px] items-center justify-center rounded-full bg-white/20 px-2 text-[12px] font-medium text-white"
        aria-label="差旅标准"
      >
        差旅标准
      </button>
    );
  }

  return (
    <Link
      to={path}
      className="relative flex size-10 items-center justify-center rounded-full bg-white/20 text-white"
      aria-label="选择出行人"
    >
      <span className="text-lg">+</span>
      {passengers.length > 0 ? (
        <span className="absolute -right-1 -top-1 flex size-5 items-center justify-center rounded-full bg-destructive text-[10px] font-medium text-white">
          {passengers.length}
        </span>
      ) : null}
    </Link>
  );
}
