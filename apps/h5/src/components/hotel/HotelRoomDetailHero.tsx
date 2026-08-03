import { useCallback, useRef, useState } from "react";

interface HotelRoomDetailHeroProps {
  imageUrls: string[];
  onOpenGallery?: (index: number) => void;
}

export function HotelRoomDetailHero({ imageUrls, onOpenGallery }: HotelRoomDetailHeroProps) {
  const slides = imageUrls.length ? imageUrls : [undefined];
  const [activeIndex, setActiveIndex] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  const syncActiveIndex = useCallback(() => {
    const container = scrollRef.current;
    if (!container || slides.length <= 1) return;
    const width = container.clientWidth;
    if (!width) return;
    const nextIndex = Math.round(container.scrollLeft / width);
    setActiveIndex(Math.min(Math.max(nextIndex, 0), slides.length - 1));
  }, [slides.length]);

  return (
    <div className="relative h-[220px] w-full shrink-0 overflow-hidden bg-[#D8DEE8]">
      <div
        ref={scrollRef}
        onScroll={syncActiveIndex}
        className="flex h-full w-full snap-x snap-mandatory overflow-x-auto overscroll-x-contain [-ms-overflow-style:none] [scrollbar-width:none] [touch-action:pan-x] [&::-webkit-scrollbar]:hidden"
      >
        {slides.map((url, index) => (
          <div
            key={url ? `${url}-${index}` : `placeholder-${index}`}
            className="h-full min-w-full shrink-0 grow-0 basis-full snap-start"
          >
            {url ? (
              <button
                type="button"
                onClick={() => onOpenGallery?.(index)}
                className="block size-full cursor-pointer"
                aria-label="查看大图"
              >
                <img
                  src={url}
                  alt=""
                  className="size-full object-cover"
                  loading={index === 0 ? "eager" : "lazy"}
                  referrerPolicy="no-referrer"
                  draggable={false}
                />
              </button>
            ) : (
              <div className="flex size-full items-center justify-center bg-gradient-to-br from-[#B8DBFF] to-[#E8ECF3]">
                <svg viewBox="0 0 24 24" className="size-10 text-[#B8C0CC]" aria-hidden>
                  <path
                    fill="currentColor"
                    d="M4 6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6zm4 2v8l3-2.5L14 16V8H8z"
                  />
                </svg>
              </div>
            )}
          </div>
        ))}
      </div>

      {slides.length > 1 && slides[0] ? (
        <div className="pointer-events-none absolute bottom-3 right-3 rounded-full bg-black/55 px-2.5 py-1 text-[11px] font-medium leading-5 text-white backdrop-blur-sm">
          {activeIndex + 1}/{slides.length}
        </div>
      ) : null}
    </div>
  );
}
