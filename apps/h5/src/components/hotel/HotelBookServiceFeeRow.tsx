import { HOTEL_DETAIL_FONT } from "@/components/hotel/hotel-detail-chrome";

interface HotelBookServiceFeeRowProps {
  amount: number;
  passengerName?: string;
  /** Render inside a room section card without its own shadow. */
  embedded?: boolean;
  /** Inset panel inside room section (rounded gray card). */
  inset?: boolean;
}

export function HotelBookServiceFeeRow({
  amount,
  passengerName,
  embedded = false,
  inset = false,
}: HotelBookServiceFeeRowProps) {
  if (!Number.isFinite(amount) || amount <= 0) return null;

  const content = (
    <>
      <span className="text-[14px] text-[#333333]">
        服务费
        {passengerName ? (
          <span className="ml-1 text-[12px] text-[#999999]">({passengerName})</span>
        ) : null}
      </span>
      <span className="text-[14px] font-medium text-[#333333]">¥{amount}</span>
    </>
  );

  if (inset) {
    return (
      <div
        className={`flex items-center justify-between rounded-xl bg-[#F8F9FC] px-3.5 py-3 ring-1 ring-[#EEF1F6] ${HOTEL_DETAIL_FONT}`}
      >
        {content}
      </div>
    );
  }

  if (embedded) {
    return (
      <div
        className={`flex items-center justify-between border-t border-[#F0F2F5] px-3 py-3.5 ${HOTEL_DETAIL_FONT}`}
      >
        {content}
      </div>
    );
  }

  return (
    <div
      className={`flex items-center justify-between rounded-xl bg-white px-4 py-3.5 shadow-[0_2px_8px_rgba(0,0,0,0.04)] ${HOTEL_DETAIL_FONT}`}
    >
      {content}
    </div>
  );
}
