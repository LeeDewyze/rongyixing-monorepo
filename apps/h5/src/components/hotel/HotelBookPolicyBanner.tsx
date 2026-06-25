import { HOTEL_DETAIL_FONT } from "@/components/hotel/hotel-detail-chrome";

interface HotelBookPolicyBannerProps {
  rules: string[];
}

export function HotelBookPolicyBanner({ rules }: HotelBookPolicyBannerProps) {
  const text = rules.filter(Boolean).join("；");
  if (!text) return null;

  return (
    <div
      className={`rounded-xl bg-[#FFF1F0] px-3.5 py-3 ring-1 ring-[#FFCCC7] ${HOTEL_DETAIL_FONT}`}
      role="alert"
    >
      <p className="text-[13px] leading-[1.5] text-[#CF1322]">
        <span className="font-medium">超标：</span>
        {text}
      </p>
    </div>
  );
}
