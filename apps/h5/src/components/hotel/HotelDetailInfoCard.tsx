import { HOTEL_DETAIL_FONT } from "@/components/hotel/hotel-detail-chrome";

function StarRating({ count }: { count: number }) {
  return (
    <div className="inline-flex items-center gap-0.5">
      {Array.from({ length: count }, (_, i) => (
        <svg key={i} viewBox="0 0 16 16" className="size-[13px] text-[#FFB800]" aria-hidden>
          <path
            fill="currentColor"
            d="M8 1.5l1.76 3.57 3.94.57-2.85 2.78.67 3.92L8 10.67 4.48 12.34l.67-3.92L2.3 5.64l3.94-.57L8 1.5z"
          />
        </svg>
      ))}
    </div>
  );
}

function buildMapUrl(name: string, lat: number, lng: number): string {
  return `https://uri.amap.com/marker?position=${lng},${lat}&name=${encodeURIComponent(name)}`;
}

function PinIcon() {
  return (
    <svg viewBox="0 0 16 16" className="mt-0.5 size-3.5 shrink-0 text-[#999999]" aria-hidden>
      <path
        fill="currentColor"
        d="M8 1.5a4.5 4.5 0 0 0-4.5 4.5c0 3.2 4.5 8.5 4.5 8.5s4.5-5.3 4.5-8.5A4.5 4.5 0 0 0 8 1.5zm0 6a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3z"
      />
    </svg>
  );
}

function PhoneIcon() {
  return (
    <svg viewBox="0 0 16 16" className="size-4 text-[#2768FA]" aria-hidden>
      <path
        fill="currentColor"
        d="M3.5 2h2.1c.3 0 .6.2.7.5l.6 2.1c.1.3 0 .6-.3.8l-1.2.9c.8 1.6 2.1 2.9 3.7 3.7l.9-1.2c.2-.2.5-.3.8-.2l2.1.6c.3.1.5.4.5.7v2.1c0 .6-.5 1-1.1 1C6.8 13.5 2.5 9.2 2.5 3.6c0-.6.4-1.1 1-1.1z"
      />
    </svg>
  );
}

function MapIcon() {
  return (
    <svg viewBox="0 0 16 16" className="size-4 text-[#2768FA]" aria-hidden>
      <path
        fill="currentColor"
        d="M8 1.5a4.5 4.5 0 0 0-4.5 4.5c0 3.2 4.5 8.5 4.5 8.5s4.5-5.3 4.5-8.5A4.5 4.5 0 0 0 8 1.5zm0 6a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3z"
      />
    </svg>
  );
}

interface HotelDetailInfoCardProps {
  name: string;
  address?: string;
  star?: number;
  phone?: string;
  lat?: number;
  lng?: number;
}

export function HotelDetailInfoCard({
  name,
  address,
  star,
  phone,
  lat,
  lng,
}: HotelDetailInfoCardProps) {
  const stars = star && star > 0 ? Math.min(5, Math.round(star)) : 0;
  const showMap = lat != null && lng != null && Number.isFinite(lat) && Number.isFinite(lng);
  const hasActions = Boolean(phone || showMap);

  return (
    <div
      className={`-mt-8 relative z-[1] mx-3 overflow-hidden rounded-xl bg-white shadow-[0_2px_12px_rgba(0,0,0,0.06)] ${HOTEL_DETAIL_FONT}`}
    >
      <div className="px-4 pb-4 pt-3.5">
        <div className="flex flex-wrap items-center gap-x-1.5 gap-y-1">
          <h1 className="text-[17px] font-semibold leading-snug text-[#333333]">{name}</h1>
          {stars > 0 ? <StarRating count={stars} /> : null}
        </div>

        {address ? (
          <div className="mt-2.5 flex items-center gap-2">
            <PinIcon />
            <p className="min-w-0 flex-1 text-[13px] leading-[1.55] text-[#666666]">{address}</p>
          </div>
        ) : null}
      </div>

      {hasActions ? (
        <div className="flex gap-2 border-t border-[#F0F2F5] bg-[#FAFBFC] px-3 py-2.5">
          {phone ? (
            <a
              href={`tel:${phone}`}
              className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-white px-3 py-2.5 text-[13px] font-medium text-[#333333] ring-1 ring-[#E8ECF3] active:bg-[#F5F6F9]"
            >
              <PhoneIcon />
              电话
            </a>
          ) : null}
          {showMap ? (
            <a
              href={buildMapUrl(name, lat, lng)}
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-white px-3 py-2.5 text-[13px] font-medium text-[#333333] ring-1 ring-[#E8ECF3] active:bg-[#F5F6F9]"
            >
              <MapIcon />
              地图
            </a>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
