interface BookContactCheckboxMarkProps {
  checked: boolean;
}

/** Visual mark for book-page contact checkboxes — pair with a hidden native input. */
export function BookContactCheckboxMark({ checked }: BookContactCheckboxMarkProps) {
  return (
    <span
      className={`pointer-events-none flex size-[18px] shrink-0 items-center justify-center rounded-[4px] border transition-colors ${
        checked
          ? "border-[#2768FA] bg-[#2768FA] shadow-[0_2px_6px_rgba(39,104,250,0.22)]"
          : "border-[#D9D9D9] bg-white"
      }`}
      aria-hidden
    >
      <svg
        viewBox="0 0 12 12"
        className={`size-2.5 text-white transition-opacity ${checked ? "opacity-100" : "opacity-0"}`}
        aria-hidden
      >
        <path
          d="M2.5 6l2.2 2.2 4.8-4.8"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  );
}
