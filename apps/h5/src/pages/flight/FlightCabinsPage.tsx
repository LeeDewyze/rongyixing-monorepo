import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { ProductType, type FlightCabinTab, type FlightFare } from "@ryx/shared-types";

import { FlightCabinCard } from "@/components/flight/FlightCabinCard";
import { FlightCabinsHeader } from "@/components/flight/FlightCabinsHeader";
import { FlightCabinsSummary } from "@/components/flight/FlightCabinsSummary";
import { FlightFareRulesSheet } from "@/components/flight/FlightFareRulesSheet";
import { FlightCabinsTabs } from "@/components/flight/FlightCabinsTabs";
import { FLIGHT_CABINS_HEADER_BG, FLIGHT_CABINS_HEADER_GRADIENT } from "@/config/flight-cabins";
import { formatCabinsDepartTitle } from "@/utils/flight-list-display";
import { usePageHeader } from "@/components/layout";
import { useFlightDetail } from "@/hooks/useFlight";
import { usePassengerSelection } from "@/hooks/usePassenger";
import {
  buildFlightDetailParams,
  filterFaresForFlight,
  normalizeFlightDetailData,
  parseFlightCabinsQuery,
  partitionCabinsByTab,
  resolveDetailSegment,
} from "@/lib/flight-detail";
import { getApiMode } from "@/lib/env";
import { formatApiError } from "@/lib/formatApiError";
import { getTicket } from "@/lib/session";

export function FlightCabinsPage() {
  const navigate = useNavigate();
  const { flightId = "" } = useParams();
  const [searchParams] = useSearchParams();
  const query = useMemo(() => parseFlightCabinsQuery(searchParams), [searchParams]);
  const { selected: selectedPassengers } = usePassengerSelection(ProductType.Flight);
  const isAuthenticated = getApiMode() === "mock" || Boolean(getTicket());
  const listHref = searchParams.toString()
    ? `/flight/list?${searchParams.toString()}`
    : "/flight/list";

  const detailParams = useMemo(
    () => buildFlightDetailParams(query, selectedPassengers.length),
    [query, selectedPassengers.length],
  );

  const { data: rawDetail, isLoading, isFetching, error, refetch } = useFlightDetail(detailParams);

  const detail = useMemo(() => normalizeFlightDetailData(rawDetail), [rawDetail]);

  const segment = useMemo(
    () => resolveDetailSegment(query, detail?.FlightSegments?.[0]),
    [query, detail?.FlightSegments],
  );

  const groupedCabins = useMemo(() => {
    const fares = filterFaresForFlight(detail?.FlightFares, query.flightNumber);
    return partitionCabinsByTab(fares);
  }, [detail?.FlightFares, query.flightNumber]);

  const [activeTab, setActiveTab] = useState<FlightCabinTab>("economy");
  const [rulesFare, setRulesFare] = useState<FlightFare | null>(null);

  useEffect(() => {
    if (groupedCabins.economy.length === 0 && groupedCabins.business.length > 0) {
      setActiveTab("business");
    }
  }, [groupedCabins.business.length, groupedCabins.economy.length]);

  const visibleCabins = useMemo(() => groupedCabins[activeTab], [activeTab, groupedCabins]);

  usePageHeader({ visible: false });

  function handleBack() {
    navigate(listHref);
  }

  function handleBook(_fare: FlightFare) {
    window.alert("预订填单功能开发中，Phase B 已完成舱位列表展示。");
  }

  function handleShowRules(fare: FlightFare) {
    setRulesFare(fare);
  }

  const departTitle = formatCabinsDepartTitle(segment.TakeoffTime || query.takeoffTime);

  if (!detailParams) {
    return (
      <div className="flex min-h-full flex-col bg-[#f2f4f8] p-4">
        <p className="text-sm text-[#808080]">舱位查询参数不完整，请从航班列表重新选择。</p>
        <button
          type="button"
          className="mt-3 text-sm font-medium text-[#5099fe]"
          onClick={handleBack}
        >
          返回列表
        </button>
      </div>
    );
  }

  return (
    <div className="flex min-h-full flex-col bg-[#f2f4f8] pb-[max(1rem,env(safe-area-inset-bottom))]">
      <div
        className="sticky top-0 z-20 shrink-0 pt-[env(safe-area-inset-top)]"
        style={{
          backgroundColor: FLIGHT_CABINS_HEADER_BG,
          backgroundImage: FLIGHT_CABINS_HEADER_GRADIENT,
        }}
      >
        <FlightCabinsHeader title={departTitle} onBack={handleBack} />
        <div className="px-3 pb-3">
          <FlightCabinsSummary segment={segment} />
        </div>
      </div>

      {!isAuthenticated && (
        <div className="mx-3 mt-3 rounded-xl bg-white p-6 text-center shadow-sm">
          <p className="text-sm text-[#808080]">请先登录后再查看舱位</p>
          <button
            type="button"
            className="mt-3 text-sm font-medium text-[#5099fe]"
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

      {isAuthenticated && (isLoading || isFetching) && (
        <p className="py-6 text-center text-sm text-[#808080]">正在获取舱位信息…</p>
      )}

      {isAuthenticated && error && !isFetching && !detail?.FlightFares?.length && (
        <div className="px-3 py-6 text-center">
          <p className="text-sm text-destructive">{formatApiError(error)}</p>
          <button
            type="button"
            className="mt-2 text-sm font-medium text-[#5099fe]"
            onClick={() => refetch()}
          >
            重试
          </button>
        </div>
      )}

      {isAuthenticated && !isLoading && !error && (
        <>
          <FlightCabinsTabs activeTab={activeTab} onChange={setActiveTab} />

          <div className="space-y-3 px-3 py-3">
            {visibleCabins.length === 0 ? (
              <div className="rounded-xl bg-white p-8 text-center text-sm text-[#808080] shadow-sm">
                {activeTab === "economy" ? "暂无经济/超经舱位" : "暂无商务/头等舱位"}
              </div>
            ) : (
              visibleCabins.map((fare, index) => (
                <FlightCabinCard
                  key={`${fare.Id ?? fare.Code ?? "fare"}-${fare.SalesPrice}-${index}`}
                  fare={fare}
                  onBook={handleBook}
                  onShowRules={handleShowRules}
                />
              ))
            )}
          </div>
        </>
      )}

      <FlightFareRulesSheet
        open={rulesFare != null}
        fare={rulesFare}
        onClose={() => setRulesFare(null)}
      />
    </div>
  );
}
