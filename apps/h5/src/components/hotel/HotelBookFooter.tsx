import type { HotelBillNight } from "@/lib/hotel-book";

import { HotelBookBillSheet } from "@/components/hotel/HotelBookBillSheet";
import { HOTEL_DETAIL_FONT } from "@/components/hotel/hotel-detail-chrome";

interface HotelBookFooterProps {
  amount: number;
  disabled: boolean;
  pending: boolean;
  billOpen: boolean;
  billNights: HotelBillNight[];
  serviceFee: number;
  roomCount: number;
  onBillToggle: () => void;
  onSubmit: () => void;
}

function BillChevron({ open }: { open: boolean }) {
  return (
    <svg
      viewBox="0 0 12 8"
      className={`h-2 w-3 shrink-0 text-brand-primary transition-transform duration-200 ${open ? "" : "rotate-180"}`}
      aria-hidden
    >
      <path
        d="M1 1.5 6 6.5 11 1.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function HotelBookFooter({
  amount,
  disabled,
  pending,
  billOpen,
  billNights,
  serviceFee,
  roomCount,
  onBillToggle,
  onSubmit,
}: HotelBookFooterProps) {
  const nightCount = billNights.length;
  const perRoomSubtotal = billNights.reduce((sum, night) => sum + night.price, 0);
  const roomSubtotal = perRoomSubtotal * Math.max(roomCount, 1);

  return (
    <>
      {billOpen ? (
        <button
          type="button"
          className="fixed inset-0 z-20 bg-black/25"
          aria-label="关闭账单明细"
          onClick={onBillToggle}
        />
      ) : null}

      <div className={`fixed inset-x-0 bottom-0 z-30 ${HOTEL_DETAIL_FONT}`}>
        {billOpen ? (
          <HotelBookBillSheet
            nights={billNights}
            nightCount={nightCount}
            roomSubtotal={roomSubtotal}
            serviceFee={serviceFee}
            roomCount={roomCount}
          />
        ) : null}

        <div className="flex items-center bg-white px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] shadow-[0_-4px_16px_rgba(0,0,0,0.06)]">
          <div className="flex w-full items-center gap-3">
            <div className="flex h-9 min-w-0 flex-1 items-center gap-2">
              <p className="m-0 shrink-0 text-[13px] leading-none text-[#666666]">总计</p>
              <p className="m-0 text-[25px] font-semibold leading-none text-[#FF4D4F]">
                ¥{Number.isFinite(amount) ? amount : "—"}
              </p>
              <button
                type="button"
                className="inline-flex items-center gap-1 text-[13px] leading-none text-brand-primary"
                aria-expanded={billOpen}
                onClick={onBillToggle}
              >
                明细
                <BillChevron open={billOpen} />
              </button>
            </div>

            <button
              type="button"
              disabled={disabled}
              className="flex h-9 w-[120px] shrink-0 items-center justify-center rounded-[24px] bg-[linear-gradient(270deg,var(--brand-btn-end)_0%,var(--brand-btn-start)_100%)] text-[14px] font-medium leading-none text-white disabled:bg-none disabled:bg-[#CCCCCC] active:opacity-90"
              onClick={onSubmit}
            >
              {pending ? "提交中…" : "生成订单"}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
