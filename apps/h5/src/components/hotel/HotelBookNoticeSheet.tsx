import type { ReactNode } from "react";

import { HOTEL_DETAIL_FONT } from "@/components/hotel/hotel-detail-chrome";

interface HotelBookNoticeSheetProps {
  open: boolean;
  cancelRule?: string;
  checkInOutTime?: string;
  bookingNotice?: string;
  onClose: () => void;
}

interface ParsedCheckInOut {
  checkIn?: string;
  checkOut?: string;
  fallback?: string;
}

function parseCheckInOutTime(raw?: string): ParsedCheckInOut | null {
  if (!raw?.trim()) return null;

  const checkInMatch = raw.match(/入住时间[：:]\s*([^离]+)/);
  const checkOutMatch = raw.match(/离店时间[：:]\s*(.+)/);

  if (checkInMatch || checkOutMatch) {
    return {
      checkIn: checkInMatch?.[1]?.trim(),
      checkOut: checkOutMatch?.[1]?.trim(),
    };
  }

  return { fallback: raw.trim() };
}

function splitNoticeParagraphs(content?: string): string[] {
  if (!content?.trim()) return [];
  return content
    .split(/[;；]\s*/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function SheetCloseButton({ onClose }: { onClose: () => void }) {
  return (
    <button
      type="button"
      className="flex size-8 items-center justify-center rounded-full bg-[#F5F6F9] text-[#999999] active:bg-[#EBEDF0]"
      aria-label="关闭"
      onClick={onClose}
    >
      <svg
        viewBox="0 0 20 20"
        className="size-4"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
      >
        <path d="M6 6l8 8M14 6l-8 8" strokeLinecap="round" />
      </svg>
    </button>
  );
}

function NoticeSectionCard({
  title,
  accentClass,
  children,
}: {
  title: string;
  accentClass: string;
  children: ReactNode;
}) {
  return (
    <section className="overflow-hidden rounded-xl bg-[#F8F9FC] ring-1 ring-[#EEF1F6]">
      <div className="flex items-center gap-2 border-b border-[#EEF1F6] bg-white/70 px-3.5 py-2.5">
        <span className={`h-3.5 w-[3px] shrink-0 rounded-full ${accentClass}`} />
        <h3 className="text-[14px] font-semibold text-[#333333]">{title}</h3>
      </div>
      <div className="px-3.5 py-3">{children}</div>
    </section>
  );
}

function CheckInOutContent({ parsed }: { parsed: ParsedCheckInOut }) {
  if (parsed.fallback) {
    return <p className="text-[13px] leading-[1.65] text-[#666666]">{parsed.fallback}</p>;
  }

  return (
    <div className="space-y-2.5">
      {parsed.checkIn ? (
        <div className="flex items-start gap-3">
          <span className="mt-0.5 shrink-0 rounded-md bg-[#EEF4FF] px-2 py-0.5 text-[11px] font-medium text-brand-primary">
            入住
          </span>
          <p className="text-[13px] leading-[1.55] text-[#666666]">{parsed.checkIn}</p>
        </div>
      ) : null}
      {parsed.checkOut ? (
        <div className="flex items-start gap-3">
          <span className="mt-0.5 shrink-0 rounded-md bg-[#FFF4E8] px-2 py-0.5 text-[11px] font-medium text-[#EA580C]">
            离店
          </span>
          <p className="text-[13px] leading-[1.55] text-[#666666]">{parsed.checkOut}</p>
        </div>
      ) : null}
    </div>
  );
}

export function HotelBookNoticeSheet({
  open,
  cancelRule,
  checkInOutTime,
  bookingNotice,
  onClose,
}: HotelBookNoticeSheetProps) {
  if (!open) return null;

  const parsedCheckInOut = parseCheckInOutTime(checkInOutTime);
  const noticeParagraphs = splitNoticeParagraphs(bookingNotice);
  const hasContent = Boolean(cancelRule?.trim() || parsedCheckInOut || noticeParagraphs.length);

  return (
    <div
      className={`fixed inset-0 z-50 flex flex-col justify-end bg-black/45 ${HOTEL_DETAIL_FONT}`}
    >
      <button type="button" className="flex-1" aria-label="关闭" onClick={onClose} />
      <div className="flex max-h-[80vh] flex-col rounded-t-[20px] bg-white shadow-[0_-10px_40px_rgba(0,0,0,0.12)] pb-[max(1rem,env(safe-area-inset-bottom))]">
        <div className="flex justify-center pt-2.5" aria-hidden>
          <span className="h-1 w-9 rounded-full bg-[#E0E0E0]" />
        </div>

        <div className="relative flex items-center justify-center px-4 pb-2 pt-1">
          <p className="text-[17px] font-semibold text-[#333333]">订房必读</p>
          <div className="absolute right-4 top-1">
            <SheetCloseButton onClose={onClose} />
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-4 pt-1">
          {hasContent ? (
            <div className="space-y-3">
              {cancelRule?.trim() ? (
                <NoticeSectionCard title="取消政策" accentClass="bg-[#FF4D4F]">
                  <p className="text-[13px] leading-[1.65] text-[#666666]">{cancelRule.trim()}</p>
                </NoticeSectionCard>
              ) : null}

              {parsedCheckInOut ? (
                <NoticeSectionCard title="入离时间" accentClass="bg-brand-primary">
                  <CheckInOutContent parsed={parsedCheckInOut} />
                </NoticeSectionCard>
              ) : null}

              {noticeParagraphs.length > 0 ? (
                <NoticeSectionCard title="预订须知" accentClass="bg-[#52C41A]">
                  <div className="space-y-2.5">
                    {noticeParagraphs.map((paragraph, index) => (
                      <p
                        key={`${index}-${paragraph.slice(0, 12)}`}
                        className="text-[13px] leading-[1.65] text-[#666666]"
                      >
                        {paragraph}
                      </p>
                    ))}
                  </div>
                </NoticeSectionCard>
              ) : null}
            </div>
          ) : (
            <p className="py-8 text-center text-[13px] text-[#999999]">暂无订房须知</p>
          )}
        </div>
      </div>
    </div>
  );
}
