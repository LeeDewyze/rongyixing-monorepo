import { useState } from "react";
import type {
  PassengerBookInfo,
  PassengerCredential,
  ProductType,
  StaffPassenger,
} from "@ryx/shared-types";
import {
  credentialDisplayNumber,
  credentialDisplayType,
} from "@ryx/shared-types";

import {
  createBookInfo,
  isSelected,
  staffSelectableCredentials,
} from "@/lib/passenger-select-logic";

import { PassengerSelectCircle } from "./PassengerSelectCircle";

interface EmployeePassengerCardProps {
  staff: StaffPassenger;
  forType: ProductType;
  selected: PassengerBookInfo[];
  onToggle: (info: PassengerBookInfo, checked: boolean) => void;
  onAddCredential: (staffId: string) => void;
  onEditCredential: (staffId: string, credential: PassengerCredential) => void;
  onRemoveCredential: (staffId: string, credential: PassengerCredential) => void;
}

function CredentialActions({
  onEdit,
  onRemove,
}: {
  onEdit: () => void;
  onRemove: () => void;
}) {
  return (
    <div className="flex shrink-0 items-center gap-1">
      <button
        type="button"
        className="flex size-8 items-center justify-center text-[#999999] active:opacity-70"
        aria-label="编辑证件"
        onClick={onEdit}
      >
        <svg viewBox="0 0 20 20" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M4 14.5V16h1.5L14 7.5 12.5 6 4 14.5z" />
          <path d="M11 5l2 2" />
        </svg>
      </button>
      <button
        type="button"
        className="flex size-8 items-center justify-center text-[#ff4d4f] active:opacity-70"
        aria-label="删除证件"
        onClick={onRemove}
      >
        <svg viewBox="0 0 20 20" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M5 6h10M8 6V4h4v2M7 6v9h6V6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
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
          className="text-left text-base font-semibold text-[#333333]"
          onClick={() => {
            if (!disabled) handleToggle(!checked);
          }}
        >
          {isPrimary ? staff.Name : credential.Name}
        </button>
        {isPrimary && staff.OrgName ? (
          <p className="mt-0.5 text-xs text-[#666666]">{staff.OrgName}</p>
        ) : null}
        <p className="mt-1 text-sm text-[#333333]">
          <span className="text-[#999999]">{credentialDisplayType(credential)} </span>
          {credentialDisplayNumber(credential)}
        </p>
        {(isPrimary ? staff.Mobile : credential.Mobile) ? (
          <p className="mt-0.5 text-sm text-[#666666]">
            {isPrimary ? staff.Mobile : credential.Mobile}
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
            onClick={() => setExpanded((v) => !v)}
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
