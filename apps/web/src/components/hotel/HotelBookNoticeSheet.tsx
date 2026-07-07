import { HOTEL_DETAIL_FONT } from "@/components/hotel/hotel-detail-chrome";

interface HotelBookNoticeSheetProps {
  open: boolean;
  checkInOutTime?: string;
  bookingNotice?: string;
  onClose: () => void;
}

interface ParsedCheckInOut {
  line?: string;
  fallback?: string;
}

/** Legacy book-notice sheet — hotel-level copy from Home/Detail only (varies per hotel). */
export function splitHotelBookingNoticeParagraphs(content?: string): string[] {
  if (!content?.trim()) return [];
  return content
    .split(/[;；]\s*/)
    .map((item) => item.trim())
    .filter(Boolean);
}

export function formatHotelCheckInOutNoticeLine(raw?: string): ParsedCheckInOut | null {
  if (!raw?.trim()) return null;

  const checkInMatch = raw.match(/入住时间[：:]\s*([^离]+)/);
  const checkOutMatch = raw.match(/离店时间[：:]\s*(.+)/);

  if (checkInMatch || checkOutMatch) {
    const parts: string[] = [];
    if (checkInMatch?.[1]?.trim()) {
      parts.push(`入住时间：${checkInMatch[1].trim()}`);
    }
    if (checkOutMatch?.[1]?.trim()) {
      parts.push(`离店时间：${checkOutMatch[1].trim()}`);
    }
    return { line: parts.join(" ") };
  }

  return { fallback: raw.trim() };
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

export function HotelBookNoticeSheet({
  open,
  checkInOutTime,
  bookingNotice,
  onClose,
}: HotelBookNoticeSheetProps) {
  if (!open) return null;

  const noticeParagraphs = splitHotelBookingNoticeParagraphs(bookingNotice);
  const parsedCheckInOut = formatHotelCheckInOutNoticeLine(checkInOutTime);
  const hasContent = noticeParagraphs.length > 0 || parsedCheckInOut != null;

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
            <div className="space-y-5">
              {noticeParagraphs.length > 0 ? (
                <div className="space-y-3">
                  {noticeParagraphs.map((paragraph, index) => (
                    <p
                      key={`${index}-${paragraph.slice(0, 12)}`}
                      className="text-[13px] leading-[1.65] text-[#666666]"
                    >
                      {paragraph}
                    </p>
                  ))}
                </div>
              ) : null}

              {parsedCheckInOut ? (
                <section>
                  <h3 className="text-[15px] font-semibold text-[#333333]">入离时间</h3>
                  <p className="mt-2 text-[13px] leading-[1.65] text-[#666666]">
                    {parsedCheckInOut.line ?? parsedCheckInOut.fallback}
                  </p>
                </section>
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
