import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import type { TrainItem, TrainSeat } from "@ryx/shared-types";
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
import { FlightPolicyLoadingOverlay } from "@/components/flight/FlightPolicyLoadingOverlay";
import { HotelPolicyAlertDialog } from "@/components/hotel/HotelPolicyAlertDialog";
import { HotelPassengerRequiredDialog } from "@/components/hotel/HotelPassengerRequiredDialog";
import { usePageHeader } from "@/components/layout";
import {
  resolveTravelPolicyRecord,
  TravelPolicyDialog,
} from "@/components/policy/TravelPolicyDialog";
import { PolicyFilterSheet } from "@/components/policy/PolicyFilterSheet";
import { TrainFilterSheet } from "@/components/train/TrainFilterSheet";
import { TrainListEmptyState } from "@/components/train/TrainListEmptyState";
import { TrainListDateStrip } from "@/components/train/TrainListDateStrip";
import { TrainListHeader } from "@/components/train/TrainListHeader";
import { TrainListItemCard } from "@/components/train/TrainListItemCard";
import { TrainListToolbar } from "@/components/train/TrainListToolbar";
import { TrainModifySearchSheet } from "@/components/train/TrainModifySearchSheet";
import { TrainTypeFilterBar } from "@/components/train/TrainTypeFilterBar";
import { useTrainList } from "@/hooks/useTrainSearchForm";
import { useLockMainColumnScroll } from "@/hooks/useLockMainColumnScroll";
import { useTrainPolicy } from "@/hooks/useTrainBook";
import { useBusinessSelfBookPassenger } from "@/hooks/useBusinessSelfBookPassenger";
import { useIdentity } from "@/hooks/useIdentity";
import { TRAIN_CALENDAR_CONFIG } from "@/lib/calendar-picker";
import { parseLocalDate, todayDateString, trainMaxSelectableDate } from "@/lib/date-search";
import { getApiMode } from "@/lib/env";
import { formatApiError } from "@/lib/formatApiError";
import { buildPassengerSelectPath } from "@/lib/passenger-selection";
import { hasAgentIdentity } from "@/lib/flight-book-save-order";
import {
  loadHomeTravelMode,
  resolveProductChannel,
  resolveTravelModeFromProductChannel,
} from "@/lib/flight-travel-mode";
import {
  applyTrainPolicyColors,
  buildTrainPolicyExceedAlertMessage,
  buildTrainPolicyParams,
  findSeatPolicyForPassenger,
  isTrainSeatBookable,
} from "@/lib/train-book-policy";
import { saveTrainBookSelection } from "@/lib/train-book-session";
import {
  isTrainExchangeListActive,
  syncTrainExchangeSessionForListUrl,
  TRAIN_EXCHANGE_SESSION_EVENT,
  type TrainExchangeSession,
} from "@/lib/train-exchange-session";
import { persistTrainSearchDate } from "@/lib/train-search";
import { getTicket } from "@/lib/session";
import { WEB_PAGE_BODY, WEB_PAGE_ROOT, WEB_PAGE_STICKY_HEADER } from "@/lib/web-page-layout";
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
  const { data: identity } = useIdentity();
  const isAgent = hasAgentIdentity(identity);
  const listReturnTo = `/train/list?${searchParams.toString()}`;
  const isAuthenticated = getApiMode() === "mock" || Boolean(getTicket());
  const travelMode = useMemo(
    () => resolveTravelModeFromProductChannel(searchParams.get("channel"), loadHomeTravelMode()),
    [searchParams],
  );
  const productChannel = resolveProductChannel(travelMode);
  const isBusinessMode = productChannel === "tmc";

  const listParams = {
    Date: searchParams.get("date") ?? "",
    FromStation: searchParams.get("fromCode") ?? "",
    ToStation: searchParams.get("toCode") ?? "",
    FromName: searchParams.get("fromName") ?? undefined,
    ToName: searchParams.get("toName") ?? undefined,
  };

  const fromName = listParams.FromName ?? listParams.FromStation;
  const toName = listParams.ToName ?? listParams.ToStation;
  const [exchangeSession, setExchangeSession] = useState<TrainExchangeSession | null>(() =>
    syncTrainExchangeSessionForListUrl(searchParams),
  );
  const isExchangeMode = isTrainExchangeListActive(searchParams, exchangeSession);
  const passengerContext = useBusinessSelfBookPassenger(
    ProductType.Train,
    isBusinessMode && !isExchangeMode,
  );
  const selfTravelPolicy = useMemo(
    () =>
      resolveTravelPolicyRecord(passengerContext.selfPassenger?.passenger) ??
      resolveTravelPolicyRecord(passengerContext.policyStaff) ??
      resolveTravelPolicyRecord(passengerContext.staff),
    [passengerContext.policyStaff, passengerContext.selfPassenger, passengerContext.staff],
  );
  const selfTravelPolicyPassengerName =
    passengerContext.selfPassenger?.credential.Name ??
    passengerContext.selfPassenger?.passenger.Name;
  const bookingPassengers = useMemo(() => {
    if (isExchangeMode && exchangeSession?.passengers?.length) {
      return exchangeSession.passengers;
    }
    return passengerContext.passengers;
  }, [exchangeSession, isExchangeMode, passengerContext.passengers]);

  useEffect(() => {
    const syncExchangeSession = () => {
      setExchangeSession(syncTrainExchangeSessionForListUrl(searchParams));
    };
    syncExchangeSession();
    window.addEventListener(TRAIN_EXCHANGE_SESSION_EVENT, syncExchangeSession);
    return () => window.removeEventListener(TRAIN_EXCHANGE_SESSION_EVENT, syncExchangeSession);
  }, [searchParams]);

  const hasListQuery = Boolean(
    parseLocalDate(listParams.Date) && listParams.FromStation && listParams.ToStation,
  );

  useEffect(() => {
    if (!parseLocalDate(listParams.Date) || !listParams.FromStation || !listParams.ToStation) {
      navigate("/home?product=train", { replace: true });
      return;
    }
    const today = todayDateString();
    const maxDate = trainMaxSelectableDate(today);
    if (listParams.Date < today) {
      const params = new URLSearchParams(searchParams);
      params.set("date", today);
      persistTrainSearchDate(today);
      navigate(`/train/list?${params.toString()}`, { replace: true });
      return;
    }
    if (listParams.Date > maxDate) {
      const params = new URLSearchParams(searchParams);
      params.set("date", maxDate);
      persistTrainSearchDate(maxDate);
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
  const [policyAlertMessage, setPolicyAlertMessage] = useState<string | null>(null);
  const [travelPolicyOpen, setTravelPolicyOpen] = useState(false);
  const [policyFilterOpen, setPolicyFilterOpen] = useState(false);
  const [policyFilterEnabled, setPolicyFilterEnabled] = useState(true);
  const [filterPassengerId, setFilterPassengerId] = useState<string | null>(null);
  const [passengerRequiredOpen, setPassengerRequiredOpen] = useState(false);
  const headerRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [headerHeight, setHeaderHeight] = useState(FALLBACK_HEADER_HEIGHT);

  const { data, isLoading, isFetching, error, refetch } = useTrainList(
    hasListQuery ? { ...listParams, channel: productChannel } : null,
  );

  const rawTrains = useMemo(() => normalizeTrains(data?.Trains), [data]);

  const policyParams = useMemo(
    () =>
      buildTrainPolicyParams({
        trains: rawTrains,
        passengers: isBusinessMode ? bookingPassengers : [],
      }),
    [isBusinessMode, rawTrains, bookingPassengers],
  );

  const {
    data: policyResults,
    isLoading: isPolicyLoading,
    isFetching: isPolicyFetching,
    isError: isPolicyError,
  } = useTrainPolicy(isAuthenticated && isBusinessMode && rawTrains.length ? policyParams : null);

  const isPolicyChecking =
    isAuthenticated &&
    isBusinessMode &&
    rawTrains.length > 0 &&
    bookingPassengers.length > 0 &&
    (isPolicyLoading || isPolicyFetching);

  const policyChecked = !isPolicyFetching && !isPolicyError && Boolean(policyResults);
  const showPolicyFilter =
    isBusinessMode &&
    !isExchangeMode &&
    !passengerContext.isSelfBookOnly &&
    bookingPassengers.length > 1;

  const filterPassengerName = useMemo(() => {
    if (!filterPassengerId) return "";
    return bookingPassengers.find((item) => item.id === filterPassengerId)?.passenger.Name ?? "";
  }, [bookingPassengers, filterPassengerId]);

  useEffect(() => {
    if (!rawTrains.length) return;
    const next = buildFilterOptions(rawTrains);
    setFilterDraft((prev) => mergeTrainFilterChecks(prev, next));
    setFilterApplied((prev) => mergeTrainFilterChecks(prev, next));
  }, [rawTrains]);

  useEffect(() => {
    if (!bookingPassengers.length) {
      setFilterPassengerId(null);
      return;
    }
    setFilterPassengerId((prev) => {
      if (prev && bookingPassengers.some((item) => item.id === prev)) return prev;
      return bookingPassengers[0]?.id ?? null;
    });
    if (passengerContext.isSelfBookOnly || bookingPassengers.length === 1) {
      setPolicyFilterEnabled(true);
    }
  }, [bookingPassengers, passengerContext.isSelfBookOnly]);

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
    const marked = markLowestPrice(trains);
    if (!isBusinessMode || !policyResults) return marked;
    return applyTrainPolicyColors(
      marked,
      policyResults,
      bookingPassengers,
      filterPassengerId,
      policyFilterEnabled,
    );
  }, [
    getFilteredTrains,
    isBusinessMode,
    listOrderState,
    policyResults,
    bookingPassengers,
    filterPassengerId,
    policyFilterEnabled,
  ]);

  const filtered = isTrainFilterActive(filterApplied);
  const showListLoading = isAuthenticated && (isLoading || isFetching) && displayed.length === 0;
  const showListError = isAuthenticated && Boolean(error) && !isFetching && displayed.length === 0;
  const showListEmpty =
    isAuthenticated && !isLoading && !isFetching && !error && displayed.length === 0;

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

  useLockMainColumnScroll();

  const handleBookAttempt = useCallback(
    (train: TrainItem, seat: TrainSeat) => {
      if (isBusinessMode && !isExchangeMode && passengerContext.isLoading) {
        return;
      }
      if (isBusinessMode && !isExchangeMode && !bookingPassengers.length) {
        setPassengerRequiredOpen(true);
        return;
      }

      if (isBusinessMode && bookingPassengers.length > 0) {
        for (const passenger of bookingPassengers) {
          const passengerPolicy = findSeatPolicyForPassenger(
            policyResults,
            bookingPassengers,
            train,
            seat,
            passenger.id,
          );
          const passengerSeat = { ...seat, policy: passengerPolicy };
          const passengerColor: TrainSeat["policyColor"] = passengerPolicy
            ? passengerPolicy.IsAllowBook === false
              ? "danger"
              : passengerPolicy.Rules?.length
                ? "warning"
                : "success"
            : seat.policyColor;
          const bookable = isTrainSeatBookable(passengerColor, isAgent, policyChecked);
          if (!bookable) {
            setPolicyAlertMessage(
              buildTrainPolicyExceedAlertMessage(train, passengerSeat, [passenger], isAgent),
            );
            return;
          }

          if (passengerColor === "danger" && isAgent) {
            setPolicyAlertMessage(
              buildTrainPolicyExceedAlertMessage(train, passengerSeat, [passenger], true),
            );
          }
        }
      }

      saveTrainBookSelection({
        searchParams: { ...listParams, channel: productChannel },
        train,
        seat,
        trainSnapshot: train.searchSnapshot,
        policy: seat.policy,
        passengers: bookingPassengers,
        selectedAt: Date.now(),
        travelMode,
        isExchange: isExchangeMode,
      });
      navigate("/train/book");
    },
    [
      isBusinessMode,
      isExchangeMode,
      bookingPassengers,
      isAgent,
      policyChecked,
      navigate,
      listReturnTo,
      listParams,
      productChannel,
      passengerContext.isLoading,
      travelMode,
      policyResults,
    ],
  );

  function handlePolicyFilterConfirm(passengerId: string | null) {
    if (passengerId === null) {
      setPolicyFilterEnabled(false);
      return;
    }
    setPolicyFilterEnabled(true);
    setFilterPassengerId(passengerId);
  }

  function handlePassengerRequiredConfirm() {
    setPassengerRequiredOpen(false);
    navigate(buildPassengerSelectPath(ProductType.Train, listReturnTo));
  }

  if (!hasListQuery) return null;

  function handleDateSelect(date: string) {
    resetListFilters();
    persistTrainSearchDate(date);
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
    persistTrainSearchDate(params.get("date") ?? "");
    if (productChannel) params.set("channel", productChannel);
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
    <div className={WEB_PAGE_ROOT}>
      <div ref={headerRef} className={WEB_PAGE_STICKY_HEADER}>
        <TrainListHeader
          fromName={fromName}
          toName={toName}
          passengerHref={buildPassengerSelectPath(ProductType.Train, listReturnTo)}
          passengerCount={bookingPassengers.length}
          showPassengerEntry={isBusinessMode && !isExchangeMode}
          selfBookOnly={passengerContext.isSelfBookOnly && !isExchangeMode}
          modifyOpen={modifyOpen}
          onBack={handleHeaderBack}
          onModifyOpen={handleModifyOpen}
          onModifyClose={handleModifyClose}
          onOpenPolicy={() => setTravelPolicyOpen(true)}
          showPolicyFilter={showPolicyFilter}
          onOpenPolicyFilter={() => setPolicyFilterOpen(true)}
        />
      </div>

      {isExchangeMode ? (
        <div className="shrink-0 border-b border-[#FFE7BA] bg-[#FFF7E6] px-4 py-2.5 text-[13px] text-[#AD6800] pc:px-6">
          改签模式：请选择新的车次与席别
        </div>
      ) : null}

      <div
        ref={scrollContainerRef}
        className={`${WEB_PAGE_BODY} [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden ${
          filterOpen || modifyOpen || policyFilterOpen ? "overflow-hidden" : ""
        }`}
      >
        {showPolicyFilter && policyFilterEnabled && filterPassengerName ? (
          <button
            type="button"
            className="mx-3 mt-2 flex w-[calc(100%-1.5rem)] items-center gap-2 rounded-xl border border-[#D6E4FF] bg-[linear-gradient(90deg,#F5F8FF_0%,#FFFFFF_100%)] px-3 py-2.5 text-left shadow-[0_1px_4px_rgba(39,104,250,0.06)] active:opacity-90 pc:mx-6 pc:w-[calc(100%-3rem)]"
            onClick={() => setPolicyFilterOpen(true)}
          >
            <span className="flex size-4 shrink-0 items-center justify-center rounded-full bg-[#2768FA] text-[10px] font-semibold text-white">
              标
            </span>
            <span className="min-w-0 flex-1 text-[12px] leading-snug text-[#2768FA]">
              已按照【{filterPassengerName}】的差旅标准过滤坐席
            </span>
            <span className="shrink-0 text-[12px] text-[#2768FA]/70" aria-hidden>
              ›
            </span>
          </button>
        ) : null}
        <div className="sticky top-0 z-20 shrink-0">
          <TrainListDateStrip
            selectedDate={listParams.Date}
            onSelect={handleDateSelect}
            onOpenCalendar={() => setCalendarOpen(true)}
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
                  navigate(`/login/password?returnTo=${encodeURIComponent(listReturnTo)}`, {
                    replace: true,
                  })
                }
              >
                去登录
              </button>
            </div>
          )}

          {isAuthenticated && (isLoading || isFetching) && displayed.length > 0 && (
            <p className="py-2 text-center text-xs text-[#9CA3AF]">更新中…</p>
          )}

          {showListLoading ? <TrainListEmptyState variant="loading" /> : null}

          {showListError ? (
            <TrainListEmptyState
              variant="error"
              message={formatApiError(error, "train")}
              onRetry={() => void refetch()}
            />
          ) : null}

          {showListEmpty ? (
            <TrainListEmptyState
              variant={filtered || trainTypeFilter !== "all" ? "no-match" : "no-trains"}
            />
          ) : null}

          {isAuthenticated &&
            displayed.map((train, index) => (
              <TrainListItemCard
                key={getTrainListItemKey(train, index)}
                train={train}
                searchDate={listParams.Date}
                expanded={expandedTrainId === train.Id}
                isAgent={isAgent}
                policyChecked={policyChecked}
                onToggle={() => toggleTrainCard(train.Id)}
                onBookAttempt={(seat) => handleBookAttempt(train, seat)}
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

      <HotelPassengerRequiredDialog
        open={passengerRequiredOpen}
        message="请添加旅客"
        onClose={() => setPassengerRequiredOpen(false)}
        onConfirm={handlePassengerRequiredConfirm}
      />

      <HotelPolicyAlertDialog
        open={Boolean(policyAlertMessage)}
        message={policyAlertMessage ?? ""}
        onClose={() => setPolicyAlertMessage(null)}
      />

      <TravelPolicyDialog
        open={travelPolicyOpen}
        passengerName={selfTravelPolicyPassengerName}
        policy={selfTravelPolicy}
        loading={passengerContext.isLoading}
        productType={ProductType.Train}
        onClose={() => setTravelPolicyOpen(false)}
      />

      <PolicyFilterSheet
        open={showPolicyFilter && policyFilterOpen}
        passengers={bookingPassengers}
        showAllSelected={!policyFilterEnabled}
        selectedPassengerId={filterPassengerId}
        description="选择查看全部坐席，或按旅客差旅标准筛选"
        onClose={() => setPolicyFilterOpen(false)}
        onConfirm={handlePolicyFilterConfirm}
      />

      <FlightPolicyLoadingOverlay open={isPolicyChecking} />
    </div>
  );
}
