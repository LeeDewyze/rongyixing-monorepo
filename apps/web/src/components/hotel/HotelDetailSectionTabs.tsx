import { HOTEL_CHROME, HOTEL_DETAIL_FONT } from "@/components/hotel/hotel-detail-chrome";

export type HotelDetailSectionId = "rooms" | "hotel" | "traffic";

const TABS: { id: HotelDetailSectionId; label: string }[] = [
  { id: "rooms", label: "房型" },
  { id: "hotel", label: "酒店信息" },
  { id: "traffic", label: "交通信息" },
];

interface HotelDetailSectionTabsProps {
  active: HotelDetailSectionId;
  onChange: (id: HotelDetailSectionId) => void;
}

export function HotelDetailSectionTabs({ active, onChange }: HotelDetailSectionTabsProps) {
  return (
    <div
      className={`px-3 pb-2.5 pt-1 ${HOTEL_DETAIL_FONT}`}
      style={{ backgroundColor: HOTEL_CHROME.tabPanel }}
    >
      <div
        className="grid grid-cols-3 gap-1 rounded-lg p-0.5"
        style={{ backgroundColor: HOTEL_CHROME.tabTrack }}
      >
        {TABS.map((tab) => {
          const selected = tab.id === active;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onChange(tab.id)}
              className={`rounded-md py-2 text-center text-[13px] transition-colors ${
                selected
                  ? "bg-white font-semibold shadow-[0_1px_4px_rgba(39,104,250,0.12)]"
                  : "font-medium text-[#666666] active:opacity-70"
              }`}
              style={selected ? { color: HOTEL_CHROME.action } : undefined}
            >
              {tab.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
