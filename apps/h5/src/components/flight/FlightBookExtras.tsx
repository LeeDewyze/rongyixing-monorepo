import { formatFlightNotifyLanguage, type FlightNotifyLanguage } from "@/lib/flight-book-notify";

export interface FlightBookServiceFeeRow {
  passengerId: string;
  passengerName: string;
  fee: number;
}

interface FlightBookPassengerExtrasProps {
  showNotifyLanguage: boolean;
  showServiceFee: boolean;
  notifyLanguage: FlightNotifyLanguage;
  serviceFees: FlightBookServiceFeeRow[];
  onOpenNotifyLanguage: () => void;
}

/** Rows embedded under 旅客信息 — matches Legacy notify + service fee placement. */
export function FlightBookPassengerExtras({
  showNotifyLanguage,
  showServiceFee,
  notifyLanguage,
  serviceFees,
  onOpenNotifyLanguage,
}: FlightBookPassengerExtrasProps) {
  if (!showNotifyLanguage && !showServiceFee) return null;
  if (showServiceFee && serviceFees.length === 0) {
    if (!showNotifyLanguage) return null;
  }

  return (
    <div className="mt-1 border-t border-[#f0f0f0] pt-1">
      {showNotifyLanguage ? (
        <div className="flex min-h-[2.5rem] items-center gap-2 border-b border-[#f0f0f0] py-2 last:border-b-0">
          <span className="w-[5.5rem] shrink-0 whitespace-nowrap text-[14px] leading-none text-[#666666]">
            通知语言
          </span>
          <button
            type="button"
            className="flex min-w-0 flex-1 items-center justify-end gap-1 truncate text-[14px] leading-tight text-[#333333]"
            onClick={onOpenNotifyLanguage}
          >
            <span className="truncate">{formatFlightNotifyLanguage(notifyLanguage)}</span>
            <span className="shrink-0 text-[16px] text-[#bbbbbb]" aria-hidden>
              ›
            </span>
          </button>
        </div>
      ) : null}

      {showServiceFee
        ? serviceFees.map((row, index) => (
            <div
              key={row.passengerId}
              className={`flex min-h-[2.5rem] items-center gap-2 py-2 ${
                index < serviceFees.length - 1 ? "border-b border-[#f0f0f0]" : ""
              }`}
            >
              <span className="w-[5.5rem] shrink-0 whitespace-nowrap text-[14px] leading-none text-[#666666]">
                服务费
              </span>
              <span className="min-w-0 flex-1 text-right text-[14px] leading-tight text-[#333333]">
                {serviceFees.length > 1 && row.passengerName
                  ? `${row.passengerName} ${row.fee}元`
                  : `${row.fee}元`}
              </span>
            </div>
          ))
        : null}
    </div>
  );
}

interface FlightBookExtrasProps {
  showNotifyLanguage: boolean;
  showServiceFee: boolean;
  notifyLanguage: FlightNotifyLanguage;
  serviceFee: number;
  onOpenNotifyLanguage: () => void;
}

/** @deprecated Prefer FlightBookPassengerExtras inside FlightBookPassengers. */
export function FlightBookExtras({
  showNotifyLanguage,
  showServiceFee,
  notifyLanguage,
  serviceFee,
  onOpenNotifyLanguage,
}: FlightBookExtrasProps) {
  const serviceFees: FlightBookServiceFeeRow[] = showServiceFee
    ? [{ passengerId: "total", passengerName: "", fee: serviceFee }]
    : [];

  return (
    <section className="rounded-xl bg-white px-3 py-1 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
      <FlightBookPassengerExtras
        showNotifyLanguage={showNotifyLanguage}
        showServiceFee={showServiceFee}
        notifyLanguage={notifyLanguage}
        serviceFees={serviceFees}
        onOpenNotifyLanguage={onOpenNotifyLanguage}
      />
    </section>
  );
}
