import { Link } from "react-router-dom";

interface FlightListHeaderProps {
  fromName: string;
  toName: string;
  passengerHref: string;
  passengerCount: number;
  onFromClick: () => void;
  onToClick: () => void;
  onBack: () => void;
}

function PassengerAddIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-6" aria-hidden>
      <circle cx="10" cy="8" r="3.5" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M4 19c0-3 2.5-5 6-5s6 2 6 5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path d="M17 8v5M19.5 10.5H14.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

export function FlightListHeader({
  fromName,
  toName,
  passengerHref,
  passengerCount,
  onFromClick,
  onToClick,
  onBack,
}: FlightListHeaderProps) {
  return (
    <div className="bg-gradient-to-b from-[#5099fe] to-[#6aabff] pt-[env(safe-area-inset-top)]">
      <div className="flex items-center px-1 pb-2 pt-1">
        <button
          type="button"
          className="flex h-11 w-10 shrink-0 items-center justify-center text-[26px] font-light leading-none text-white active:opacity-70"
          aria-label="返回"
          onClick={onBack}
        >
          ‹
        </button>

        <div className="flex min-w-0 flex-1 items-center justify-center gap-1.5 text-[17px] font-medium text-white">
          <button type="button" className="truncate active:opacity-80" onClick={onFromClick}>
            {fromName}
          </button>
          <img
            src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='20' height='8' viewBox='0 0 20 8'%3E%3Cpath d='M0 4h14M14 4l-4-3.5M14 4l-4 3.5' fill='none' stroke='white' stroke-width='1.2' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E"
            alt=""
            className="shrink-0 opacity-90"
            aria-hidden
          />
          <button
            type="button"
            className="inline-flex max-w-[40%] items-center gap-0.5 truncate active:opacity-80"
            onClick={onToClick}
          >
            <span className="truncate">{toName}</span>
            <svg viewBox="0 0 12 12" className="size-3 shrink-0 opacity-80" aria-hidden>
              <path d="M3 4.5 6 7.5 9 4.5" fill="none" stroke="currentColor" strokeWidth="1.2" />
            </svg>
          </button>
        </div>

        <Link
          to={passengerHref}
          className="relative flex h-11 w-10 shrink-0 items-center justify-center text-white active:opacity-70"
          aria-label="选择出行人"
        >
          <PassengerAddIcon />
          {passengerCount > 0 ? (
            <span className="absolute right-0.5 top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#ff4d4f] px-1 text-[10px] font-medium text-white">
              {passengerCount}
            </span>
          ) : null}
        </Link>
      </div>
    </div>
  );
}
