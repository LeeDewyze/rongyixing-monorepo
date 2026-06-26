import bookOptionChevronIcon from "@/assets/hotel/book-option-chevron.png";

/** Shared chevron for book-page option rows (hotel + flight). */
export function BookOptionChevron({ inCircle = true }: { inCircle?: boolean }) {
  if (!inCircle) {
    return (
      <img src={bookOptionChevronIcon} alt="" className="size-3 shrink-0 opacity-80" aria-hidden />
    );
  }

  return <img src={bookOptionChevronIcon} alt="" className="size-5 shrink-0" aria-hidden />;
}
