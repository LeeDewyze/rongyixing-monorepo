import { useEffect, useMemo, useState } from "react";
import type { HotelInitStaff, PassengerBookInfo } from "@ryx/shared-types";

import {
  createHotelPassengerBookForm,
  resolveHotelInitClientId,
  type HotelPassengerBookForm,
} from "@/lib/hotel-book";

function findHotelInitStaff(
  passenger: PassengerBookInfo,
  staffs: HotelInitStaff[] | undefined,
): HotelInitStaff | undefined {
  if (!staffs?.length) return undefined;
  const accountId = resolveHotelInitClientId(passenger);
  return staffs.find((staff) => String(staff.Id) === accountId);
}

export function useHotelBookPassengerForms(
  passengers: PassengerBookInfo[],
  staffs: HotelInitStaff[] | undefined,
  defaultArrivalTime: string,
) {
  const [forms, setForms] = useState<Record<string, HotelPassengerBookForm>>({});

  useEffect(() => {
    setForms((prev) => {
      const next: Record<string, HotelPassengerBookForm> = {};
      for (const passenger of passengers) {
        const existing = prev[passenger.id];
        if (!existing) {
          next[passenger.id] = createHotelPassengerBookForm(passenger, defaultArrivalTime);
        } else {
          next[passenger.id] = {
            ...existing,
            arrivalTime: existing.arrivalTime || defaultArrivalTime,
          };
        }

        const staff = findHotelInitStaff(passenger, staffs);
        if (staff?.Approvers?.length && !next[passenger.id].approvalId) {
          const approver = staff.Approvers[0];
          next[passenger.id] = {
            ...next[passenger.id],
            approvalId: String(approver.AccountId ?? approver.Id ?? ""),
            approvalName: approver.Name ?? "",
          };
        }
      }
      return next;
    });
  }, [defaultArrivalTime, passengers, staffs]);

  const orderedForms = useMemo(
    () =>
      passengers
        .map((passenger) => forms[passenger.id])
        .filter((form): form is HotelPassengerBookForm => Boolean(form)),
    [forms, passengers],
  );

  function updateForm(passengerId: string, patch: Partial<HotelPassengerBookForm>) {
    setForms((prev) => {
      const current = prev[passengerId];
      if (!current) return prev;
      return { ...prev, [passengerId]: { ...current, ...patch } };
    });
  }

  function toggleExpanded(passengerId: string) {
    setForms((prev) => {
      const current = prev[passengerId];
      if (!current) return prev;
      return { ...prev, [passengerId]: { ...current, expanded: !current.expanded } };
    });
  }

  return { forms, orderedForms, updateForm, toggleExpanded };
}
