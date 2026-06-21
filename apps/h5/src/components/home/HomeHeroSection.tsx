import type { HomeProductId, HomeTravelMode } from "@/config/home-assets";
import { HOME_ASSETS } from "@/config/home-assets";

export type { HomeProductId, HomeTravelMode };

interface HomeHeroSectionProps {
  travelMode: HomeTravelMode;
  activeProduct: HomeProductId;
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
        stroke={active ? "#2768FA" : "transparent"}
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
  onTravelModeChange,
  onProductChange,
}: HomeHeroSectionProps) {
  const isBusiness = travelMode === "business";

  return (
    <div className="relative shrink-0">
      <div className="relative h-[208px] w-full overflow-hidden">
        <img src={HOME_ASSETS.heroBanner} alt="" className="size-full object-cover object-center" />
      </div>

      <div className="relative -mt-7">
        <div className="overflow-hidden rounded-t-xl bg-white shadow-[0_-2px_12px_rgba(0,0,0,0.06)]">
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
                  isBusiness ? "font-semibold text-[#010101]" : "font-medium text-[#666666]"
                }`}
                onClick={() => onTravelModeChange("business")}
              >
                因公出行
                <TravelTabIndicator active={isBusiness} />
              </button>
              <button
                type="button"
                className={`flex h-full flex-col items-center justify-center gap-1.5 text-[17px] leading-none ${
                  !isBusiness ? "font-semibold text-[#010101]" : "font-medium text-[#666666]"
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
        <div className="my-5 bg-[#F5F6F9]">
          <div className="grid grid-cols-3">
            {PRODUCTS.map((product) => {
              const active = activeProduct === product.id;
              return (
                <button
                  key={product.id}
                  type="button"
                  className="flex flex-col items-center gap-1.5 border-none bg-transparent p-0"
                  onClick={() => onProductChange(product.id)}
                >
                  <ProductIcon product={product.id} active={active} />
                  <span
                    className={`text-[14px] leading-none ${
                      active ? "font-medium text-[#2768FA]" : "font-normal text-[#666666]"
                    }`}
                  >
                    {product.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
