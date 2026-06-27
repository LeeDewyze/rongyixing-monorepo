import type { HotelListItem as HotelListItemType } from "@ryx/shared-types";

interface HotelListItemProps {
  hotel: HotelListItemType;
  onClick: () => void;
}

/** Figma — contracted hotel badge on list thumbnail. */
const CONTRACT_HOTEL_BADGE_GRADIENT = "linear-gradient(270deg, var(--brand-btn-end) 0%, var(--brand-btn-start) 100%)";

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
    <svg viewBox="0 0 16 16" className="h-[14px] w-[11px] shrink-0 text-brand-primary" aria-hidden>
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

function isContractHotel(hotel: HotelListItemType): boolean {
  return hotel.Tags?.some((tag) => tag.toLowerCase() === "tmc") ?? false;
}

function HotelPrice({ price }: { price?: number }) {
  return (
    <div className="flex shrink-0 items-baseline [font-family:'PingFang_SC',sans-serif]">
      <span className="text-[15px] font-semibold leading-none text-[#E72932]">¥</span>
      <span className="text-[23px] font-semibold leading-none text-[#E72932]">
        {formatDisplayPrice(price)}
      </span>
      <span className="ml-0.5 text-[12px] font-semibold leading-none text-[#E72932]">起</span>
    </div>
  );
}

export function HotelListItem({ hotel, onClick }: HotelListItemProps) {
  const stars = hotel.Star && hotel.Star > 0 ? Math.min(5, Math.round(hotel.Star)) : 0;
  const contracted = isContractHotel(hotel);

  return (
    <button
      type="button"
      className="flex w-full gap-3 p-3 text-left active:opacity-90"
      onClick={onClick}
    >
      <div className="relative size-24 shrink-0 overflow-hidden rounded-lg bg-[#E5E7EB]">
        {hotel.ImageUrl ? (
          <img src={hotel.ImageUrl} alt="" className="size-full object-cover" loading="lazy" />
        ) : null}
        {contracted ? (
          <span
            className="absolute left-0 top-0 flex h-5 w-[62px] items-center justify-center rounded-tl-lg rounded-tr-lg rounded-br-lg rounded-bl-none text-[10px] leading-none text-white"
            style={{ background: CONTRACT_HOTEL_BADGE_GRADIENT }}
          >
            协议酒店
          </span>
        ) : null}
      </div>

      <div className="flex min-h-24 min-w-0 flex-1 flex-col">
        <div className="h-12 shrink-0">
          <h3 className="line-clamp-2 text-base font-medium leading-6 tracking-[0.35px] text-[#333333] [font-family:'HarmonyOS_Sans_SC','HarmonyOS_Sans','PingFang_SC',sans-serif]">
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
