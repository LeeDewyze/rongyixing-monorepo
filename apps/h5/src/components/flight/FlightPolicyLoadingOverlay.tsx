export const FLIGHT_POLICY_LOADING_MESSAGE = "正在计算差标信息";

interface FlightPolicyLoadingOverlayProps {
  open: boolean;
  message?: string;
}

/** Legacy list → cabins preflight loading toast while Home-Detail + Home-Policy run. */
export function FlightPolicyLoadingOverlay({
  open,
  message = FLIGHT_POLICY_LOADING_MESSAGE,
}: FlightPolicyLoadingOverlayProps) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-black/30 px-8"
      role="status"
      aria-live="polite"
      aria-busy="true"
      aria-label={message}
    >
      <div className="flex min-w-[220px] items-center gap-3 rounded-xl bg-white px-5 py-4 shadow-[0_8px_24px_rgba(0,0,0,0.12)]">
        <svg
          className="size-6 shrink-0 animate-spin text-[#5099fe]"
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="3"
          />
          <path
            className="opacity-90"
            fill="currentColor"
            d="M4 12a8 8 0 018-8v3a5 5 0 00-5 5H4z"
          />
        </svg>
        <p className="text-[15px] leading-snug text-[#333333]">{message}</p>
      </div>
    </div>
  );
}
