import { useState } from "react";

import type { FlightTicketNoticeRule } from "@/lib/flight-book";

interface FlightBookTicketNoticeSheetProps {
  open: boolean;
  rules: FlightTicketNoticeRule[];
  onClose: () => void;
}

export function FlightBookTicketNoticeSheet({
  open,
  rules,
  onClose,
}: FlightBookTicketNoticeSheetProps) {
  const [activeRule, setActiveRule] = useState<FlightTicketNoticeRule | null>(null);

  if (!open || rules.length === 0) return null;

  function handleClose() {
    setActiveRule(null);
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end bg-black/40">
      <button type="button" className="flex-1" aria-label="关闭" onClick={handleClose} />
      <div className="flex max-h-[85vh] flex-col rounded-t-2xl bg-white pb-[max(1rem,env(safe-area-inset-bottom))]">
        <div className="flex items-center justify-between border-b border-[#eeeeee] px-4 py-3">
          <button
            type="button"
            className="min-w-[2rem] text-[22px] leading-none text-[#999999]"
            aria-label={activeRule ? "返回" : "关闭"}
            onClick={() => {
              if (activeRule) {
                setActiveRule(null);
                return;
              }
              handleClose();
            }}
          >
            {activeRule ? "‹" : "×"}
          </button>
          <p className="flex-1 truncate px-2 text-center text-[16px] font-semibold text-[#333333]">
            {activeRule?.key ?? "购票须知"}
          </p>
          <span className="min-w-[2rem]" />
        </div>

        {activeRule ? (
          <iframe
            title={activeRule.key}
            src={activeRule.url}
            className="min-h-[60vh] w-full flex-1 border-0"
          />
        ) : (
          <ul className="min-h-0 flex-1 overflow-y-auto">
            {rules.map((rule) => (
              <li key={rule.key} className="border-b border-[#eeeeee] last:border-b-0">
                <button
                  type="button"
                  className="flex w-full items-center justify-between px-4 py-3.5 text-left text-[14px] text-[#333333] active:bg-[#f7f7f7]"
                  onClick={() => setActiveRule(rule)}
                >
                  <span className="min-w-0 flex-1 pr-3">{rule.key}</span>
                  <span className="shrink-0 text-[#cccccc]">›</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
