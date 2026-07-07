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
    <section
      className={`overflow-hidden rounded-xl bg-white shadow-[0_2px_8px_rgba(0,0,0,0.04)] ${HOTEL_DETAIL_FONT}`}
    >
      <div className="px-2 pt-3.5 pb-3">
        <h2 className="text-[16px] font-medium leading-none text-brand-title">{hotelName}</h2>

        <div className="mt-3 flex h-[60px] w-full flex-col justify-center gap-4 rounded-lg bg-[#F5F6F9] px-3">
          <div className="flex items-center justify-start">
            <span className="text-[14px] leading-none text-[#333333]">
              {formatStayDate(checkIn)}
            </span>
            <span className="ml-4 shrink-0 text-[12px] font-medium leading-none text-[#FF4D4F]">
              共{nights}晚
            </span>
            <span className="ml-4 text-[14px] leading-none text-[#333333]">
              {formatStayDate(checkOut)}
            </span>
          </div>
          {roomDetail ? (
            <p className="text-[14px] font-normal leading-none text-[#666666]">{roomDetail}</p>
          ) : null}
        </div>

        <div className="mt-3 flex items-center justify-between">
          <span className="text-[14px] font-normal leading-none text-[#666666]">
            <span className="text-[#FF4D4F]">*</span>
            {cancelLabel}
          </span>
          <button
            type="button"
            onClick={onOpenNotice}
            className="text-right text-[12px] font-normal leading-none text-brand-primary"
          >
            订房必读
          </button>
        </div>
      </div>
    </section>
  );
}
