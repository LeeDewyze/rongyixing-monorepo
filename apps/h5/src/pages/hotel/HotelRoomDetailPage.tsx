import { useMemo } from "react";
import { useParams, useSearchParams } from "react-router-dom";

import { usePageHeader } from "@/components/layout";
import { useHotelDetail } from "@/hooks/useHotelList";
import { formatApiError } from "@/lib/formatApiError";
import { buildHotelDetailParams, parseHotelDetailQuery } from "@/utils/hotel-detail";

export function HotelRoomDetailPage() {
  const { hotelId = "", roomId = "" } = useParams();
  const [searchParams] = useSearchParams();
  const query = useMemo(() => parseHotelDetailQuery(searchParams), [searchParams]);
  const detailParams = useMemo(() => buildHotelDetailParams(hotelId, query), [hotelId, query]);

  const { data, isLoading, error } = useHotelDetail(detailParams);
  const room = data?.Rooms?.find((item) => item.RoomId === roomId);

  usePageHeader({
    title: room?.RoomName ?? "房型详情",
    showBack: true,
  });

  if (isLoading) {
    return <p className="p-4 text-sm text-[#999999]">加载中…</p>;
  }

  if (error) {
    return <p className="p-4 text-sm text-destructive">{formatApiError(error, "hotel")}</p>;
  }

  if (!room) {
    return <p className="p-4 text-sm text-[#999999]">房型不存在</p>;
  }

  return (
    <div className="space-y-3 p-4">
      {room.ImageUrl ? (
        <img src={room.ImageUrl} alt="" className="aspect-[4/3] w-full rounded-lg object-cover" />
      ) : null}
      {room.Specs ? <p className="text-sm text-[#666666]">{room.Specs}</p> : null}
      {room.Tags?.length ? <p className="text-sm text-[#999999]">{room.Tags.join(" · ")}</p> : null}
    </div>
  );
}
