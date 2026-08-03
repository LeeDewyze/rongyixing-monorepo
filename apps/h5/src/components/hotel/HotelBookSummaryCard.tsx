import { HOTEL_DETAIL_FONT } from "@/components/hotel/hotel-detail-chrome";

interface HotelBookSummaryCardProps {
  hotelName: string;
  checkIn: string;
  checkOut: string;
  nights: number;
  roomName: string;
  breakfast?: string;
  cancelRule?: string;
  onOpenNotice: () => void;
}

function formatBreakfastLabel(breakfast?: string): string | null {
  if (!breakfast) return null;
  if (/无早|不含早/.test(breakfast)) return "无早";
  return breakfast;
}

function formatCancelLabel(cancelRule?: string): string {
  if (!cancelRule) return "不可取消";
  if (/不可取消|预订后不可|不可退/.test(cancelRule)) return "不可取消";
  return cancelRule;
}

function formatStayDate(date: string): string {
  return date.slice(0, 10);
}

export function HotelBookSummaryCard({
  hotelName,
  checkIn,
  checkOut,
  nights,
  roomName,
  breakfast,
  cancelRule,
  onOpenNotice,
}: HotelBookSummaryCardProps) {
  const breakfastLabel = formatBreakfastLabel(breakfast);
  const cancelLabel = formatCancelLabel(cancelRule);
  const roomDetail = [roomName, breakfastLabel].filter(Boolean).join(" ");

  return (
    <div className={`px-3 pb-3 pt-2 ${HOTEL_DETAIL_FONT}`}>
      <section
        className="overflow-hidden rounded-lg px-3.5 pb-3 pt-3 shadow-[0_8px_22px_rgba(39,104,250,0.16)]"
        style={{
          background: "linear-gradient(270deg, #2768FA 0%, #33A1F9 100%)",
        }}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <h2 className="truncate text-[17px] font-medium leading-tight text-white">
              {hotelName}
            </h2>
            <p className="mt-2 text-[13px] leading-none text-white/90">
              {formatStayDate(checkIn)} 至 {formatStayDate(checkOut)}
            </p>
          </div>

          <div className="shrink-0 rounded-full bg-white/18 px-2.5 py-1 ring-1 ring-white/25">
            <span className="text-[12px] font-medium leading-none text-white">{nights}晚</span>
          </div>
        </div>

        <div className="mt-3 rounded-[8px] bg-white px-3 py-3">
          <p className="text-[15px] font-medium leading-tight text-[#010101]">{roomName}</p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            {breakfastLabel ? (
              <span className="rounded-full bg-[#F3F7FF] px-2 py-1 text-[12px] leading-none text-brand-primary">
                {breakfastLabel}
              </span>
            ) : null}
            <span className="rounded-full bg-[#FFF7E8] px-2 py-1 text-[12px] leading-none text-[#FF8D1A]">
              {cancelLabel}
            </span>
          </div>
          {roomDetail && roomDetail !== roomName ? (
            <p className="mt-2 truncate text-[13px] text-[#666666]">{roomDetail}</p>
          ) : null}
        </div>

        <div className="mt-2 flex items-center justify-between">
          <span className="text-[12px] leading-none text-white/90">预订前请确认入住政策</span>
          <button
            type="button"
            onClick={onOpenNotice}
            className="rounded-full bg-white/18 px-2.5 py-1 text-right text-[12px] font-medium leading-none text-white ring-1 ring-white/25 active:opacity-80"
          >
            订房必读
          </button>
        </div>
      </section>
    </div>
  );
}
