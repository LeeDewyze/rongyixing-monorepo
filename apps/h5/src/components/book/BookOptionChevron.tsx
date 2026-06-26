import bookOptionChevronIcon from "@/assets/hotel/book-option-chevron.png";

/** Shared chevron for book-page option rows (hotel + flight). */
export function BookOptionChevron({ inCircle = true }: { inCircle?: boolean }) {
  if (!inCircle) {
    return (
      <svg
        viewBox="0 0 16 16"
        className="size-4 shrink-0 text-[#999999]"
        fill="none"
        aria-hidden
      >
        <path
          d="M6 4.5 10 8 6 11.5"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }

  return <img src={bookOptionChevronIcon} alt="" className="size-5 shrink-0" aria-hidden />;
}
