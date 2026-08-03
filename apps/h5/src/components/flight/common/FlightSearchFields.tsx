import type { FlightSearchForm } from "@/hooks/useFlightSearchForm";

import { FlightCityPairField } from "./FlightCityPairField";
import { FlightDateField } from "./FlightDateField";

interface FlightSearchFieldsProps {
  form: FlightSearchForm;
  className?: string;
}

/**
 * Reusable city pair + departure date block for search / list modify / book flows.
 */
export function FlightSearchFields({ form, className = "" }: FlightSearchFieldsProps) {
  return (
    <div className={`space-y-1 ${className}`}>
      <FlightCityPairField
        fromCity={form.fromCity}
        toCity={form.toCity}
        onSelectFrom={() => form.setPicker("from")}
        onSelectTo={() => form.setPicker("to")}
        onSwap={form.swapCities}
      />
      <FlightDateField value={form.date} onChange={form.setDate} />
      {form.validationError && (
        <p className="pt-2 text-center text-sm text-destructive">{form.validationError}</p>
      )}
    </div>
  );
}
