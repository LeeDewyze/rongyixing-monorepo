import { HOME_ASSETS } from "@/config/home-assets";

/** Figma — recent trip inner card gradient (opacity via alpha). */
const RECENT_TRIP_CARD_GRADIENT =
  "linear-gradient(277.92deg, rgba(51, 161, 249, 0) 0%, rgba(39, 104, 250, 0.2) 87.2%)";

type RecentTripType = "hotel" | "flight" | "train";

const TRIP_PRODUCT_ICONS: Record<RecentTripType, string> = {
  hotel: HOME_ASSETS.products.hotel.active,
  flight: HOME_ASSETS.products.flight.active,
  train: HOME_ASSETS.products.train.active,
};

/** Mock recent trip — replace with API data when available. */
const RECENT_TRIP = {
  type: "hotel" as RecentTripType,
  title: "北京中关村生命科学亚朵酒店",
  dateRange: "2022-04-08 · 1晚 · 2022-04-09",
  roomInfo: "大床房 · 有早餐",
};

function TripProductIcon({ type }: { type: RecentTripType }) {
  return (
    <span className="inline-flex size-8 shrink-0 overflow-hidden rounded-[8px]">
      <img
        src={TRIP_PRODUCT_ICONS[type]}
        alt=""
        className="size-full scale-[1.12] object-cover"
        aria-hidden
      />
    </span>
  );
}

export function HomeRecentTripPanel() {
  return (
    <section className="mx-3 mt-4 mb-4">
      <div className="overflow-hidden rounded-lg bg-white p-3">
        <h2 className="mb-2 text-[16px] font-medium leading-6 text-brand-title">近期出行</h2>
        <div
          className="flex items-center gap-3 overflow-hidden rounded-lg p-4"
          style={{ background: RECENT_TRIP_CARD_GRADIENT }}
        >
          <TripProductIcon type={RECENT_TRIP.type} />
          <div className="min-w-0 flex-1">
            <p className="truncate text-[14px] font-medium leading-none tracking-normal text-brand-title [font-family:'HarmonyOS_Sans_SC','HarmonyOS_Sans','PingFang_SC',sans-serif]">
              {RECENT_TRIP.title}
            </p>
            <p className="mt-1.5 text-[14px] font-normal leading-none tracking-normal text-[#666666] [font-family:'HarmonyOS_Sans_SC','HarmonyOS_Sans','PingFang_SC',sans-serif]">
              {RECENT_TRIP.dateRange}
            </p>
            <p className="mt-1 text-[14px] text-[#666666]">{RECENT_TRIP.roomInfo}</p>
          </div>
        </div>
      </div>
    </section>
  );
}
