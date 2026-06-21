import type { MemberPassenger, PassengerBookInfo, ProductType } from "@ryx/shared-types";
import {
  credentialDisplayNumber,
  credentialDisplayType,
  memberToCredential,
} from "@ryx/shared-types";

import {
  createBookInfo,
  isCredentialAllowed,
  isSelected,
} from "@/lib/passenger-select-logic";

import { PassengerSelectCircle } from "./PassengerSelectCircle";

interface ExternalPassengerCardProps {
  passenger: MemberPassenger;
  forType: ProductType;
  selected: PassengerBookInfo[];
  onToggle: (info: PassengerBookInfo, checked: boolean) => void;
  onEdit: (passenger: MemberPassenger) => void;
  onRemove: (passenger: MemberPassenger) => void;
}

export function ExternalPassengerCard({
  passenger,
  forType,
  selected,
  onToggle,
  onEdit,
  onRemove,
}: ExternalPassengerCardProps) {
  if (!passenger.Name) return null;

  const cred = memberToCredential(passenger);
  const selectable = isCredentialAllowed(cred, forType);
  const checked = isSelected(selected, cred);

  function handleToggle(next: boolean) {
    if (!selectable) return;
    onToggle(createBookInfo(passenger, cred, true), next);
  }

  return (
    <div className="mx-4 mb-3 rounded-xl bg-white p-4 shadow-sm">
      <div className="flex gap-3">
        <PassengerSelectCircle
          checked={checked}
          onChange={handleToggle}
          disabled={!selectable}
          ariaLabel={`选择 ${passenger.Name}`}
        />
        <div className="min-w-0 flex-1">
          <button
            type="button"
            className="text-left text-base font-semibold text-[#333333]"
            onClick={() => handleToggle(!checked)}
          >
            {passenger.Name}
          </button>
          <p className="mt-1 text-sm text-[#333333]">
            <span className="text-[#999999]">{credentialDisplayType(cred)} </span>
            {credentialDisplayNumber(cred)}
          </p>
          {passenger.Mobile ? (
            <p className="mt-0.5 text-sm text-[#666666]">{passenger.Mobile}</p>
          ) : null}
        </div>
        <div className="flex shrink-0 items-start gap-1">
          <button
            type="button"
            className="flex size-8 items-center justify-center text-[#999999] active:opacity-70"
            aria-label="编辑"
            onClick={() => onEdit(passenger)}
          >
            <svg viewBox="0 0 20 20" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M4 14.5V16h1.5L14 7.5 12.5 6 4 14.5z" />
              <path d="M11 5l2 2" />
            </svg>
          </button>
          <button
            type="button"
            className="flex size-8 items-center justify-center text-[#ff4d4f] active:opacity-70"
            aria-label="删除"
            onClick={() => onRemove(passenger)}
          >
            <svg viewBox="0 0 20 20" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M5 6h10M8 6V4h4v2M7 6v9h6V6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}

/** @deprecated Use ExternalPassengerCard */
export const NonEmployeePassengerRow = ExternalPassengerCard;
