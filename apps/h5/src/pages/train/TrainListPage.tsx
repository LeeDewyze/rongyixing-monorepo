import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import type { TrainItem } from "@ryx/shared-types";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ProductType } from "@ryx/shared-types";
import type {
  TrainDurationSortMode,
  TrainFilterCondition,
  TrainPriceSortMode,
  TrainSortTab,
  TrainTypeFilter,
} from "@ryx/shared-types";

import { CalendarPickerSheet } from "@/components/calendar/CalendarPickerSheet";
import { usePageHeader } from "@/components/layout";
import { TrainFilterSheet } from "@/components/train/TrainFilterSheet";
import { TrainListDateStrip } from "@/components/train/TrainListDateStrip";
import { TrainListHeader } from "@/components/train/TrainListHeader";
import { TrainListItemCard } from "@/components/train/TrainListItemCard";
import { TrainListToolbar } from "@/components/train/TrainListToolbar";
import { TrainModifySearchSheet } from "@/components/train/TrainModifySearchSheet";
import { TrainTypeFilterBar } from "@/components/train/TrainTypeFilterBar";
import { useTrainList } from "@/hooks/useTrainSearchForm";
import { usePassengerSelection } from "@/hooks/usePassenger";
import { TRAIN_CALENDAR_CONFIG } from "@/lib/calendar-picker";
import { parseLocalDate, todayDateString } from "@/lib/date-search";
import { getApiMode } from "@/lib/env";
import { formatApiError } from "@/lib/formatApiError";
import { buildPassengerSelectPath } from "@/lib/passenger-selection";
import { getTicket } from "@/lib/session";
import {
  applyTrainFilters,
  applyTrainTypeFilter,
  buildFilterOptions,
  createInitialTrainFilter,
  getTrainListItemKey,
  isTrainFilterActive,
  markLowestPrice,
  mergeTrainFilterChecks,
  normalizeTrains,
  resolveTrainListOrder,
} from "@/utils/train-list";

function buildListUrl(base: URLSearchParams, date: string): string {
  const params = new URLSearchParams(base);
  params.set("date", date);
  return `/train/list?${params.toString()}`;
}

const FALLBACK_HEADER_HEIGHT = 56;

export function TrainListPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [modifyOpen, setModifyOpen] = useState(false);
  const { selected: selectedPassengers } = usePassengerSelection(ProductType.Train);
  const listReturnTo = `/train/list?${searchParams.toString()}`;
  const isAuthenticated = getApiMode() === "mock" || Boolean(getTicket());

  const listParams = {
    Date: searchParams.get("date") ?? "",
    FromStation: searchParams.get("fromCode") ?? "",
    ToStation: searchParams.get("toCode") ?? "",
    FromName: searchParams.get("fromName") ?? undefined,
    ToName: searchParams.get("toName") ?? undefined,
  };

  const fromName = listParams.FromName ?? listParams.FromStation;
  const toName = listParams.ToName ?? listParams.ToStation;

  const hasListQuery = Boolean(
    parseLocalDate(listParams.Date) && listParams.FromStation && listParams.ToStation,
  );

  useEffect(() => {
    if (!parseLocalDate(listParams.Date) || !listParams.FromStation || !listParams.ToStation) {
      navigate("/home?product=train", { replace: true });
      return;
    }
    const today = todayDateString();
    if (listParams.Date < today) {
      const params = new URLSearchParams(searchParams);
      params.set("date", today);
      navigate(`/train/list?${params.toString()}`, { replace: true });
    }
  }, [listParams.Date, listParams.FromStation, listParams.ToStation, navigate, searchParams]);

  const [trainTypeFilter, setTrainTypeFilter] = useState<TrainTypeFilter>("all");
  const [filterDraft, setFilterDraft] = useState<TrainFilterCondition>(createInitialTrainFilter);
  const [filterApplied, setFilterApplied] =
    useState<TrainFilterCondition>(createInitialTrainFilter);
  const [filterOpen, setFilterOpen] = useState(false);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<TrainSortTab>("time");
  const [durationSortMode, setDurationSortMode] = useState<TrainDurationSortMode>("off");
  const [timeEarlyToLate, setTimeEarlyToLate] = useState(true);
  const [priceSortMode, setPriceSortMode] = useState<TrainPriceSortMode>("off");
  const [expandedTrainId, setExpandedTrainId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [headerHeight, setHeaderHeight] = useState(FALLBACK_HEADER_HEIGHT);

  const { data, isLoading, isFetching, error, refetch } = useTrainList(
    hasListQuery ? listParams : null,
  );

  const rawTrains = useMemo(() => normalizeTrains(data?.Trains), [data]);

  useEffect(() => {
    if (!rawTrains.length) return;
    const next = buildFilterOptions(rawTrains);
    setFilterDraft((prev) => mergeTrainFilterChecks(prev, next));
    setFilterApplied((prev) => mergeTrainFilterChecks(prev, next));
  }, [rawTrains]);

  const resetExpanded = useCallback(() => {
    setExpandedTrainId(null);
  }, []);

  const resetListFilters = useCallback(() => {
    setFilterApplied(createInitialTrainFilter());
    setFilterDraft(createInitialTrainFilter());
    setTrainTypeFilter("all");
    setActiveTab("time");
    setDurationSortMode("off");
    setTimeEarlyToLate(true);
    setPriceSortMode("off");
    resetExpanded();
  }, [resetExpanded]);

  const getFilteredTrains = useCallback((): TrainItem[] => {
    let trains = applyTrainTypeFilter(rawTrains, trainTypeFilter);
    trains = applyTrainFilters(trains, filterApplied);
    return trains;
  }, [rawTrains, trainTypeFilter, filterApplied]);

  const listOrderState = useMemo(
    () => ({
      activeTab,
      durationSortMode,
      timeEarlyToLate,
      priceSortMode,
    }),
    [activeTab, durationSortMode, timeEarlyToLate, priceSortMode],
  );

  useEffect(() => {
    resetExpanded();
  }, [
    listParams.Date,
    trainTypeFilter,
    filterApplied,
    activeTab,
    durationSortMode,
    timeEarlyToLate,
    priceSortMode,
    resetExpanded,
  ]);

  useLayoutEffect(() => {
    scrollContainerRef.current?.scrollTo({ top: 0, behavior: "auto" });
  }, [
    listParams.Date,
    trainTypeFilter,
    filterApplied,
    activeTab,
    durationSortMode,
    timeEarlyToLate,
    priceSortMode,
  ]);

  const displayed = useMemo(() => {
    const trains = resolveTrainListOrder(getFilteredTrains(), listOrderState);
    return markLowestPrice(trains);
  }, [getFilteredTrains, listOrderState]);

  const filtered = isTrainFilterActive(filterApplied);

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

  useEffect(() => {
    if (!toastMessage) return;
    const timer = window.setTimeout(() => setToastMessage(null), 2000);
    return () => window.clearTimeout(timer);
  }, [toastMessage]);

  if (!hasListQuery) return null;

  function handleDateSelect(date: string) {
    resetListFilters();
    navigate(buildListUrl(searchParams, date), { replace: true });
  }

  function handleFilterConfirm() {
    setFilterApplied(filterDraft);
    setFilterOpen(false);
    setActiveTab("filter");
  }

  function handleDurationSort() {
    if (activeTab !== "duration" || durationSortMode === "off") {
      setPriceSortMode("off");
      setActiveTab("duration");
      setDurationSortMode("short");
      return;
    }
    setDurationSortMode((mode) => (mode === "short" ? "long" : "short"));
  }

  function handleTimeSort() {
    if (activeTab !== "time") {
      setDurationSortMode("off");
      setPriceSortMode("off");
      setActiveTab("time");
      return;
    }
    setTimeEarlyToLate((early) => !early);
  }

  function handlePriceSort() {
    if (activeTab !== "price" || priceSortMode === "off") {
      setDurationSortMode("off");
      setActiveTab("price");
      setPriceSortMode("low");
      return;
    }
    setPriceSortMode((mode) => (mode === "low" ? "high" : "low"));
  }

  function handleModifySearch(params: URLSearchParams) {
    resetListFilters();
    navigate(`/train/list?${params.toString()}`, { replace: true });
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
    navigate(-1);
  }

  function toggleTrainCard(trainId: string) {
    setExpandedTrainId((current) => (current === trainId ? null : trainId));
  }

  return (
    <div className="relative h-dvh overflow-hidden bg-[#F5F6F9]">
      <div ref={headerRef} className="fixed inset-x-0 top-0 z-50 mx-auto w-full max-w-lg">
        <TrainListHeader
          fromName={fromName}
          toName={toName}
          passengerHref={buildPassengerSelectPath(ProductType.Train, listReturnTo)}
          passengerCount={selectedPassengers.length}
          modifyOpen={modifyOpen}
          onBack={handleHeaderBack}
          onModifyOpen={handleModifyOpen}
          onModifyClose={handleModifyClose}
        />
      </div>

      <div
        ref={scrollContainerRef}
        className={`h-full overscroll-y-contain [-webkit-overflow-scrolling:touch] [scrollbar-gutter:stable] ${
          filterOpen || modifyOpen ? "overflow-hidden" : "overflow-y-auto"
        }`}
        style={{ paddingTop: headerHeight }}
      >
        <div className="sticky top-0 z-20 shrink-0">
          <TrainListDateStrip
            selectedDate={listParams.Date}
            onSelect={handleDateSelect}
            onOpenCalendar={() => setCalendarOpen(true)}
            days={7}
          />
          <TrainTypeFilterBar
            value={trainTypeFilter}
            onChange={(value) => {
              setTrainTypeFilter(value);
              setActiveTab("time");
              setDurationSortMode("off");
              setTimeEarlyToLate(true);
              setPriceSortMode("off");
            }}
          />
        </div>

        <div className="relative z-0 space-y-3 px-3 py-3 pb-[calc(4.5rem+0.75rem+env(safe-area-inset-bottom))]">
          {!isAuthenticated && (
            <div className="rounded-xl bg-white p-8 text-center shadow-sm">
              <p className="text-sm text-[#808080]">请先登录后再查询车次</p>
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
            <p className="py-4 text-center text-sm text-[#808080]">正在获取车次列表…</p>
          )}

          {isAuthenticated && error && !isFetching && displayed.length === 0 && (
            <div className="py-4 text-center">
              <p className="text-sm text-destructive">{formatApiError(error, "train")}</p>
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
              {filtered || trainTypeFilter !== "all" ? "没有符合条件的车次" : "暂无车次"}
            </div>
          )}

          {isAuthenticated &&
            displayed.map((train, index) => (
              <TrainListItemCard
                key={getTrainListItemKey(train, index)}
                train={train}
                expanded={expandedTrainId === train.Id}
                onToggle={() => toggleTrainCard(train.Id)}
                onBookAttempt={() => setToastMessage("功能开发中")}
              />
            ))}
        </div>
      </div>

      <TrainListToolbar
        activeTab={activeTab}
        filtered={filtered}
        durationSortMode={durationSortMode}
        timeEarlyToLate={timeEarlyToLate}
        priceSortMode={priceSortMode}
        onFilter={() => {
          setFilterDraft(filterApplied);
          setFilterOpen(true);
        }}
        onDurationSort={handleDurationSort}
        onTimeSort={handleTimeSort}
        onPriceSort={handlePriceSort}
      />

      <TrainFilterSheet
        open={filterOpen}
        filter={filterDraft}
        onChange={setFilterDraft}
        onClose={() => setFilterOpen(false)}
        onConfirm={handleFilterConfirm}
      />

      <CalendarPickerSheet
        open={calendarOpen}
        config={TRAIN_CALENDAR_CONFIG}
        startDate={listParams.Date}
        endDate={listParams.Date}
        onClose={() => setCalendarOpen(false)}
        onConfirm={(selected) => {
          setCalendarOpen(false);
          handleDateSelect(selected);
        }}
      />

      <TrainModifySearchSheet
        open={modifyOpen}
        headerTop={headerHeight}
        initial={{
          fromCode: listParams.FromStation,
          toCode: listParams.ToStation,
          fromName,
          toName,
          date: listParams.Date,
        }}
        onClose={handleModifyClose}
        onSearch={handleModifySearch}
      />

      {toastMessage ? (
        <div className="pointer-events-none fixed inset-x-0 bottom-[calc(4.5rem+env(safe-area-inset-bottom))] z-50 flex justify-center px-4">
          <div className="rounded-lg bg-[#333333]/90 px-4 py-2 text-sm text-white shadow-lg">
            {toastMessage}
          </div>
        </div>
      ) : null}
    </div>
  );
}
