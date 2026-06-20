import { formatDateLabel, todayDateString } from "@/lib/date-search";

interface DateFieldProps {
  value: string;
  onChange: (date: string) => void;
  label?: string;
  minDate?: string;
}

export function DateField({
  value,
  onChange,
  label = "出发日期",
  minDate = todayDateString(),
}: DateFieldProps) {
  return (
    <div>
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
      <p className="py-1 text-right text-xs text-muted-foreground">{formatDateLabel(value)}</p>
    </div>
  );
}
