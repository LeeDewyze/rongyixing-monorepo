import { useCallback, useEffect, useState } from "react";
import type { HotelCity } from "@ryx/shared-types";

import { useHotelCities } from "@/hooks/useHotelList";
import {
  buildHotelListSearchParams,
  hotelCityFromQuery,
  loadDefaultHotelSearchForm,
  persistHotelSearch,
  resolveHotelCityInCatalog,
  validateHotelSearch,
  type HotelMyPosition,
} from "@/lib/hotel-search";
import { addDays } from "@/lib/date-search";

export type HotelCityPickerTarget = "city" | null;

export interface HotelSearchQueryInitial {
  cityCode: string;
  cityName?: string;
  checkIn: string;
  checkOut: string;
}

export function useHotelSearchForm() {
  const { data: cities = [], isLoading, error } = useHotelCities();
  const defaults = loadDefaultHotelSearchForm();

  const [city, setCity] = useState<HotelCity>(defaults.city);
  const [checkIn, setCheckIn] = useState(defaults.checkIn);
  const [checkOut, setCheckOut] = useState(defaults.checkOut);
  const [picker, setPicker] = useState<HotelCityPickerTarget>(null);
  const [validationError, setValidationError] = useState("");
  const [myPosition, setMyPositionState] = useState<HotelMyPosition | null>(null);

  useEffect(() => {
    if (!cities.length) return;
    setCity((prev) => {
      const resolved = resolveHotelCityInCatalog(cities, prev);
      return resolved.Code === prev.Code && resolved.Name === prev.Name ? prev : resolved;
    });
  }, [cities]);

  useEffect(() => {
    persistHotelSearch(city, checkIn, checkOut);
  }, [city, checkIn, checkOut]);

  useEffect(() => {
    if (checkOut < checkIn) {
      setCheckOut(addDays(checkIn, 1));
    }
  }, [checkIn, checkOut]);

  const resetFromQuery = useCallback(
    (initial: HotelSearchQueryInitial) => {
      if (!cities.length) return;
      setCity(hotelCityFromQuery(cities, initial.cityCode, initial.cityName));
      setCheckIn(initial.checkIn);
      setCheckOut(initial.checkOut);
      setValidationError("");
      setPicker(null);
      setMyPositionState(null);
    },
    [cities],
  );

  const selectCity = useCallback((next: HotelCity) => {
    setCity(next);
    setMyPositionState(null);
  }, []);

  const setMyPosition = useCallback((position: HotelMyPosition) => {
    setMyPositionState(position);
  }, []);

  const clearMyPosition = useCallback(() => {
    setMyPositionState(null);
  }, []);

  const validate = useCallback((): string | null => {
    const message = validateHotelSearch(city, checkIn, checkOut);
    setValidationError(message ?? "");
    return message;
  }, [city, checkIn, checkOut]);

  const buildSearchParams = useCallback(
    (keyword?: string) => {
      return buildHotelListSearchParams({ city, checkIn, checkOut, myPosition, keyword });
    },
    [city, checkIn, checkOut, myPosition],
  );

  return {
    cities,
    isLoading,
    error,
    city,
    checkIn,
    checkOut,
    picker,
    validationError,
    myPosition,
    setCity,
    selectCity,
    setMyPosition,
    clearMyPosition,
    setCheckIn,
    setCheckOut,
    setPicker,
    setValidationError,
    resetFromQuery,
    validate,
    buildSearchParams,
  };
}

export type HotelSearchForm = ReturnType<typeof useHotelSearchForm>;
