import type { FlightFare } from "@ryx/shared-types";

import {
  formatCabinInfoLine,
  prepareFlightFareRulesForSheet,
} from "@/lib/flight-detail";

interface FlightFareRulesSheetProps {
  open: boolean;
  fare: FlightFare | null;
  onClose: () => void;
}

export function FlightFareRulesSheet({ open, fare, onClose }: FlightFareRulesSheetProps) {
  if (!open || !fare) return null;

  const rules = prepareFlightFareRulesForSheet(fare);
  const cabinLine = formatCabinInfoLine(fare);

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end bg-black/40">
      <button type="button" className="flex-1" aria-label="关闭" onClick={onClose} />
      <div className="flex max-h-[80vh] flex-col rounded-t-2xl bg-white pb-[max(1rem,env(safe-area-inset-bottom))]">
        <div className="flex items-center justify-between border-b border-[#eeeeee] px-4 py-3">
          <p className="text-[16px] font-semibold text-[#333333]">退改签详情</p>
          <button
            type="button"
            className="text-[22px] leading-none text-[#999999]"
            aria-label="关闭"
            onClick={onClose}
          >
            ×
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-3">
          {cabinLine ? (
            <p className="mb-3 text-[13px] text-[#666666]">{cabinLine}</p>
          ) : null}

          <p className="text-[14px] font-semibold text-[#333333]">行李规定(成人)</p>

          {rules.length === 0 ? (
            <p className="mt-4 text-center text-sm text-[#808080]">暂无退改签政策信息</p>
          ) : (
            <div className="mt-2">
              {rules.map((rule, index) => (
                <div key={`${rule.Name ?? "rule"}-${index}`} className="px-1">
                  {rule.Tag ? (
                    <p className="my-2 text-center text-[12px] text-[#808080]">{rule.Tag}</p>
                  ) : null}
                  <div className="flex gap-3 border-b border-[#eeeeee] py-2.5 last:border-b-0">
                    <p className="w-[25%] shrink-0 text-[13px] text-[#808080]">{rule.Name}</p>
                    <div className="min-w-0 flex-1 text-[13px] text-[#333333]">
                      {rule.Description ? <p>{rule.Description}</p> : null}
                      {rule.Details?.map((detail) => (
                        <div
                          key={`${detail.name}-${String(detail.value)}`}
                          className="flex items-start justify-between gap-2 py-0.5"
                        >
                          <span className="text-[#666666]">{detail.name}</span>
                          <span className="shrink-0 text-right">{String(detail.value ?? "")}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
