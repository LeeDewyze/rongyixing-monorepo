import { useMemo } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";

import { HotelRoomDetailHero } from "@/components/hotel/HotelRoomDetailHero";
import { HotelRoomDetailSpecGrid } from "@/components/hotel/HotelRoomDetailSpecGrid";
import {
  HOTEL_CHROME,
  HOTEL_DETAIL_FONT,
  HOTEL_HEADER_GRADIENT,
} from "@/components/hotel/hotel-detail-chrome";
import { usePageHeader } from "@/components/layout";
import { useHotelDetail } from "@/hooks/useHotelList";
import { saveHotelGalleryImages } from "@/lib/hotel-gallery-session";
import { formatApiError } from "@/lib/formatApiError";
import { navigateBack } from "@/lib/navigation";
import {
  buildHotelDetailParams,
  buildHotelDetailUrl,
  buildHotelShowImagesUrl,
  getRoomDetailSpecItems,
  getRoomGalleryUrls,
  parseHotelDetailQuery,
} from "@/utils/hotel-detail";

function BackIcon() {
  return (
    <svg viewBox="0 0 10 17" className="h-[17px] w-[10px] shrink-0 text-brand-title" aria-hidden>
      <path
        d="M9 1.5 2.5 8.5 9 15.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function RoomDetailSkeleton() {
  return (
    <div className="space-y-3 p-3">
      <div className="h-[220px] animate-pulse bg-[#E8ECF3]" />
      <div className="h-20 animate-pulse rounded-xl bg-white" />
      <div className="h-48 animate-pulse rounded-xl bg-white" />
    </div>
  );
}

export function HotelRoomDetailPage() {
  const navigate = useNavigate();
  const { hotelId = "", roomId = "" } = useParams();
  const [searchParams] = useSearchParams();
  const query = useMemo(() => parseHotelDetailQuery(searchParams), [searchParams]);
  const detailParams = useMemo(() => buildHotelDetailParams(hotelId, query), [hotelId, query]);

  const { data, isLoading, error } = useHotelDetail(detailParams);
  const room = data?.Rooms?.find((item) => item.RoomId === roomId);
  const galleryUrls = useMemo(
    () => (room ? getRoomGalleryUrls(room, data?.RoomDefaultImg) : []),
    [room, data?.RoomDefaultImg],
  );
  const specItems = useMemo(() => (room ? getRoomDetailSpecItems(room) : []), [room]);

  usePageHeader({ visible: false });

  const detailFallback = buildHotelDetailUrl(hotelId, query);

  function handleBack() {
    navigateBack(navigate, detailFallback);
  }

  function handleOpenGallery(index: number) {
    if (!room || !galleryUrls.length) return;
    saveHotelGalleryImages(galleryUrls);
    navigate(buildHotelShowImagesUrl(hotelId, room.RoomName, index));
  }

  if (!detailParams) {
    return null;
  }

  if (isLoading) {
    return (
      <div className={`min-h-full bg-[#F5F6F9] ${HOTEL_DETAIL_FONT}`}>
        <header
          className="shrink-0 pt-[env(safe-area-inset-top)]"
          style={{ background: HOTEL_HEADER_GRADIENT }}
        >
          <div className="flex h-12 items-center gap-2 px-3">
            <button
              type="button"
              onClick={handleBack}
              className="flex h-12 w-8 shrink-0 items-center justify-center active:opacity-70"
              aria-label="返回"
            >
              <BackIcon />
            </button>
            <h1
              className="min-w-0 flex-1 truncate text-center text-[16px] font-semibold leading-tight"
              style={{ color: HOTEL_CHROME.title }}
            >
              房型详情
            </h1>
            <span className="w-8 shrink-0" aria-hidden />
          </div>
        </header>
        <RoomDetailSkeleton />
      </div>
    );
  }

  if (error) {
    return (
      <div className={`p-4 ${HOTEL_DETAIL_FONT}`}>
        <p className="text-sm text-destructive">{formatApiError(error, "hotel")}</p>
      </div>
    );
  }

  if (!room) {
    return (
      <div className={`p-4 ${HOTEL_DETAIL_FONT}`}>
        <p className="text-sm text-[#999999]">房型不存在</p>
      </div>
    );
  }

  return (
    <div className={`flex min-h-full flex-col bg-[#F5F6F9] pb-4 ${HOTEL_DETAIL_FONT}`}>
      <header
        className="sticky top-0 z-20 shrink-0 pt-[env(safe-area-inset-top)]"
        style={{ background: HOTEL_HEADER_GRADIENT }}
      >
        <div className="flex h-12 items-center gap-2 px-3">
          <button
            type="button"
            onClick={handleBack}
            className="flex h-12 w-8 shrink-0 items-center justify-center active:opacity-70"
            aria-label="返回"
          >
            <BackIcon />
          </button>
          <h1
            className="min-w-0 flex-1 truncate text-center text-[16px] font-semibold leading-tight"
            style={{ color: HOTEL_CHROME.title }}
          >
            {data?.HotelName ?? "酒店详情"}
          </h1>
          <span className="w-8 shrink-0" aria-hidden />
        </div>
      </header>

      <HotelRoomDetailHero
        imageUrls={galleryUrls}
        onOpenGallery={galleryUrls.length ? handleOpenGallery : undefined}
      />

      <div className="mx-3 mt-3 space-y-3">
        <section className="overflow-hidden rounded-xl bg-white px-4 py-3.5 shadow-[0_2px_12px_rgba(0,0,0,0.06)] ring-1 ring-[#E8ECF3]">
          <h2 className="text-[16px] font-semibold leading-snug text-[#1A1A1A]">
            {room.RoomName}
            <span className="font-medium text-[#666666]">详情</span>
          </h2>
          {room.Tags?.length ? (
            <div className="mt-2.5 flex flex-wrap gap-1.5">
              {room.Tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex h-[20px] items-center rounded-full bg-[#EEF4FF] px-2 text-[10px] leading-none text-brand-primary ring-1 ring-[#D6E4FF]"
                >
                  {tag}
                </span>
              ))}
            </div>
          ) : null}
        </section>

        <HotelRoomDetailSpecGrid items={specItems} />
      </div>
    </div>
  );
}
