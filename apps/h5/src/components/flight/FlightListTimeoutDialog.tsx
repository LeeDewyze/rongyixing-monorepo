import { FLIGHT_LIST_TIMEOUT_MESSAGE } from "@/lib/flight-list-refresh";

import "./flight-list-timeout-dialog.css";

interface FlightListTimeoutDialogProps {
  open: boolean;
  onConfirm: () => void;
}

function TimeoutClockIcon() {
  return (
    <div
      className="mx-auto flex size-[52px] items-center justify-center rounded-full bg-[linear-gradient(145deg,#EEF4FF_0%,#F7FAFF_100%)] shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_6px_16px_rgba(39,104,250,0.12)] ring-1 ring-[#D6E4FF]"
      aria-hidden
    >
      <svg viewBox="0 0 24 24" className="size-7 text-brand-primary" fill="none">
        <circle cx="12" cy="12" r="8.25" stroke="currentColor" strokeWidth="1.5" />
        <path
          d="M12 7.5V12l3 2.25"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}

/** Legacy TimeoutTipComponent — list page price staleness. */
export function FlightListTimeoutDialog({ open, onConfirm }: FlightListTimeoutDialogProps) {
  if (!open) return null;

  return (
    <div
      className="flight-list-timeout-backdrop fixed inset-0 z-[70] flex items-center justify-center bg-black/45 px-6 backdrop-blur-[2px]"
      role="presentation"
    >
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="flight-list-timeout-title"
        aria-describedby="flight-list-timeout-message"
        className="flight-list-timeout-panel w-full max-w-[340px] overflow-hidden rounded-2xl bg-white shadow-[0_12px_40px_rgba(0,0,0,0.14)]"
      >
        <div className="relative overflow-hidden px-5 pb-4 pt-6">
          <div
            className="pointer-events-none absolute inset-x-0 top-0 h-[88px] bg-[linear-gradient(180deg,#EEF4FF_0%,rgba(255,255,255,0)_100%)]"
            aria-hidden
          />
          <div className="relative">
            <TimeoutClockIcon />
            <h2
              id="flight-list-timeout-title"
              className="mt-4 text-center text-[17px] font-semibold tracking-[0.02em] text-[#333333]"
            >
              温馨提示
            </h2>
          </div>
        </div>

        <div className="px-5 pb-5">
          <div className="rounded-xl bg-[#F8F9FC] px-4 py-3.5 ring-1 ring-[#EEF1F6]">
            <p
              id="flight-list-timeout-message"
              className="text-center text-[14px] leading-[1.65] text-[#666666]"
            >
              {FLIGHT_LIST_TIMEOUT_MESSAGE}
            </p>
          </div>

          <button
            type="button"
            className="mt-4 flex h-11 w-full items-center justify-center rounded-[24px] bg-[linear-gradient(270deg,var(--brand-btn-end)_0%,var(--brand-btn-start)_100%)] text-[15px] font-medium text-white shadow-[0_4px_12px_rgba(39,104,250,0.24)] active:scale-[0.99] active:opacity-95"
            onClick={onConfirm}
          >
            我知道了
          </button>
        </div>
      </div>
    </div>
  );
}
