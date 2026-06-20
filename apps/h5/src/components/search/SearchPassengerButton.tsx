import { Link } from "react-router-dom";
import type { ProductType } from "@ryx/shared-types";

import { usePassengerSelection } from "@/hooks/usePassenger";
import { buildPassengerSelectPath } from "@/lib/passenger-selection";

interface SearchPassengerButtonProps {
  forType: ProductType;
  returnTo: string;
}

export function SearchPassengerButton({ forType, returnTo }: SearchPassengerButtonProps) {
  const { selected } = usePassengerSelection(forType);
  const path = buildPassengerSelectPath(forType, returnTo);

  return (
    <Link
      to={path}
      className="relative flex size-10 items-center justify-center rounded-full bg-white/20 text-white"
      aria-label="选择出行人"
    >
      <span className="text-lg">+</span>
      {selected.length > 0 ? (
        <span className="absolute -right-1 -top-1 flex size-5 items-center justify-center rounded-full bg-destructive text-[10px] font-medium text-white">
          {selected.length}
        </span>
      ) : null}
    </Link>
  );
}
