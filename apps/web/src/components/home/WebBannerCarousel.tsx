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
const DRAG_START_THRESHOLD_PX = 8;

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
  const candidates = useMemo(() => {
    const trimmed = src.trim();
    if (!trimmed) return [] as string[];

    const normalized = normalizeBannerImageUrl(trimmed);
    const list = [normalized];
    if (trimmed !== normalized) list.push(trimmed);
    return [...new Set(list)];
  }, [src]);

  const [candidateIndex, setCandidateIndex] = useState(0);

  useEffect(() => {
    setCandidateIndex(0);
  }, [src]);

  const handleError = useCallback(() => {
    setCandidateIndex((index) => index + 1);
  }, []);

  const currentSrc = candidates[candidateIndex];
  if (!currentSrc || candidateIndex >= candidates.length) {
    return <div className="size-full bg-[#E8EAEF]" aria-hidden />;
  }

  return (
    <img
      key={currentSrc}
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
  const isDraggingRef = useRef(false);
  const activePointerIdRef = useRef<number | null>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const trackIndexRef = useRef(canCycle ? 1 : 0);
  const isLoopResettingRef = useRef(false);
  const realIndex = getLoopRealIndex(trackIndex, count);
  const slidesKey = useMemo(() => slides.map((slide) => slide.id).join("|"), [slides]);

  trackIndexRef.current = trackIndex;

  useEffect(() => {
    setTrackIndex(canCycle ? 1 : 0);
    trackIndexRef.current = canCycle ? 1 : 0;
    setEnableTransition(true);
    setDragOffset(0);
    setIsDragging(false);
    isDraggingRef.current = false;
    activePointerIdRef.current = null;
    isLoopResettingRef.current = false;
  }, [canCycle, slidesKey]);

  useEffect(() => {
    slides.forEach((slide) => {
      const image = new Image();
      image.src = slide.imageUrl;
    });
  }, [slidesKey, slides]);

  useEffect(() => {
    if (!canCycle) return;
    const timer = window.setInterval(() => {
      if (pausedRef.current || isLoopResettingRef.current) return;
      setTrackIndex((value) => {
        if (value >= count + 1) return value;
        return value + 1;
      });
    }, AUTOPLAY_MS);
    return () => window.clearInterval(timer);
  }, [canCycle, count]);

  const jumpWithoutTransition = useCallback((index: number) => {
    isLoopResettingRef.current = true;
    setEnableTransition(false);
    setTrackIndex(index);
    trackIndexRef.current = index;
  }, []);

  useEffect(() => {
    if (enableTransition) return;
    const frame = requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setEnableTransition(true);
        isLoopResettingRef.current = false;
      });
    });
    return () => cancelAnimationFrame(frame);
  }, [enableTransition, trackIndex]);

  const handleTrackTransitionEnd = useCallback(
    (event: React.TransitionEvent<HTMLDivElement>) => {
      if (event.currentTarget !== trackRef.current) return;
      if (event.propertyName !== "transform") return;
      if (!canCycle || isLoopResettingRef.current) return;

      const index = trackIndexRef.current;
      if (index === count + 1) jumpWithoutTransition(1);
      else if (index === 0) jumpWithoutTransition(count);
    },
    [canCycle, count, jumpWithoutTransition],
  );

  useEffect(() => {
    if (!canCycle || isLoopResettingRef.current) return;
    const index = trackIndexRef.current;
    if (index !== count + 1 && index !== 0) return;

    const timer = window.setTimeout(() => {
      if (isLoopResettingRef.current) return;
      const current = trackIndexRef.current;
      if (current === count + 1) jumpWithoutTransition(1);
      else if (current === 0) jumpWithoutTransition(count);
    }, TRANSITION_MS + 100);

    return () => window.clearTimeout(timer);
  }, [trackIndex, canCycle, count, jumpWithoutTransition]);

  const finishDrag = useCallback(
    (clientX: number) => {
      const deltaX = clientX - dragStartXRef.current;
      isDraggingRef.current = false;
      setIsDragging(false);
      setDragOffset(0);
      pausedRef.current = false;
      activePointerIdRef.current = null;

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
      if (event.pointerType === "mouse" && event.button !== 0) return;
      pausedRef.current = true;
      didSwipeRef.current = false;
      isDraggingRef.current = false;
      setIsDragging(false);
      dragStartXRef.current = event.clientX;
      activePointerIdRef.current = event.pointerId;
      setDragOffset(0);
    },
    [canCycle],
  );

  const handlePointerMove = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    if (activePointerIdRef.current !== event.pointerId) return;

    const deltaX = event.clientX - dragStartXRef.current;
    if (!isDraggingRef.current) {
      if (Math.abs(deltaX) < DRAG_START_THRESHOLD_PX) return;
      isDraggingRef.current = true;
      setIsDragging(true);
      event.currentTarget.setPointerCapture(event.pointerId);
    }

    setDragOffset(deltaX);
  }, []);

  const handlePointerUp = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      if (activePointerIdRef.current !== event.pointerId) return;

      if (isDraggingRef.current) {
        if (event.currentTarget.hasPointerCapture(event.pointerId)) {
          event.currentTarget.releasePointerCapture(event.pointerId);
        }
        finishDrag(event.clientX);
        return;
      }

      activePointerIdRef.current = null;
      pausedRef.current = false;
    },
    [finishDrag],
  );

  const handlePointerCancel = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      if (activePointerIdRef.current !== event.pointerId) return;

      if (isDraggingRef.current) {
        if (event.currentTarget.hasPointerCapture(event.pointerId)) {
          event.currentTarget.releasePointerCapture(event.pointerId);
        }
        finishDrag(event.clientX);
        return;
      }

      activePointerIdRef.current = null;
      pausedRef.current = false;
    },
    [finishDrag],
  );

  const handleActiveSlideClick = useCallback(() => {
    if (didSwipeRef.current) {
      didSwipeRef.current = false;
      return;
    }
    const slide = slides[realIndex];
    if (slide?.banner?.Url) {
      onBannerClick?.(slide);
    }
  }, [onBannerClick, realIndex, slides]);

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
          {loopSlides.map((slide, index) => (
            <button
              key={slide.loopKey}
              type="button"
              className={`relative h-[220px] w-[440px] shrink-0 overflow-hidden rounded-2xl border-none bg-transparent p-0 shadow-[0_4px_16px_rgba(0,0,0,0.08)] ${
                index === trackIndex ? "z-10" : "z-0"
              }`}
              onClick={index === trackIndex ? handleActiveSlideClick : undefined}
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
