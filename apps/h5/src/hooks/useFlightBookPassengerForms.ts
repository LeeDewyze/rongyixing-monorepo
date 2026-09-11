import { useEffect, useMemo, useState } from "react";
import type { FlightInitStaff, FlightPassengerBookForm, PassengerBookInfo } from "@ryx/shared-types";

import { syncPassengerBookForms } from "@/lib/flight-book-passenger-form";

export function useFlightBookPassengerForms(
  passengers: PassengerBookInfo[],
  staffs: FlightInitStaff[] | undefined,
) {
  const [forms, setForms] = useState<Record<string, FlightPassengerBookForm>>({});

  useEffect(() => {
    setForms((prev) => syncPassengerBookForms(prev, passengers, staffs));
  }, [passengers, staffs]);

  const orderedForms = useMemo(
    () =>
      passengers
        .map((passenger) => forms[passenger.id])
        .filter((form): form is FlightPassengerBookForm => Boolean(form)),
    [forms, passengers],
  );

  function updateForm(passengerId: string, patch: Partial<FlightPassengerBookForm>) {
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
