import { formatDateLabel, nightsBetween, todayDateString } from "@/lib/date-search";

interface DateRangeFieldProps {
  checkIn: string;
  checkOut: string;
  onCheckInChange: (date: string) => void;
  onCheckOutChange: (date: string) => void;
}

export function DateRangeField({
  checkIn,
  checkOut,
  onCheckInChange,
  onCheckOutChange,
}: DateRangeFieldProps) {
  const min = todayDateString();
  const nights = nightsBetween(checkIn, checkOut);

  return (
    <div className="space-y-1 border-b py-3">
      <div className="flex items-end gap-3">
        <label className="flex-1">
          <span className="text-xs text-muted-foreground">入住</span>
          <input
            type="date"
            className="mt-1 block w-full border-0 bg-transparent text-lg font-medium outline-none"
            value={checkIn}
            min={min}
            onChange={(e) => onCheckInChange(e.target.value)}
          />
        </label>
        <span className="pb-2 text-muted-foreground">—</span>
        <label className="flex-1 text-right">
          <span className="text-xs text-muted-foreground">离店</span>
          <input
            type="date"
            className="mt-1 block w-full border-0 bg-transparent text-right text-lg font-medium outline-none"
            value={checkOut}
            min={checkIn || min}
            onChange={(e) => onCheckOutChange(e.target.value)}
          />
        </label>
      </div>
      <p className="text-right text-xs text-muted-foreground">
        共{nights}晚 · {formatDateLabel(checkIn)} — {formatDateLabel(checkOut)}
      </p>
    </div>
  );
}
