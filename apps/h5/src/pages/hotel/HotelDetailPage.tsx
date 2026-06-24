import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { ProductType, type HotelRoomPlan } from "@ryx/shared-types";

import { HOTEL_HEADER_GRADIENT } from "@/components/hotel/hotel-detail-chrome";
import { HotelDetailDateBar } from "@/components/hotel/HotelDetailDateBar";
import { HotelDetailHero } from "@/components/hotel/HotelDetailHero";
import { HotelDetailHotelInfoSection } from "@/components/hotel/HotelDetailHotelInfoSection";
import { HotelDetailInfoCard } from "@/components/hotel/HotelDetailInfoCard";
import { HotelDetailRoomCard, useExpandedRoomState } from "@/components/hotel/HotelDetailRoomCard";
import { HotelDetailSectionTabs } from "@/components/hotel/HotelDetailSectionTabs";
import { HotelDetailStickyHeader } from "@/components/hotel/HotelDetailStickyHeader";
import { HotelDetailTrafficSection } from "@/components/hotel/HotelDetailTrafficSection";
import { HotelPolicyFilterSheet } from "@/components/hotel/HotelPolicyFilterSheet";
import { HotelStayDatePickerSheet } from "@/components/hotel/HotelStayDatePickerSheet";
import { usePageHeader } from "@/components/layout";
import { useHotelDetailSections } from "@/hooks/useHotelDetailSections";
import { useHotelDetail, useHotelPolicy } from "@/hooks/useHotelList";
import { useIdentity } from "@/hooks/useIdentity";
import { usePassengerSelection } from "@/hooks/usePassenger";
import {
  buildHotelPolicyParams,
  buildPolicyColorMap,
  formatHotelPolicyBlockMessage,
  isHotelPlanBookable,
  resolvePlanPolicyColor,
} from "@/lib/hotel-book-policy";
import { saveHotelGalleryImages } from "@/lib/hotel-gallery-session";
import { formatApiError } from "@/lib/formatApiError";
import { getApiMode } from "@/lib/env";
import { hasAgentIdentity } from "@/lib/flight-book-save-order";
import { buildPassengerSelectPath } from "@/lib/passenger-selection";
import { getTicket } from "@/lib/session";
import {
  buildHotelDetailParams,
  buildHotelDetailUrl,
  buildHotelMapUrl,
  buildHotelRoomDetailUrl,
  buildHotelShowImagesUrl,
  parseHotelDetailQuery,
} from "@/utils/hotel-detail";

function HotelDetailSkeleton() {
  return (
    <div className="space-y-3 p-3">
      <div className="h-28 animate-pulse rounded-lg bg-white" />
      <div className="h-16 animate-pulse rounded-lg bg-[#E8EDFF]" />
      <div className="h-20 animate-pulse bg-white" />
      {Array.from({ length: 3 }, (_, i) => (
        <div key={i} className="h-24 animate-pulse rounded-lg bg-white" />
      ))}
    </div>
  );
}

export function HotelDetailPage() {
  const navigate = useNavigate();
  const { hotelId = "" } = useParams();
  const [searchParams] = useSearchParams();
  const query = useMemo(() => parseHotelDetailQuery(searchParams), [searchParams]);
  const detailParams = useMemo(() => buildHotelDetailParams(hotelId, query), [hotelId, query]);

  const { selected: selectedPassengers } = usePassengerSelection(ProductType.Hotel);
  const { data: identity } = useIdentity();
  const isAgent = hasAgentIdentity(identity);
  const isAuthenticated = getApiMode() === "mock" || Boolean(getTicket());

  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const [policyFilterOpen, setPolicyFilterOpen] = useState(false);
  const [filterPassengerId, setFilterPassengerId] = useState<string | null>(null);
  const { expandedRoomId, toggleRoom } = useExpandedRoomState();

  const detailReturnTo = `/hotel/${encodeURIComponent(hotelId)}?${searchParams.toString()}`;
  const passengerHref = buildPassengerSelectPath(ProductType.Hotel, detailReturnTo);

  const { data, isLoading, isFetching, error, refetch } = useHotelDetail(detailParams);

  const policyParams = useMemo(() => {
    if (!data || selectedPassengers.length === 0) return null;
    return buildHotelPolicyParams({
      detail: data,
      passengers: selectedPassengers,
      cityCode: query.cityCode,
    });
  }, [data, query.cityCode, selectedPassengers]);

  const { data: policyResults } = useHotelPolicy(
    policyParams,
    Boolean(data && selectedPassengers.length > 0),
  );

  const policyColors = useMemo(
    () =>
      buildPolicyColorMap({
        results: policyResults,
        filterPassengerId,
        passengers: selectedPassengers,
        detail: data ?? { HotelId: hotelId, HotelName: "" },
      }),
    [policyResults, filterPassengerId, selectedPassengers, data, hotelId],
  );

  const {
    stickyRef,
    stickySentinelRef,
    stickyVisible,
    roomsRef,
    hotelRef,
    trafficRef,
    activeSection,
    scrollMarginTop,
    scrollToSection,
  } = useHotelDetailSections(Boolean(data));

  const mapUrl = useMemo(
    () => buildHotelMapUrl(data?.HotelName ?? "", data?.Lat, data?.Lng),
    [data?.HotelName, data?.Lat, data?.Lng],
  );

  usePageHeader({ visible: false });

  useEffect(() => {
    if (!query.checkIn || !query.checkOut || !query.cityCode) {
      navigate("/hotel", { replace: true });
    }
  }, [navigate, query.checkIn, query.checkOut, query.cityCode]);

  function handleBack() {
    const listParams = new URLSearchParams({
      checkIn: query.checkIn,
      checkOut: query.checkOut,
      cityCode: query.cityCode,
      cityName: query.cityName,
    });
    navigate(`/hotel/list?${listParams.toString()}`);
  }

  function handleOpenGallery(index: number) {
    if (!data?.ImageUrls?.length) return;
    saveHotelGalleryImages(data.ImageUrls);
    navigate(buildHotelShowImagesUrl(hotelId, data.HotelName, index));
  }

  function handleDateConfirm(checkIn: string, checkOut: string) {
    setDatePickerOpen(false);
    const next = buildHotelDetailUrl(hotelId, { ...query, checkIn, checkOut });
    navigate(next, { replace: true });
  }

  function handleToggleRoom(roomId: string) {
    toggleRoom(roomId);
  }

  function handleOpenRoomDetail(roomId: string) {
    navigate(buildHotelRoomDetailUrl(hotelId, roomId, query));
  }

  function handleBook(plan: HotelRoomPlan) {
    if (selectedPassengers.length === 0 && isAuthenticated) {
      const proceed = window.confirm("请先添加旅客。是否前往选择旅客？");
      if (proceed) navigate(passengerHref);
      return;
    }
    const color = resolvePlanPolicyColor(plan, policyColors);
    if (!isHotelPlanBookable(color, isAgent)) {
      window.alert(formatHotelPolicyBlockMessage(color));
      return;
    }
    const bookParams = new URLSearchParams({
      planId: plan.PlanId,
      checkIn: query.checkIn,
      checkOut: query.checkOut,
    });
    navigate(`/hotel/${hotelId}/book?${bookParams.toString()}`);
  }

  if (!detailParams) {
    return null;
  }

  if (isLoading) {
    return (
      <div className="min-h-full bg-[#F5F6F9]">
        <HotelDetailHero onBack={handleBack} />
        <HotelDetailSkeleton />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-full flex-col items-center justify-center gap-4 bg-[#F5F6F9] p-6">
        <p className="text-center text-sm text-[#666666]">{formatApiError(error, "hotel")}</p>
        <button
          type="button"
          onClick={() => refetch()}
          className="rounded-lg bg-[#2768FA] px-6 py-2 text-sm text-white"
        >
          重试
        </button>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex min-h-full items-center justify-center bg-[#F5F6F9] p-6">
        <p className="text-sm text-[#666666]">酒店不存在</p>
      </div>
    );
  }

  const rooms = data.Rooms ?? [];
  const sectionScrollStyle = { scrollMarginTop };

  return (
    <div className="flex min-h-full flex-col bg-[#F5F6F9] pb-[calc(1rem+env(safe-area-inset-bottom))]">
      <HotelDetailHero
        imageUrls={data.ImageUrls}
        onBack={handleBack}
        onOpenGallery={handleOpenGallery}
      />

      <HotelDetailInfoCard
        name={data.HotelName}
        address={data.Address}
        star={data.Star}
        phone={data.Phone}
        lat={data.Lat}
        lng={data.Lng}
      />

      <HotelDetailDateBar
        checkIn={query.checkIn}
        checkOut={query.checkOut}
        onOpenPicker={() => setDatePickerOpen(true)}
      />

      {stickyVisible ? (
        <div
          ref={stickyRef}
          className="fixed inset-x-0 top-0 z-30 overflow-hidden shadow-[0_2px_12px_rgba(142,200,255,0.35)]"
          style={{ background: HOTEL_HEADER_GRADIENT }}
        >
          <HotelDetailStickyHeader
            hotelName={data.HotelName}
            passengerCount={selectedPassengers.length}
            passengerHref={passengerHref}
            canFilterPolicy={selectedPassengers.length > 0}
            onBack={handleBack}
            onOpenPolicyFilter={() => setPolicyFilterOpen(true)}
          />
          <HotelDetailSectionTabs active={activeSection} onChange={scrollToSection} />
        </div>
      ) : null}

      <section
        ref={roomsRef}
        data-section-id="rooms"
        style={sectionScrollStyle}
        className="mx-3 mt-2 space-y-2 pb-2"
      >
        <div ref={stickySentinelRef} className="h-px w-full shrink-0" aria-hidden />
        <h2 className="px-1 pt-1 text-[15px] font-semibold text-[#333333]">房型信息</h2>
        {isFetching ? <p className="py-1 text-right text-[12px] text-[#999999]">更新中…</p> : null}
        {rooms.length === 0 ? (
          <p className="rounded-lg bg-white py-8 text-center text-sm text-[#999999]">
            暂无可用房型
          </p>
        ) : (
          rooms.map((room) => (
            <HotelDetailRoomCard
              key={room.RoomId}
              room={room}
              expanded={expandedRoomId === room.RoomId}
              policyColors={policyColors}
              isAgent={isAgent}
              onToggle={() => handleToggleRoom(room.RoomId)}
              onOpenRoomDetail={() => handleOpenRoomDetail(room.RoomId)}
              onBook={handleBook}
            />
          ))
        )}
      </section>

      <div ref={hotelRef} data-section-id="hotel" style={sectionScrollStyle}>
        <HotelDetailHotelInfoSection
          checkInOutTime={data.CheckInOutTime}
          bookingNotice={data.BookingNotice}
          openingDate={data.OpeningDate}
          renovationDate={data.RenovationDate}
          introduction={data.Introduction}
        />
      </div>

      <div ref={trafficRef} data-section-id="traffic" style={sectionScrollStyle} className="pb-4">
        <HotelDetailTrafficSection address={data.Address} mapUrl={mapUrl} />
      </div>

      <HotelStayDatePickerSheet
        open={datePickerOpen}
        checkIn={query.checkIn}
        checkOut={query.checkOut}
        onClose={() => setDatePickerOpen(false)}
        onConfirm={handleDateConfirm}
      />

      <HotelPolicyFilterSheet
        open={policyFilterOpen}
        passengers={selectedPassengers}
        selectedId={filterPassengerId}
        onClose={() => setPolicyFilterOpen(false)}
        onConfirm={setFilterPassengerId}
      />
    </div>
  );
}
