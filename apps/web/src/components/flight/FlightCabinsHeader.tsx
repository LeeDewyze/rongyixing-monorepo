import { FLIGHT_CABINS_FONT } from "@/components/flight/flight-cabins-chrome";

interface FlightCabinsHeaderProps {
  title: string;
  onBack: () => void;
  showPolicyFilter?: boolean;
  onOpenPolicyFilter?: () => void;
}

export function FlightCabinsHeader({
  title,
  onBack,
  showPolicyFilter = false,
  onOpenPolicyFilter,
}: FlightCabinsHeaderProps) {
  return (
    <div className={`pt-[env(safe-area-inset-top)] ${FLIGHT_CABINS_FONT}`}>
      <div className="relative flex h-11 items-center px-1">
        <button
          type="button"
          className="flex h-11 w-11 shrink-0 items-center justify-center text-2xl text-brand-title active:opacity-70"
          aria-label="返回"
          onClick={onBack}
        >
          ‹
        </button>

        <h1
          className="pointer-events-none absolute inset-x-16 truncate text-center text-base font-semibold text-brand-title"
        >
          {title}
        </h1>

        {showPolicyFilter ? (
          <button
            type="button"
            className="ml-auto h-8 shrink-0 rounded-full border border-white/80 bg-white/60 px-3 text-[12px] font-medium leading-none text-brand-primary shadow-[0_1px_6px_rgba(39,104,250,0.10)] backdrop-blur-[3px] active:bg-white/70"
            onClick={onOpenPolicyFilter}
          >
            过滤差标
          </button>
        ) : (
          <div className="ml-auto h-11 w-11 shrink-0" aria-hidden />
        )}
      </div>
    </div>
  );
}
