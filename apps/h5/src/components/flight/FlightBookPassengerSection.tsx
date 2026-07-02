import type { ReactNode } from "react";

interface FlightBookPassengerSectionProps {
  passengers: ReactNode;
  seatPicker?: ReactNode;
  notifyLanguage?: ReactNode;
  serviceFee?: ReactNode;
  /** When multiple passengers — badge shows 旅客1, 旅客2, … */
  passengerIndex?: number;
}

/** Flight book passenger block — mirrors hotel room section layout. */
export function FlightBookPassengerSection({
  passengers,
  seatPicker,
  notifyLanguage,
  serviceFee,
  passengerIndex,
}: FlightBookPassengerSectionProps) {
  const title = passengerIndex != null ? `旅客${passengerIndex}` : "旅客信息";

  return (
    <section className="overflow-hidden rounded-xl bg-white px-3.5 shadow-sm ring-1 ring-[#EEF1F6]">
      <h2 className="border-b border-[#F0F2F5] py-3 text-[15px] font-semibold text-[#111111]">
        {title}
      </h2>

      <div className="pb-4 pt-3">{passengers}</div>

      {seatPicker ? <div className="pb-4">{seatPicker}</div> : null}

      {notifyLanguage ? <div className="pb-4">{notifyLanguage}</div> : null}

      {serviceFee ? <div className="pb-4">{serviceFee}</div> : null}
    </section>
  );
}
