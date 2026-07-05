import trainRouteArrow from "@/assets/train/route-arrow.png";
import { HOTEL_DETAIL_FONT } from "@/components/hotel/hotel-detail-chrome";
import type { TrainBookBillBreakdown } from "@/lib/train-book";

interface TrainBookBillSheetProps {
  breakdown: TrainBookBillBreakdown;
}

function formatBillAmount(value: number): string {
  return Number.isFinite(value) ? String(value) : "--";
}

function parseTrainCode(routeLabel: string): string {
  const match = routeLabel.match(/^([A-Z0-9]+)/i);
  return match?.[1] ?? "";
}

function BillLineRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 py-2">
      <span className="min-w-0 flex-1 text-[14px] text-[#666666]">{label}</span>
      <span className="shrink-0 text-[14px] font-medium tabular-nums text-[#333333]">{value}</span>
    </div>
  );
}

function RouteRow({
  fromStation,
  toStation,
  trainRouteLabel,
}: {
  fromStation: string;
  toStation: string;
  trainRouteLabel?: string;
}) {
  const trainCode = trainRouteLabel ? parseTrainCode(trainRouteLabel) : "";

  return (
    <div className="overflow-hidden rounded-xl bg-[linear-gradient(180deg,#EEF4FF_0%,#F8FBFF_100%)] px-3.5 py-3 ring-1 ring-[#D6E4FF]">
      <div className="grid grid-cols-[minmax(0,1fr)_5.5rem_minmax(0,1fr)] items-center gap-x-2">
        <p className="truncate text-left text-[15px] font-semibold leading-tight text-[#333333]">
          {fromStation}
        </p>

        <div className="flex flex-col items-center justify-center gap-1">
          {trainCode ? (
            <span className="text-[11px] font-medium leading-none tracking-wide text-[#2768FA]">
              {trainCode}
            </span>
          ) : null}
          <img
            src={trainRouteArrow}
            alt=""
            width={56}
            height={12}
            className="h-3 w-14 shrink-0 object-contain"
            aria-hidden
          />
        </div>

        <p className="truncate text-right text-[15px] font-semibold leading-tight text-[#333333]">
          {toStation}
        </p>
      </div>
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
      className={`overflow-hidden rounded-t-2xl border border-b-0 border-[#EEF1F6] bg-white shadow-[0_-8px_24px_rgba(15,23,42,0.12)] ${HOTEL_DETAIL_FONT}`}
      role="dialog"
      aria-label="费用明细"
    >
      <div className="flex shrink-0 items-center justify-between border-b border-[#EEF1F6] px-4 py-3">
        <p className="text-[15px] font-medium text-[#010101]">费用明细</p>
        {passengerCount > 1 ? (
          <p className="text-[12px] text-[#999999]">共 {passengerCount} 位乘车人</p>
        ) : null}
      </div>

      <div className="space-y-3 px-4 py-3">
        {firstBill?.fromStation || firstBill?.toStation ? (
          <RouteRow
            fromStation={firstBill.fromStation}
            toStation={firstBill.toStation}
            trainRouteLabel={firstBill.trainRouteLabel}
          />
        ) : null}

        <div className="rounded-xl bg-[#F8F9FC] px-3 py-1 ring-1 ring-[#EEF1F6]">
          <BillLineRow
            label="火车票"
            value={`¥${formatBillAmount(firstBill?.ticketPrice ?? 0)} × ${passengerCount}人`}
          />
          {firstBill?.seatTypeName ? (
            <p className="pb-2 text-[12px] leading-snug text-[#999999]">{firstBill.seatTypeName}</p>
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
          {breakdown.originalTicketCredit != null && breakdown.originalTicketCredit > 0 ? (
            <BillLineRow
              label="原票抵扣"
              value={`-¥${formatBillAmount(breakdown.originalTicketCredit)}`}
            />
          ) : null}
        </div>
      </div>
    </div>
  );
}
