import { useState } from "react";
import type { PassengerBookInfo, PassengerCredential, ProductType, StaffPassenger } from "@ryx/shared-types";
import {
  credentialDisplayNumber,
  credentialDisplayType,
} from "@ryx/shared-types";

import {
  createBookInfo,
  isSelected,
  staffSelectableCredentials,
} from "@/lib/passenger-select-logic";

interface EmployeePassengerCardProps {
  staff: StaffPassenger;
  forType: ProductType;
  selected: PassengerBookInfo[];
  onToggle: (info: PassengerBookInfo, checked: boolean) => void;
}

export function EmployeePassengerCard({
  staff,
  forType,
  selected,
  onToggle,
}: EmployeePassengerCardProps) {
  const [expanded, setExpanded] = useState(false);
  const credentials = staffSelectableCredentials(staff, forType);
  const primary = credentials[0];
  const others = credentials.slice(1);
  const primaryDisabled = !primary?.Number && !primary?.HideNumber;

  function handleToggle(credential: PassengerCredential, checked: boolean) {
    onToggle(createBookInfo(staff, credential), checked);
  }

  return (
    <div className="rounded-lg border bg-card p-3">
      <div className="flex gap-3">
        {primary ? (
          <input
            type="checkbox"
            className="mt-1 size-4 shrink-0 accent-primary"
            checked={isSelected(selected, primary)}
            disabled={primaryDisabled}
            onChange={(e) => handleToggle(primary, e.target.checked)}
          />
        ) : null}
        <div className="min-w-0 flex-1">
          <button
            type="button"
            className="text-left font-semibold"
            onClick={() => {
              if (primary && !primaryDisabled) {
                handleToggle(primary, !isSelected(selected, primary));
              }
            }}
          >
            {staff.Name}
          </button>
          {staff.OrgName ? (
            <p className="text-xs text-muted-foreground">{staff.OrgName}</p>
          ) : null}
          {primary ? (
            <p className="text-sm">
              <span className="text-muted-foreground">{credentialDisplayType(primary)}</span>
              {credentialDisplayNumber(primary)}
            </p>
          ) : null}
          {staff.Mobile ? <p className="text-sm text-muted-foreground">{staff.Mobile}</p> : null}
          {others.length > 0 ? (
            <button
              type="button"
              className="mt-1 text-xs text-primary"
              onClick={() => setExpanded((v) => !v)}
            >
              {expanded ? "收起其他证件" : `其他证件 (${others.length})`}
            </button>
          ) : null}
        </div>
      </div>

      {expanded && others.length > 0 ? (
        <ul className="mt-3 space-y-2 border-t pt-3">
          {others.map((c) => (
            <li key={c.Id} className="flex gap-3 pl-1">
              <input
                type="checkbox"
                className="mt-1 size-4 shrink-0 accent-primary"
                checked={isSelected(selected, c)}
                onChange={(e) => handleToggle(c, e.target.checked)}
              />
              <div>
                <p className="text-sm font-medium">{c.Name}</p>
                <p className="text-sm text-muted-foreground">
                  {credentialDisplayType(c)} {credentialDisplayNumber(c)}
                </p>
              </div>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
