import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@ryx/ui/components/ui/button";
import { ProductType } from "@ryx/shared-types";
import type { FlightFilterCondition, FlightSearchParams, FlightSortTab, Trafficline } from "@ryx/shared-types";

import { FlightCityPickerHost, FlightDateStrip } from "@/components/flight/common";
import { FlightFilterSheet } from "@/components/flight/FlightFilterSheet";
import { FlightListToolbar } from "@/components/flight/FlightListToolbar";
import { FlightModifySearchSheet } from "@/components/flight/FlightModifySearchSheet";
import { FlightSegmentCard } from "@/components/flight/FlightSegmentCard";
import { FlightSortSheet, type FlightSortKind } from "@/components/flight/FlightSortSheet";
import { usePageHeader } from "@/components/layout";
import { useFlightList } from "@/hooks/useFlight";
import { useFlightSearchForm } from "@/hooks/useFlightSearchForm";
import { usePassengerSelection } from "@/hooks/usePassenger";
import {
  buildFlightListSearchParams,
  displayCityName,
  validateFlightSearch,
} from "@/lib/flight-search";
import { buildPassengerSelectPath } from "@/lib/passenger-selection";
import { formatApiError } from "@/lib/formatApiError";
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

function buildListUrl(
  base: URLSearchParams,
  date: string,
): string {
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

  const { data, isLoading, isFetching, error, refetch } = useFlightList(
    listParams.Date && listParams.FromCode && listParams.ToCode ? listParams : null,
  );

  const rawSegments = useMemo(() => normalizeFlightSegments(data), [data]);

  const [filterDraft, setFilterDraft] = useState<FlightFilterCondition>(createInitialFilter);
  const [filterApplied, setFilterApplied] = useState<FlightFilterCondition>(createInitialFilter);
  const [filterOpen, setFilterOpen] = useState(false);
  const [sortSheet, setSortSheet] = useState<FlightSortKind | null>(null);
  const [modifyOpen, setModifyOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<FlightSortTab>("none");
  const [priceLowToHigh, setPriceLowToHigh] = useState(true);
  const [timeEarlyToLate, setTimeEarlyToLate] = useState(true);

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

  const recommended = displayed[0];
  const rest = displayed.slice(1);
  const filtered = isFilterActive(filterApplied);

  const routeTitle = `${displayCityName(form.fromCity) || fromName} - ${displayCityName(form.toCity) || toName}`;

  usePageHeader({
    title: routeTitle,
    subtitle: `${listParams.Date} 共${displayed.length}个航班${filtered ? "（筛选后）" : ""}`,
    showBack: true,
  });

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
    setFilterApplied(createInitialFilter());
    setFilterDraft(createInitialFilter());
    setActiveTab("none");
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
    const params = new URLSearchParams(searchParams);
    navigate(`/flight/${flightId}/cabins?${params.toString()}`);
  }

  return (
    <div className="flex min-h-full flex-col pb-20">
      <div className="space-y-3 border-b bg-background px-4 pb-3 pt-2">
        <div className="flex items-center justify-end gap-2">
          <Button asChild variant="outline" size="sm">
            <Link to={buildPassengerSelectPath(ProductType.Flight, listReturnTo)}>
              出行人{selectedPassengers.length > 0 ? `(${selectedPassengers.length})` : ""}
            </Link>
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={isFetching}
            onClick={() => refetch()}
          >
            刷新
          </Button>
          <Button variant="outline" size="sm" onClick={() => setModifyOpen(true)}>
            修改
          </Button>
        </div>
        <div className="flex items-center justify-center gap-2 text-base font-medium">
          <button
            type="button"
            className="text-[#5099fe] active:opacity-70"
            onClick={() => form.setPicker("from")}
          >
            {displayCityName(form.fromCity) || fromName}
          </button>
          <span className="text-muted-foreground">→</span>
          <button
            type="button"
            className="text-[#5099fe] active:opacity-70"
            onClick={() => form.setPicker("to")}
          >
            {displayCityName(form.toCity) || toName}
          </button>
        </div>
        {form.validationError ? (
          <p className="text-center text-xs text-destructive">{form.validationError}</p>
        ) : null}
        <FlightDateStrip selectedDate={listParams.Date} onSelect={handleDateSelect} />
      </div>

      <div className="flex-1 space-y-3 px-4 py-3">
        {(isLoading || isFetching) && (
          <p className="text-sm text-muted-foreground">正在获取航班列表…</p>
        )}

        {error && (
          <p className="text-sm text-destructive">{formatApiError(error)}</p>
        )}

        {!isLoading && !error && displayed.length === 0 && (
          <div className="rounded-lg border bg-muted/30 p-6 text-center text-sm text-muted-foreground">
            {filtered
              ? "未查到符合条件的航班，请更改筛选条件"
              : "未查到航班信息，请更改查询条件重新查询"}
          </div>
        )}

        {recommended && (
          <FlightSegmentCard
            segment={recommended}
            recommended
            onClick={() => openCabins(recommended.Id)}
          />
        )}

        {rest.map((seg) => (
          <FlightSegmentCard
            key={seg.Id}
            segment={seg}
            onClick={() => openCabins(seg.Id)}
          />
        ))}
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
