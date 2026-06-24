import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";

import { parseSearchApprovalOption } from "@/lib/flight-book-approval";
import { getApi } from "@/lib/api";

interface FlightBookApproverSheetProps {
  open: boolean;
  onClose: () => void;
  onSelect: (approver: { accountId: string; name: string }) => void;
}

export function FlightBookApproverSheet({ open, onClose, onSelect }: FlightBookApproverSheetProps) {
  const [keyword, setKeyword] = useState("");
  const [debounced, setDebounced] = useState("");

  useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(keyword.trim()), 400);
    return () => window.clearTimeout(timer);
  }, [keyword]);

  const search = useQuery({
    queryKey: ["book", "searchApprovals", debounced],
    queryFn: () =>
      getApi().book.searchApprovals({
        name: debounced,
        PageIndex: 1,
        PageSize: 20,
      }),
    enabled: open,
    staleTime: 30_000,
  });

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end bg-black/40">
      <button type="button" className="flex-1" aria-label="关闭" onClick={onClose} />
      <div className="flex max-h-[70vh] flex-col rounded-t-2xl bg-white pb-[max(1rem,env(safe-area-inset-bottom))]">
        <div className="border-b border-[#eeeeee] px-4 py-3">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-[16px] font-semibold text-[#333333]">选择审批人</p>
            <button type="button" className="text-[22px] text-[#999999]" onClick={onClose}>
              ×
            </button>
          </div>
          <input
            type="search"
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
            placeholder="搜索审批人"
            className="w-full rounded-lg border border-[#eeeeee] px-3 py-2 text-[14px] outline-none"
          />
        </div>
        <ul className="min-h-0 flex-1 overflow-y-auto">
          {(search.data ?? []).map((item) => {
            const parsed = parseSearchApprovalOption(item);
            if (!parsed) return null;
            return (
              <li key={parsed.accountId} className="border-b border-[#eeeeee] last:border-b-0">
                <button
                  type="button"
                  className="w-full px-4 py-3.5 text-left text-[14px] text-[#333333]"
                  onClick={() => {
                    onSelect(parsed);
                    onClose();
                  }}
                >
                  {parsed.name}
                </button>
              </li>
            );
          })}
          {search.isFetching ? (
            <li className="px-4 py-6 text-center text-[13px] text-[#999999]">搜索中…</li>
          ) : null}
        </ul>
      </div>
    </div>
  );
}
