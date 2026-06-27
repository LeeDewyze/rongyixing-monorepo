import { useState } from "react";
import type { FlightInsuranceProduct } from "@ryx/shared-types";

import { FlightInsuranceDetailSheet } from "@/components/flight/FlightInsuranceDetailSheet";
import { formatInsuranceDetailLines } from "@/lib/flight-book-insurance";

interface FlightBookInsuranceProps {
  products: FlightInsuranceProduct[];
  selectedId: string;
  mandatory?: boolean;
  selectionLocked?: boolean;
  onSelect: (id: string) => void;
}

export function FlightBookInsurance({
  products,
  selectedId,
  mandatory = false,
  selectionLocked = false,
  onSelect,
}: FlightBookInsuranceProps) {
  const [expandedIds, setExpandedIds] = useState<Record<string, boolean>>({});
  const [detailUrlProduct, setDetailUrlProduct] = useState<FlightInsuranceProduct | null>(null);

  if (!products.length) return null;

  function toggleDetail(productId: string) {
    setExpandedIds((prev) => ({ ...prev, [productId]: !prev[productId] }));
  }

  return (
    <>
      <div className="rounded-xl bg-white px-3 py-3">
        <div className="mb-2 flex items-center justify-between gap-2">
          <p className="text-[14px] font-medium text-[#333333]">航空意外险</p>
          {mandatory ? (
            <span className="shrink-0 rounded bg-[#fff1f0] px-2 py-0.5 text-[11px] text-[#ff4d4f]">
              须购买
            </span>
          ) : null}
        </div>
        <div className="space-y-3">
          {!mandatory ? (
            <label className="flex cursor-pointer items-center gap-2 py-1">
              <input
                type="radio"
                name="flight-insurance"
                checked={!selectedId}
                disabled={selectionLocked}
                onChange={() => onSelect("")}
                className="size-4 accent-brand-accent"
              />
              <span className="text-[14px] text-[#666666]">不购买</span>
            </label>
          ) : null}

          {products.map((product) => {
            const id = String(product.Id ?? "");
            const expanded = Boolean(expandedIds[id]);
            const detailLines = formatInsuranceDetailLines(product.Detail);
            const hasDetail = detailLines.length > 0 || Boolean(product.DetailUrl);

            return (
              <div key={id} className="rounded-lg border border-[#f0f0f0] px-3 py-2">
                <div className="flex items-start gap-2">
                  <label className="flex min-w-0 flex-1 cursor-pointer items-start gap-2 py-0.5">
                    <input
                      type="radio"
                      name="flight-insurance"
                      checked={selectedId === id}
                      disabled={selectionLocked}
                      onChange={() => onSelect(id)}
                      className="mt-0.5 size-4 accent-brand-accent"
                    />
                    <span className="min-w-0 flex-1 text-[14px] text-[#333333]">
                      {product.Name}
                      {product.Price != null ? (
                        <span className="ml-2 text-[#ff4d4f]">¥{product.Price}/人</span>
                      ) : null}
                    </span>
                  </label>
                  {hasDetail ? (
                    <button
                      type="button"
                      className="shrink-0 text-[13px] text-brand-accent"
                      onClick={() => toggleDetail(id)}
                    >
                      详情{expanded ? " ▴" : " ▾"}
                    </button>
                  ) : null}
                </div>

                {expanded ? (
                  <div className="mt-2 border-t border-[#f5f5f5] pt-2">
                    {detailLines.length > 0 ? (
                      <div className="space-y-1 text-[13px] leading-5 text-[#666666]">
                        {detailLines.map((line) => (
                          <p key={`${id}-${line}`}>{line}</p>
                        ))}
                      </div>
                    ) : null}
                    {product.DetailUrl ? (
                      <button
                        type="button"
                        className="mt-2 flex w-full items-center justify-between text-[13px] text-brand-accent"
                        onClick={() => setDetailUrlProduct(product)}
                      >
                        <span>显示更多</span>
                        <span className="text-[#cccccc]">›</span>
                      </button>
                    ) : null}
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      </div>

      <FlightInsuranceDetailSheet
        open={detailUrlProduct != null}
        title={detailUrlProduct?.Name ?? "保险详情"}
        url={detailUrlProduct?.DetailUrl ?? ""}
        onClose={() => setDetailUrlProduct(null)}
      />
    </>
  );
}

export {
  resolveInsuranceAmount,
  resolvePassengerInsuranceProducts,
} from "@/lib/flight-book-insurance-display";
