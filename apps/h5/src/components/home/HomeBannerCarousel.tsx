import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import type { HomeBannerSlide } from "@/lib/home-banners";
import { normalizeBannerImageUrl } from "@/lib/home-banners";

const AUTOPLAY_MS = 3000;
const SWIPE_THRESHOLD_PX = 40;

/** Map loop track index to the real slide index used by pagination dots. */
export function getLoopRealIndex(trackIndex: number, realCount: number): number {
  if (realCount <= 1) return 0;
  if (trackIndex === 0) return realCount - 1;
  if (trackIndex === realCount + 1) return 0;
  return trackIndex - 1;
}

/** Resolve the next loop track index after a swipe gesture. */
export function resolveLoopTrackIndex(
  trackIndex: number,
  realCount: number,
  deltaX: number,
  threshold = SWIPE_THRESHOLD_PX,
): number {
  if (realCount <= 1 || Math.abs(deltaX) < threshold) {
    return trackIndex;
  }
  if (deltaX < 0) {
    return trackIndex + 1;
  }
  return trackIndex - 1;
}

/** @deprecated Use resolveLoopTrackIndex for loop carousels. */
export function resolveSwipeIndex(
  activeIndex: number,
  count: number,
  deltaX: number,
  threshold = SWIPE_THRESHOLD_PX,
): number {
  if (count <= 1 || Math.abs(deltaX) < threshold) {
    return activeIndex;
  }
  if (deltaX < 0) {
    return (activeIndex + 1) % count;
  }
  return (activeIndex - 1 + count) % count;
}

type LoopSlide = HomeBannerSlide & { loopKey: string };

function BannerSlideImage({ src }: { src: string }) {
  const [currentSrc, setCurrentSrc] = useState(() => normalizeBannerImageUrl(src));
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setCurrentSrc(normalizeBannerImageUrl(src));
    setFailed(false);
  }, [src]);

  const handleError = useCallback(() => {
    if (failed) return;
    if (!currentSrc.startsWith("https://")) {
      const trimmed = src.trim();
      if (trimmed.startsWith("http://")) {
        setCurrentSrc(`https://${trimmed.slice("http://".length)}`);
        return;
      }
    }
    setFailed(true);
  }, [currentSrc, failed, src]);

  if (failed) {
    return <div className="size-full bg-[#E8EAEF]" aria-hidden />;
  }

  return (
    <img
      src={currentSrc}
      alt=""
      className="pointer-events-none size-full object-cover object-center"
      loading="eager"
      decoding="async"
      draggable={false}
      onError={handleError}
    />
  );
}

interface HomeBannerCarouselProps {
  slides: HomeBannerSlide[];
  onBannerClick?: (slide: HomeBannerSlide) => void;
}

export function HomeBannerCarousel({ slides, onBannerClick }: HomeBannerCarouselProps) {
  const count = slides.length;
  const canCycle = count > 1;
  const loopSlides = useMemo<LoopSlide[]>(() => {
    if (!canCycle) {
      return slides.map((slide) => ({ ...slide, loopKey: slide.id }));
    }
    const last = slides[count - 1]!;
    const first = slides[0]!;
    return [
      { ...last, loopKey: `${last.id}-loop-head` },
      ...slides.map((slide) => ({ ...slide, loopKey: slide.id })),
      { ...first, loopKey: `${first.id}-loop-tail` },
    ];
  }, [canCycle, count, slides]);

  const [trackIndex, setTrackIndex] = useState(() => (canCycle ? 1 : 0));
  const [dragOffset, setDragOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [enableTransition, setEnableTransition] = useState(true);
  const pausedRef = useRef(false);
  const dragStartXRef = useRef(0);
  const didSwipeRef = useRef(false);
  const realIndex = getLoopRealIndex(trackIndex, count);

  useEffect(() => {
    setTrackIndex(canCycle ? 1 : 0);
    setEnableTransition(true);
    setDragOffset(0);
    setIsDragging(false);
  }, [canCycle, slides]);

  useEffect(() => {
    slides.forEach((slide) => {
      const image = new Image();
      image.src = slide.imageUrl;
    });
  }, [slides]);

  useEffect(() => {
    if (!canCycle) return;
    const timer = window.setInterval(() => {
      if (pausedRef.current) return;
      setTrackIndex((value) => value + 1);
    }, AUTOPLAY_MS);
    return () => window.clearInterval(timer);
  }, [canCycle]);

  const jumpWithoutTransition = useCallback((index: number) => {
    setEnableTransition(false);
    setTrackIndex(index);
  }, []);

  useEffect(() => {
    if (enableTransition) return;
    const frame = requestAnimationFrame(() => {
      requestAnimationFrame(() => setEnableTransition(true));
    });
    return () => cancelAnimationFrame(frame);
  }, [enableTransition, trackIndex]);

  const handleTrackTransitionEnd = useCallback(() => {
    if (!canCycle || isDragging) return;
    if (trackIndex === count + 1) {
      jumpWithoutTransition(1);
    } else if (trackIndex === 0) {
      jumpWithoutTransition(count);
    }
  }, [canCycle, count, isDragging, jumpWithoutTransition, trackIndex]);

  const finishDrag = useCallback(
    (clientX: number) => {
      const deltaX = clientX - dragStartXRef.current;
      setIsDragging(false);
      setDragOffset(0);
      pausedRef.current = false;

      if (Math.abs(deltaX) >= SWIPE_THRESHOLD_PX) {
        didSwipeRef.current = true;
        setTrackIndex((value) => resolveLoopTrackIndex(value, count, deltaX));
      }
    },
    [count],
  );

  const handlePointerDown = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      if (!canCycle) return;
      pausedRef.current = true;
      didSwipeRef.current = false;
      dragStartXRef.current = event.clientX;
      setIsDragging(true);
      setDragOffset(0);
      event.currentTarget.setPointerCapture(event.pointerId);
    },
    [canCycle],
  );

  const handlePointerMove = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      if (!isDragging) return;
      setDragOffset(event.clientX - dragStartXRef.current);
    },
    [isDragging],
  );

  const handlePointerUp = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      if (!isDragging) return;
      if (event.currentTarget.hasPointerCapture(event.pointerId)) {
        event.currentTarget.releasePointerCapture(event.pointerId);
      }
      finishDrag(event.clientX);
    },
    [finishDrag, isDragging],
  );

  const handlePointerCancel = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      if (!isDragging) return;
      if (event.currentTarget.hasPointerCapture(event.pointerId)) {
        event.currentTarget.releasePointerCapture(event.pointerId);
      }
      finishDrag(event.clientX);
    },
    [finishDrag, isDragging],
  );

  if (count === 0) {
    return null;
  }

  return (
    <div
      className="relative h-[208px] w-full touch-pan-y overflow-hidden"
      aria-roledescription="carousel"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerCancel}
    >
      <div
        className={`flex h-full ${
          isDragging || !enableTransition ? "" : "transition-transform duration-[600ms] ease-out"
        }`}
        style={{
          transform: `translateX(calc(-${trackIndex * 100}% + ${dragOffset}px))`,
        }}
        onTransitionEnd={handleTrackTransitionEnd}
      >
        {loopSlides.map((slide) => (
          <button
            key={slide.loopKey}
            type="button"
            className="relative h-full min-w-full flex-[0_0_100%] border-none bg-transparent p-0"
            onClick={() => {
              if (didSwipeRef.current) {
                didSwipeRef.current = false;
                return;
              }
              if (slide.banner?.Url) {
                onBannerClick?.(slide);
              }
            }}
            aria-label={slide.banner?.Title ?? slide.banner?.Name ?? "轮播图"}
          >
            <BannerSlideImage src={slide.imageUrl} />
          </button>
        ))}
      </div>

      {canCycle ? (
        <div
          className="pointer-events-none absolute inset-x-0 bottom-11 z-20 flex items-center justify-center"
          role="tablist"
          aria-label="轮播图指示器"
        >
          {slides.map((slide, index) => {
            const isActive = index === realIndex;
            return (
              <span
                key={slide.id}
                role="tab"
                aria-selected={isActive}
                aria-label={`第 ${index + 1} 张`}
                className={`mx-[0.15em] size-[7px] shrink-0 rounded-full transition-colors duration-300 ${
                  isActive ? "bg-white" : "bg-white/40"
                }`}
              />
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
