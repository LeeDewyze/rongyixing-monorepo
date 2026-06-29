import type { HomeProductId, HomeTravelMode } from "@/config/home-assets";
import { HOME_ASSETS } from "@/config/home-assets";
import { HomeBannerCarousel } from "@/components/home/HomeBannerCarousel";
import type { HomeBannerSlide } from "@/lib/home-banners";

export type { HomeProductId, HomeTravelMode };

interface HomeHeroSectionProps {
  travelMode: HomeTravelMode;
  activeProduct: HomeProductId;
  bannerSlides?: HomeBannerSlide[];
  bannerLoading?: boolean;
  onBannerClick?: (slide: HomeBannerSlide) => void;
  notice?: React.ReactNode;
  onTravelModeChange: (mode: HomeTravelMode) => void;
  onProductChange: (product: HomeProductId) => void;
}

const PRODUCTS: { id: HomeProductId; label: string }[] = [
  { id: "flight", label: "国内机票" },
  { id: "train", label: "火车票" },
  { id: "hotel", label: "国内酒店" },
];

/** Arc underline for travel-mode tabs (Figma smile indicator). */
function TravelTabIndicator({ active }: { active: boolean }) {
  return (
    <svg width="32" height="7" viewBox="0 0 32 7" className="shrink-0" aria-hidden>
      <path
        d="M4 2 Q16 7 28 2"
        stroke={active ? "var(--brand-primary)" : "transparent"}
        strokeWidth="3"
        fill="none"
        strokeLinecap="round"
      />
    </svg>
  );
}

/** Figma 10:213 — product icons are 44×44. */
const PRODUCT_ICON_SIZE = "size-11";

function ProductIcon({ product, active }: { product: HomeProductId; active: boolean }) {
  const assets = HOME_ASSETS.products[product];

  return (
    <img
      src={active ? assets.active : assets.default}
      alt=""
      className={`${PRODUCT_ICON_SIZE} shrink-0 object-contain`}
      aria-hidden
    />
  );
}

export function HomeHeroSection({
  travelMode,
  activeProduct,
  bannerSlides,
  bannerLoading = false,
  onBannerClick,
  notice,
  onTravelModeChange,
  onProductChange,
}: HomeHeroSectionProps) {
  const isBusiness = travelMode === "business";
  const slides = bannerSlides && bannerSlides.length > 0 ? bannerSlides : [];
  const showBannerPlaceholder = bannerLoading || slides.length === 0;

  return (
    <div className="relative shrink-0">
      {showBannerPlaceholder ? (
        <div
          className={`h-[208px] w-full bg-[#E8EAEF] ${bannerLoading ? "animate-pulse" : ""}`}
          aria-hidden
        />
      ) : (
        <HomeBannerCarousel slides={slides} onBannerClick={onBannerClick} />
      )}

      <div className="relative -mt-7">
        <div className="overflow-hidden rounded-t-xl bg-white shadow-[0_-2px_12px_rgba(0,0,0,0.06)]">
          {notice ? <div className="px-3 -mt-1 pt-2 pb-2">{notice}</div> : null}
          {/* Figma 10:218 — travel-mode tab strip only; product entries sit on page gray below */}
          <div className="relative h-14 w-full overflow-hidden">
            <img
              src={HOME_ASSETS.travelMode.track}
              alt=""
              className={`absolute inset-0 size-full object-fill ${isBusiness ? "" : "scale-x-[-1]"}`}
              aria-hidden
            />
            <div className="absolute inset-0 grid grid-cols-2">
              <button
                type="button"
                className={`flex h-full flex-col items-center justify-center gap-1.5 text-[17px] leading-none ${
                  isBusiness ? "font-semibold text-brand-title" : "font-medium text-[#666666]"
                }`}
                onClick={() => onTravelModeChange("business")}
              >
                因公出行
                <TravelTabIndicator active={isBusiness} />
              </button>
              <button
                type="button"
                className={`flex h-full flex-col items-center justify-center gap-1.5 text-[17px] leading-none ${
                  !isBusiness ? "font-semibold text-brand-title" : "font-medium text-[#666666]"
                }`}
                onClick={() => onTravelModeChange("personal")}
              >
                因私出行
                <TravelTabIndicator active={!isBusiness} />
              </button>
            </div>
          </div>
        </div>

        {/* Figma 10:213 — product entries on #F5F6F9, not white */}
        <div className="mt-4 mb-3 bg-[#F5F6F9] px-3">
          <div className="grid grid-cols-3 gap-1.5">
            {PRODUCTS.map((product) => {
              const active = activeProduct === product.id;
              return (
                <button
                  key={product.id}
                  type="button"
                  aria-current={active ? "page" : undefined}
                  className={`relative flex flex-col items-center gap-1.5 rounded-[16px] py-2.5 transition-[background-color,box-shadow] duration-200 ${
                    active
                      ? "bg-[#EEF5FF] shadow-[0_3px_10px_rgba(39,104,250,0.12)] ring-1 ring-[#BFD8FF]"
                      : "bg-transparent text-[#999999] active:bg-white/60"
                  }`}
                  onClick={() => onProductChange(product.id)}
                >
                  <span className="flex size-[50px] items-center justify-center">
                    <ProductIcon product={product.id} active={active} />
                  </span>
                  <span
                    className={`text-[14px] leading-none ${
                      active ? "font-semibold text-brand-primary" : "font-normal text-[#999999]"
                    }`}
                  >
                    {product.label}
                  </span>
                  <span
                    className={`h-0.5 w-6 shrink-0 rounded-full ${
                      active ? "bg-brand-primary" : "bg-transparent"
                    }`}
                    aria-hidden
                  />
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
