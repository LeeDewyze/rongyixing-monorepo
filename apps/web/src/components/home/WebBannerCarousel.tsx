import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import type { HomeBannerSlide } from "@/lib/home-banners";
import { normalizeBannerImageUrl } from "@/lib/home-banners";

/** Design spec: 440 × 220 slide with adjacent peek. */
export const BANNER_SLIDE_WIDTH = 440;
export const BANNER_SLIDE_HEIGHT = 220;
export const BANNER_SLIDE_GAP = 16;

const AUTOPLAY_MS = 3000;
const TRANSITION_MS = 500;
const SWIPE_THRESHOLD_PX = 40;

export function getLoopRealIndex(trackIndex: number, realCount: number): number {
  if (realCount <= 1) return 0;
  if (trackIndex === 0) return realCount - 1;
  if (trackIndex === realCount + 1) return 0;
  return trackIndex - 1;
}

export function resolveLoopTrackIndex(
  trackIndex: number,
  realCount: number,
  deltaX: number,
  threshold = SWIPE_THRESHOLD_PX,
): number {
  if (realCount <= 1 || Math.abs(deltaX) < threshold) return trackIndex;
  return deltaX < 0 ? trackIndex + 1 : trackIndex - 1;
}

export function getCenteredTrackOffsetPx(trackIndex: number): number {
  const slideStep = BANNER_SLIDE_WIDTH + BANNER_SLIDE_GAP;
  const slideCenter = trackIndex * slideStep + BANNER_SLIDE_WIDTH / 2;
  return slideCenter;
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

interface WebBannerCarouselProps {
  slides: HomeBannerSlide[];
  onBannerClick?: (slide: HomeBannerSlide) => void;
}

/** Pad/PC banner carousel — centered 440×220 slide with side peek; dots on active slide bottom. */
export function WebBannerCarousel({ slides, onBannerClick }: WebBannerCarouselProps) {
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
  const trackRef = useRef<HTMLDivElement>(null);
  const trackIndexRef = useRef(canCycle ? 1 : 0);
  const isLoopResettingRef = useRef(false);
  const realIndex = getLoopRealIndex(trackIndex, count);

  trackIndexRef.current = trackIndex;

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
      if (pausedRef.current || isLoopResettingRef.current) return;
      setTrackIndex((value) => value + 1);
    }, AUTOPLAY_MS);
    return () => window.clearInterval(timer);
  }, [canCycle]);

  const jumpWithoutTransition = useCallback((index: number) => {
    isLoopResettingRef.current = true;
    setEnableTransition(false);
    setTrackIndex(index);
    trackIndexRef.current = index;
    requestAnimationFrame(() => {
      trackRef.current?.offsetHeight;
      requestAnimationFrame(() => {
        setEnableTransition(true);
        isLoopResettingRef.current = false;
      });
    });
  }, []);

  const handleTrackTransitionEnd = useCallback(
    (event: React.TransitionEvent<HTMLDivElement>) => {
      if (event.propertyName !== "transform" || event.target !== event.currentTarget) return;
      if (!canCycle || isDragging || isLoopResettingRef.current) return;

      const index = trackIndexRef.current;
      if (index === count + 1) jumpWithoutTransition(1);
      else if (index === 0) jumpWithoutTransition(count);
    },
    [canCycle, count, isDragging, jumpWithoutTransition],
  );

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

  if (count === 0) return null;

  const trackOffsetPx = getCenteredTrackOffsetPx(trackIndex);

  return (
    <div className="relative w-full">
      <div
        className="relative h-[220px] w-full touch-pan-y overflow-hidden rounded-2xl"
        aria-roledescription="carousel"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerCancel}
      >
        <div
          ref={trackRef}
          className={`flex h-full items-stretch gap-4 will-change-transform ${
            isDragging || !enableTransition ? "" : "transition-transform duration-500 ease-in-out"
          }`}
          style={{
            transform: `translateX(calc(50% - ${trackOffsetPx}px + ${dragOffset}px))`,
            transitionDuration: isDragging || !enableTransition ? undefined : `${TRANSITION_MS}ms`,
          }}
          onTransitionEnd={handleTrackTransitionEnd}
        >
          {loopSlides.map((slide) => (
            <button
              key={slide.loopKey}
              type="button"
              className="relative h-[220px] w-[440px] shrink-0 overflow-hidden rounded-2xl border-none bg-transparent p-0 shadow-[0_4px_16px_rgba(0,0,0,0.08)]"
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
            className="pointer-events-none absolute bottom-3 left-1/2 z-20 flex -translate-x-1/2 items-center justify-center"
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
    </div>
  );
}
