import trainRouteArrow from "@/assets/train/route-arrow.png";
import { HOTEL_DETAIL_FONT } from "@/components/hotel/hotel-detail-chrome";
import type { TrainBookBillBreakdown } from "@/lib/train-book";

interface TrainBookBillSheetProps {
  breakdown: TrainBookBillBreakdown;
}

function formatBillAmount(value: number): string {
  return Number.isFinite(value) ? String(value) : "--";
}

function BillLineRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between gap-3 py-2">
      <span className="min-w-0 flex-1 text-[14px] text-[#666666]">{label}</span>
      <span className="shrink-0 text-[14px] font-medium tabular-nums text-[#333333]">
        {value}
      </span>
    </div>
  );
}

function RouteRow({ fromStation, toStation }: { fromStation: string; toStation: string }) {
  return (
    <div className="flex items-center gap-2 rounded-lg bg-white px-3 py-2.5 ring-1 ring-[#E8EBF0]">
      <span className="text-[14px] font-medium text-[#2768FA]">{fromStation}</span>
      <span className="flex min-w-0 flex-1 items-center px-1">
        <div className="h-px flex-1 bg-[#d8e7ff]" />
        <img
          src={trainRouteArrow}
          alt=""
          className="mx-1 h-3 w-8 shrink-0 object-contain"
          aria-hidden
        />
        <div className="h-px flex-1 bg-[#d8e7ff]" />
      </span>
      <span className="text-[14px] font-medium text-[#2768FA]">{toStation}</span>
    </div>
  );
}

/** Inline bill panel — expands above the train book footer. */
export function TrainBookBillSheet({ breakdown }: TrainBookBillSheetProps) {
  const passengerCount = breakdown.passengers.length;
  const firstBill = breakdown.passengers[0];
  const serviceFeeTotal = breakdown.passengers.reduce((sum, bill) => sum + bill.serviceFee, 0);
  const hasSameServiceFee = breakdown.passengers.every(
    (bill) => bill.serviceFee === firstBill?.serviceFee,
  );

  return (
    <div
      className={`overflow-hidden rounded-t-xl border border-b-0 border-[#EEF1F6] bg-white shadow-[0_-6px_18px_rgba(15,23,42,0.10)] ${HOTEL_DETAIL_FONT}`}
      role="dialog"
      aria-label="费用明细"
    >
      <div className="space-y-2 px-4 py-3">
        {firstBill?.fromStation || firstBill?.toStation ? (
          <RouteRow fromStation={firstBill.fromStation} toStation={firstBill.toStation} />
        ) : null}

        <div className="rounded-lg bg-[#F8F9FC] px-3 py-1 ring-1 ring-[#EEF1F6]">
          <BillLineRow
            label="火车票"
            value={`¥${formatBillAmount(firstBill?.ticketPrice ?? 0)} × ${passengerCount}人`}
          />
          {firstBill?.seatTypeName ? (
            <p className="pb-2 text-[12px] leading-snug text-[#999999]">
              {firstBill.seatTypeName}
            </p>
          ) : null}
          {serviceFeeTotal > 0 ? (
            <BillLineRow
              label="服务费"
              value={
                hasSameServiceFee
                  ? `¥${formatBillAmount(firstBill?.serviceFee ?? 0)} × ${passengerCount}人`
                  : `¥${formatBillAmount(serviceFeeTotal)}`
              }
            />
          ) : null}
        </div>
      </div>
    </div>
  );
}
