import type { HotelType } from "@ryx/shared-types";

const HOTEL_TYPE_TABS: { value: HotelType; label: string }[] = [
  { value: "Normal", label: "非协议酒店" },
  { value: "Tmc", label: "协议酒店" },
];

/** Design artboard: 670×66 track, 335×66 active segment, 12px radius (2×). */
const TRACK_RADIUS = "calc(100cqw * 12 / 670)";

const TRACK_STYLE = {
  background: "rgba(39, 104, 250, 0.1)",
  boxShadow: "0px 2px 16px 0px rgba(175, 175, 175, 0.2)",
} as const;

const ACTIVE_INDICATOR_STYLE = {
  background: "linear-gradient(270deg, #2768FA 0%, #33A1F9 100%)",
  boxShadow: "0px 2px 16px 0px rgba(175, 175, 175, 0.2)",
} as const;

interface HotelTypeTabsProps {
  value: HotelType;
  onChange: (value: HotelType) => void;
}

export function HotelTypeTabs({ value, onChange }: HotelTypeTabsProps) {
  const activeIndex = HOTEL_TYPE_TABS.findIndex((tab) => tab.value === value);

  return (
    <div className="@container px-[22px] pb-3 pt-3">
      <div
        className="relative flex w-full items-stretch aspect-[670/66]"
        style={{ borderRadius: TRACK_RADIUS, ...TRACK_STYLE }}
      >
        <div
          aria-hidden
          className="absolute inset-y-0 w-1/2 transition-transform duration-200 ease-out"
          style={{
            ...ACTIVE_INDICATOR_STYLE,
            borderRadius: TRACK_RADIUS,
            transform: `translateX(${Math.max(activeIndex, 0) * 100}%)`,
          }}
        />
        {HOTEL_TYPE_TABS.map((tab) => {
          const active = value === tab.value;
          return (
            <button
              key={tab.value}
              type="button"
              className={`relative z-10 flex flex-1 items-center justify-center text-[14px] font-medium leading-none transition-colors ${
                active ? "text-white" : "text-[#333333]"
              }`}
              style={{ borderRadius: TRACK_RADIUS }}
              onClick={() => onChange(tab.value)}
            >
              {tab.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
