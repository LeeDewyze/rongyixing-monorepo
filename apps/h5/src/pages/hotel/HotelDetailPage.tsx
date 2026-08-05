import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { ProductType, type HotelRoom, type HotelRoomPlan } from "@ryx/shared-types";

import { HOTEL_HEADER_GRADIENT } from "@/components/hotel/hotel-detail-chrome";
import { HotelDetailDateBar } from "@/components/hotel/HotelDetailDateBar";
import { HotelDetailHero } from "@/components/hotel/HotelDetailHero";
import { HotelDetailHotelInfoSection } from "@/components/hotel/HotelDetailHotelInfoSection";
import { HotelDetailInfoCard } from "@/components/hotel/HotelDetailInfoCard";
import { HotelDetailRoomCard } from "@/components/hotel/HotelDetailRoomCard";
import { HotelDetailToolbar } from "@/components/hotel/HotelDetailToolbar";
import { useExpandedRoomState } from "@/components/hotel/useExpandedRoomState";
import { HotelDetailSectionTabs } from "@/components/hotel/HotelDetailSectionTabs";
import { HotelDetailStickyHeader } from "@/components/hotel/HotelDetailStickyHeader";
import { HotelDetailTrafficSection } from "@/components/hotel/HotelDetailTrafficSection";
import { HotelPolicyAlertDialog } from "@/components/hotel/HotelPolicyAlertDialog";
import { HotelPolicyFilterSheet } from "@/components/hotel/HotelPolicyFilterSheet";
import { HotelStayDatePickerSheet } from "@/components/hotel/HotelStayDatePickerSheet";
import { usePageHeader } from "@/components/layout";
import {
  resolveTravelPolicyRecord,
  TravelPolicyDialog,
} from "@/components/policy/TravelPolicyDialog";
import { useHotelDetailSections } from "@/hooks/useHotelDetailSections";
import { useHotelDetail, useHotelPolicy } from "@/hooks/useHotelList";
import { useIdentity } from "@/hooks/useIdentity";
import { useBusinessSelfBookPassenger } from "@/hooks/useBusinessSelfBookPassenger";
import {
  buildHotelPolicyParams,
  buildPolicyColorMap,
  isHotelPlanBookable,
  resolveHotelPlanBookAlertMessage,
  resolvePlanBookingPolicyColor,
  resolvePlanPolicyColor,
  resolvePlanPolicyRules,
} from "@/lib/hotel-book-policy";
import { saveHotelGalleryImages } from "@/lib/hotel-gallery-session";
import { saveHotelBookSelection } from "@/lib/hotel-book-session";
import { isBusinessTravelMode, loadHomeTravelMode } from "@/lib/flight-travel-mode";
import { formatApiError } from "@/lib/formatApiError";
import { navigateBack } from "@/lib/navigation";
import { hasAgentIdentity } from "@/lib/flight-book-save-order";
import { buildPassengerSelectPath } from "@/lib/passenger-selection";
import {
  buildHotelDetailParams,
  buildHotelDetailUrl,
  buildHotelMapUrl,
  buildHotelRoomDetailUrl,
  buildHotelShowImagesUrl,
  getRoomGalleryUrls,
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
  const travelMode = useMemo(
    () => (query.channel === "tourist" ? "personal" : loadHomeTravelMode()),
    [query.channel],
  );
  const isBusinessMode = isBusinessTravelMode(travelMode);
  const passengerContext = useBusinessSelfBookPassenger(ProductType.Hotel, isBusinessMode);
  const selectedPassengers = passengerContext.passengers;
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
  const { data: identity } = useIdentity();
  const isAgent = hasAgentIdentity(identity);

  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const [policyFilterOpen, setPolicyFilterOpen] = useState(false);
  const [travelPolicyOpen, setTravelPolicyOpen] = useState(false);
  const [policyAlertMessage, setPolicyAlertMessage] = useState<string | null>(null);
  const [cancelRuleMessage, setCancelRuleMessage] = useState<string | null>(null);
  const [policyFilterEnabled, setPolicyFilterEnabled] = useState(true);
  const [filterPassengerId, setFilterPassengerId] = useState<string | null>(null);
  const { expandedRoomId, toggleRoom } = useExpandedRoomState();

  const detailReturnTo = `/hotel/${encodeURIComponent(hotelId)}?${searchParams.toString()}`;
  const passengerHref = buildPassengerSelectPath(ProductType.Hotel, detailReturnTo);

  const { data, isLoading, isFetching, isSuccess, error, refetch } = useHotelDetail(detailParams);

  // Legacy: initFilterPolicy runs only after Home/Detail succeeds (getHotelDetail → initFilterPolicy).
  const detailReady = isSuccess && Boolean(data) && !isFetching;

  const policyParams = useMemo(() => {
    if (!isBusinessMode || !detailReady || selectedPassengers.length === 0) return null;
    return buildHotelPolicyParams({
      detail: data!,
      passengers: selectedPassengers,
      cityCode: query.cityCode,
    });
  }, [data, detailReady, isBusinessMode, query.cityCode, selectedPassengers]);

  const {
    data: policyResults,
    isLoading: isPolicyLoading,
    isFetching: isPolicyFetching,
    refetch: refetchPolicy,
  } = useHotelPolicy(policyParams, isBusinessMode && detailReady && selectedPassengers.length > 0);
  const isPolicyChecking =
    isBusinessMode &&
    selectedPassengers.length > 0 &&
    (!detailReady || isPolicyLoading || isPolicyFetching);

  const policyColors = useMemo(
    () =>
      !isBusinessMode || !detailReady || selectedPassengers.length === 0 || isPolicyChecking
        ? {}
        : buildPolicyColorMap({
            results: policyResults,
            filterPassengerId: policyFilterEnabled ? filterPassengerId : null,
            passengers: selectedPassengers,
            detail: data!,
          }),
    [
      data,
      detailReady,
      filterPassengerId,
      isBusinessMode,
      isPolicyChecking,
      policyFilterEnabled,
      policyResults,
      selectedPassengers,
    ],
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
      navigate("/home?product=hotel", { replace: true });
    }
  }, [navigate, query.checkIn, query.checkOut, query.cityCode]);

  // Legacy initFilterPolicy: default to first passenger until user picks「不过滤差标」.
  useEffect(() => {
    if (selectedPassengers.length === 0) {
      setFilterPassengerId(null);
      return;
    }
    setFilterPassengerId((prev) => {
      if (prev && selectedPassengers.some((item) => item.id === prev)) return prev;
      return selectedPassengers[0]?.id ?? null;
    });
  }, [selectedPassengers]);

  function handleBack() {
    const listParams = new URLSearchParams({
      checkIn: query.checkIn,
      checkOut: query.checkOut,
      cityCode: query.cityCode,
      cityName: query.cityName,
    });
    navigateBack(navigate, `/hotel/list?${listParams.toString()}`);
  }

  function handleOpenGallery(index: number) {
    if (!data?.ImageUrls?.length) return;
    saveHotelGalleryImages(data.ImageUrls);
    navigate(buildHotelShowImagesUrl(hotelId, data.HotelName, index));
  }

  function handleOpenRoomGallery(room: HotelRoom) {
    const urls = getRoomGalleryUrls(room, data?.RoomDefaultImg);
    if (!urls.length) return;
    saveHotelGalleryImages(urls);
    navigate(buildHotelShowImagesUrl(hotelId, room.RoomName, 0));
  }

  function handleShowCancelRule(message: string) {
    setCancelRuleMessage(message);
  }

  function handleDateConfirm(checkIn: string, checkOut: string) {
    setDatePickerOpen(false);
    const next = buildHotelDetailUrl(hotelId, { ...query, checkIn, checkOut });
    navigate(next, { replace: true });
  }

  function requirePassengersBeforeAction(): boolean {
    if (!isBusinessMode) return true;
    if (selectedPassengers.length > 0) return true;
    if (passengerContext.isLoading) {
      setPolicyAlertMessage("正在获取预订权限，请稍后再试");
      return false;
    }
    if (passengerContext.isSelfBookOnly) {
      setPolicyAlertMessage("未获取到本人旅客信息，请刷新后重试");
      return false;
    }
    navigate(passengerHref);
    return false;
  }

  /** Legacy filterPassengerPolicy always calls getPolicy() after filter sheet confirm. */
  async function handlePolicyFilterConfirm(passengerId: string | null) {
    if (passengerId === null) {
      setPolicyFilterEnabled(false);
    } else {
      setPolicyFilterEnabled(true);
      setFilterPassengerId(passengerId);
    }
    if (isBusinessMode && detailReady && selectedPassengers.length > 0) {
      await refetchPolicy();
    }
  }

  function handleToggleRoom(roomId: string) {
    toggleRoom(roomId);
  }

  function handleOpenRoomDetail(roomId: string) {
    navigate(buildHotelRoomDetailUrl(hotelId, roomId, query));
  }

  function handleBook(plan: HotelRoomPlan) {
    if (!requirePassengersBeforeAction() || !data) return;
    const policyChecked =
      isBusinessMode && detailReady && selectedPassengers.length > 0 && !isPolicyChecking;
    const displayColor = resolvePlanPolicyColor(plan, policyColors);
    const bookColor = isBusinessMode
      ? resolvePlanBookingPolicyColor(plan, policyResults, selectedPassengers)
      : undefined;
    const alertMessage = resolveHotelPlanBookAlertMessage({
      plan,
      displayColor,
      bookColor,
      policyResults,
      passengers: selectedPassengers,
      isAgent,
      policyChecked,
    });
    if (isBusinessMode && alertMessage) {
      setPolicyAlertMessage(alertMessage);
      return;
    }
    if (isBusinessMode && !isHotelPlanBookable(bookColor, isAgent, policyChecked)) {
      setPolicyAlertMessage("当前房价暂不可预订，请刷新后重试");
      return;
    }

    const room =
      (data.Rooms ?? []).find((item) => item.Plans.some((p) => p.PlanId === plan.PlanId)) ??
      ({ RoomId: "", RoomName: "", Plans: [plan] } satisfies HotelRoom);

    saveHotelBookSelection({
      hotelId,
      hotelName: data.HotelName,
      checkIn: query.checkIn,
      checkOut: query.checkOut,
      cityCode: query.cityCode,
      cityName: query.cityName,
      hotelAddress: data.Address,
      hotelPhone: data.Phone,
      room,
      plan,
      policyRules: isBusinessMode
        ? resolvePlanPolicyRules(plan, policyResults, selectedPassengers)
        : [],
      checkInOutTime: data.CheckInOutTime,
      bookingNotice: data.BookingNotice,
      travelMode,
      selectedAt: Date.now(),
    });

    const bookParams = new URLSearchParams({
      planId: plan.PlanId,
      roomId: room.RoomId,
      checkIn: query.checkIn,
      checkOut: query.checkOut,
    });
    if (query.channel) bookParams.set("channel", query.channel);
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
          className="rounded-lg bg-brand-primary px-6 py-2 text-sm text-white"
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

      {isBusinessMode ? (
        <HotelDetailToolbar
          passengerCount={selectedPassengers.length}
          passengerHref={passengerHref}
          canFilterPolicy={selectedPassengers.length > 0}
          selfBookOnly={passengerContext.isSelfBookOnly}
          onOpenPolicyFilter={() => setPolicyFilterOpen(true)}
          onOpenPolicyDetail={() => setTravelPolicyOpen(true)}
        />
      ) : null}

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
            canFilterPolicy={isBusinessMode && selectedPassengers.length > 0}
            selfBookOnly={passengerContext.isSelfBookOnly}
            onBack={handleBack}
            onOpenPolicyFilter={() => setPolicyFilterOpen(true)}
            onOpenPolicyDetail={() => setTravelPolicyOpen(true)}
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
              policyLoading={isPolicyChecking}
              isAgent={isAgent}
              onToggle={() => handleToggleRoom(room.RoomId)}
              onOpenRoomDetail={() => handleOpenRoomDetail(room.RoomId)}
              onOpenRoomGallery={() => handleOpenRoomGallery(room)}
              onBook={handleBook}
              onShowCancelRule={handleShowCancelRule}
            />
          ))
        )}
      </section>

      <section ref={hotelRef} data-section-id="hotel" style={sectionScrollStyle}>
        <HotelDetailHotelInfoSection
          checkInOutTime={data.CheckInOutTime}
          bookingNotice={data.BookingNotice}
          openingDate={data.OpeningDate}
          renovationDate={data.RenovationDate}
          introduction={data.Introduction}
        />
      </section>

      <section
        ref={trafficRef}
        data-section-id="traffic"
        style={sectionScrollStyle}
        className="pb-4"
      >
        <HotelDetailTrafficSection address={data.Address} mapUrl={mapUrl} />
      </section>

      <HotelStayDatePickerSheet
        open={datePickerOpen}
        checkIn={query.checkIn}
        checkOut={query.checkOut}
        onClose={() => setDatePickerOpen(false)}
        onConfirm={handleDateConfirm}
      />

      <HotelPolicyFilterSheet
        open={isBusinessMode && policyFilterOpen}
        passengers={selectedPassengers}
        showAllSelected={!policyFilterEnabled}
        selectedPassengerId={filterPassengerId}
        onClose={() => setPolicyFilterOpen(false)}
        onConfirm={handlePolicyFilterConfirm}
      />

      <HotelPolicyAlertDialog
        open={policyAlertMessage != null}
        message={policyAlertMessage ?? ""}
        onClose={() => setPolicyAlertMessage(null)}
      />

      <HotelPolicyAlertDialog
        open={cancelRuleMessage != null}
        message={cancelRuleMessage ?? ""}
        onClose={() => setCancelRuleMessage(null)}
      />

      <TravelPolicyDialog
        open={travelPolicyOpen}
        passengerName={selfTravelPolicyPassengerName}
        policy={selfTravelPolicy}
        loading={passengerContext.isLoading}
        productType={ProductType.Hotel}
        onClose={() => setTravelPolicyOpen(false)}
      />
    </div>
  );
}
