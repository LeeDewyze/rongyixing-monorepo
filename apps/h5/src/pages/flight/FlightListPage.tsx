import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ProductType } from "@ryx/shared-types";
import type { FlightFilterCondition, FlightSearchParams, FlightSortTab } from "@ryx/shared-types";

import { CalendarPickerSheet } from "@/components/calendar/CalendarPickerSheet";
import { PassengerSelectAlertDialog } from "@/components/passenger";
import { FlightFilterSheet } from "@/components/flight/FlightFilterSheet";
import { FlightListDateStrip } from "@/components/flight/FlightListDateStrip";
import { FlightListHeader } from "@/components/flight/FlightListHeader";
import { FlightListToolbar } from "@/components/flight/FlightListToolbar";
import { FlightModifySearchSheet } from "@/components/flight/FlightModifySearchSheet";
import { FlightSegmentCard } from "@/components/flight/FlightSegmentCard";
import { FlightPolicyLoadingOverlay } from "@/components/flight/FlightPolicyLoadingOverlay";
import { usePageHeader } from "@/components/layout";
import { useFlightListPageEffects } from "@/hooks/useFlightListPageEffects";
import { useFlightList } from "@/hooks/useFlight";
import { useFlightSearchForm } from "@/hooks/useFlightSearchForm";
import { usePassengerSelection } from "@/hooks/usePassenger";
import {
  buildFlightListSearchParams,
  buildHomeIndexParams,
  resolveListCitiesFromQuery,
} from "@/lib/flight-search";
import { buildCabinsPath, getFlightListEmptyMessage } from "@/lib/flight-list-refresh";
import { saveFlightListSnapshot } from "@/lib/flight-list-session";
import { prefetchFlightCabinsPolicy } from "@/lib/flight-cabins-preflight";
import { FLIGHT_NO_POLICY_SEATS_MESSAGE } from "@/lib/flight-cabin-policy";
import { hasAgentIdentity } from "@/lib/flight-book-save-order";
import { useIdentity } from "@/hooks/useIdentity";
import { parseLocalDate, todayDateString } from "@/lib/date-search";
import { FLIGHT_CALENDAR_CONFIG } from "@/lib/calendar-picker";
import { buildPassengerSelectPath } from "@/lib/passenger-selection";
import { getApiMode } from "@/lib/env";
import { formatApiError } from "@/lib/formatApiError";
import { getTicket } from "@/lib/session";
import {
  loadHomeTravelMode,
  resolveProductChannel,
  resolveTravelModeFromProductChannel,
} from "@/lib/flight-travel-mode";
import {
  applyFlightFilters,
  buildFilterOptions,
  createInitialFilter,
  getDefaultSortedFlights,
  initLowestPriceSegments,
  isFilterActive,
  normalizeFlightSegments,
  resolveFlightSegmentId,
  sortByPrice,
  sortByTime,
} from "@/utils/flight-list";
import { partitionFlightList, resolveFlightCardVariant } from "@/utils/flight-list-display";
import { navigateBack } from "@/lib/navigation";

function buildListUrl(base: URLSearchParams, date: string): string {
  const params = new URLSearchParams(base);
  params.set("date", date);
  return `/flight/list?${params.toString()}`;
}

const FALLBACK_HEADER_HEIGHT = 56;
const FLIGHT_LIST_PASSENGER_REQUIRED_MESSAGE = "请先添加旅客";

export function FlightListPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const form = useFlightSearchForm();
  const { selected: selectedPassengers } = usePassengerSelection(ProductType.Flight);
  const { data: identity } = useIdentity();
  const isAgent = hasAgentIdentity(identity);
  const listReturnTo = `/flight/list?${searchParams.toString()}`;
  const isAuthenticated = getApiMode() === "mock" || Boolean(getTicket());
  const travelMode = useMemo(
    () => resolveTravelModeFromProductChannel(searchParams.get("channel"), loadHomeTravelMode()),
    [searchParams],
  );
  const productChannel = resolveProductChannel(travelMode);

  const listParams: FlightSearchParams = {
    Date: searchParams.get("date") ?? "",
    FromCode: searchParams.get("fromCode") ?? "",
    ToCode: searchParams.get("toCode") ?? "",
    FromAsAirport: searchParams.get("fromAsAirport") === "true",
    ToAsAirport: searchParams.get("toAsAirport") === "true",
  };

  const fromName = searchParams.get("fromName") ?? listParams.FromCode;
  const toName = searchParams.get("toName") ?? listParams.ToCode;

  useEffect(() => {
    if (!form.airports.length) return;
    form.resetFromQuery({
      fromCode: listParams.FromCode,
      toCode: listParams.ToCode,
      fromName,
      toName,
      date: listParams.Date,
      fromAsAirport: listParams.FromAsAirport,
      toAsAirport: listParams.ToAsAirport,
    });
  }, [
    listParams.FromCode,
    listParams.ToCode,
    listParams.Date,
    listParams.FromAsAirport,
    listParams.ToAsAirport,
    fromName,
    toName,
    form.airports.length,
    form.resetFromQuery,
  ]);

  const hasListQuery = Boolean(
    parseLocalDate(listParams.Date) && listParams.FromCode && listParams.ToCode,
  );

  useEffect(() => {
    if (!parseLocalDate(listParams.Date) || !listParams.FromCode || !listParams.ToCode) {
      navigate("/home?product=flight", { replace: true });
      return;
    }
    const today = todayDateString();
    if (listParams.Date < today) {
      const params = new URLSearchParams(searchParams);
      params.set("date", today);
      navigate(`/flight/list?${params.toString()}`, { replace: true });
    }
  }, [listParams.Date, listParams.FromCode, listParams.ToCode, navigate, searchParams]);

  const [filterDraft, setFilterDraft] = useState<FlightFilterCondition>(createInitialFilter);
  const [filterApplied, setFilterApplied] = useState<FlightFilterCondition>(createInitialFilter);
  const [filterOpen, setFilterOpen] = useState(false);
  const [modifyOpen, setModifyOpen] = useState(false);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<FlightSortTab>("none");
  const [priceLowToHigh, setPriceLowToHigh] = useState(true);
  const [timeEarlyToLate, setTimeEarlyToLate] = useState(true);
  const headerRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [headerHeight, setHeaderHeight] = useState(FALLBACK_HEADER_HEIGHT);
  const [passengerAlertOpen, setPassengerAlertOpen] = useState(false);
  const [openingCabinsId, setOpeningCabinsId] = useState<string | null>(null);

  const resolvedListCities = useMemo(
    () =>
      resolveListCitiesFromQuery(form.airports, {
        fromCode: listParams.FromCode,
        toCode: listParams.ToCode,
        fromName,
        toName,
        date: listParams.Date,
        fromAsAirport: listParams.FromAsAirport,
        toAsAirport: listParams.ToAsAirport,
      }),
    [
      form.airports,
      listParams.FromCode,
      listParams.ToCode,
      listParams.FromAsAirport,
      listParams.ToAsAirport,
      listParams.Date,
      fromName,
      toName,
    ],
  );

  const apiListParams = useMemo((): FlightSearchParams | null => {
    if (!hasListQuery || !resolvedListCities) return null;
    return buildHomeIndexParams(
      resolvedListCities.fromCity,
      resolvedListCities.toCity,
      listParams.Date,
      productChannel,
    );
  }, [hasListQuery, resolvedListCities, listParams.Date, productChannel]);

  const { data, isLoading, isFetching, error, refetch, dataUpdatedAt } =
    useFlightList(apiListParams);

  useEffect(() => {
    if (data && apiListParams) {
      saveFlightListSnapshot(apiListParams, data);
    }
  }, [apiListParams, data]);

  useEffect(() => {
    if (!resolvedListCities || !hasListQuery) return;
    const canonical = buildFlightListSearchParams({
      fromCity: resolvedListCities.fromCity,
      toCity: resolvedListCities.toCity,
      date: listParams.Date,
      channel: productChannel,
    });
    const extras = new URLSearchParams(searchParams);
    for (const key of [
      "fromCode",
      "toCode",
      "fromName",
      "toName",
      "date",
      "fromAsAirport",
      "toAsAirport",
      "channel",
    ]) {
      extras.delete(key);
    }
    const next = new URLSearchParams(canonical);
    for (const [key, value] of extras.entries()) {
      next.set(key, value);
    }
    if (next.toString() !== searchParams.toString()) {
      navigate(`/flight/list?${next.toString()}`, { replace: true });
    }
  }, [resolvedListCities, hasListQuery, listParams.Date, navigate, productChannel, searchParams]);

  const resetListFilters = useCallback(() => {
    setFilterApplied(createInitialFilter());
    setFilterDraft(createInitialFilter());
    setActiveTab("none");
  }, []);

  const stripDoRefresh = useCallback(() => {
    if (searchParams.get("doRefresh") !== "true") return;
    const next = new URLSearchParams(searchParams);
    next.delete("doRefresh");
    navigate(`/flight/list?${next.toString()}`, { replace: true });
  }, [navigate, searchParams]);

  useFlightListPageEffects({
    listParams: apiListParams ?? listParams,
    searchParams,
    selectedPassengers,
    hasListQuery,
    dataUpdatedAt,
    isFetching,
    refetch,
    onFullRefresh: resetListFilters,
    stripDoRefresh,
  });

  const rawSegments = useMemo(() => normalizeFlightSegments(data), [data]);

  useEffect(() => {
    if (!rawSegments.length) return;
    const next = buildFilterOptions(rawSegments);
    setFilterDraft((prev) => mergeFilterChecks(prev, next));
    setFilterApplied((prev) => mergeFilterChecks(prev, next));
  }, [rawSegments]);

  const displayed = useMemo(() => {
    let segments = initLowestPriceSegments(applyFlightFilters(rawSegments, filterApplied));
    if (activeTab === "price") {
      segments = sortByPrice(segments, priceLowToHigh);
    } else if (activeTab === "time") {
      segments = sortByTime(segments, timeEarlyToLate);
    } else {
      segments = getDefaultSortedFlights(segments);
    }
    return segments;
  }, [rawSegments, filterApplied, activeTab, priceLowToHigh, timeEarlyToLate]);

  const filtered = isFilterActive(filterApplied);
  const { directFlights, transferFlights } = useMemo(
    () => partitionFlightList(displayed),
    [displayed],
  );

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
  }, [listParams.Date, filterApplied, activeTab, priceLowToHigh, timeEarlyToLate]);

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

  if (!hasListQuery) return null;

  function handleDateSelect(date: string) {
    navigate(buildListUrl(searchParams, date), { replace: true });
  }

  function handleFilterConfirm() {
    setFilterApplied(filterDraft);
    setFilterOpen(false);
    setActiveTab("filter");
  }

  function handleTimeSort() {
    if (activeTab !== "time") {
      setActiveTab("time");
      return;
    }
    setTimeEarlyToLate((early) => !early);
  }

  function handlePriceSort() {
    if (activeTab !== "price") {
      setActiveTab("price");
      return;
    }
    setPriceLowToHigh((low) => !low);
  }

  function handleModifySearch(params: URLSearchParams) {
    resetListFilters();
    navigate(`/flight/list?${params.toString()}`, { replace: true });
  }

  function handleModifyOpen() {
    setModifyOpen(true);
  }

  function handleModifyClose() {
    setModifyOpen(false);
  }

  function handleHeaderBack() {
    if (modifyOpen) {
      handleModifyClose();
      return;
    }
    navigateBack(navigate, "/home?product=flight");
  }

  async function openCabins(flightId: string) {
    const segment = displayed.find((s) => s.Id === flightId);
    if (!segment) return;
    if (selectedPassengers.length === 0) {
      setPassengerAlertOpen(true);
      return;
    }
    if (openingCabinsId) return;

    setOpeningCabinsId(flightId);
    try {
      const { policyResults } = await prefetchFlightCabinsPolicy({
        segment,
        listParams,
        searchParams,
        passengers: selectedPassengers,
      });
      if (!policyResults.length && !isAgent) {
        window.alert(FLIGHT_NO_POLICY_SEATS_MESSAGE);
        return;
      }
      navigate(buildCabinsPath(segment, searchParams));
    } catch (error) {
      window.alert(formatApiError(error, "flight"));
    } finally {
      setOpeningCabinsId(null);
    }
  }

  function handlePassengerAlertDismiss() {
    setPassengerAlertOpen(false);
  }

  function handlePassengerAlertConfirm() {
    setPassengerAlertOpen(false);
    navigate(buildPassengerSelectPath(ProductType.Flight, listReturnTo));
  }

  return (
    <div className="relative h-dvh overflow-hidden bg-[#F5F6F9]">
      <div ref={headerRef} className="fixed inset-x-0 top-0 z-50 mx-auto w-full max-w-lg">
        <FlightListHeader
          fromName={fromName}
          toName={toName}
          passengerHref={buildPassengerSelectPath(ProductType.Flight, listReturnTo)}
          passengerCount={selectedPassengers.length}
          modifyOpen={modifyOpen}
          onBack={handleHeaderBack}
          onModifyOpen={handleModifyOpen}
          onModifyClose={handleModifyClose}
        />
      </div>

      <div
        ref={scrollContainerRef}
        className={`h-full overscroll-y-contain [-webkit-overflow-scrolling:touch] [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden ${
          filterOpen || modifyOpen ? "overflow-hidden" : "overflow-y-auto"
        }`}
        style={{ paddingTop: headerHeight }}
      >
        <div className="sticky top-0 z-20 shrink-0">
          <FlightListDateStrip
            selectedDate={listParams.Date}
            onSelect={handleDateSelect}
            onOpenCalendar={() => setCalendarOpen(true)}
          />
        </div>

        <div className="relative z-0 space-y-3 px-3 py-3 pb-[calc(4.5rem+0.75rem+env(safe-area-inset-bottom))]">
          {!isAuthenticated && (
            <div className="rounded-xl bg-white p-8 text-center shadow-sm">
              <p className="text-sm text-[#808080]">请先登录后再查询航班</p>
              <button
                type="button"
                className="mt-3 text-sm font-medium text-[#5099fe]"
                onClick={() =>
                  navigate(`/login/password?returnTo=${encodeURIComponent(listReturnTo)}`)
                }
              >
                去登录
              </button>
            </div>
          )}

          {isAuthenticated && (isLoading || isFetching) && (
            <p className="py-4 text-center text-sm text-[#808080]">正在获取航班列表…</p>
          )}

          {isAuthenticated && error && !isFetching && displayed.length === 0 && (
            <div className="py-4 text-center">
              <p className="text-sm text-destructive">{formatApiError(error, "flight")}</p>
              <button
                type="button"
                className="mt-2 text-sm font-medium text-[#5099fe]"
                onClick={() => refetch()}
              >
                重试
              </button>
            </div>
          )}

          {isAuthenticated && !isLoading && !error && displayed.length === 0 && (
            <div className="rounded-xl bg-white p-8 text-center text-sm text-[#808080] shadow-sm">
              {getFlightListEmptyMessage(filtered)}
            </div>
          )}

          {isAuthenticated &&
            directFlights.map((seg) => (
              <FlightSegmentCard
                key={resolveFlightSegmentId(seg)}
                segment={seg}
                variant={resolveFlightCardVariant(seg, "direct")}
                loading={openingCabinsId === seg.Id}
                onClick={() => void openCabins(resolveFlightSegmentId(seg))}
              />
            ))}

          {isAuthenticated && transferFlights.length > 0 && (
            <>
              <div className="flex items-center gap-2 py-1 text-center text-xs text-[#999999]">
                <span className="h-px flex-1 bg-[#e5e5e5]" />
                <span className="shrink-0 px-2">推荐中转航班</span>
                <span className="h-px flex-1 bg-[#e5e5e5]" />
              </div>
              {transferFlights.map((seg) => (
                <FlightSegmentCard
                  key={resolveFlightSegmentId(seg)}
                  segment={seg}
                  variant={resolveFlightCardVariant(seg, "transfer")}
                  loading={openingCabinsId === seg.Id}
                  onClick={() => void openCabins(resolveFlightSegmentId(seg))}
                />
              ))}
            </>
          )}
        </div>
      </div>

      <FlightListToolbar
        activeTab={activeTab}
        filtered={filtered}
        priceLowToHigh={priceLowToHigh}
        timeEarlyToLate={timeEarlyToLate}
        onFilter={() => {
          setFilterDraft(filterApplied);
          setFilterOpen(true);
        }}
        onTimeSort={handleTimeSort}
        onPriceSort={handlePriceSort}
      />

      <FlightFilterSheet
        open={filterOpen}
        filter={filterDraft}
        onChange={setFilterDraft}
        onClose={() => setFilterOpen(false)}
        onConfirm={handleFilterConfirm}
      />

      <CalendarPickerSheet
        open={calendarOpen}
        config={FLIGHT_CALENDAR_CONFIG}
        startDate={listParams.Date}
        endDate={listParams.Date}
        onClose={() => setCalendarOpen(false)}
        onConfirm={(selected) => {
          setCalendarOpen(false);
          handleDateSelect(selected);
        }}
      />

      <FlightModifySearchSheet
        open={modifyOpen}
        headerTop={headerHeight}
        initial={{
          fromCode: listParams.FromCode,
          toCode: listParams.ToCode,
          fromName,
          toName,
          date: listParams.Date,
          fromAsAirport: listParams.FromAsAirport,
          toAsAirport: listParams.ToAsAirport,
        }}
        onClose={handleModifyClose}
        onSearch={handleModifySearch}
      />

      <PassengerSelectAlertDialog
        open={passengerAlertOpen}
        message={FLIGHT_LIST_PASSENGER_REQUIRED_MESSAGE}
        onClose={handlePassengerAlertDismiss}
        onConfirm={handlePassengerAlertConfirm}
      />

      <FlightPolicyLoadingOverlay open={openingCabinsId != null} />
    </div>
  );
}

function mergeFilterChecks(
  current: FlightFilterCondition,
  next: FlightFilterCondition,
): FlightFilterCondition {
  const merge = (
    prev: FlightFilterCondition["airCompanies"],
    options: FlightFilterCondition["airCompanies"],
  ) =>
    options.map((o) => ({
      ...o,
      isChecked: prev.find((p) => p.id === o.id)?.isChecked ?? false,
    }));

  return {
    onlyDirect: current.onlyDirect,
    isAgreement: current.isAgreement,
    takeOffTimeSpan: current.takeOffTimeSpan,
    airCompanies: merge(current.airCompanies, next.airCompanies),
    fromAirports: merge(current.fromAirports, next.fromAirports),
    toAirports: merge(current.toAirports, next.toAirports),
    airTypes: merge(current.airTypes, next.airTypes),
  };
}
