import type { ReactNode } from "react";

import type { HomeProductId, HomeTravelMode } from "@/config/home-assets";
import { HOME_ASSETS } from "@/config/home-assets";
import { BANNER_SLIDE_MAX_WIDTH, WebBannerCarousel } from "@/components/home/WebBannerCarousel";
import type { HomeBannerSlide } from "@/lib/home-banners";

export type { HomeProductId, HomeTravelMode };

interface WebHomeTopCardProps {
  travelMode: HomeTravelMode;
  activeProduct: HomeProductId;
  visibleProducts?: HomeProductId[];
  bannerSlides?: HomeBannerSlide[];
  bannerLoading?: boolean;
  onBannerClick?: (slide: HomeBannerSlide) => void;
  onTravelModeChange: (mode: HomeTravelMode) => void;
  onProductChange: (product: HomeProductId) => void;
  searchPanel: ReactNode;
  notice?: ReactNode;
}

const PRODUCTS: { id: HomeProductId; label: string }[] = [
  { id: "flight", label: "国内机票" },
  { id: "train", label: "火车票" },
  { id: "hotel", label: "国内酒店" },
];

const PRODUCT_GRID_COLS: Record<number, string> = {
  1: "grid-cols-1",
  2: "grid-cols-2",
  3: "grid-cols-3",
};

function ProductIcon({ product, active }: { product: HomeProductId; active: boolean }) {
  const assets = HOME_ASSETS.products[product];
  return (
    <img
      src={active ? assets.active : assets.default}
      alt=""
      className="size-12 shrink-0 object-contain"
      aria-hidden
    />
  );
}

const TRAVEL_MODE_TABS: { id: HomeTravelMode; label: string }[] = [
  { id: "business", label: "因公出行" },
  { id: "personal", label: "因私出行" },
];

/** Conventional underline tabs — easy to keep responsive across Pad/PC. */
function TravelModeTabs({
  travelMode,
  onTravelModeChange,
}: {
  travelMode: HomeTravelMode;
  onTravelModeChange: (mode: HomeTravelMode) => void;
}) {
  return (
    <div className="flex w-full border-b border-[#EEEEEE]">
      {TRAVEL_MODE_TABS.map((tab) => {
        const active = travelMode === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            aria-current={active ? "true" : undefined}
            className={`relative flex-1 py-4 text-center text-[17px] leading-none transition-colors ${
              active ? "font-semibold text-brand-primary" : "font-medium text-[#666666]"
            }`}
            onClick={() => onTravelModeChange(tab.id)}
          >
            {tab.label}
            {active ? (
              <span
                className="absolute bottom-0 left-1/2 h-[3px] w-8 -translate-x-1/2 rounded-full bg-brand-primary"
                aria-hidden
              />
            ) : null}
          </button>
        );
      })}
    </div>
  );
}

/** Banner + travel mode + product tabs + search — unified Pad/PC home top card. */
export function WebHomeTopCard({
  travelMode,
  activeProduct,
  visibleProducts,
  bannerSlides,
  bannerLoading = false,
  onBannerClick,
  onTravelModeChange,
  onProductChange,
  searchPanel,
  notice,
}: WebHomeTopCardProps) {
  const slides = bannerSlides && bannerSlides.length > 0 ? bannerSlides : [];
  const showBannerPlaceholder = slides.length === 0 && bannerLoading;
  const productEntries = PRODUCTS.filter((product) =>
    (visibleProducts ?? PRODUCTS.map((item) => item.id)).includes(product.id),
  );
  const activeProductVisible = productEntries.some((product) => product.id === activeProduct);
  const productGridClass =
    PRODUCT_GRID_COLS[productEntries.length] ?? PRODUCT_GRID_COLS[3] ?? "grid-cols-3";

  return (
    <div className="relative">
      {showBannerPlaceholder ? (
        <div aria-hidden>
          <div
            className={`aspect-[2/1] w-full min-h-[220px] max-h-[280px] rounded-2xl bg-[#E8EAEF] ${bannerLoading ? "animate-pulse" : ""}`}
            style={{ maxWidth: BANNER_SLIDE_MAX_WIDTH }}
          />
        </div>
      ) : slides.length > 0 ? (
        <WebBannerCarousel slides={slides} onBannerClick={onBannerClick} />
      ) : null}

      {notice ? <div className="relative my-2 w-full px-1 pad:my-3 pc:my-4">{notice}</div> : null}

      <div className={notice ? "relative" : "relative mt-2 pad:mt-3 pc:mt-4"}>
        <div className="overflow-hidden rounded-2xl bg-white shadow-[0_4px_24px_rgba(0,0,0,0.06)]">
          <TravelModeTabs travelMode={travelMode} onTravelModeChange={onTravelModeChange} />

          <div className="px-4 pb-2 pt-3 pc:px-6">
            {productEntries.length > 0 ? (
              <div className={`grid ${productGridClass} gap-2 rounded-2xl bg-[#F5F6F9] p-2`}>
                {productEntries.map((product) => {
                  const active = activeProduct === product.id;
                  return (
                    <button
                      key={product.id}
                      type="button"
                      aria-current={active ? "page" : undefined}
                      className={`relative flex items-center justify-center gap-2 rounded-2xl px-3 py-2 transition-all ${
                        active
                          ? "bg-[#EEF5FF] shadow-[0_3px_10px_rgba(39,104,250,0.12)] ring-1 ring-[#BFD8FF]"
                          : "bg-transparent text-[#999999] hover:bg-white/60"
                      }`}
                      onClick={() => onProductChange(product.id)}
                    >
                      <ProductIcon product={product.id} active={active} />
                      <span
                        className={`text-sm leading-none ${
                          active ? "font-semibold text-brand-primary" : "font-normal text-[#999999]"
                        }`}
                      >
                        {product.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            ) : null}
          </div>

          {activeProductVisible ? (
            <div className="relative mx-4 mb-4 mt-1 rounded-2xl border border-[#F0F0F0] bg-white px-4 py-4 pc:mx-6 pc:mb-6 pc:px-6">
              {searchPanel}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
