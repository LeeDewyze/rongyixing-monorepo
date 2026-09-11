import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import type { FlightOutNumberField, TravelUrlRow } from "@ryx/shared-types";

import {
  fetchTravelUrlOptions,
  filterTravelUrlRows,
  formatTravelOutNumberLabel,
  formatTravelUrlRowReason,
  formatTravelUrlRowTripItems,
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

function TravelUrlRowMeta({ row }: { row: TravelUrlRow }) {
  const trips = formatTravelUrlRowTripItems(row);
  const reason = formatTravelUrlRowReason(row.Subject);
  const partner = row.Partner?.trim();
  const sharedDate =
    trips.length > 1 && trips.every((trip) => trip.date && trip.date === trips[0]?.date)
      ? trips[0]!.date
      : "";

  return (
    <>
      {sharedDate
        ? trips.map((trip, index) =>
            trip.route ? (
              <span key={`route-${index}`} className="text-[13px] leading-5">
                {trip.route}
              </span>
            ) : null,
          )
        : trips.map((trip, index) => (
            <span
              key={`trip-${index}`}
              className="flex w-full items-baseline justify-between gap-3 text-[13px] leading-5"
            >
              <span className="min-w-0 truncate">{trip.route}</span>
              {trip.date ? (
                <span className="shrink-0 text-[12px] font-normal text-[#808080]">{trip.date}</span>
              ) : null}
            </span>
          ))}
      {sharedDate ? <span className="text-[12px] text-[#808080]">{sharedDate}</span> : null}
      {reason ? <span className="text-[12px] text-[#808080]">{reason}</span> : null}
      {partner ? <span className="text-[12px] text-[#808080]">出行人：{partner}</span> : null}
    </>
  );
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
    queryKey: [
      "travel",
      "getTravelUrl",
      field?.key,
      field?.staffNumber,
      field?.staffOutNumber,
      field?.accountId,
      field?.travelType,
    ],
    queryFn: () => fetchTravelUrlOptions(field!),
    enabled: open && field != null,
    staleTime: 30_000,
  });

  const allRows = query.data ?? [];
  const visibleRows = useMemo(() => filterTravelUrlRows(allRows, keyword), [allRows, keyword]);
  const trimmedKeyword = keyword.trim();

  if (!open || !field) return null;

  const emptyMessage =
    allRows.length === 0 ? "暂无数据" : trimmedKeyword ? "无匹配结果" : "暂无数据";

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end bg-black/40">
      <button type="button" className="flex-1" aria-label="关闭" onClick={onClose} />
      <div className="flex min-h-[min(52vh,24rem)] max-h-[70vh] flex-col rounded-t-2xl bg-white pb-[max(1rem,env(safe-area-inset-bottom))]">
        <div className="border-b border-[#eeeeee] px-4 py-3">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-[16px] font-semibold text-[#333333]">
              选择{formatTravelOutNumberLabel(field)}
            </p>
            <button type="button" className="text-[22px] text-[#999999]" onClick={onClose}>
              ×
            </button>
          </div>
          <input
            type="search"
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
            placeholder="请输入关键字"
            autoFocus
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
            <li className="px-4 py-6 text-center text-[14px] text-[#808080]">{emptyMessage}</li>
          ) : (
            visibleRows.map((row, index) => {
              const value = resolveOutNumberValueFromTravelUrlRow(row);
              const rowKey = `${row.TravelFormId ?? row.TravelNumber ?? index}`;
              const isSelected = selected === value;
              return (
                <li key={rowKey} className="border-b border-[#eeeeee] last:border-b-0">
                  <button
                    type="button"
                    className={`flex w-full flex-col gap-0.5 border-l-[3px] py-3 pr-4 text-left ${
                      isSelected
                        ? "border-l-[#5099fe] bg-[#e8f2ff] pl-[13px] text-[#5099fe]"
                        : "border-l-transparent pl-[13px] text-[#333333]"
                    }`}
                    onClick={() => onSelect(value, row)}
                  >
                    <span className="text-[14px] font-medium">
                      {formatTravelUrlRowLabel(row, field.isTravelNumber)}
                    </span>
                    <TravelUrlRowMeta row={row} />
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
