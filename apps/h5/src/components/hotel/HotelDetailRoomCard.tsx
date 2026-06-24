import { useEffect, useState } from "react";
import type { HotelPolicyColor, HotelRoom, HotelRoomPlan } from "@ryx/shared-types";

import { HotelDetailPlanRow } from "@/components/hotel/HotelDetailPlanRow";
import { HOTEL_DETAIL_FONT } from "@/components/hotel/hotel-detail-chrome";
import { resolvePlanPolicyColor } from "@/lib/hotel-book-policy";
import { getRoomLowestPrice, isRoomFullyBooked } from "@/utils/hotel-detail";

interface HotelDetailRoomCardProps {
  room: HotelRoom;
  expanded: boolean;
  policyColors: Record<string, HotelPolicyColor>;
  policyLoading?: boolean;
  isAgent: boolean;
  onToggle: () => void;
  onOpenRoomDetail: () => void;
  onOpenRoomGallery?: () => void;
  onBook: (plan: HotelRoomPlan) => void;
}

function ExpandToggleButton({ expanded }: { expanded: boolean }) {
  return (
    <span
      className={`flex size-7 shrink-0 items-center justify-center rounded-full border transition-colors ${
        expanded
          ? "border-[#D6E4FF] bg-[#EEF4FF] text-[#2768FA]"
          : "border-[#E5E7EB] bg-[#FAFBFC] text-[#666666]"
      }`}
      aria-hidden
    >
      <svg
        viewBox="0 0 12 12"
        className={`size-2.5 transition-transform duration-200 ${expanded ? "rotate-180" : ""}`}
      >
        <path d="M2 4l4 4 4-4" fill="none" stroke="currentColor" strokeWidth="1.5" />
      </svg>
    </span>
  );
}

function RoomTag({ label }: { label: string }) {
  return (
    <span className="inline-flex h-[20px] items-center rounded-full bg-[#F5F6F9] px-2 text-[10px] leading-none text-[#666666] ring-1 ring-[#ECEEF2]">
      {label}
    </span>
  );
}

function ChevronRightIcon() {
  return (
    <svg viewBox="0 0 12 12" className="size-3 shrink-0 opacity-70" aria-hidden>
      <path d="M4 2l4 4-4 4" fill="none" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

function RoomThumbnail({ room }: { room: HotelRoom }) {
  const [src, setSrc] = useState(room.ImageUrl);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setSrc(room.ImageUrl);
    setFailed(false);
  }, [room.ImageUrl, room.ImageUrlFallback, room.RoomId]);

  if (!src || failed) {
    return (
      <div className="flex size-full items-center justify-center bg-gradient-to-br from-[#E8ECF3] to-[#DDE3ED]">
        <svg viewBox="0 0 24 24" className="size-8 text-[#B8C0CC]" aria-hidden>
          <path
            fill="currentColor"
            d="M4 6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6zm4 2v8l3-2.5L14 16V8H8z"
          />
        </svg>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt=""
      className="size-full object-cover"
      loading="lazy"
      referrerPolicy="no-referrer"
      draggable={false}
      onError={() => {
        if (room.ImageUrlFallback && src !== room.ImageUrlFallback) {
          setSrc(room.ImageUrlFallback);
          return;
        }
        setFailed(true);
      }}
    />
  );
}

export function HotelDetailRoomCard({
  room,
  expanded,
  policyColors,
  policyLoading = false,
  isAgent,
  onToggle,
  onOpenRoomDetail,
  onOpenRoomGallery,
  onBook,
}: HotelDetailRoomCardProps) {
  const lowestPrice = getRoomLowestPrice(room);
  const fullyBooked = isRoomFullyBooked(room, policyColors);
  const planCount = room.Plans.length;
  const imageCount = room.ImageCount ?? (room.ImageUrl ? 1 : 0);
  const canOpenGallery = Boolean(onOpenRoomGallery && imageCount >= 1);

  function handleOpenGallery(event: React.MouseEvent | React.KeyboardEvent) {
    event.stopPropagation();
    onOpenRoomGallery?.();
  }

  return (
    <div
      className={`overflow-hidden rounded-xl bg-white shadow-[0_2px_12px_rgba(0,0,0,0.06)] ring-1 transition-shadow duration-200 ${HOTEL_DETAIL_FONT} ${
        expanded ? "ring-[#D6E4FF] shadow-[0_4px_16px_rgba(39,104,250,0.08)]" : "ring-[#E8ECF3]"
      }`}
    >
      <div
        role="button"
        tabIndex={0}
        aria-expanded={expanded}
        aria-label={expanded ? "收起价格计划" : "展开价格计划"}
        onClick={onToggle}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            onToggle();
          }
        }}
        className={`flex cursor-pointer gap-3 p-3.5 transition-colors active:bg-[#FAFBFC] ${
          expanded ? "bg-[#FCFDFF]" : ""
        }`}
      >
        <div
          role={canOpenGallery ? "button" : undefined}
          tabIndex={canOpenGallery ? 0 : undefined}
          aria-label={canOpenGallery ? `查看${room.RoomName}图片` : undefined}
          onClick={canOpenGallery ? handleOpenGallery : undefined}
          onKeyDown={
            canOpenGallery
              ? (event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    handleOpenGallery(event);
                  }
                }
              : undefined
          }
          className={`relative h-[104px] w-[88px] shrink-0 overflow-hidden rounded-lg bg-[#E5E7EB] ring-1 ring-black/[0.04] ${canOpenGallery ? "cursor-pointer active:opacity-90" : ""}`}
        >
          <RoomThumbnail room={room} />
          {imageCount >= 1 ? (
            <span className="absolute bottom-1.5 right-1.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-black/55 px-1 text-[10px] font-medium leading-none text-white backdrop-blur-sm">
              {imageCount}
            </span>
          ) : null}
        </div>

        <div className="flex min-w-0 flex-1 flex-col">
          <div className="flex items-start gap-2">
            <div className="min-w-0 flex-1">
              <h3 className="text-[15px] font-semibold leading-snug text-[#1A1A1A]">
                {room.RoomName}
              </h3>
              {planCount > 0 ? (
                <p className="mt-0.5 text-[11px] text-[#999999]">{planCount}个价格</p>
              ) : null}
            </div>
            <ExpandToggleButton expanded={expanded} />
          </div>

          {room.Specs ? (
            <p className="mt-1.5 line-clamp-2 text-[11px] leading-[1.45] text-[#8A8F98]">
              {room.Specs}
            </p>
          ) : null}

          {room.Tags?.length ? (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {room.Tags.map((tag) => (
                <RoomTag key={tag} label={tag} />
              ))}
            </div>
          ) : null}

          <div className="mt-auto flex items-end justify-between gap-2 border-t border-[#F0F2F5] pt-2.5">
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                onOpenRoomDetail();
              }}
              className="inline-flex items-center gap-0.5 text-[12px] font-medium text-[#2768FA] active:opacity-70"
            >
              房型详情
              <ChevronRightIcon />
            </button>

            {fullyBooked ? (
              <span className="rounded-full bg-[#F3F4F6] px-2.5 py-1 text-[11px] font-medium text-[#999999]">
                已满房
              </span>
            ) : lowestPrice != null ? (
              <div className="flex items-baseline text-[#2768FA]">
                <span className="text-[11px] font-medium">¥</span>
                <span className="text-[24px] font-semibold leading-none tracking-tight">
                  {Math.round(lowestPrice)}
                </span>
                <span className="ml-0.5 text-[11px] font-medium text-[#2768FA]/80">起</span>
              </div>
            ) : null}
          </div>
        </div>
      </div>

      {expanded ? (
        <div className="border-t border-[#EEF0F4] bg-[#FAFBFD] pt-2">
          {room.Plans.map((plan, index) => {
            const color = resolvePlanPolicyColor(plan, policyColors);
            return (
              <HotelDetailPlanRow
                key={`${room.RoomId}-${plan.PlanId}`}
                plan={plan}
                policyColor={color}
                isAgent={isAgent}
                policyChecked={!policyLoading}
                loading={policyLoading}
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
