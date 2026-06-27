import type { FlightBookBillBreakdown } from "@/lib/flight-book";
import { FlightRoutePlaneIcon } from "@/components/flight/FlightRoutePlaneIcon";
import { HOTEL_DETAIL_FONT } from "@/components/hotel/hotel-detail-chrome";

interface FlightBookBillSheetProps {
  breakdown: FlightBookBillBreakdown;
}

function formatBillAmount(value: number): string {
  return Number.isFinite(value) ? String(value) : "—";
}

function BillLineRow({ label, amount }: { label: string; amount: number }) {
  return (
    <div className="flex items-center justify-between gap-3 py-1.5">
      <span className="min-w-0 flex-1 text-[14px] text-[#666666]">{label}</span>
      <span className="shrink-0 text-[14px] font-medium tabular-nums text-[#333333]">
        ¥{formatBillAmount(amount)}
      </span>
    </div>
  );
}

function RouteRow({ fromCity, toCity }: { fromCity: string; toCity: string }) {
  return (
    <div className="flex items-center gap-2 rounded-lg bg-white px-3 py-2.5 ring-1 ring-[#E8EBF0]">
      <span className="text-[14px] font-medium text-[#2768FA]">{fromCity}</span>
      <span className="flex min-w-0 flex-1 items-center px-1">
        <div className="h-px flex-1 bg-[#d8e7ff]" />
        <FlightRoutePlaneIcon className="mx-1 h-4 w-5 shrink-0" />
        <div className="h-px flex-1 bg-[#d8e7ff]" />
      </span>
      <span className="text-[14px] font-medium text-[#2768FA]">{toCity}</span>
    </div>
  );
}

/** Inline bill panel — expands above the book footer (same pattern as hotel). */
export function FlightBookBillSheet({ breakdown }: FlightBookBillSheetProps) {
  const passengerCount = breakdown.passengers.length;
  const hasMultiplePassengers = passengerCount > 1;

  return (
    <div
      className={`flex max-h-[min(58vh,26rem)] flex-col overflow-hidden rounded-t-2xl border border-b-0 border-[#EEF1F6] bg-white shadow-[0_-8px_24px_rgba(15,23,42,0.12)] ${HOTEL_DETAIL_FONT}`}
      role="dialog"
      aria-label="费用明细"
    >
      <div className="flex shrink-0 items-center justify-between border-b border-[#EEF1F6] px-4 py-3">
        <p className="text-[15px] font-medium text-[#010101]">费用明细</p>
        {hasMultiplePassengers ? (
          <p className="text-[12px] text-[#999999]">共 {passengerCount} 位乘机人</p>
        ) : null}
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-3">
        <div className="space-y-3">
          {breakdown.passengers.map((bill, index) => (
            <section
              key={`${bill.passengerName}-${bill.credentialNumber}-${index}`}
              className="overflow-hidden rounded-xl bg-[#F8F9FC] ring-1 ring-[#EEF1F6]"
            >
              <div className="border-b border-[#EEF1F6] bg-white/70 px-3.5 py-2.5">
                <p className="text-[15px] font-semibold text-[#333333]">{bill.passengerName}</p>
                {bill.credentialNumber ? (
                  <p className="mt-1 text-[12px] tabular-nums text-[#999999]">
                    {bill.credentialNumber}
                  </p>
                ) : null}
              </div>

              <div className="space-y-3 px-3.5 py-3">
                {bill.fromCity || bill.toCity ? (
                  <RouteRow fromCity={bill.fromCity} toCity={bill.toCity} />
                ) : null}

                <div className="rounded-lg bg-white px-3 py-1 ring-1 ring-[#EEF1F6]">
                  <BillLineRow label="机票票价" amount={bill.ticketPrice} />
                  {bill.flightRouteLabel ? (
                    <p className="pb-1.5 text-[12px] leading-snug text-[#999999]">
                      {bill.flightRouteLabel}
                    </p>
                  ) : null}

                  {bill.taxLines.map((line) => (
                    <BillLineRow
                      key={`${bill.passengerName}-${line.name}`}
                      label={line.name}
                      amount={line.amount}
                    />
                  ))}

                  {bill.serviceFee > 0 ? (
                    <BillLineRow label="服务费" amount={bill.serviceFee} />
                  ) : null}
                </div>

                {hasMultiplePassengers ? (
                  <div className="flex items-center justify-between border-t border-dashed border-[#E5E8EF] pt-2.5">
                    <span className="text-[13px] text-[#666666]">小计</span>
                    <span className="text-[15px] font-semibold tabular-nums text-[#FF4D4F]">
                      ¥{formatBillAmount(bill.subtotal)}
                    </span>
                  </div>
                ) : null}
              </div>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}
