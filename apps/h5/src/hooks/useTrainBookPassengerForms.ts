import { useEffect, useState } from "react";
import type { PassengerBookInfo } from "@ryx/shared-types";

import { createTrainPassengerBookForm, type TrainPassengerBookForm } from "@/lib/train-book";

export function useTrainBookPassengerForms(passengers: PassengerBookInfo[]) {
  const [forms, setForms] = useState<Record<string, TrainPassengerBookForm>>({});

  useEffect(() => {
    setForms((prev) => {
      const next: Record<string, TrainPassengerBookForm> = {};
      for (const passenger of passengers) {
        next[passenger.id] = prev[passenger.id] ?? createTrainPassengerBookForm(passenger);
      }
      return next;
    });
  }, [passengers]);

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
