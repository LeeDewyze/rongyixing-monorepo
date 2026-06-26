import { useEffect, useState } from "react";
import type { FlightInitStaff, PassengerBookInfo } from "@ryx/shared-types";

import {
  createTrainPassengerBookForm,
  type TrainPassengerBookForm,
} from "@/lib/train-book";
import { findInitStaffForPassenger } from "@/lib/flight-book-passenger-form";

export function useTrainBookPassengerForms(
  passengers: PassengerBookInfo[],
  staffs: FlightInitStaff[] | undefined,
) {
  const [forms, setForms] = useState<Record<string, TrainPassengerBookForm>>({});

  useEffect(() => {
    setForms((prev) => {
      const next: Record<string, TrainPassengerBookForm> = {};
      for (const passenger of passengers) {
        const existing = prev[passenger.id];
        next[passenger.id] = existing ?? createTrainPassengerBookForm(passenger);

        const staff = findInitStaffForPassenger(passenger, staffs);
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
  }, [passengers, staffs]);

  function updateForm(passengerId: string, patch: Partial<TrainPassengerBookForm>) {
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

  return { forms, updateForm, toggleExpanded };
}
