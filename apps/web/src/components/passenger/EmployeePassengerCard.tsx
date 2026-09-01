import { useState } from "react";
import type {
  PassengerBookInfo,
  PassengerCredential,
  ProductType,
  StaffPassenger,
} from "@ryx/shared-types";
import { credentialDisplayNumber, credentialDisplayType } from "@ryx/shared-types";

import {
  createBookInfo,
  isSelected,
  staffSelectableCredentials,
} from "@/lib/passenger-select-logic";

import { PassengerSelectCircle } from "./PassengerSelectCircle";
import { PassengerCredentialActionButton } from "./PassengerCredentialActionButton";

interface EmployeePassengerCardProps {
  staff: StaffPassenger;
  forType: ProductType;
  selected: PassengerBookInfo[];
  onToggle: (info: PassengerBookInfo, checked: boolean) => void;
  onAddCredential: (staffId: string) => void;
  onEditCredential: (staffId: string, credential: PassengerCredential) => void;
  onRemoveCredential: (staffId: string, credential: PassengerCredential) => void;
}

function CredentialActions({ onEdit, onRemove }: { onEdit: () => void; onRemove: () => void }) {
  return (
    <div className="flex shrink-0 items-start gap-1.5">
      <PassengerCredentialActionButton label="编辑证件" tone="edit" onClick={onEdit} />
      <PassengerCredentialActionButton label="删除证件" tone="delete" onClick={onRemove} />
    </div>
  );
}

function PassengerMeta({
  orgName,
  credential,
  mobile,
  showType = true,
}: {
  orgName?: string;
  credential: PassengerCredential;
  mobile?: string;
  showType?: boolean;
}) {
  return (
    <div className="mt-1.5 space-y-1 text-sm leading-5">
      {orgName ? <p className="truncate text-xs leading-4 text-[#8a8f99]">{orgName}</p> : null}
      <p className="text-[#4b5563]">
        {showType ? (
          <span className="mr-1 text-[#9aa1ad]">{credentialDisplayType(credential)}</span>
        ) : null}
        {credentialDisplayNumber(credential)}
      </p>
      {mobile ? <p className="text-[#6b7280]">{mobile}</p> : null}
    </div>
  );
}

function CredentialRow({
  credential,
  staff,
  selected,
  onToggle,
  showActions = false,
  isPrimary = false,
  onEdit,
  onRemove,
}: {
  credential: PassengerCredential;
  staff: StaffPassenger;
  selected: PassengerBookInfo[];
  onToggle: (info: PassengerBookInfo, checked: boolean) => void;
  showActions?: boolean;
  isPrimary?: boolean;
  onEdit?: () => void;
  onRemove?: () => void;
}) {
  const disabled = !credential.Number && !credential.HideNumber;
  const checked = isSelected(selected, credential);
  const title = isPrimary ? staff.Name : credentialDisplayType(credential);
  const missingCredential = disabled;

  function handleToggle(next: boolean) {
    onToggle(createBookInfo(staff, credential), next);
  }

  return (
    <div className={`flex gap-3 ${isPrimary ? "" : "border-t border-[#f0f0f0] pt-3"}`}>
      <PassengerSelectCircle
        checked={checked}
        onChange={handleToggle}
        disabled={disabled}
        ariaLabel={`选择 ${staff.Name}`}
      />
      <div className="min-w-0 flex-1">
        <button
          type="button"
          className={`text-left leading-5 text-[#2f343d] ${isPrimary ? "text-base font-semibold" : "text-sm font-medium"}`}
          onClick={() => {
            if (!disabled) handleToggle(!checked);
          }}
        >
          {title}
        </button>
        <PassengerMeta
          orgName={isPrimary ? staff.OrgName : undefined}
          credential={credential}
          mobile={isPrimary ? staff.Mobile : credential.Mobile}
          showType={isPrimary}
        />
        {missingCredential ? (
          <p className="mt-1 text-xs font-medium leading-4 text-brand-primary">
            证件信息缺失，请完善后再进行人员选择
          </p>
        ) : null}
      </div>
      {showActions && onEdit && onRemove ? (
        <CredentialActions onEdit={onEdit} onRemove={onRemove} />
      ) : null}
    </div>
  );
}

export function EmployeePassengerCard({
  staff,
  forType,
  selected,
  onToggle,
  onAddCredential,
  onEditCredential,
  onRemoveCredential,
}: EmployeePassengerCardProps) {
  const [expanded, setExpanded] = useState(false);
  const credentials = staffSelectableCredentials(staff, forType);
  const primary = credentials[0];
  const others = credentials.slice(1);

  if (!primary) return null;

  return (
    <div className="mx-4 mb-3 rounded-xl bg-white p-4 shadow-sm">
      <CredentialRow
        credential={primary}
        staff={staff}
        selected={selected}
        onToggle={onToggle}
        isPrimary
      />

      <div className="mt-3 flex flex-wrap items-center gap-2 pl-8">
        <button
          type="button"
          className="text-sm text-[#5099fe] active:opacity-70"
          onClick={() => onAddCredential(staff.Id)}
        >
          添加其他证件
          <span className="ml-0.5 inline-block" aria-hidden>
            ▾
          </span>
        </button>
        {others.length > 0 ? (
          <button
            type="button"
            className="text-sm text-[#999999] active:opacity-70"
            onClick={() => setExpanded((value) => !value)}
          >
            {expanded ? "收起" : `其他证件 (${others.length})`}
          </button>
        ) : null}
      </div>

      {expanded && others.length > 0 ? (
        <div className="mt-3 space-y-3 pl-8">
          {others.map((c) => (
            <CredentialRow
              key={c.Id}
              credential={c}
              staff={staff}
              selected={selected}
              onToggle={onToggle}
              showActions
              onEdit={() => onEditCredential(staff.Id, c)}
              onRemove={() => onRemoveCredential(staff.Id, c)}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}
