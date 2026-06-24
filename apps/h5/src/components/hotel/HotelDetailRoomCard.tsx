import { useEffect, useState } from "react";
import type { HotelPolicyColor, HotelRoom, HotelRoomPlan } from "@ryx/shared-types";

import { HotelDetailPlanRow } from "@/components/hotel/HotelDetailPlanRow";
import { isHotelPlanBookable, resolvePlanPolicyColor } from "@/lib/hotel-book-policy";
import { getRoomLowestPrice, isRoomFullyBooked } from "@/utils/hotel-detail";

interface HotelDetailRoomCardProps {
  room: HotelRoom;
  expanded: boolean;
  policyColors: Record<string, HotelPolicyColor>;
  isAgent: boolean;
  onToggle: () => void;
  onOpenRoomDetail: () => void;
  onBook: (plan: HotelRoomPlan) => void;
}

function ExpandToggleButton({ expanded, onClick }: { expanded: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex size-6 shrink-0 items-center justify-center rounded-full border border-[#D1D5DB] bg-white active:bg-[#F5F6F9]"
      aria-expanded={expanded}
      aria-label={expanded ? "收起价格计划" : "展开价格计划"}
    >
      <svg
        viewBox="0 0 12 12"
        className={`size-2.5 text-[#666666] transition-transform ${expanded ? "rotate-180" : ""}`}
        aria-hidden
      >
        <path d="M2 4l4 4 4-4" fill="none" stroke="currentColor" strokeWidth="1.5" />
      </svg>
    </button>
  );
}

function RoomTag({ label }: { label: string }) {
  return (
    <span className="inline-flex h-[18px] items-center rounded border border-[#E5E7EB] px-1.5 text-[10px] leading-none text-[#666666]">
      {label}
    </span>
  );
}

function RoomThumbnail({ room }: { room: HotelRoom }) {
  const [src, setSrc] = useState(room.ImageUrl);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setSrc(room.ImageUrl);
    setFailed(false);
  }, [room.ImageUrl, room.ImageUrlFallback, room.RoomId]);

  function logThumbnailUrls() {
    console.info("[HotelDetailRoomThumbnail]", {
      roomId: room.RoomId,
      roomName: room.RoomName,
      imageUrl: room.ImageUrl,
      imageUrlFallback: room.ImageUrlFallback,
      currentSrc: src,
      failed,
    });
  }

  if (!src || failed) {
    return (
      <button
        type="button"
        onClick={logThumbnailUrls}
        className="size-full bg-[#E8ECF3] active:bg-[#DDE3ED]"
        aria-label={`${room.RoomName} 房型图片`}
      />
    );
  }

  return (
    <button
      type="button"
      onClick={logThumbnailUrls}
      className="size-full"
      aria-label={`${room.RoomName} 房型图片`}
    >
      <img
        src={src}
        alt=""
        className="size-full object-cover"
        loading="lazy"
        referrerPolicy="no-referrer"
        onError={() => {
          if (room.ImageUrlFallback && src !== room.ImageUrlFallback) {
            setSrc(room.ImageUrlFallback);
            return;
          }
          setFailed(true);
        }}
      />
    </button>
  );
}

export function HotelDetailRoomCard({
  room,
  expanded,
  policyColors,
  isAgent,
  onToggle,
  onOpenRoomDetail,
  onBook,
}: HotelDetailRoomCardProps) {
  const lowestPrice = getRoomLowestPrice(room);
  const fullyBooked = isRoomFullyBooked(room, policyColors);
  const planCount = room.Plans.length;
  const imageCount = room.ImageCount ?? (room.ImageUrl ? 1 : 0);

  return (
    <div className="overflow-hidden rounded-lg bg-white shadow-[0_1px_6px_rgba(0,0,0,0.04)]">
      <div className="flex gap-3 p-3">
        <div className="relative h-[100px] w-[84px] shrink-0 overflow-hidden rounded-[4px] bg-[#E5E7EB]">
          <RoomThumbnail room={room} />
          {imageCount >= 1 ? (
            <span className="absolute bottom-1 right-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-white px-1 text-[11px] font-medium leading-none text-[#333333] shadow-[0_1px_3px_rgba(0,0,0,0.12)]">
              {imageCount}
            </span>
          ) : null}
        </div>

        <div className="flex min-w-0 flex-1 flex-col">
          <div className="flex items-start gap-2">
            <h3 className="min-w-0 flex-1 text-[15px] font-semibold leading-snug text-[#333333]">
              {room.RoomName}
            </h3>
            <ExpandToggleButton expanded={expanded} onClick={onToggle} />
          </div>

          {room.Specs ? (
            <p className="mt-1 line-clamp-2 text-[11px] leading-relaxed text-[#999999]">
              {room.Specs}
            </p>
          ) : null}

          {room.Tags?.length ? (
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {room.Tags.map((tag) => (
                <RoomTag key={tag} label={tag} />
              ))}
            </div>
          ) : null}

          <div className="mt-auto flex items-end justify-between gap-2 pt-2">
            <button
              type="button"
              onClick={onOpenRoomDetail}
              className="shrink-0 text-[12px] text-[#2768FA] active:opacity-70"
            >
              详情
            </button>

            {fullyBooked ? (
              <p className="text-[12px] text-[#999999]">已满房</p>
            ) : lowestPrice != null ? (
              <div className="flex items-baseline text-[#2768FA]">
                <span className="text-[12px] font-medium">¥</span>
                <span className="text-[22px] font-semibold leading-none">
                  {Math.round(lowestPrice)}
                </span>
                <span className="ml-0.5 text-[11px] font-medium">起</span>
              </div>
            ) : (
              <span />
            )}
          </div>
        </div>
      </div>

      {expanded ? (
        <div className="border-t border-[#F0F2F5] bg-white">
          {room.Plans.map((plan, index) => {
            const color = resolvePlanPolicyColor(plan, policyColors);
            const bookable = isHotelPlanBookable(color, isAgent);
            return (
              <HotelDetailPlanRow
                key={`${room.RoomId}-${plan.PlanId}`}
                plan={plan}
                policyColor={color}
                bookable={bookable}
                isLast={index === planCount - 1}
                onBook={() => onBook(plan)}
              />
            );
          })}
        </div>
      ) : null}
    </div>
  );
}

export function useExpandedRoomState() {
  const [expandedRoomId, setExpandedRoomId] = useState<string | null>(null);
  return {
    expandedRoomId,
    toggleRoom: (roomId: string) => {
      setExpandedRoomId((current) => (current === roomId ? null : roomId));
    },
  };
}
