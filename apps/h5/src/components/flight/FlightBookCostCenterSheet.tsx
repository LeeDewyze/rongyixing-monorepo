import { useEffect, useState } from "react";
import type { BookCostCenterOption } from "@ryx/shared-types";

import { useQuery } from "@tanstack/react-query";

import { getApi } from "@/lib/api";
import { parseCostCenterLabel } from "@/lib/flight-book-passenger-form";

interface FlightBookCostCenterSheetProps {
  open: boolean;
  selectedCode?: string;
  onClose: () => void;
  onSelect: (costCenter: { code: string; name: string }) => void;
}

export function FlightBookCostCenterSheet({
  open,
  selectedCode,
  onClose,
  onSelect,
}: FlightBookCostCenterSheetProps) {
  const [keyword, setKeyword] = useState("");
  const [debounced, setDebounced] = useState("");

  useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(keyword.trim()), 400);
    return () => window.clearTimeout(timer);
  }, [keyword]);

  const search = useQuery({
    queryKey: ["book", "costCenters", debounced],
    queryFn: () => getApi().book.getCostCenter(debounced),
    enabled: open,
    staleTime: 30_000,
  });

  if (!open) return null;

  const items = search.data ?? [];

  function handleSelect(item: BookCostCenterOption) {
    onSelect({
      code: item.Value,
      name: parseCostCenterLabel(item.Text),
    });
    setKeyword("");
    onClose();
  }

  return (
    <div className="fixed inset-0 z-[70] flex flex-col justify-end bg-black/40">
      <button type="button" className="flex-1" aria-label="关闭" onClick={onClose} />
      <div className="flex max-h-[75vh] flex-col rounded-t-2xl bg-white pb-[max(1rem,env(safe-area-inset-bottom))]">
        <div className="border-b border-[#eeeeee] px-4 py-3">
          <p className="text-center text-[16px] font-semibold text-[#333333]">选择成本中心</p>
        </div>
        <div className="border-b border-[#f0f0f0] px-4 py-3">
          <input
            type="search"
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
            placeholder="搜索成本中心"
            className="w-full rounded-lg bg-[#f6f8fc] px-3 py-2.5 text-[14px] text-[#333333] outline-none placeholder:text-[#999999]"
            autoFocus
          />
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-2">
          {search.isFetching ? (
            <p className="py-8 text-center text-[13px] text-[#999999]">正在加载…</p>
          ) : items.length === 0 ? (
            <p className="py-8 text-center text-[13px] text-[#999999]">暂无数据</p>
          ) : (
            <ul className="divide-y divide-[#f0f0f0]">
              {items.map((item) => {
                const selected = item.Value === selectedCode;
                return (
                  <li key={item.Value}>
                    <button
                      type="button"
                      className="flex w-full items-center justify-between py-3.5 text-left text-[15px] active:bg-[#f5f7fa]"
                      onClick={() => handleSelect(item)}
                    >
                      <span className={selected ? "font-medium text-[#5099fe]" : "text-[#666666]"}>
                        {item.Text}
                      </span>
                      {selected ? <span className="text-[#5099fe]">✓</span> : null}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
