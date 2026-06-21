import { FLIGHT_LIST_TIMEOUT_MESSAGE } from "@/lib/flight-list-refresh";

interface FlightListTimeoutDialogProps {
  open: boolean;
  onConfirm: () => void;
}

/** Legacy TimeoutTipComponent — list page price staleness. */
export function FlightListTimeoutDialog({ open, onConfirm }: FlightListTimeoutDialogProps) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-black/45 px-6"
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="flight-list-timeout-title"
        className="w-full max-w-sm overflow-hidden rounded-2xl bg-white shadow-lg"
      >
        <div className="px-5 pb-4 pt-5 text-center">
          <h2 id="flight-list-timeout-title" className="text-base font-semibold text-[#333333]">
            温馨提示
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-[#666666]">
            {FLIGHT_LIST_TIMEOUT_MESSAGE}
          </p>
        </div>
        <div className="px-5 pb-5">
          <button
            type="button"
            className="flex h-11 w-full items-center justify-center rounded-full bg-[#5099fe] text-sm font-medium text-white active:opacity-90"
            onClick={onConfirm}
          >
            我知道了
          </button>
        </div>
      </div>
    </div>
  );
}
