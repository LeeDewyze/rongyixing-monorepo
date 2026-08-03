import type { FlightOrderTicket, HotelOrderBillLine } from "@ryx/shared-types";

import { FareRulesBottomSheet } from "@/components/flight/flight-fare-rule-presentation";
import { sumBillLines } from "@/lib/flight-order-detail";

interface FlightOrderBillSheetProps {
  open: boolean;
  ticket?: FlightOrderTicket;
  lines: HotelOrderBillLine[];
  onClose: () => void;
}

function formatPayableAmount(value: number): string {
  if (!Number.isFinite(value)) return "—";
  return String(Math.round(value * 100) / 100);
}

function resolveAmountClass(amount: number, emphasized = false): string {
  if (amount < 0) return emphasized ? "font-semibold text-[#FF4D4F]" : "font-medium text-[#FF4D4F]";
  if (emphasized && amount > 0) return "font-semibold text-[#FF4D4F]";
  if (emphasized) return "font-semibold text-[#333333]";
  return "font-medium text-[#333333]";
}

function PayableLineRow({
  label,
  amount,
  emphasized = false,
  dashedTop = false,
}: {
  label: string;
  amount: number;
  emphasized?: boolean;
  dashedTop?: boolean;
}) {
  return (
    <div
      className={`flex items-center justify-between gap-4 px-3 py-2.5 ${
        dashedTop ? "border-t border-dashed border-[#E5E8EF]" : ""
      }`}
    >
      <span
        className={`min-w-0 flex-1 ${emphasized ? "text-[15px] font-medium text-[#333333]" : "text-[14px] text-[#666666]"}`}
      >
        {label}
      </span>
      <span
        className={`shrink-0 text-[14px] tabular-nums ${resolveAmountClass(amount, emphasized)}`}
      >
        {formatPayableAmount(amount)}
      </span>
    </div>
  );
}

function resolveStatusClass(statusName?: string): string {
  if (!statusName) return "text-[#999999]";
  if (/废除|取消|退票/.test(statusName)) return "text-[#FF8D1A]";
  if (/成功|完成|已出票/.test(statusName)) return "text-[#52C41A]";
  return "text-[#999999]";
}

export function FlightOrderBillSheet({ open, ticket, lines, onClose }: FlightOrderBillSheetProps) {
  const payableTotal = sumBillLines(lines);
  const travelerName = ticket?.Traveler?.Name?.trim() || "—";
  const transactionId = ticket?.Id?.trim();
  const statusName = ticket?.StatusName?.trim();

  return (
    <FareRulesBottomSheet
      open={open}
      title="应付明细"
      titleId="flight-order-bill-title"
      onClose={onClose}
    >
      {!ticket ? (
        <p className="py-8 text-center text-[14px] text-[#999999]">暂无明细</p>
      ) : (
        <section className="overflow-hidden rounded-xl bg-[#F8F9FC] ring-1 ring-[#EEF1F6]">
          <div className="border-b border-[#EEF1F6] bg-white/70 px-3.5 py-2.5">
            <p className="text-[15px] font-semibold text-[#333333]">{travelerName}</p>
            {transactionId ? (
              <p className="mt-1 text-[12px] leading-snug text-[#999999]">
                事务号 <span className="tabular-nums text-[#666666]">{transactionId}</span>
                {statusName ? (
                  <span className={resolveStatusClass(statusName)}> ({statusName})</span>
                ) : null}
              </p>
            ) : null}
          </div>

          <div className="px-3.5 py-3">
            <div className="overflow-hidden rounded-lg bg-white ring-1 ring-[#EEF1F6]">
              {lines.length === 0 ? (
                <p className="px-3 py-4 text-center text-[14px] text-[#999999]">暂无费用项</p>
              ) : (
                lines.map((line, index) => {
                  const isLast = index === lines.length - 1;
                  return (
                    <div
                      key={`${line.Name}-${line.Tag ?? ""}-${index}`}
                      className={isLast ? "" : "border-b border-[#F0F2F5]"}
                    >
                      <PayableLineRow label={line.Name} amount={line.Amount} />
                    </div>
                  );
                })
              )}
              <PayableLineRow label="应付" amount={payableTotal} emphasized dashedTop />
            </div>
          </div>
        </section>
      )}
    </FareRulesBottomSheet>
  );
}
