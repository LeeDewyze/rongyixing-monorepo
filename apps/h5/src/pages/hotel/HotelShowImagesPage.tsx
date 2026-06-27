import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";

import {
  HOTEL_CHROME,
  HOTEL_DETAIL_FONT,
  HOTEL_HEADER_GRADIENT,
} from "@/components/hotel/hotel-detail-chrome";
import { usePageHeader } from "@/components/layout";
import { loadHotelGalleryImages } from "@/lib/hotel-gallery-session";
import { navigateBack } from "@/lib/navigation";

function BackIcon() {
  return (
    <svg viewBox="0 0 10 17" className="h-[17px] w-[10px] shrink-0 text-brand-title" aria-hidden>
      <path
        d="M9 1.5 2.5 8.5 9 15.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function HotelShowImagesPage() {
  const navigate = useNavigate();
  const { hotelId = "" } = useParams();
  const [searchParams] = useSearchParams();
  const hotelName = searchParams.get("hotelName")?.trim() ?? "酒店相册";
  const initPos = Math.max(0, Number.parseInt(searchParams.get("initPos") ?? "0", 10) || 0);

  const images = useMemo(() => loadHotelGalleryImages(), []);
  const detailFallback = hotelId ? `/hotel/${encodeURIComponent(hotelId)}` : "/hotel";

  function handleBack() {
    navigateBack(navigate, detailFallback);
  }
  const [activeIndex, setActiveIndex] = useState(() =>
    images.length ? Math.min(initPos, images.length - 1) : 0,
  );
  const scrollRef = useRef<HTMLDivElement>(null);
  const didScrollToInit = useRef(false);

  usePageHeader({ visible: false });

  useEffect(() => {
    if (!images.length) {
      navigateBack(navigate, detailFallback);
    }
  }, [detailFallback, images.length, navigate]);

  useEffect(() => {
    const container = scrollRef.current;
    if (!container || !images.length || didScrollToInit.current) return;

    const scrollToInit = () => {
      const width = container.clientWidth;
      if (!width) return;
      const index = Math.min(initPos, images.length - 1);
      container.scrollLeft = index * width;
      setActiveIndex(index);
      didScrollToInit.current = true;
    };

    scrollToInit();
    requestAnimationFrame(scrollToInit);
  }, [images.length, initPos]);

  const syncActiveIndex = useCallback(() => {
    const container = scrollRef.current;
    if (!container || images.length <= 1) return;
    const width = container.clientWidth;
    if (!width) return;
    const nextIndex = Math.round(container.scrollLeft / width);
    setActiveIndex(Math.min(Math.max(nextIndex, 0), images.length - 1));
  }, [images.length]);

  if (!images.length) {
    return null;
  }

  return (
    <div className={`fixed inset-0 z-50 flex min-h-dvh flex-col bg-black ${HOTEL_DETAIL_FONT}`}>
      <header
        className="shrink-0 pt-[env(safe-area-inset-top)]"
        style={{ background: HOTEL_HEADER_GRADIENT }}
      >
        <div className="flex h-12 items-center gap-2 px-3">
          <button
            type="button"
            onClick={handleBack}
            className="flex h-12 w-8 shrink-0 items-center justify-center active:opacity-70"
            aria-label="返回"
          >
            <BackIcon />
          </button>
          <h1
            className="min-w-0 flex-1 truncate text-center text-[16px] font-semibold leading-tight"
            style={{ color: HOTEL_CHROME.title }}
          >
            {hotelName}
          </h1>
          <span className="w-8 shrink-0" aria-hidden />
        </div>
      </header>

      <div className="relative min-h-0 flex-1">
        <div
          ref={scrollRef}
          onScroll={syncActiveIndex}
          className="absolute inset-0 flex snap-x snap-mandatory overflow-x-auto overscroll-x-contain [-ms-overflow-style:none] [scrollbar-width:none] [touch-action:pan-x] [&::-webkit-scrollbar]:hidden"
        >
          {images.map((url, index) => (
            <div
              key={`${url}-${index}`}
              className="flex h-full min-w-full shrink-0 grow-0 basis-full snap-start items-center justify-center bg-black"
            >
              <img
                src={url}
                alt=""
                className="w-full max-h-full object-contain"
                loading={index <= initPos + 1 ? "eager" : "lazy"}
                referrerPolicy="no-referrer"
                draggable={false}
              />
            </div>
          ))}
        </div>

        <div className="pointer-events-none absolute bottom-6 right-4 rounded-full bg-black/55 px-3 py-1 text-[12px] font-medium leading-5 text-white backdrop-blur-sm">
          {activeIndex + 1}/{images.length}
        </div>
      </div>
    </div>
  );
}
