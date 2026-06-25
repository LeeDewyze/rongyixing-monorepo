import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ProductType } from "@ryx/shared-types";
import type {
  FlightFilterCondition,
  FlightSearchParams,
  FlightSortTab,
  Trafficline,
} from "@ryx/shared-types";

import { FlightCityPickerHost } from "@/components/flight/common";
import { FlightFilterSheet } from "@/components/flight/FlightFilterSheet";
import { FlightListDateStrip } from "@/components/flight/FlightListDateStrip";
import { FlightListHeader } from "@/components/flight/FlightListHeader";
import { FlightListTimeoutDialog } from "@/components/flight/FlightListTimeoutDialog";
import { FlightListToolbar } from "@/components/flight/FlightListToolbar";
import { FlightModifySearchSheet } from "@/components/flight/FlightModifySearchSheet";
import { FlightSegmentCard } from "@/components/flight/FlightSegmentCard";
import { FlightSortSheet, type FlightSortKind } from "@/components/flight/FlightSortSheet";
import { usePageHeader } from "@/components/layout";
import { useFlightListPageEffects } from "@/hooks/useFlightListPageEffects";
import { useFlightList } from "@/hooks/useFlight";
import { useFlightSearchForm } from "@/hooks/useFlightSearchForm";
import { usePassengerSelection } from "@/hooks/usePassenger";
import {
  buildFlightListSearchParams,
  buildHomeIndexParams,
  displayCityName,
  resolveListCitiesFromQuery,
  validateFlightSearch,
} from "@/lib/flight-search";
import { buildCabinsPath, getFlightListEmptyMessage } from "@/lib/flight-list-refresh";
import { saveFlightListSnapshot } from "@/lib/flight-list-session";
import { parseLocalDate, todayDateString } from "@/lib/date-search";
import { buildPassengerSelectPath } from "@/lib/passenger-selection";
import { getApiMode } from "@/lib/env";
import { formatApiError } from "@/lib/formatApiError";
import { getTicket } from "@/lib/session";
import {
  applyFlightFilters,
  buildFilterOptions,
  createInitialFilter,
  getDefaultSortedFlights,
  isFilterActive,
  normalizeFlightSegments,
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

export function FlightListPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const form = useFlightSearchForm();
  const { selected: selectedPassengers } = usePassengerSelection(ProductType.Flight);
  const listReturnTo = `/flight/list?${searchParams.toString()}`;
  const isAuthenticated = getApiMode() === "mock" || Boolean(getTicket());

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
  const [sortSheet, setSortSheet] = useState<FlightSortKind | null>(null);
  const [modifyOpen, setModifyOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<FlightSortTab>("none");
  const [priceLowToHigh, setPriceLowToHigh] = useState(true);
  const [timeEarlyToLate, setTimeEarlyToLate] = useState(true);

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
    );
  }, [hasListQuery, resolvedListCities, listParams.Date]);

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
  }, [resolvedListCities, hasListQuery, listParams.Date, navigate, searchParams]);

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

  const { timeoutOpen, confirmTimeoutRefresh } = useFlightListPageEffects({
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
    let segments = applyFlightFilters(rawSegments, filterApplied);
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

  if (!hasListQuery) return null;

  function handleDateSelect(date: string) {
    navigate(buildListUrl(searchParams, date), { replace: true });
  }

  function handleFilterConfirm() {
    setFilterApplied(filterDraft);
    setFilterOpen(false);
    setActiveTab("filter");
  }

  function handleSortConfirm(kind: FlightSortKind, ascending: boolean) {
    if (kind === "time") {
      setTimeEarlyToLate(ascending);
      setActiveTab("time");
    } else {
      setPriceLowToHigh(ascending);
      setActiveTab("price");
    }
    setSortSheet(null);
  }

  function handleModifySearch(params: URLSearchParams) {
    resetListFilters();
    navigate(`/flight/list?${params.toString()}`, { replace: true });
  }

  function handleSelectFrom(city: Trafficline) {
    const message = validateFlightSearch(city, form.toCity);
    if (message) {
      form.setValidationError(message);
      return;
    }
    form.setFromCity(city);
    form.setValidationError("");
    handleModifySearch(
      buildFlightListSearchParams({
        fromCity: city,
        toCity: form.toCity,
        date: listParams.Date,
      }),
    );
  }

  function handleSelectTo(city: Trafficline) {
    const message = validateFlightSearch(form.fromCity, city);
    if (message) {
      form.setValidationError(message);
      return;
    }
    form.setToCity(city);
    form.setValidationError("");
    handleModifySearch(
      buildFlightListSearchParams({
        fromCity: form.fromCity,
        toCity: city,
        date: listParams.Date,
      }),
    );
  }

  function openCabins(flightId: string) {
    const segment = displayed.find((s) => s.Id === flightId);
    if (!segment) return;
    navigate(buildCabinsPath(segment, searchParams));
  }

  return (
    <div className="flex min-h-full flex-col bg-[#f2f4f8] pb-[calc(3.5rem+env(safe-area-inset-bottom))]">
      <div className="sticky top-0 z-20 shrink-0">
        <FlightListHeader
          fromName={displayCityName(form.fromCity) || fromName}
          toName={displayCityName(form.toCity) || toName}
          passengerHref={buildPassengerSelectPath(ProductType.Flight, listReturnTo)}
          passengerCount={selectedPassengers.length}
          onBack={() => navigateBack(navigate, "/home?product=flight")}
          onFromClick={() => form.setPicker("from")}
          onToClick={() => form.setPicker("to")}
        />
        <FlightListDateStrip
          selectedDate={listParams.Date}
          onSelect={handleDateSelect}
          onOpenCalendar={() => setModifyOpen(true)}
        />
        {form.validationError ? (
          <p className="bg-[#eef3ff] px-4 pb-2 text-center text-xs text-[#ff4d4f]">
            {form.validationError}
          </p>
        ) : null}
      </div>

      <div className="flex-1 space-y-3 px-3 py-3">
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
          directFlights.map((seg, index) => (
            <FlightSegmentCard
              key={seg.Id}
              segment={seg}
              variant={resolveFlightCardVariant(seg, index, "direct")}
              onClick={() => openCabins(seg.Id)}
            />
          ))}

        {isAuthenticated && transferFlights.length > 0 && (
          <>
            <div className="flex items-center gap-2 py-1 text-center text-xs text-[#999999]">
              <span className="h-px flex-1 bg-[#e5e5e5]" />
              <span className="shrink-0 px-2">推荐中转航班</span>
              <span className="h-px flex-1 bg-[#e5e5e5]" />
            </div>
            {transferFlights.map((seg, index) => (
              <FlightSegmentCard
                key={seg.Id}
                segment={seg}
                variant={resolveFlightCardVariant(seg, index, "transfer")}
                onClick={() => openCabins(seg.Id)}
              />
            ))}
          </>
        )}
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
        onOpenTimeSort={() => setSortSheet("time")}
        onOpenPriceSort={() => setSortSheet("price")}
      />

      <FlightSortSheet
        open={sortSheet !== null}
        kind={sortSheet}
        timeEarlyToLate={timeEarlyToLate}
        priceLowToHigh={priceLowToHigh}
        onClose={() => setSortSheet(null)}
        onConfirm={handleSortConfirm}
      />

      <FlightFilterSheet
        open={filterOpen}
        filter={filterDraft}
        onChange={setFilterDraft}
        onClose={() => setFilterOpen(false)}
        onConfirm={handleFilterConfirm}
      />

      <FlightModifySearchSheet
        open={modifyOpen}
        initial={{
          fromCode: listParams.FromCode,
          toCode: listParams.ToCode,
          fromName,
          toName,
          date: listParams.Date,
          fromAsAirport: listParams.FromAsAirport,
          toAsAirport: listParams.ToAsAirport,
        }}
        onClose={() => setModifyOpen(false)}
        onSearch={handleModifySearch}
      />

      <FlightCityPickerHost
        airports={form.airports}
        picker={form.picker}
        onClose={() => form.setPicker(null)}
        onSelectFrom={handleSelectFrom}
        onSelectTo={handleSelectTo}
      />

      <FlightListTimeoutDialog open={timeoutOpen} onConfirm={confirmTimeoutRefresh} />
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
