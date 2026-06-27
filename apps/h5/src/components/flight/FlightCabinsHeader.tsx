import { FLIGHT_CABINS_CHROME, FLIGHT_CABINS_FONT } from "@/components/flight/flight-cabins-chrome";

interface FlightCabinsHeaderProps {
  title: string;
  onBack: () => void;
  showPolicyFilter?: boolean;
  onOpenPolicyFilter?: () => void;
}

function BackIcon() {
  return (
    <svg viewBox="0 0 10 17" className="h-[17px] w-[10px] shrink-0 text-[#010101]" aria-hidden>
      <path
        d="M9 1.5 2.5 8.5 9 15.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function FlightCabinsHeader({
  title,
  onBack,
  showPolicyFilter = false,
  onOpenPolicyFilter,
}: FlightCabinsHeaderProps) {
  return (
    <div className={`px-2 pb-1 pt-1 ${FLIGHT_CABINS_FONT}`}>
      <div className="flex h-12 items-center gap-1.5">
        <button
          type="button"
          className="flex h-10 w-9 shrink-0 items-center justify-center rounded-full active:bg-white/40"
          aria-label="返回"
          onClick={onBack}
        >
          <BackIcon />
        </button>

        <h1
          className="min-w-0 flex-1 truncate text-center text-[16px] font-semibold leading-tight tracking-tight"
          style={{ color: FLIGHT_CABINS_CHROME.title }}
        >
          {title}
        </h1>

        {showPolicyFilter ? (
          <button
            type="button"
            className="shrink-0 rounded-full border border-white/80 bg-white/60 px-3 py-1.5 text-[12px] font-medium leading-none shadow-[0_1px_6px_rgba(39,104,250,0.1)] backdrop-blur-[3px] active:bg-white/70"
            style={{ color: FLIGHT_CABINS_CHROME.action }}
            onClick={onOpenPolicyFilter}
          >
            过滤差标
          </button>
        ) : (
          <div className="h-10 w-[72px] shrink-0" aria-hidden />
        )}
      </div>
    </div>
  );
}
