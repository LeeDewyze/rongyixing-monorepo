import { useCallback, useRef, useState } from "react";

interface HotelDetailHeroProps {
  imageUrls?: string[];
  onBack?: () => void;
  onOpenGallery?: (index: number) => void;
}

function BackButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={(event) => {
        event.stopPropagation();
        onClick();
      }}
      className="flex size-8 items-center justify-center rounded-full bg-black/50 text-white active:opacity-80"
      aria-label="返回"
    >
      <svg viewBox="0 0 10 17" className="h-[17px] w-[10px]" aria-hidden>
        <path
          d="M9 1.5 2.5 8.5 9 15.5"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </button>
  );
}

export function HotelDetailHero({ imageUrls = [], onBack, onOpenGallery }: HotelDetailHeroProps) {
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
      {onBack ? (
        <div className="absolute left-4 top-[calc(env(safe-area-inset-top)+2rem)] z-10">
          <BackButton onClick={onBack} />
        </div>
      ) : null}

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
              <div className="size-full bg-gradient-to-br from-[#B8DBFF] to-[#E8ECF3]" />
            )}
          </div>
        ))}
      </div>

      {slides.length > 1 && slides[0] ? (
        <div className="pointer-events-none absolute bottom-2 right-3 rounded-full bg-black/45 px-2 py-0.5 text-[11px] leading-5 text-white">
          {activeIndex + 1}/{slides.length}
        </div>
      ) : null}
    </div>
  );
}
