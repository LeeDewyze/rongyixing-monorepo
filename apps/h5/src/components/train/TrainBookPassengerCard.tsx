import {
  credentialDisplayNumber,
  credentialDisplayType,
  type FlightOutNumberField,
  type PassengerBookInfo,
} from "@ryx/shared-types";

import { FlightBookCredentialSwitchButton } from "@/components/flight/FlightBookExpandableSummaryCard";
import { HotelBookPassengerDetails } from "@/components/hotel/HotelBookPassengerDetails";
import { HotelBookRoomCard } from "@/components/hotel/HotelBookRoomCard";
import type { TrainPassengerBookForm } from "@/lib/train-book";

function resolveStaffAccountId(passenger: PassengerBookInfo): string | undefined {
  const fromPassenger =
    "AccountId" in passenger.passenger && passenger.passenger.AccountId
      ? String(passenger.passenger.AccountId)
      : undefined;
  if (fromPassenger) return fromPassenger;
  return passenger.credential.AccountId ? String(passenger.credential.AccountId) : undefined;
}

interface TrainBookPassengerCardProps {
  passenger: PassengerBookInfo;
  form: TrainPassengerBookForm;
  showOrganizations: boolean;
  showCostCenter: boolean;
  requiresApprover: boolean;
  isSkipApproveEnabled: boolean;
  outNumberFields: FlightOutNumberField[];
  illegalReasons: string[];
  expenseTypes: { id: string; name: string }[];
  requiresIllegalReason: boolean;
  onUpdateForm: (passengerId: string, patch: Partial<TrainPassengerBookForm>) => void;
  onToggleExpanded: () => void;
  onOpenOrganization: () => void;
  onOpenCostCenter: () => void;
  onOpenApprover: () => void;
  onOpenOutNumberPicker: (field: FlightOutNumberField) => void;
  onChangeCredential: (passenger: PassengerBookInfo) => void;
}

/** Train book passenger card — reuses hotel expanded passenger details. */
export function TrainBookPassengerCard({
  passenger,
  form,
  showOrganizations,
  showCostCenter,
  requiresApprover,
  isSkipApproveEnabled,
  outNumberFields,
  illegalReasons,
  expenseTypes,
  requiresIllegalReason,
  onUpdateForm,
  onToggleExpanded,
  onOpenOrganization,
  onOpenCostCenter,
  onOpenApprover,
  onOpenOutNumberPicker,
  onChangeCredential,
}: TrainBookPassengerCardProps) {
  const canSwitchCredential = Boolean(resolveStaffAccountId(passenger));
  const credentialLine = `${credentialDisplayType(passenger.credential)}：${credentialDisplayNumber(passenger.credential)}`;

  return (
    <HotelBookRoomCard
      passengerName={passenger.credential.Name ?? ""}
      credentialSubtitle={credentialLine}
      expanded={form.expanded}
      onToggleExpand={onToggleExpanded}
      credentialSwitchAction={
        canSwitchCredential ? (
          <FlightBookCredentialSwitchButton onClick={() => onChangeCredential(passenger)} />
        ) : undefined
      }
    >
      <div className="space-y-3">
        <HotelBookPassengerDetails
          form={form}
          showOrganizations={showOrganizations}
          showCostCenter={showCostCenter}
          requiresApprover={requiresApprover}
          isSkipApproveEnabled={isSkipApproveEnabled}
          outNumberFields={outNumberFields}
          illegalReasons={illegalReasons}
          expenseTypes={expenseTypes}
          requiresIllegalReason={requiresIllegalReason}
          onUpdateForm={(patch) => onUpdateForm(passenger.id, patch)}
          onOpenOrganization={onOpenOrganization}
          onOpenCostCenter={onOpenCostCenter}
          onOpenApprover={onOpenApprover}
          onOpenOutNumberPicker={onOpenOutNumberPicker}
        />
      </div>
    </HotelBookRoomCard>
  );
}
