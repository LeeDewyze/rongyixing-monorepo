import { useEffect, useState } from "react";
import type { FlightAuthorizedContact, SearchLinkmanOption } from "@ryx/shared-types";

import { useSearchLinkman } from "@/hooks/useSearchLinkman";
import { parseSearchLinkmanOption } from "@/lib/flight-book-contacts";
import { formatApiError } from "@/lib/formatApiError";

interface FlightBookAddContactSheetProps {
  open: boolean;
  existingAccountIds: string[];
  onClose: () => void;
  onSelect: (contact: FlightAuthorizedContact) => void;
}

export function FlightBookAddContactSheet({
  open,
  existingAccountIds,
  onClose,
  onSelect,
}: FlightBookAddContactSheetProps) {
  const [keyword, setKeyword] = useState("");
  const search = useSearchLinkman(keyword, open);

  useEffect(() => {
    if (!open) {
      setKeyword("");
    }
  }, [open]);

  if (!open) return null;

  function handleSelect(item: SearchLinkmanOption) {
    const contact = parseSearchLinkmanOption(item);
    if (!contact) {
      window.alert("联系人数据格式不正确，请重新选择");
      return;
    }
    if (existingAccountIds.includes(contact.accountId)) {
      window.alert("该账号已添加");
      return;
    }
    onSelect(contact);
    onClose();
  }

  const items = search.data ?? [];
  const trimmedKeyword = keyword.trim();

  return (
    <div className="fixed inset-0 z-[70] flex flex-col justify-end bg-black/40">
      <button type="button" className="flex-1" aria-label="关闭" onClick={onClose} />
      <div className="flex max-h-[75vh] flex-col rounded-t-2xl bg-white pb-[max(1rem,env(safe-area-inset-bottom))]">
        <div className="flex items-center justify-between border-b border-[#eeeeee] px-4 py-3">
          <p className="text-[16px] font-semibold text-[#333333]">授权账号查看订单</p>
          <button
            type="button"
            className="text-[22px] leading-none text-[#999999]"
            aria-label="关闭"
            onClick={onClose}
          >
            ×
          </button>
        </div>

        <div className="border-b border-[#f0f0f0] px-4 py-3">
          <input
            type="search"
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
            placeholder="员工号、姓名"
            className="w-full rounded-lg bg-[#f6f8fc] px-3 py-2.5 text-[14px] text-[#333333] outline-none placeholder:text-[#999999]"
            autoFocus
          />
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-2">
          {search.isFetching ? (
            <p className="py-8 text-center text-[13px] text-[#999999]">正在搜索…</p>
          ) : search.error ? (
            <p className="py-8 text-center text-[13px] text-destructive">
              {formatApiError(search.error)}
            </p>
          ) : items.length === 0 ? (
            <p className="py-8 text-center text-[13px] text-[#999999]">
              {trimmedKeyword ? "暂无数据" : "输入员工号或姓名搜索，或查看下方推荐"}
            </p>
          ) : null}

          {!search.isFetching && !search.error && items.length > 0 ? (
            <ul className="divide-y divide-[#f0f0f0]">
              {items.map((item) => (
                <li key={item.Value}>
                  <button
                    type="button"
                    className="flex w-full py-3.5 text-left text-[15px] text-[#666666] active:bg-[#f5f7fa]"
                    onClick={() => handleSelect(item)}
                  >
                    {item.Text}
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      </div>
    </div>
  );
}
