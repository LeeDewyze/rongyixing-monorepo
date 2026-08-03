import { FLIGHT_CABINS_FONT } from "@/components/flight/flight-cabins-chrome";

interface FlightCabinsPolicyBannerProps {
  passengerName: string;
  onClick?: () => void;
}

function PolicyIcon() {
  return (
    <svg viewBox="0 0 16 16" className="size-4 shrink-0 text-[#2768FA]" aria-hidden>
      <path
        fill="currentColor"
        d="M8 1.25a.75.75 0 0 1 .67.41l1.24 2.48 2.74.4a.75.75 0 0 1 .42 1.28l-1.98 1.93.47 2.73a.75.75 0 0 1-1.09.79L8 9.98l-2.45 1.29a.75.75 0 0 1-1.09-.79l.47-2.73L3.95 5.82a.75.75 0 0 1 .42-1.28l2.74-.4L7.33 1.66A.75.75 0 0 1 8 1.25Z"
      />
    </svg>
  );
}

export function FlightCabinsPolicyBanner({
  passengerName,
  onClick,
}: FlightCabinsPolicyBannerProps) {
  const content = (
    <div className={`flex items-center gap-2 ${FLIGHT_CABINS_FONT}`}>
      <PolicyIcon />
      <p className="min-w-0 flex-1 text-[12px] leading-snug text-[#2768FA]">
        已按照【{passengerName}】的差旅标准过滤舱位
      </p>
      {onClick ? (
        <span className="shrink-0 text-[12px] text-[#2768FA]/70" aria-hidden>
          ›
        </span>
      ) : null}
    </div>
  );

  const className =
    "mx-3 mt-2 rounded-xl border border-[#D6E4FF] bg-[linear-gradient(90deg,#F5F8FF_0%,#FFFFFF_100%)] px-3 py-2.5 shadow-[0_1px_4px_rgba(39,104,250,0.06)]";

  if (onClick) {
    return (
      <button
        type="button"
        className={`${className} w-[calc(100%-1.5rem)] text-left active:opacity-90`}
        onClick={onClick}
      >
        {content}
      </button>
    );
  }

  return <div className={className}>{content}</div>;
}
