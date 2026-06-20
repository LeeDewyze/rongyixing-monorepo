import type { MemberPassenger, PassengerBookInfo, ProductType } from "@ryx/shared-types";
import {
  credentialDisplayNumber,
  credentialDisplayType,
} from "@ryx/shared-types";

import {
  createBookInfo,
  isSelected,
  memberSelectableCredential,
} from "@/lib/passenger-select-logic";

interface NonEmployeePassengerRowProps {
  passenger: MemberPassenger;
  forType: ProductType;
  selected: PassengerBookInfo[];
  onToggle: (info: PassengerBookInfo, checked: boolean) => void;
}

export function NonEmployeePassengerRow({
  passenger,
  forType,
  selected,
  onToggle,
}: NonEmployeePassengerRowProps) {
  const credential = memberSelectableCredential(passenger, forType);
  if (!credential) return null;

  return (
    <div className="flex gap-3 rounded-lg border bg-card p-3">
      <input
        type="checkbox"
        className="mt-1 size-4 shrink-0 accent-primary"
        checked={isSelected(selected, credential)}
        onChange={(e) =>
          onToggle(createBookInfo(passenger, credential, true), e.target.checked)
        }
      />
      <div className="min-w-0 flex-1">
        <button
          type="button"
          className="text-left font-semibold"
          onClick={() =>
            onToggle(createBookInfo(passenger, credential, true), !isSelected(selected, credential))
          }
        >
          {passenger.Name}
        </button>
        <p className="text-sm">
          <span className="text-muted-foreground">{credentialDisplayType(credential)}</span>
          {credentialDisplayNumber(credential)}
        </p>
        {passenger.Mobile ? (
          <p className="text-sm text-muted-foreground">{passenger.Mobile}</p>
        ) : null}
      </div>
    </div>
  );
}
