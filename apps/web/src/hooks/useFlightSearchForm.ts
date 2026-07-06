import { useCallback, useEffect, useState } from "react";
import type { Trafficline } from "@ryx/shared-types";

import { useFlightAirports } from "@/hooks/useFlight";
import {
  buildFlightListSearchParams,
  cityFromQuery,
  loadDefaultSearchForm,
  persistFlightCities,
  type FlightSearchQueryInitial,
  validateFlightSearch,
} from "@/lib/flight-search";

export type FlightCityPickerTarget = "from" | "to" | null;

export interface UseFlightSearchFormOptions {
  /** Write city changes to localStorage (default true). */
  persistCities?: boolean;
  /** Fetch airport list only when true (default true). */
  enabled?: boolean;
}

/**
 * Shared city + date form state for flight search / list modify / future book steps.
 */
export function useFlightSearchForm(options: UseFlightSearchFormOptions = {}) {
  const persistCities = options.persistCities ?? true;
  const enabled = options.enabled ?? true;
  const { data: airports = [], isLoading, error } = useFlightAirports({ enabled });

  const defaults = loadDefaultSearchForm();
  const [fromCity, setFromCity] = useState<Trafficline>(defaults.fromCity);
  const [toCity, setToCity] = useState<Trafficline>(defaults.toCity);
  const [date, setDate] = useState(defaults.date);
  const [picker, setPicker] = useState<FlightCityPickerTarget>(null);
  const [validationError, setValidationError] = useState("");

  useEffect(() => {
    if (persistCities) {
      persistFlightCities(fromCity, toCity);
    }
  }, [fromCity, toCity, persistCities]);

  const resetFromStorage = useCallback(() => {
    const next = loadDefaultSearchForm();
    setFromCity(next.fromCity);
    setToCity(next.toCity);
    setDate(next.date);
    setValidationError("");
    setPicker(null);
  }, []);

  const resetFromQuery = useCallback(
    (initial: FlightSearchQueryInitial) => {
      if (!airports.length) return;
      setFromCity(
        cityFromQuery(airports, initial.fromCode, initial.fromName, initial.fromAsAirport),
      );
      setToCity(cityFromQuery(airports, initial.toCode, initial.toName, initial.toAsAirport));
      setDate(initial.date);
      setValidationError("");
      setPicker(null);
    },
    [airports],
  );

  const swapCities = useCallback(() => {
    setFromCity(toCity);
    setToCity(fromCity);
  }, [fromCity, toCity]);

  const validate = useCallback((): string | null => {
    const message = validateFlightSearch(fromCity, toCity);
    setValidationError(message ?? "");
    return message;
  }, [fromCity, toCity]);

  const buildSearchParams = useCallback(() => {
    return buildFlightListSearchParams({ fromCity, toCity, date });
  }, [fromCity, toCity, date]);

  return {
    airports,
    isLoading,
    error,
    fromCity,
    toCity,
    date,
    picker,
    validationError,
    setFromCity,
    setToCity,
    setDate,
    setPicker,
    setValidationError,
    swapCities,
    resetFromStorage,
    resetFromQuery,
    validate,
    buildSearchParams,
  };
}

export type FlightSearchForm = ReturnType<typeof useFlightSearchForm>;
