import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import type { FlightOutNumberField, TravelUrlRow } from "@ryx/shared-types";

import {
  fetchTravelUrlOptions,
  filterTravelUrlRows,
  resolveOutNumberValueFromTravelUrlRow,
} from "@/lib/flight-book-outnumber";
import { formatApiError } from "@/lib/formatApiError";

interface FlightOutNumberPickerSheetProps {
  open: boolean;
  field: FlightOutNumberField | null;
  selected?: string;
  onClose: () => void;
  onSelect: (value: string, row: TravelUrlRow) => void;
}

function formatTravelUrlRowLabel(row: TravelUrlRow, isTravelNumber?: boolean): string {
  const number = row.TravelNumber?.trim();
  if (!number) return row.Subject?.trim() ?? "—";
  return isTravelNumber ? `单号 ${number}` : number;
}

function formatTravelUrlRowSubtitle(row: TravelUrlRow): string {
  const parts: string[] = [];
  if (row.Subject?.trim()) parts.push(row.Subject.trim());
  if (row.StartDate || row.EndDate) {
    parts.push([row.StartDate, row.EndDate].filter(Boolean).join(" ~ "));
  }
  const trips = (row.Trips ?? []).filter(Boolean);
  if (trips.length) parts.push(trips.join(" / "));
  return parts.join(" · ");
}

export function FlightOutNumberPickerSheet({
  open,
  field,
  selected,
  onClose,
  onSelect,
}: FlightOutNumberPickerSheetProps) {
  const [keyword, setKeyword] = useState("");

  useEffect(() => {
    if (!open) setKeyword("");
  }, [open]);

  const query = useQuery({
    queryKey: ["travel", "getTravelUrl", field?.key, field?.staffNumber, field?.staffOutNumber],
    queryFn: () => fetchTravelUrlOptions(field!),
    enabled: open && field != null,
    staleTime: 30_000,
  });

  const visibleRows = useMemo(
    () => filterTravelUrlRows(query.data ?? [], keyword),
    [keyword, query.data],
  );

  if (!open || !field) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end bg-black/40">
      <button type="button" className="flex-1" aria-label="关闭" onClick={onClose} />
      <div className="flex max-h-[70vh] flex-col rounded-t-2xl bg-white pb-[max(1rem,env(safe-area-inset-bottom))]">
        <div className="border-b border-[#eeeeee] px-4 py-3">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-[16px] font-semibold text-[#333333]">选择{field.label}</p>
            <button type="button" className="text-[22px] text-[#999999]" onClick={onClose}>
              ×
            </button>
          </div>
          <input
            type="search"
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
            placeholder="请输入关键字"
            className="w-full rounded-lg border border-[#eeeeee] px-3 py-2 text-[14px] outline-none"
          />
        </div>

        <ul className="min-h-0 flex-1 overflow-y-auto">
          {query.isLoading ? (
            <li className="px-4 py-6 text-center text-[14px] text-[#808080]">加载中…</li>
          ) : query.isError ? (
            <li className="px-4 py-6 text-center text-[14px] text-destructive">
              {formatApiError(query.error)}
            </li>
          ) : visibleRows.length === 0 ? (
            <li className="px-4 py-6 text-center text-[14px] text-[#808080]">暂无数据</li>
          ) : (
            visibleRows.map((row, index) => {
              const value = resolveOutNumberValueFromTravelUrlRow(row);
              const rowKey = `${row.TravelFormId ?? row.TravelNumber ?? index}`;
              const subtitle = formatTravelUrlRowSubtitle(row);
              return (
                <li key={rowKey} className="border-b border-[#eeeeee] last:border-b-0">
                  <button
                    type="button"
                    className={`flex w-full flex-col gap-1 px-4 py-3 text-left ${
                      selected === value ? "text-[#5099fe]" : "text-[#333333]"
                    }`}
                    onClick={() => onSelect(value, row)}
                  >
                    <span className="text-[14px] font-medium">
                      {formatTravelUrlRowLabel(row, field.isTravelNumber)}
                    </span>
                    {subtitle ? (
                      <span className="text-[12px] text-[#808080]">{subtitle}</span>
                    ) : null}
                  </button>
                </li>
              );
            })
          )}
        </ul>
      </div>
    </div>
  );
}
