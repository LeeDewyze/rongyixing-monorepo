import {
  credentialDisplayNumber,
  credentialDisplayType,
  type FlightOutNumberField,
  type PassengerBookInfo,
} from "@ryx/shared-types";
import type { ReactNode } from "react";

import {
  FlightBookCredentialSwitchButton,
  FlightBookExpandableSummaryCard,
} from "@/components/flight/FlightBookExpandableSummaryCard";
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
  grouped?: boolean;
  onRemove?: () => void;
  serviceFee?: ReactNode;
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
  grouped = false,
  onRemove,
  serviceFee,
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
  const action =
    canSwitchCredential || onRemove ? (
      <div className="flex shrink-0 items-center gap-2">
        {canSwitchCredential ? (
          <FlightBookCredentialSwitchButton onClick={() => onChangeCredential(passenger)} />
        ) : null}
        {onRemove ? (
          <button
            type="button"
            className="rounded-full px-1.5 py-0.5 text-[12px] font-medium text-[#FF4D4F] active:bg-[#fff1f0]"
            onClick={onRemove}
          >
            移除
          </button>
        ) : null}
      </div>
    ) : undefined;

  const details = (
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
        mergeContactAndSupplement
        onUpdateForm={(patch) => onUpdateForm(passenger.id, patch)}
        onOpenOrganization={onOpenOrganization}
        onOpenCostCenter={onOpenCostCenter}
        onOpenApprover={onOpenApprover}
        onOpenOutNumberPicker={onOpenOutNumberPicker}
      />
    </div>
  );

  if (grouped) {
    return (
      <div className="border-b border-[#F0F2F5] last:border-b-0">
        <FlightBookExpandableSummaryCard
          surface="plain"
          className="rounded-none px-0 py-3"
          name={passenger.credential.Name ?? ""}
          subtitle={credentialLine}
          expanded={form.expanded}
          onToggleExpanded={onToggleExpanded}
          footerAction={action}
        >
          {details}
        </FlightBookExpandableSummaryCard>
        {serviceFee ? <div className="pb-3">{serviceFee}</div> : null}
      </div>
    );
  }

  return (
    <HotelBookRoomCard
      passengerName={passenger.credential.Name ?? ""}
      credentialSubtitle={credentialLine}
      expanded={form.expanded}
      onToggleExpand={onToggleExpanded}
      credentialSwitchAction={action}
    >
      {details}
    </HotelBookRoomCard>
  );
}
