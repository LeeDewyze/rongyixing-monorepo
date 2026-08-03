import { HOTEL_DETAIL_FONT } from "@/components/hotel/hotel-detail-chrome";

function ChevronRightIcon() {
  return (
    <svg viewBox="0 0 12 12" className="size-3 shrink-0 text-[#CCCCCC]" aria-hidden>
      <path d="M4 2l4 4-4 4" fill="none" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

function PinIcon() {
  return (
    <svg viewBox="0 0 16 16" className="size-4 shrink-0 text-[#999999]" aria-hidden>
      <path
        fill="currentColor"
        d="M8 1.25a4.75 4.75 0 0 0-4.75 4.75c0 2.65 3.1 6.85 4.22 8.33a.75.75 0 0 0 1.06 0C9.64 12.85 12.75 8.65 12.75 6A4.75 4.75 0 0 0 8 1.25zm0 6.25a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3z"
      />
    </svg>
  );
}

interface HotelDetailTrafficSectionProps {
  address?: string;
  mapUrl?: string;
}

export function HotelDetailTrafficSection({ address, mapUrl }: HotelDetailTrafficSectionProps) {
  const hasContent = Boolean(address || mapUrl);

  if (!hasContent) {
    return (
      <section className="mx-3 mt-3 overflow-hidden rounded-lg bg-white shadow-[0_2px_12px_rgba(0,0,0,0.06)]">
        <div className="px-4 py-8 text-center text-[14px] text-[#999999]">暂无交通信息</div>
      </section>
    );
  }

  const cardBody = (
    <div className="px-4 py-3.5">
      {address ? (
        <div className="flex items-center gap-2.5">
          <PinIcon />
          <p className="min-w-0 flex-1 text-[15px] font-medium leading-[1.6] text-[#333333]">
            {address}
          </p>
        </div>
      ) : (
        <p className="text-[14px] text-[#666666]">查看酒店位置</p>
      )}

      {mapUrl ? (
        <div className={`${address ? "mt-3 border-t border-[#F0F2F5] pt-3" : ""}`}>
          <span className="flex items-center justify-between text-[14px] text-brand-primary">
            <span className="font-medium">打开地图查看</span>
            <ChevronRightIcon />
          </span>
        </div>
      ) : null}
    </div>
  );

  return (
    <section
      className={`mx-3 mt-3 overflow-hidden rounded-lg bg-white shadow-[0_2px_12px_rgba(0,0,0,0.06)] ${HOTEL_DETAIL_FONT}`}
    >
      <div className="flex items-center gap-2 border-b border-[#F0F2F5] px-4 py-3.5">
        <span className="h-3.5 w-0.5 shrink-0 rounded-full bg-brand-primary" aria-hidden />
        <h2 className="text-[15px] font-semibold text-[#333333]">交通信息</h2>
      </div>

      <div className="p-3">
        {mapUrl ? (
          <a
            href={mapUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="block overflow-hidden rounded-xl ring-1 ring-[#E8ECF3] active:bg-[#FAFBFC]"
          >
            {cardBody}
          </a>
        ) : (
          <article className="overflow-hidden rounded-xl ring-1 ring-[#E8ECF3]">{cardBody}</article>
        )}
      </div>
    </section>
  );
}
