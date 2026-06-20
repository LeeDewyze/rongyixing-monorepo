import { formatFlightDateLabel, todayDateString } from "@/lib/flight-search";

interface FlightDateFieldProps {
  value: string;
  onChange: (date: string) => void;
  label?: string;
  minDate?: string;
  className?: string;
}

/** Single departure date picker with weekday hint. */
export function FlightDateField({
  value,
  onChange,
  label = "出发日期",
  minDate = todayDateString(),
  className = "",
}: FlightDateFieldProps) {
  return (
    <div className={className}>
      <label className="flex items-baseline justify-between border-b py-3">
        <span className="text-xs text-muted-foreground">{label}</span>
        <input
          type="date"
          className="border-0 bg-transparent text-right text-lg font-medium outline-none"
          value={value}
          min={minDate}
          onChange={(e) => onChange(e.target.value)}
        />
      </label>
      <p className="py-1 text-right text-xs text-muted-foreground">
        {formatFlightDateLabel(value)}
      </p>
    </div>
  );
}
