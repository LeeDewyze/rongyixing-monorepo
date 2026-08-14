import { useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import type { FlightOutNumberField } from "@ryx/shared-types";

import { fetchTravelUrlOptions, pickSoleTravelUrlNumber } from "@/lib/flight-book-outnumber";

interface UseAutoFillTravelOutNumberInput {
  field: FlightOutNumberField | undefined;
  currentValue: string;
  enabled: boolean;
  onFill: (key: string, value: string) => void;
}

/** Legacy: when GetTravelUrl returns exactly one row, auto-fill TravelNumber. */
export function useAutoFillTravelOutNumber(input: UseAutoFillTravelOutNumberInput) {
  const { field, currentValue, enabled, onFill } = input;
  const trimmed = currentValue.trim();
  const shouldFetch = enabled && Boolean(field?.canSelect) && !trimmed;
  const onFillRef = useRef(onFill);
  onFillRef.current = onFill;

  const query = useQuery({
    queryKey: [
      "travel",
      "getTravelUrl",
      field?.key,
      field?.staffNumber,
      field?.staffOutNumber,
      field?.travelType,
    ],
    queryFn: () => fetchTravelUrlOptions(field!),
    enabled: shouldFetch && field != null,
    staleTime: 30_000,
  });

  useEffect(() => {
    if (!field || trimmed) return;
    const value = pickSoleTravelUrlNumber(query.data ?? []);
    if (!value) return;
    onFillRef.current(field.key, value);
  }, [field, trimmed, query.data]);
}
