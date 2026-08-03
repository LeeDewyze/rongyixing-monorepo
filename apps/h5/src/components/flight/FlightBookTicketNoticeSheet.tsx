import { useEffect, useRef, useState } from "react";

import { BookOptionChevron } from "@/components/book/BookOptionChevron";
import type { FlightTicketNoticeRule } from "@/lib/flight-book";
import { fetchFlightNoticeSrcdoc } from "@/lib/flight-notice-embed";

interface FlightBookTicketNoticeSheetProps {
  open: boolean;
  rules: FlightTicketNoticeRule[];
  onClose: () => void;
}

type NoticeView = "list" | "tabs";

function NoticeTabBar({
  rules,
  activeIndex,
  onChange,
}: {
  rules: FlightTicketNoticeRule[];
  activeIndex: number;
  onChange: (index: number) => void;
}) {
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);

  useEffect(() => {
    tabRefs.current[activeIndex]?.scrollIntoView({
      behavior: "smooth",
      block: "nearest",
      inline: "center",
    });
  }, [activeIndex]);

  return (
    <div className="shrink-0 border-b border-[#EEEEEE]" role="tablist" aria-label="购票须知">
      <div className="flex overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {rules.map((rule, index) => {
          const active = index === activeIndex;
          return (
            <button
              key={rule.key}
              ref={(node) => {
                tabRefs.current[index] = node;
              }}
              type="button"
              role="tab"
              aria-selected={active}
              className={`relative shrink-0 px-4 py-3 text-[14px] leading-none transition-colors ${
                active ? "font-medium text-[#2768FA]" : "font-normal text-[#666666]"
              }`}
              onClick={() => onChange(index)}
            >
              <span className="block max-w-[12rem] truncate">{rule.key}</span>
              {active ? (
                <span
                  className="absolute inset-x-3 bottom-0 h-[2px] rounded-full bg-[#2768FA]"
                  aria-hidden
                />
              ) : null}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function NoticeListView({
  rules,
  onSelect,
}: {
  rules: FlightTicketNoticeRule[];
  onSelect: (index: number) => void;
}) {
  return (
    <ul className="min-h-0 flex-1 overflow-y-auto">
      {rules.map((rule, index) => (
        <li key={rule.key} className="border-b border-[#EEEEEE] last:border-b-0">
          <button
            type="button"
            className="flex w-full items-center justify-between px-4 py-3.5 text-left text-[14px] text-[#333333] active:bg-[#F7F7F7]"
            onClick={() => onSelect(index)}
          >
            <span className="min-w-0 flex-1 pr-3 leading-snug">{rule.key}</span>
            <BookOptionChevron inCircle={false} />
          </button>
        </li>
      ))}
    </ul>
  );
}

function NoticeDetailFrame({ title, url }: { title: string; url: string }) {
  const [srcdoc, setSrcdoc] = useState<string | null>(null);
  const [useDirectSrc, setUseDirectSrc] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setSrcdoc(null);
    setUseDirectSrc(false);

    void fetchFlightNoticeSrcdoc(url)
      .then((doc) => {
        if (cancelled) return;
        if (doc) {
          setSrcdoc(doc);
          return;
        }
        setUseDirectSrc(true);
      })
      .catch(() => {
        if (!cancelled) {
          setUseDirectSrc(true);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [url]);

  if (!srcdoc && !useDirectSrc) {
    return <p className="p-4 text-sm text-[#999999]">正在加载…</p>;
  }

  return (
    <iframe
      key={url}
      title={title}
      src={useDirectSrc ? url : undefined}
      srcDoc={srcdoc ?? undefined}
      className="h-full w-full border-0"
    />
  );
}

export function FlightBookTicketNoticeSheet({
  open,
  rules,
  onClose,
}: FlightBookTicketNoticeSheetProps) {
  const [view, setView] = useState<NoticeView>("list");
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    if (open) {
      setView("list");
      setActiveIndex(0);
    }
  }, [open]);

  useEffect(() => {
    if (activeIndex >= rules.length) {
      setActiveIndex(0);
    }
  }, [activeIndex, rules.length]);

  if (!open || rules.length === 0) return null;

  const activeRule = rules[activeIndex] ?? rules[0];

  function handleClose() {
    setView("list");
    onClose();
  }

  function handleHeaderAction() {
    if (view === "tabs") {
      setView("list");
      return;
    }
    handleClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end bg-black/40">
      <button type="button" className="flex-1" aria-label="关闭" onClick={handleClose} />
      <div
        className={`flex flex-col overflow-hidden rounded-t-2xl bg-white pb-[max(1rem,env(safe-area-inset-bottom))] ${
          view === "tabs" ? "h-[80vh]" : "max-h-[85vh]"
        }`}
      >
        <div className="flex shrink-0 items-center justify-between border-b border-[#EEEEEE] px-4 py-3">
          <button
            type="button"
            className="min-w-[2rem] text-[22px] leading-none text-[#999999]"
            aria-label={view === "tabs" ? "返回" : "关闭"}
            onClick={handleHeaderAction}
          >
            {view === "tabs" ? "‹" : "×"}
          </button>
          <p className="flex-1 truncate px-2 text-center text-[16px] font-semibold text-[#333333]">
            购票须知
          </p>
          <span className="min-w-[2rem]" />
        </div>

        {view === "list" ? (
          <NoticeListView
            rules={rules}
            onSelect={(index) => {
              setActiveIndex(index);
              setView("tabs");
            }}
          />
        ) : (
          <>
            <NoticeTabBar rules={rules} activeIndex={activeIndex} onChange={setActiveIndex} />
            <div className="min-h-0 flex-1 overflow-x-hidden overflow-y-hidden">
              <NoticeDetailFrame title={activeRule.key} url={activeRule.url} />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
