import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ProductType } from "@ryx/shared-types";
import type { HotelCity, HotelType } from "@ryx/shared-types";

import { HotelListFilterSheet } from "@/components/hotel/HotelListFilterSheet";
import { HotelListHeader } from "@/components/hotel/HotelListHeader";
import { HotelListItem } from "@/components/hotel/HotelListItem";
import { HotelListToolbar, type HotelListToolbarId } from "@/components/hotel/HotelListToolbar";
import { HotelStayDatePickerSheet } from "@/components/hotel/HotelStayDatePickerSheet";
import { CityPicker } from "@/components/search";
import { usePageHeader } from "@/components/layout";
import { useHotelConditions, useInfiniteHotelList, useHotelCities } from "@/hooks/useHotelList";
import { usePassengerSelection } from "@/hooks/usePassenger";
import { usePullToRefresh } from "@/hooks/usePullToRefresh";
import { getApi } from "@/lib/api";
import { formatApiError } from "@/lib/formatApiError";
import {
  readStaffCityCode,
  resolveHotelListPassengerIds,
  shouldShowHotelFreeStayTip,
} from "@/lib/hotel-list-context";
import {
  applyHotelListFilterParams,
  createInitialHotelListFilter,
  isHotelListFilterActive,
  type HotelListFilterSection,
  type HotelListFilterState,
} from "@/lib/hotel-list-filters";
import { navigateBack } from "@/lib/navigation";
import { CITY_HISTORY_KEYS, hotelCityFromQuery, hotelCityPickerAdapter } from "@/lib/hotel-search";

const FALLBACK_HEADER_HEIGHT = 56;
const HOTEL_LIST_FONT =
  "[font-family:'HarmonyOS_Sans_SC','HarmonyOS_Sans','PingFang_SC',sans-serif]";
const BASIC_FILTER_SECTIONS: HotelListFilterSection[] = ["sort", "star", "category", "price"];
const LOCATION_FILTER_SECTIONS: HotelListFilterSection[] = ["location"];
const AMENITY_FILTER_SECTIONS: HotelListFilterSection[] = ["brand", "theme", "service", "facility"];

function parseHotelType(value: string | null): HotelType | undefined {
  if (value === "Normal" || value === "Tmc" || value === "Agent") return value;
  return undefined;
}

function useInfiniteScrollTrigger(
  onLoadMore: (() => void) | undefined,
  enabled: boolean,
  scrollRoot: HTMLElement | null | undefined,
) {
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!enabled || !onLoadMore) return;

    const target = sentinelRef.current;
    if (!target) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          onLoadMore();
        }
      },
      { root: scrollRoot ?? null, rootMargin: "160px 0px" },
    );

    observer.observe(target);
    return () => observer.disconnect();
  }, [enabled, onLoadMore, scrollRoot]);

  return sentinelRef;
}

function HotelListSkeleton() {
  return (
    <div className="flex flex-col gap-2">
      {Array.from({ length: 4 }, (_, i) => (
        <div key={i} className="flex gap-3 rounded-lg bg-white p-3">
          <div className="size-24 shrink-0 animate-pulse rounded-lg bg-[#E5E7EB]" />
          <div className="flex min-h-24 flex-1 flex-col justify-between py-0.5">
            <div className="space-y-2">
              <div className="h-4 w-full animate-pulse rounded bg-[#E5E7EB]" />
              <div className="h-4 w-3/4 animate-pulse rounded bg-[#E5E7EB]" />
              <div className="h-3 w-20 animate-pulse rounded bg-[#E5E7EB]" />
            </div>
            <div className="flex items-end justify-between gap-2">
              <div className="h-3 w-2/5 animate-pulse rounded bg-[#E5E7EB]" />
              <div className="h-4 w-14 animate-pulse rounded bg-[#E5E7EB]" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function HotelFreeStayTip({ onOpen }: { onOpen: () => void }) {
  return (
    <button
      type="button"
      className={`${HOTEL_LIST_FONT} flex w-full items-center gap-2 rounded-lg border border-[#B8D8FF] bg-[#EEF6FF] px-3 py-2.5 text-left text-[12px] leading-5 text-[#2768FA] shadow-sm active:scale-[0.99]`}
      onClick={onOpen}
    >
      <span className="flex size-4 shrink-0 items-center justify-center rounded-full bg-gradient-to-r from-brand-btn-start to-brand-btn-end text-[11px] font-semibold leading-none text-white">
        i
      </span>
      <span className="min-w-0 flex-1">
        贵公司已开通超标随心住，自行支付超标部分即可享受心仪的房间
      </span>
      <span className="shrink-0 text-[11px] font-medium">说明</span>
    </button>
  );
}

function HotelFreeStayDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/45 px-8 backdrop-blur-sm">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="hotel-free-stay-title"
        className={`${HOTEL_LIST_FONT} w-full max-w-[320px] overflow-hidden rounded-2xl bg-white shadow-2xl`}
      >
        <div className="bg-gradient-to-b from-[#F2F7FF] to-white px-5 pb-3 pt-5">
          <h2
            id="hotel-free-stay-title"
            className="text-center text-[17px] font-semibold text-brand-title"
          >
            超标随心住
          </h2>
        </div>
        <div className="px-5 pb-5 text-[14px] leading-6 text-[#4B5563]">
          <p>
            预订超出差旅标准的房型时，可自行支付超标部分；企业承担标准内费用，超标差额按实际订单规则展示。
          </p>
          <button
            type="button"
            className="mt-5 h-10 w-full rounded-full bg-gradient-to-r from-brand-btn-start to-brand-btn-end text-[15px] font-medium text-white active:opacity-90"
            onClick={onClose}
          >
            我知道了
          </button>
        </div>
      </div>
    </div>
  );
}

export function HotelListPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [activeFilter, setActiveFilter] = useState<HotelListToolbarId | null>(null);
  const [filterOpen, setFilterOpen] = useState(false);
  const [filterInitialSection, setFilterInitialSection] =
    useState<HotelListFilterSection>("sort");
  const [filterVisibleSections, setFilterVisibleSections] =
    useState<HotelListFilterSection[]>(BASIC_FILTER_SECTIONS);
  const [filterDraft, setFilterDraft] = useState<HotelListFilterState>(
    createInitialHotelListFilter,
  );
  const [filterApplied, setFilterApplied] = useState<HotelListFilterState>(
    createInitialHotelListFilter,
  );
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const [cityPickerOpen, setCityPickerOpen] = useState(false);
  const [freeStayDialogOpen, setFreeStayDialogOpen] = useState(false);
  const headerRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const [scrollRoot, setScrollRoot] = useState<HTMLDivElement | null>(null);
  const [headerHeight, setHeaderHeight] = useState(FALLBACK_HEADER_HEIGHT);

  const cityCode = searchParams.get("cityCode") ?? "";
  const cityName = searchParams.get("cityName") ?? cityCode;
  const checkIn = searchParams.get("checkIn") ?? "";
  const checkOut = searchParams.get("checkOut") ?? "";
  const keyword = searchParams.get("keyword") ?? "";
  const keywordType = searchParams.get("keywordType") ?? "";
  const hotelId = searchParams.get("hotelId") ?? "";
  const lat = searchParams.get("lat") ?? "";
  const lng = searchParams.get("lng") ?? "";
  const hotelType = parseHotelType(searchParams.get("hotelType")) ?? "Normal";
  const travelFormId = searchParams.get("travelFormId") ?? searchParams.get("travelformid") ?? "";
  const { selected: selectedPassengers } = usePassengerSelection(ProductType.Hotel);
  const passengerIds = useMemo(
    () => resolveHotelListPassengerIds(selectedPassengers),
    [selectedPassengers],
  );
  const staffCityCode = useMemo(() => readStaffCityCode(), []);
  const { data: tmc } = useQuery({
    queryKey: ["tmc", "getTmc", "hotel-list"],
    queryFn: () => getApi().tmc.getTmc(),
    staleTime: 5 * 60 * 1000,
  });
  const showFreeStayTip = shouldShowHotelFreeStayTip({ tmc, hotelType });

  const hasParams = Boolean(cityCode && checkIn && checkOut);

  const { data: cities = [], isLoading: citiesLoading } = useHotelCities();

  const resolvedCity = useMemo(
    () => (hasParams ? hotelCityFromQuery(cities, cityCode, cityName) : null),
    [hasParams, cities, cityCode, cityName],
  );

  const listReady = hasParams && !citiesLoading;

  useEffect(() => {
    if (!hasParams) navigate("/hotel", { replace: true });
  }, [hasParams, navigate]);

  useEffect(() => {
    if (!listReady || !resolvedCity || resolvedCity.Code === cityCode) return;
    const next = new URLSearchParams(searchParams);
    next.set("cityCode", resolvedCity.Code);
    next.set("cityName", resolvedCity.Name);
    navigate({ pathname: "/hotel/list", search: next.toString() }, { replace: true });
  }, [listReady, resolvedCity, cityCode, searchParams, navigate]);

  usePageHeader({ visible: false });

  useLayoutEffect(() => {
    const header = headerRef.current;
    if (!header) return;

    const updateHeight = () => {
      setHeaderHeight(header.offsetHeight);
    };

    updateHeight();
    const observer = new ResizeObserver(updateHeight);
    observer.observe(header);
    return () => observer.disconnect();
  }, []);

  useLayoutEffect(() => {
    scrollContainerRef.current?.scrollTo({ top: 0, behavior: "auto" });
  }, [cityCode, checkIn, checkOut, keyword, keywordType, hotelId, lat, lng]);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const main = document.querySelector("main");
    const previousMainOverflow = main instanceof HTMLElement ? main.style.overflow : "";
    if (main instanceof HTMLElement) {
      main.style.overflow = "hidden";
    }

    return () => {
      document.body.style.overflow = previousOverflow;
      if (main instanceof HTMLElement) {
        main.style.overflow = previousMainOverflow;
      }
    };
  }, []);

  const listParams = useMemo(
    () => {
      if (!listReady || !resolvedCity) return {};
      const baseParams = {
        CityCode: resolvedCity.Code,
        CityName: resolvedCity.Name,
        CheckInDate: checkIn,
        CheckOutDate: checkOut,
        Keyword: keyword || undefined,
        HotelType: hotelType,
        TravelFormId: travelFormId || undefined,
        Passengers: passengerIds || undefined,
        StaffCityCode: staffCityCode,
      };
      if (keywordType === "hotel" && hotelId) {
        return applyHotelListFilterParams(
          {
            ...baseParams,
            HotelId: hotelId,
          },
          filterApplied,
        );
      }
      if (keywordType === "address" && lat && lng) {
        return applyHotelListFilterParams(
          {
            ...baseParams,
            Lat: lat,
            Lng: lng,
          },
          filterApplied,
        );
      }
      return applyHotelListFilterParams(baseParams, filterApplied);
    },
    [
      listReady,
      resolvedCity,
      checkIn,
      checkOut,
      keyword,
      keywordType,
      hotelId,
      lat,
      lng,
      hotelType,
      travelFormId,
      passengerIds,
      staffCityCode,
      filterApplied,
    ],
  );

  const {
    data,
    isLoading,
    isFetching,
    isError,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    error,
    refresh,
  } = useInfiniteHotelList(listParams);
  const {
    data: conditions,
    isLoading: conditionsLoading,
    isError: conditionsError,
  } = useHotelConditions(resolvedCity?.Code);

  const hotels = data?.pages.flatMap((page) => page.Hotels) ?? [];
  const isInitialLoading = isLoading && hotels.length === 0;
  const hasLoadedHotels = hotels.length > 0;

  const handleLoadMore = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      void fetchNextPage();
    }
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

  const sentinelRef = useInfiniteScrollTrigger(handleLoadMore, Boolean(hasNextPage), scrollRoot);

  const { pullDistance, statusLabel, isActive } = usePullToRefresh({
    scrollRef: scrollContainerRef,
    scrollElement: scrollRoot,
    onRefresh: refresh,
    disabled: isInitialLoading,
  });

  const handleScrollRoot = useCallback((node: HTMLDivElement | null) => {
    scrollContainerRef.current = node;
    setScrollRoot(node);
  }, []);

  const filterActive = isHotelListFilterActive(filterApplied);

  function openFilterSheet(id: HotelListToolbarId) {
    setActiveFilter(id);
    setFilterInitialSection(
      id === "location" ? "location" : id === "priceStar" ? "price" : id === "filter" ? "brand" : "sort",
    );
    setFilterVisibleSections(
      id === "location"
        ? LOCATION_FILTER_SECTIONS
        : id === "filter"
          ? AMENITY_FILTER_SECTIONS
          : BASIC_FILTER_SECTIONS,
    );
    setFilterDraft(filterApplied);
    setFilterOpen(true);
  }

  function handleFilterConfirm() {
    setFilterApplied(filterDraft);
    setFilterOpen(false);
  }

  if (!hasParams) return null;

  function goModifySearch() {
    const next = new URLSearchParams();
    next.set("cityCode", resolvedCity?.Code ?? cityCode);
    next.set("cityName", resolvedCity?.Name ?? cityName);
    next.set("checkIn", checkIn);
    next.set("checkOut", checkOut);
    if (keyword) next.set("keyword", keyword);
    if (keywordType) next.set("keywordType", keywordType);
    if (hotelId) next.set("hotelId", hotelId);
    if (lat) next.set("lat", lat);
    if (lng) next.set("lng", lng);
    if (hotelType) next.set("hotelType", hotelType);
    if (travelFormId) next.set("travelFormId", travelFormId);
    navigate(`/hotel/keyword?${next.toString()}`);
  }

  function handleDateConfirm(nextCheckIn: string, nextCheckOut: string) {
    const next = new URLSearchParams(searchParams);
    next.set("checkIn", nextCheckIn);
    next.set("checkOut", nextCheckOut);
    navigate({ pathname: "/hotel/list", search: next.toString() }, { replace: true });
  }

  function handleCitySelect(city: HotelCity) {
    const next = new URLSearchParams(searchParams);
    next.set("cityCode", city.Code);
    next.set("cityName", city.Name);
    next.delete("keyword");
    next.delete("keywordType");
    next.delete("hotelId");
    next.delete("lat");
    next.delete("lng");
    navigate({ pathname: "/hotel/list", search: next.toString() }, { replace: true });
    setCityPickerOpen(false);
  }

  function openDetail(hotel: (typeof hotels)[number]) {
    const params = new URLSearchParams({
      checkIn,
      checkOut,
      cityCode: resolvedCity?.Code ?? cityCode,
      cityName: resolvedCity?.Name ?? cityName,
      minPrice: String(hotel.MinPrice ?? ""),
    });
    params.set("hotelType", hotelType);
    if (keyword) params.set("keyword", keyword);
    if (keywordType) params.set("keywordType", keywordType);
    if (hotelId) params.set("hotelId", hotelId);
    if (lat) params.set("lat", lat);
    if (lng) params.set("lng", lng);
    if (travelFormId) params.set("travelFormId", travelFormId);
    navigate(`/hotel/${hotel.HotelId}?${params.toString()}`);
  }

  return (
    <div
      className="relative h-dvh overflow-hidden"
      style={{ background: "var(--brand-form-header-gradient)" }}
    >
      <div
        ref={headerRef}
        className="fixed inset-x-0 top-0 z-50 mx-auto w-full max-w-lg"
        style={{ background: "var(--brand-form-header-gradient)" }}
      >
        <HotelListHeader
          cityName={cityName}
          checkIn={checkIn}
          checkOut={checkOut}
          keyword={keyword}
          onBack={() => navigateBack(navigate, "/hotel")}
          onCityClick={() => setCityPickerOpen(true)}
          onDateClick={() => setDatePickerOpen(true)}
          onKeywordClick={goModifySearch}
        />
      </div>

      <div
        ref={handleScrollRoot}
        className="h-full overflow-y-auto overscroll-y-contain [-webkit-overflow-scrolling:touch]"
        style={{ paddingTop: headerHeight }}
      >
        <div
          className={`flex items-end justify-center overflow-hidden text-sm text-[#9CA3AF] transition-[height] duration-200 ease-out ${HOTEL_LIST_FONT} ${
            isActive ? "opacity-100" : "opacity-0"
          }`}
          style={{ height: isActive ? pullDistance : 0 }}
          aria-live="polite"
        >
          <span className="pb-2">{statusLabel}</span>
        </div>

        <div className="relative z-0 mx-auto max-w-lg space-y-2 px-3 pb-[calc(4.75rem+0.75rem+env(safe-area-inset-bottom))] pt-1">
          {showFreeStayTip ? <HotelFreeStayTip onOpen={() => setFreeStayDialogOpen(true)} /> : null}

          {citiesLoading || isInitialLoading ? <HotelListSkeleton /> : null}

          {isError && !isFetching && !hasLoadedHotels ? (
            <div className="rounded-lg bg-white px-4 py-8 text-center">
              <p className="text-sm text-destructive">{formatApiError(error, "hotel")}</p>
              <button
                type="button"
                className="mt-3 text-sm font-medium text-brand-primary"
                onClick={() => void refresh()}
              >
                重试
              </button>
            </div>
          ) : null}

          {!citiesLoading && !isInitialLoading && !isError && hotels.length === 0 ? (
            <div className="rounded-lg bg-white px-4 py-16 text-center">
              <p className="text-sm text-[#716161]">暂无数据</p>
            </div>
          ) : null}

          {!citiesLoading && !isInitialLoading && hotels.length > 0 ? (
            <ul className="flex flex-col gap-2">
              {hotels.map((hotel) => (
                <li key={hotel.HotelId} className="overflow-hidden rounded-lg bg-white">
                  <HotelListItem hotel={hotel} onClick={() => openDetail(hotel)} />
                </li>
              ))}
            </ul>
          ) : null}

          {hasNextPage ? (
            <div
              ref={sentinelRef}
              className={`flex h-10 items-center justify-center text-sm text-[#9CA3AF] ${HOTEL_LIST_FONT}`}
              aria-hidden={!isFetchingNextPage}
            >
              {isFetchingNextPage ? "加载中..." : null}
            </div>
          ) : hasLoadedHotels ? (
            <p className="py-3 text-center text-xs text-[#9CA3AF]">没有更多酒店了</p>
          ) : null}

          {isFetching && !isLoading && !isFetchingNextPage ? (
            <p className="py-3 text-center text-xs text-[#9CA3AF]">更新中...</p>
          ) : null}
        </div>
      </div>

      <HotelListToolbar
        activeId={filterActive ? activeFilter : activeFilter === "location" ? activeFilter : null}
        filtered={filterActive}
        onSelect={openFilterSheet}
      />

      <HotelListFilterSheet
        open={filterOpen}
        filter={filterDraft}
        initialSection={filterInitialSection}
        visibleSections={filterVisibleSections}
        conditions={conditions}
        conditionsLoading={conditionsLoading}
        conditionsError={conditionsError}
        onChange={setFilterDraft}
        onClose={() => setFilterOpen(false)}
        onConfirm={handleFilterConfirm}
      />

      <HotelFreeStayDialog
        open={freeStayDialogOpen}
        onClose={() => setFreeStayDialogOpen(false)}
      />

      <HotelStayDatePickerSheet
        open={datePickerOpen}
        checkIn={checkIn}
        checkOut={checkOut}
        onClose={() => setDatePickerOpen(false)}
        onConfirm={handleDateConfirm}
      />

      <CityPicker
        open={cityPickerOpen}
        items={cities}
        title="选择酒店城市"
        historyKey={CITY_HISTORY_KEYS.hotel}
        searchPlaceholder="搜索城市名称"
        hotTitle="热门城市"
        historyTitle="历史记录"
        hotGridColumns={3}
        tone="form"
        onClose={() => setCityPickerOpen(false)}
        onSelect={handleCitySelect}
        {...hotelCityPickerAdapter}
      />
    </div>
  );
}
