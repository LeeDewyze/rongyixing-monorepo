interface PassengerSelectCircleProps {
  checked: boolean;
  disabled?: boolean;
  onChange: (checked: boolean) => void;
  ariaLabel?: string;
}

/** Circular multi-select control — aligned with MasterGo passenger picker. */
export function PassengerSelectCircle({
  checked,
  disabled = false,
  onChange,
  ariaLabel,
}: PassengerSelectCircleProps) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      aria-label={ariaLabel}
      disabled={disabled}
      onClick={() => {
        if (!disabled) onChange(!checked);
      }}
      className={`mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors ${
        disabled
          ? "cursor-not-allowed border-[#cccccc] bg-white opacity-50"
          : checked
            ? "border-[#5099fe] bg-[#5099fe]"
            : "border-[#5099fe] bg-white active:bg-[#e8eeff]"
      }`}
    >
      {checked ? (
        <svg viewBox="0 0 12 12" className="size-3 text-white" aria-hidden>
          <path
            d="M2 6l2.5 2.5L10 3"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      ) : null}
    </button>
  );
}
