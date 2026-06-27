import type { MemberPassenger, PassengerBookInfo, ProductType } from "@ryx/shared-types";
import {
  credentialDisplayNumber,
  credentialDisplayType,
  memberToCredential,
} from "@ryx/shared-types";

import { createBookInfo, isCredentialAllowed, isSelected } from "@/lib/passenger-select-logic";

import { PassengerSelectCircle } from "./PassengerSelectCircle";
import { PassengerCredentialActionButton } from "./PassengerCredentialActionButton";

interface ExternalPassengerCardProps {
  passenger: MemberPassenger;
  forType: ProductType;
  selected: PassengerBookInfo[];
  onToggle: (info: PassengerBookInfo, checked: boolean) => void;
  onEdit: (passenger: MemberPassenger) => void;
  onRemove: (passenger: MemberPassenger) => void;
}

function PassengerMeta({
  credential,
  mobile,
}: {
  credential: ReturnType<typeof memberToCredential>;
  mobile?: string;
}) {
  return (
    <div className="mt-1.5 space-y-1 text-sm leading-5">
      <p className="text-[#4b5563]">
        <span className="mr-1 text-[#9aa1ad]">{credentialDisplayType(credential)}</span>
        {credentialDisplayNumber(credential)}
      </p>
      {mobile ? <p className="text-[#6b7280]">{mobile}</p> : null}
    </div>
  );
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
            className="text-left text-base font-semibold leading-5 text-[#2f343d]"
            onClick={() => handleToggle(!checked)}
          >
            {passenger.Name}
          </button>
          <PassengerMeta credential={cred} mobile={passenger.Mobile} />
        </div>
        <div className="flex shrink-0 items-start gap-1.5">
          <PassengerCredentialActionButton
            label="编辑"
            tone="edit"
            onClick={() => onEdit(passenger)}
          />
          <PassengerCredentialActionButton
            label="删除"
            tone="delete"
            onClick={() => onRemove(passenger)}
          />
        </div>
      </div>
    </div>
  );
}

/** @deprecated Use ExternalPassengerCard */
export const NonEmployeePassengerRow = ExternalPassengerCard;
