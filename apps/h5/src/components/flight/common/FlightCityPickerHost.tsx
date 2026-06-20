import type { Trafficline } from "@ryx/shared-types";

import type { FlightCityPickerTarget, FlightSearchForm } from "@/hooks/useFlightSearchForm";

import { FlightCityPicker } from "./FlightCityPicker";

interface FlightCityPickerHostProps {
  airports: Trafficline[];
  picker: FlightCityPickerTarget;
  onClose: () => void;
  onSelectFrom: (city: Trafficline) => void;
  onSelectTo: (city: Trafficline) => void;
}

/** Mounts from/to city picker overlays (pair with useFlightSearchForm). */
export function FlightCityPickerHost({
  airports,
  picker,
  onClose,
  onSelectFrom,
  onSelectTo,
}: FlightCityPickerHostProps) {
  return (
    <>
      <FlightCityPicker
        open={picker === "from"}
        cities={airports}
        title="选择出发城市"
        onClose={onClose}
        onSelect={onSelectFrom}
      />
      <FlightCityPicker
        open={picker === "to"}
        cities={airports}
        title="选择到达城市"
        onClose={onClose}
        onSelect={onSelectTo}
      />
    </>
  );
}

/** Convenience wrapper bound to useFlightSearchForm return value. */
export function FlightCityPickerHostFromForm({ form }: { form: FlightSearchForm }) {
  return (
    <FlightCityPickerHost
      airports={form.airports}
      picker={form.picker}
      onClose={() => form.setPicker(null)}
      onSelectFrom={form.setFromCity}
      onSelectTo={form.setToCity}
    />
  );
}
