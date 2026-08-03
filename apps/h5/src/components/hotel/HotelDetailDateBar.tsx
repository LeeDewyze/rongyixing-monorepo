import { HOTEL_DETAIL_FONT } from "@/components/hotel/hotel-detail-chrome";
import { formatHotelDateShort, nightsBetween, relativeDayLabel } from "@/lib/date-search";

interface HotelDetailDateBarProps {
  checkIn: string;
  checkOut: string;
  onOpenPicker: () => void;
}

function ChevronRightIcon() {
  return (
    <svg viewBox="0 0 12 12" className="size-3 shrink-0 text-[#CCCCCC]" aria-hidden>
      <path d="M4 2l4 4-4 4" fill="none" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

function DateColumn({
  label,
  date,
  hint,
  align,
}: {
  label: string;
  date: string;
  hint: string;
  align: "start" | "end";
}) {
  return (
    <div
      className={`flex min-w-0 flex-1 flex-col ${align === "end" ? "items-end text-right" : "items-start"}`}
    >
      <span className="text-[11px] font-medium text-[#999999]">{label}</span>
      <span className="mt-1 text-[16px] font-semibold leading-none text-[#333333]">
        {formatHotelDateShort(date)}
      </span>
      {hint ? (
        <span className="mt-1 text-[12px] leading-none text-brand-primary">{hint}</span>
      ) : (
        <span className="mt-1 h-3" aria-hidden />
      )}
    </div>
  );
}

export function HotelDetailDateBar({ checkIn, checkOut, onOpenPicker }: HotelDetailDateBarProps) {
  const nights = nightsBetween(checkIn, checkOut);

  return (
    <button
      type="button"
      onClick={onOpenPicker}
      className={`mx-3 mt-3 w-[calc(100%-1.5rem)] overflow-hidden rounded-xl bg-white text-left shadow-[0_2px_12px_rgba(0,0,0,0.06)] ring-1 ring-[#E8ECF3] active:bg-[#FAFBFC] ${HOTEL_DETAIL_FONT}`}
    >
      <div className="flex items-center gap-2 px-4 py-3.5">
        <DateColumn label="入住" date={checkIn} hint={relativeDayLabel(checkIn)} align="start" />

        <div className="flex shrink-0 flex-col items-center px-1">
          <span className="rounded-full bg-[#EEF4FF] px-2.5 py-1 text-[11px] font-semibold leading-none text-brand-primary ring-1 ring-[#D6E4FF]">
            {nights}晚
          </span>
          <div className="mt-1.5 flex w-14 items-center gap-0.5" aria-hidden>
            <span className="h-px flex-1 bg-[#D6E4FF]" />
            <span className="size-1 rounded-full bg-brand-primary/40" />
            <span className="h-px flex-1 bg-[#D6E4FF]" />
          </div>
        </div>

        <DateColumn label="离店" date={checkOut} hint={relativeDayLabel(checkOut)} align="end" />

        <ChevronRightIcon />
      </div>
    </button>
  );
}
