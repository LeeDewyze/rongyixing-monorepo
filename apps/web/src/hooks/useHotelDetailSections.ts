import { useCallback, useEffect, useLayoutEffect, useRef, useState, type RefObject } from "react";

import type { HotelDetailSectionId } from "@/components/hotel/HotelDetailSectionTabs";

const SECTION_IDS: HotelDetailSectionId[] = ["rooms", "hotel", "traffic"];

export function useHotelDetailSections(enabled: boolean) {
  const stickyRef = useRef<HTMLDivElement>(null);
  const stickySentinelRef = useRef<HTMLDivElement>(null);
  const roomsRef = useRef<HTMLElement>(null);
  const hotelRef = useRef<HTMLElement>(null);
  const trafficRef = useRef<HTMLElement>(null);
  const [stickyVisible, setStickyVisible] = useState(false);
  const [activeSection, setActiveSection] = useState<HotelDetailSectionId>("rooms");
  const [scrollMarginTop, setScrollMarginTop] = useState(0);
  const scrollingRef = useRef(false);

  const getSectionRef = useCallback((id: HotelDetailSectionId): RefObject<HTMLElement | null> => {
    switch (id) {
      case "hotel":
        return hotelRef;
      case "traffic":
        return trafficRef;
      default:
        return roomsRef;
    }
  }, []);

  useLayoutEffect(() => {
    const node = stickyRef.current;
    if (!node || !stickyVisible) {
      setScrollMarginTop(0);
      return;
    }

    const update = () => setScrollMarginTop(node.offsetHeight);
    update();

    const observer = new ResizeObserver(update);
    observer.observe(node);
    return () => observer.disconnect();
  }, [enabled, stickyVisible]);

  useEffect(() => {
    const node = stickySentinelRef.current;
    if (!enabled || !node) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry) return;
        setStickyVisible(entry.boundingClientRect.top < 0);
      },
      { threshold: [0, 1] },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [enabled]);

  const scrollToSection = useCallback(
    (id: HotelDetailSectionId) => {
      const target = getSectionRef(id).current;
      if (!target) return;
      scrollingRef.current = true;
      setActiveSection(id);
      target.scrollIntoView({ behavior: "smooth", block: "start" });
      window.setTimeout(() => {
        scrollingRef.current = false;
      }, 500);
    },
    [getSectionRef],
  );

  useEffect(() => {
    if (!enabled) return;

    const sections = SECTION_IDS.map((id) => getSectionRef(id).current).filter(
      Boolean,
    ) as HTMLElement[];
    if (!sections.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (scrollingRef.current) return;
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        const top = visible[0];
        if (!top) return;
        const id = top.target.getAttribute("data-section-id") as HotelDetailSectionId | null;
        if (id) setActiveSection(id);
      },
      {
        root: null,
        rootMargin: `-${scrollMarginTop + 8}px 0px -45% 0px`,
        threshold: [0, 0.25, 0.5, 0.75, 1],
      },
    );

    for (const section of sections) {
      observer.observe(section);
    }
    return () => observer.disconnect();
  }, [enabled, getSectionRef, scrollMarginTop]);

  return {
    stickyRef,
    stickySentinelRef,
    stickyVisible,
    roomsRef,
    hotelRef,
    trafficRef,
    activeSection,
    scrollMarginTop,
    scrollToSection,
  };
}
