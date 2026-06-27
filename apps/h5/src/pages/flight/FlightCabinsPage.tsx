import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import {
  ProductType,
  type FlightBookPolicy,
  type FlightCabinTab,
  type FlightFare,
} from "@ryx/shared-types";

import { FlightCabinCard } from "@/components/flight/FlightCabinCard";
import { FlightCabinsHeader } from "@/components/flight/FlightCabinsHeader";
import { FlightCabinsPolicyBanner } from "@/components/flight/FlightCabinsPolicyBanner";
import { FlightCabinsSummary } from "@/components/flight/FlightCabinsSummary";
import { FlightFareRulesSheet } from "@/components/flight/FlightFareRulesSheet";
import { FlightCabinsTabs } from "@/components/flight/FlightCabinsTabs";
import { FlightPolicyFilterSheet } from "@/components/flight/FlightPolicyFilterSheet";
import { FlightCabinsSkeleton } from "@/components/flight/FlightCabinsSkeleton";
import {
  FLIGHT_CABINS_CHROME,
  FLIGHT_CABINS_HEADER_GRADIENT,
} from "@/components/flight/flight-cabins-chrome";
import { formatCabinsDepartTitle } from "@/utils/flight-list-display";
import { usePageHeader } from "@/components/layout";
import { useFlightDetail, useFlightPolicy } from "@/hooks/useFlight";
import { useFlightPriceTimeout } from "@/hooks/useFlightPriceTimeout";
import { useMemberProfile } from "@/hooks/useMemberProfile";
import { usePassengerSelection } from "@/hooks/usePassenger";
import {
  buildFlightDetailParams,
  filterFaresForFlight,
  isEconomyFare,
  isFlightFareBookable,
  normalizeFlightDetailData,
  parseFlightCabinsQuery,
  partitionCabinsByTab,
  resolveDetailSegment,
} from "@/lib/flight-detail";
import { saveFlightBookSelection } from "@/lib/flight-book-session";
import { loadFlightListSnapshot } from "@/lib/flight-list-session";
import { isFlightListTimedOut } from "@/lib/flight-list-refresh";
import { buildPassengerSelectPath } from "@/lib/passenger-selection";
import { getApiMode } from "@/lib/env";
import { formatApiError } from "@/lib/formatApiError";
import { getTicket } from "@/lib/session";
import { getApi } from "@/lib/api";
import {
  buildFlightPolicyParams,
  buildPassengerFlightPoliciesMap,
  FLIGHT_POLICY_FETCH_FAILED_MESSAGE,
  formatFlightPolicyBookBlockMessage,
  isFlightPolicyBookAllowed,
  shouldBlockBookingOnPolicyFetchFailure,
} from "@/lib/flight-book-policy";
import {
  attachPolicyToRow,
  filterFlightFaresByPolicy,
  formatFlightCabinPolicyHint,
  isFlightCabinPolicyBlocked,
  isFlightCabinSoldOut,
  resolvePolicyForRow,
  type FlightCabinPolicyRow,
} from "@/lib/flight-cabin-policy";
import { buildFlightPolicySessionKey, loadFlightPolicySession } from "@/lib/flight-policy-session";
import { isSelfBookType, resolveDefaultPolicyFilterPassengerId } from "@/lib/flight-self-book";
import { hasAgentIdentity } from "@/lib/flight-book-save-order";
import { navigateBack } from "@/lib/navigation";
import { useIdentity } from "@/hooks/useIdentity";

const FALLBACK_HEADER_HEIGHT = 56;

export function FlightCabinsPage() {
  const navigate = useNavigate();
  const { flightId = "" } = useParams();
  const [searchParams] = useSearchParams();
  const query = useMemo(() => parseFlightCabinsQuery(searchParams), [searchParams]);
  const { selected: selectedPassengers } = usePassengerSelection(ProductType.Flight);
  const { data: identity } = useIdentity();
  const { data: memberProfile } = useMemberProfile();
  const isAgent = hasAgentIdentity(identity);
  const isAuthenticated = getApiMode() === "mock" || Boolean(getTicket());
  const listHref = searchParams.toString()
    ? `/flight/list?${searchParams.toString()}`
    : "/flight/list";

  const listParams = useMemo(
    () => ({
      Date: query.date,
      FromCode: query.fromCode,
      ToCode: query.toCode,
      FromAsAirport: query.fromAsAirport,
      ToAsAirport: query.toAsAirport,
    }),
    [query.date, query.fromCode, query.toCode, query.fromAsAirport, query.toAsAirport],
  );

  const detailParams = useMemo(
    () => buildFlightDetailParams(query, selectedPassengers.length),
    [query, selectedPassengers.length],
  );

  const policySessionKey = useMemo(() => {
    if (!flightId || !query.flightNumber) return null;
    return buildFlightPolicySessionKey({
      segmentId: flightId,
      flightNumber: query.flightNumber,
      listParams,
      passengers: selectedPassengers,
    });
  }, [flightId, listParams, query.flightNumber, selectedPassengers]);

  const cachedPolicySession = useMemo(
    () => (policySessionKey ? loadFlightPolicySession(policySessionKey) : null),
    [policySessionKey],
  );

  const {
    data: rawDetail,
    isLoading,
    isFetching,
    isSuccess,
    error,
    refetch,
    dataUpdatedAt,
  } = useFlightDetail(detailParams);

  const detail = useMemo(() => normalizeFlightDetailData(rawDetail), [rawDetail]);
  const detailReady = isSuccess && Boolean(detail?.FlightFares?.length) && !isFetching;

  const segment = useMemo(
    () => resolveDetailSegment(query, detail?.FlightSegments?.[0]),
    [query, detail?.FlightSegments],
  );

  const policyParams = useMemo(() => {
    if (!detailReady || selectedPassengers.length === 0) return null;
    const listSnapshot = loadFlightListSnapshot(listParams);
    return buildFlightPolicyParams({
      listSnapshot: listSnapshot ?? undefined,
      detailSnapshot: detail ?? undefined,
      passengers: selectedPassengers,
    });
  }, [detail, detailReady, listParams, selectedPassengers]);

  const hasCachedPolicy = Boolean(cachedPolicySession?.policyResults?.length);
  const {
    data: policyQueryData,
    isLoading: isPolicyLoading,
    isFetching: isPolicyFetching,
    isError: isPolicyError,
  } = useFlightPolicy(policyParams, {
    enabled: detailReady && selectedPassengers.length > 0 && !hasCachedPolicy,
    initialData: cachedPolicySession?.policyResults,
  });

  const policyResults = policyQueryData ?? cachedPolicySession?.policyResults;
  const isPolicyChecking =
    selectedPassengers.length > 0 &&
    detailReady &&
    (isPolicyLoading || isPolicyFetching) &&
    !policyResults?.length;

  const isSelf = useMemo(
    () => isSelfBookType({ memberProfile, identity, passengers: selectedPassengers }),
    [identity, memberProfile, selectedPassengers],
  );

  const [activeTab, setActiveTab] = useState<FlightCabinTab>("economy");
  const [rulesFare, setRulesFare] = useState<FlightFare | null>(null);
  const [priceSnapshotAt, setPriceSnapshotAt] = useState(0);
  const [policyFilterOpen, setPolicyFilterOpen] = useState(false);
  const [policyFilterEnabled, setPolicyFilterEnabled] = useState(true);
  const [filterPassengerId, setFilterPassengerId] = useState<string | null>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const [headerHeight, setHeaderHeight] = useState(FALLBACK_HEADER_HEIGHT);

  useLayoutEffect(() => {
    const header = headerRef.current;
    if (!header) return;

    const updateHeight = () => setHeaderHeight(header.offsetHeight);
    updateHeight();
    const observer = new ResizeObserver(updateHeight);
    observer.observe(header);
    return () => observer.disconnect();
  }, []);

  const allFares = useMemo(
    () => filterFaresForFlight(detail?.FlightFares, query.flightNumber),
    [detail?.FlightFares, query.flightNumber],
  );

  const groupedCabins = useMemo(() => partitionCabinsByTab(allFares), [allFares]);

  const policyRows = useMemo(
    () =>
      filterFlightFaresByPolicy({
        fares: allFares,
        policyResults,
        passengers: selectedPassengers,
        filterPassengerId,
        filterEnabled: policyFilterEnabled,
        flightNumber: query.flightNumber ?? segment.Number ?? segment.FlightNumber ?? "",
      }),
    [
      allFares,
      filterPassengerId,
      policyFilterEnabled,
      policyResults,
      query.flightNumber,
      segment.FlightNumber,
      segment.Number,
      selectedPassengers,
    ],
  );

  const displayRows = useMemo((): FlightCabinPolicyRow[] => {
    const policyContext = {
      policyResults,
      passengers: selectedPassengers,
      filterPassengerId,
      flightNumber: query.flightNumber ?? segment.Number ?? segment.FlightNumber ?? "",
    };

    const tabRows = policyFilterEnabled
      ? policyRows
      : groupedCabins[activeTab].map((fare) => ({
          fare,
          color: "default" as const,
          isAllowBook: true,
        }));

    return tabRows
      .filter((row) =>
        activeTab === "economy" ? isEconomyFare(row.fare) : !isEconomyFare(row.fare),
      )
      .map((row) => (policyFilterEnabled ? attachPolicyToRow(row, policyContext) : row));
  }, [
    activeTab,
    filterPassengerId,
    groupedCabins,
    policyFilterEnabled,
    policyResults,
    policyRows,
    query.flightNumber,
    segment.FlightNumber,
    segment.Number,
    selectedPassengers,
  ]);

  const filterPassengerName = useMemo(() => {
    if (!filterPassengerId) return "";
    return selectedPassengers.find((item) => item.id === filterPassengerId)?.passenger.Name ?? "";
  }, [filterPassengerId, selectedPassengers]);

  const detailRouteKey = useMemo(
    () => `${flightId}|${query.date}|${query.fromCode}|${query.toCode}|${query.flightNumber ?? ""}`,
    [flightId, query.date, query.fromCode, query.toCode, query.flightNumber],
  );

  const cabinsReturnTo = `/flight/${encodeURIComponent(flightId)}/cabins?${searchParams.toString()}`;

  useEffect(() => {
    setPriceSnapshotAt(0);
  }, [detailRouteKey]);

  useEffect(() => {
    if (!dataUpdatedAt || !detail || priceSnapshotAt !== 0) return;
    setPriceSnapshotAt(dataUpdatedAt);
  }, [dataUpdatedAt, detail, priceSnapshotAt]);

  useEffect(() => {
    if (selectedPassengers.length === 0) {
      setFilterPassengerId(null);
      return;
    }
    const defaultId = resolveDefaultPolicyFilterPassengerId(selectedPassengers, isSelf);
    setFilterPassengerId((prev) => {
      if (prev && selectedPassengers.some((item) => item.id === prev)) return prev;
      return defaultId;
    });
    if (isSelf || selectedPassengers.length === 1) {
      setPolicyFilterEnabled(true);
    }
  }, [isSelf, selectedPassengers]);

  useEffect(() => {
    if (groupedCabins.economy.length === 0 && groupedCabins.business.length > 0) {
      setActiveTab("business");
    }
  }, [groupedCabins.business.length, groupedCabins.economy.length]);

  const handleTimeoutRefresh = useCallback(() => {
    const params = new URLSearchParams(searchParams);
    params.set("doRefresh", "true");
    navigate(`/flight/list?${params.toString()}`);
  }, [navigate, searchParams]);

  const { openTimeoutDialog } = useFlightPriceTimeout({
    enabled: Boolean(detailParams && detail),
    snapshotAt: priceSnapshotAt,
    onRefresh: handleTimeoutRefresh,
  });

  usePageHeader({ visible: false });

  function handleBack() {
    navigateBack(navigate, listHref);
  }

  function handlePolicyFilterConfirm(passengerId: string | null) {
    if (passengerId === null) {
      setPolicyFilterEnabled(false);
      return;
    }
    setPolicyFilterEnabled(true);
    setFilterPassengerId(passengerId);
  }

  async function resolvePolicyResultsForBook() {
    const timedOut = Boolean(priceSnapshotAt && isFlightListTimedOut(priceSnapshotAt));
    if (policyResults?.length && !isPolicyError && !timedOut) {
      return policyResults;
    }
    if (!policyParams) return policyResults;
    try {
      return await getApi().flight.getFlightPolicy(policyParams);
    } catch {
      return undefined;
    }
  }

  async function proceedToBook(row: FlightCabinPolicyRow) {
    const fare = row.fare;
    let flightPoliciesByPassengerId: Record<string, FlightBookPolicy> = {};
    let flightPolicy = undefined;
    const listSnapshot = loadFlightListSnapshot(listParams);

    const policyResultsForBook = await resolvePolicyResultsForBook();
    if (!policyResultsForBook?.length) {
      if (shouldBlockBookingOnPolicyFetchFailure(isAgent)) {
        window.alert(FLIGHT_POLICY_FETCH_FAILED_MESSAGE);
        return;
      }
    } else if (policyParams && selectedPassengers.length > 0) {
      flightPoliciesByPassengerId = buildPassengerFlightPoliciesMap({
        results: policyResultsForBook,
        passengers: selectedPassengers,
        fare,
        segmentNumber: segment.Number ?? segment.FlightNumber,
      });
      flightPolicy = selectedPassengers[0]
        ? flightPoliciesByPassengerId[selectedPassengers[0].id]
        : undefined;
    }

    for (const passenger of selectedPassengers) {
      const passengerPolicy = flightPoliciesByPassengerId[passenger.id];
      if (passengerPolicy && !isFlightPolicyBookAllowed(passengerPolicy, isAgent)) {
        window.alert(formatFlightPolicyBookBlockMessage(passengerPolicy, passenger));
        return;
      }
    }

    saveFlightBookSelection({
      flightId,
      cabinsQuery: query,
      segment,
      fare,
      detailSnapshot: detail ?? undefined,
      listSnapshot: listSnapshot ?? undefined,
      flightPolicy,
      flightPoliciesByPassengerId,
      priceSnapshotAt: priceSnapshotAt || Date.now(),
      selectedAt: Date.now(),
    });
    navigate("/flight/book");
  }

  function handleBook(row: FlightCabinPolicyRow) {
    const fare = row.fare;
    const policyContext = {
      policyResults,
      passengers: selectedPassengers,
      filterPassengerId,
      flightNumber: query.flightNumber ?? segment.Number ?? segment.FlightNumber ?? "",
    };
    const resolvedRow = policyFilterEnabled ? attachPolicyToRow(row, policyContext) : row;
    const policy = resolvePolicyForRow({ row: resolvedRow, ...policyContext });

    if (isFlightCabinSoldOut(resolvedRow)) {
      window.alert("该舱位已售罄");
      return;
    }
    if (policy && !isFlightPolicyBookAllowed(policy, isAgent)) {
      const filterPassenger =
        selectedPassengers.find((item) => item.id === filterPassengerId) ?? selectedPassengers[0];
      window.alert(formatFlightPolicyBookBlockMessage(policy, filterPassenger));
      return;
    }
    if (!isFlightFareBookable(fare)) {
      window.alert("该舱位已售罄");
      return;
    }
    if (selectedPassengers.length === 0) {
      navigate(buildPassengerSelectPath(ProductType.Flight, cabinsReturnTo));
      return;
    }
    if (priceSnapshotAt && isFlightListTimedOut(priceSnapshotAt)) {
      openTimeoutDialog();
      return;
    }
    void proceedToBook({ ...resolvedRow, policy });
  }

  function handleShowRules(fare: FlightFare) {
    setRulesFare(fare);
  }

  const departTitle = formatCabinsDepartTitle(segment.TakeoffTime || query.takeoffTime);

  if (!detailParams) {
    return (
      <div
        className="flex min-h-full flex-col p-4"
        style={{ backgroundColor: FLIGHT_CABINS_CHROME.pageBg }}
      >
        <p className="text-sm text-[#808080]">舱位查询参数不完整，请从航班列表重新选择。</p>
        <button
          type="button"
          className="mt-3 text-sm font-medium text-[#2768FA]"
          onClick={handleBack}
        >
          返回列表
        </button>
      </div>
    );
  }

  const showCabinSkeleton =
    isAuthenticated && (isLoading || isFetching || isPolicyChecking) && !error;

  return (
    <div
      className="relative min-h-full pb-[max(1rem,env(safe-area-inset-bottom))]"
      style={{ backgroundColor: FLIGHT_CABINS_CHROME.pageBg }}
    >
      <div
        ref={headerRef}
        className="fixed inset-x-0 top-0 z-30 mx-auto w-full max-w-lg overflow-hidden pt-[env(safe-area-inset-top)] shadow-[0_2px_12px_rgba(142,200,255,0.35)]"
        style={{ background: FLIGHT_CABINS_HEADER_GRADIENT }}
      >
        <FlightCabinsHeader
          title={departTitle}
          onBack={handleBack}
          showPolicyFilter={!isSelf && selectedPassengers.length > 0}
          onOpenPolicyFilter={() => setPolicyFilterOpen(true)}
        />
      </div>

      <div style={{ paddingTop: headerHeight }}>
        <div
          className="px-3 pb-3 pt-3"
          style={{
            background: `linear-gradient(180deg, #DCE9FA 0%, ${FLIGHT_CABINS_CHROME.pageBg} 100%)`,
          }}
        >
          <FlightCabinsSummary segment={segment} />
        </div>

        {policyFilterEnabled && filterPassengerName ? (
          <FlightCabinsPolicyBanner
            passengerName={filterPassengerName}
            onClick={() => setPolicyFilterOpen(true)}
          />
        ) : null}

        {isPolicyError && !isAgent && selectedPassengers.length > 0 ? (
          <div className="mx-3 mt-2 rounded-xl border border-[#FECACA] bg-[#FEF2F2] px-3 py-2.5 text-[12px] leading-snug text-[#DC2626]">
            差标获取失败，请返回列表重试
          </div>
        ) : null}

        {!isAuthenticated && (
          <div className="mx-3 mt-3 rounded-xl bg-white p-6 text-center shadow-[0_1px_4px_rgba(0,0,0,0.03)] ring-1 ring-[#ECEEF2]">
            <p className="text-sm text-[#808080]">请先登录后再查看舱位</p>
            <button
              type="button"
              className="mt-3 text-sm font-medium text-[#2768FA]"
              onClick={() =>
                navigate(
                  `/login/password?returnTo=${encodeURIComponent(
                    `/flight/${encodeURIComponent(flightId)}/cabins?${searchParams.toString()}`,
                  )}`,
                )
              }
            >
              去登录
            </button>
          </div>
        )}

        {showCabinSkeleton ? <FlightCabinsSkeleton /> : null}

        {isAuthenticated && error && !isFetching && !detail?.FlightFares?.length ? (
          <div className="px-3 py-6 text-center">
            <p className="text-sm text-destructive">{formatApiError(error, "flight")}</p>
            <button
              type="button"
              className="mt-3 rounded-full bg-[linear-gradient(270deg,#2768FA_0%,#33A1F9_100%)] px-6 py-2 text-sm font-medium text-white"
              onClick={() => refetch()}
            >
              重试
            </button>
          </div>
        ) : null}

        {isAuthenticated && !showCabinSkeleton && !error ? (
          <section className="mx-3 mt-2 pb-3">
            {isFetching ? (
              <p className="pb-1 text-right text-[12px] text-[#999999]">更新中…</p>
            ) : null}

            <FlightCabinsTabs activeTab={activeTab} onChange={setActiveTab} />

            <div className="mt-2 space-y-2">
              {displayRows.length === 0 ? (
                <div className="rounded-xl bg-white p-8 text-center text-sm text-[#808080] ring-1 ring-[#ECEEF2] shadow-[0_1px_4px_rgba(0,0,0,0.03)]">
                  {activeTab === "economy" ? "暂无经济/超经舱位" : "暂无商务/头等舱位"}
                </div>
              ) : (
                displayRows.map((row, index) => (
                  <FlightCabinCard
                    key={`${row.fare.Id ?? row.fare.Code ?? row.fare.BookCode ?? "fare"}-${row.fare.SalesPrice}-${index}`}
                    fare={row.fare}
                    policyColor={policyFilterEnabled ? row.color : "default"}
                    policyHint={
                      policyFilterEnabled ? formatFlightCabinPolicyHint(row.policy) : undefined
                    }
                    policyBlocked={
                      policyFilterEnabled ? isFlightCabinPolicyBlocked(row, isAgent) : false
                    }
                    soldOut={isFlightCabinSoldOut(row)}
                    onBook={() => handleBook(row)}
                    onShowRules={handleShowRules}
                  />
                ))
              )}
            </div>
          </section>
        ) : null}

        <FlightFareRulesSheet
          open={rulesFare != null}
          fare={rulesFare}
          onClose={() => setRulesFare(null)}
        />

        <FlightPolicyFilterSheet
          open={policyFilterOpen}
          passengers={selectedPassengers}
          showAllSelected={!policyFilterEnabled}
          selectedPassengerId={filterPassengerId}
          onClose={() => setPolicyFilterOpen(false)}
          onConfirm={handlePolicyFilterConfirm}
        />
      </div>
    </div>
  );
}
