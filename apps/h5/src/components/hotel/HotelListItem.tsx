import type { HotelListItem as HotelListItemType } from "@ryx/shared-types";

interface HotelListItemProps {
  hotel: HotelListItemType;
  onClick: () => void;
}

/** Design artboard: 131×28 star row (2×) → ~65.5×14 at 1×. */
function StarRating({ count }: { count: number }) {
  return (
    <div className="inline-flex h-[14px] items-center">
      {Array.from({ length: count }, (_, i) => (
        <svg
          key={i}
          viewBox="0 0 16 16"
          className="size-[13px] shrink-0 text-[#FFB800]"
          aria-hidden
        >
          <path
            fill="currentColor"
            d="M8 1.5l1.76 3.57 3.94.57-2.85 2.78.67 3.92L8 10.67 4.48 12.34l.67-3.92L2.3 5.64l3.94-.57L8 1.5z"
          />
        </svg>
      ))}
    </div>
  );
}

function LocationIcon() {
  return (
    <svg viewBox="0 0 16 16" className="h-[14px] w-[11px] shrink-0 text-[#2768FA]" aria-hidden>
      <path
        fill="currentColor"
        d="M8 1.5a4.5 4.5 0 0 0-4.5 4.5c0 3.2 4.5 8.5 4.5 8.5s4.5-5.3 4.5-8.5A4.5 4.5 0 0 0 8 1.5zm0 6a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3z"
      />
    </svg>
  );
}

function formatDisplayPrice(price?: number): string {
  if (price == null || Number.isNaN(price)) return "--";
  return String(Math.round(price));
}

const PRICE_FONT = "[font-family:'PingFang_SC',sans-serif]";

function HotelPrice({ price }: { price?: number }) {
  return (
    <div className={`flex shrink-0 items-baseline ${PRICE_FONT}`}>
      <span className="text-[15px] font-semibold leading-none text-[#E72932]">¥</span>
      <span className="px-0.5 text-[23px] font-semibold leading-none text-[#E72932]">
        {formatDisplayPrice(price)}
      </span>
      <span className="text-[12px] font-semibold leading-none text-[#E72932]">起</span>
    </div>
  );
}

export function HotelListItem({ hotel, onClick }: HotelListItemProps) {
  const stars = hotel.Star && hotel.Star > 0 ? Math.min(5, Math.round(hotel.Star)) : 0;

  return (
    <button
      type="button"
      className="flex w-full gap-3.5 py-2.5 text-left active:opacity-90"
      onClick={onClick}
    >
      <div className="size-[100px] shrink-0 overflow-hidden rounded-[10px] bg-[#E5E7EB]">
        {hotel.ImageUrl ? (
          <img src={hotel.ImageUrl} alt="" className="size-full object-cover" loading="lazy" />
        ) : null}
      </div>

      <div className="flex h-[100px] min-w-0 flex-1 flex-col">
        {/* Reserve two title lines so stars stay at a fixed vertical position. */}
        <div className="h-12 shrink-0">
          <h3 className="line-clamp-2 text-base font-medium leading-6 tracking-[0.35px] text-[#333333] [font-family:'Source_Han_Sans_SC','Noto_Sans_SC','PingFang_SC',sans-serif]">
            {hotel.HotelName}
          </h3>
        </div>

        {stars > 0 ? (
          <div className="mt-1 shrink-0">
            <StarRating count={stars} />
          </div>
        ) : null}

        <div className="min-h-0 flex-1" aria-hidden />

        <div className="flex shrink-0 items-end justify-between gap-2">
          {hotel.Address ? (
            <div className="flex min-w-0 flex-1 items-center gap-1 overflow-hidden pr-1">
              <LocationIcon />
              <span className="truncate text-[12px] leading-none text-[#999999]">
                {hotel.Address}
              </span>
            </div>
          ) : (
            <span className="min-w-0 flex-1" />
          )}
          <HotelPrice price={hotel.MinPrice} />
        </div>
      </div>
    </button>
  );
}
