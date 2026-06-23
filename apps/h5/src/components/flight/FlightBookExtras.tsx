import { formatFlightNotifyLanguage, type FlightNotifyLanguage } from "@/lib/flight-book-notify";

interface FlightBookExtrasProps {
  showNotifyLanguage: boolean;
  showServiceFee: boolean;
  notifyLanguage: FlightNotifyLanguage;
  serviceFee: number;
  onOpenNotifyLanguage: () => void;
}

export function FlightBookExtras({
  showNotifyLanguage,
  showServiceFee,
  notifyLanguage,
  serviceFee,
  onOpenNotifyLanguage,
}: FlightBookExtrasProps) {
  if (!showNotifyLanguage && !showServiceFee) return null;

  return (
    <section className="rounded-xl bg-white px-3 py-1 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
      {showNotifyLanguage ? (
        <button
          type="button"
          className={`flex w-full items-center justify-between py-3.5 text-left ${
            showServiceFee ? "border-b border-[#f0f0f0]" : ""
          }`}
          onClick={onOpenNotifyLanguage}
        >
          <span className="text-[16px] text-[#333333]">通知语言</span>
          <span className="flex items-center gap-1 text-[16px] text-[#333333]">
            {formatFlightNotifyLanguage(notifyLanguage)}
            <span className="text-[18px] text-[#bbbbbb]" aria-hidden>
              ›
            </span>
          </span>
        </button>
      ) : null}

      {showServiceFee ? (
        <div className="flex items-center justify-between py-3.5">
          <span className="text-[16px] text-[#333333]">服务费</span>
          <span className="text-[16px] text-[#333333]">{serviceFee}元</span>
        </div>
      ) : null}
    </section>
  );
}
