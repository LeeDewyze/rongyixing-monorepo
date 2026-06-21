import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import type { HotelType } from "@ryx/shared-types";

import { HotelListFilterBar, type HotelListFilterId } from "@/components/hotel/HotelListFilterBar";
import { HotelListItem } from "@/components/hotel/HotelListItem";
import { HotelListSearchBar } from "@/components/hotel/HotelListSearchBar";
import { HotelTypeTabs } from "@/components/hotel/HotelTypeTabs";
import { usePageHeader } from "@/components/layout";
import { BRAND_HEADER_BG } from "@/config/brand";
import { useHotelList } from "@/hooks/useHotelList";
import { formatApiError } from "@/lib/formatApiError";

function parseHotelType(value: string | null): HotelType {
  if (value === "Tmc" || value === "Agent") return value;
  return "Normal";
}

function MoreMenuIcon() {
  return (
    <svg viewBox="0 0 20 20" className="size-5" aria-hidden>
      <circle cx="4" cy="10" r="1.5" fill="currentColor" />
      <circle cx="10" cy="10" r="1.5" fill="currentColor" />
      <circle cx="16" cy="10" r="1.5" fill="currentColor" />
    </svg>
  );
}

function HotelListSkeleton() {
  return (
    <div>
      {Array.from({ length: 6 }, (_, i) => (
        <div key={i} className="flex gap-3.5 py-2.5">
          <div className="size-[100px] shrink-0 animate-pulse rounded-[10px] bg-[#E5E7EB]" />
          <div className="flex min-h-[100px] flex-1 flex-col justify-between py-0.5">
            <div className="space-y-2">
              <div className="h-4 w-full animate-pulse rounded bg-[#E5E7EB]" />
              <div className="h-4 w-3/4 animate-pulse rounded bg-[#E5E7EB]" />
              <div className="h-3 w-20 animate-pulse rounded bg-[#E5E7EB]" />
            </div>
            <div className="flex items-end justify-between gap-2">
              <div className="h-3 w-2/5 animate-pulse rounded bg-[#E5E7EB]" />
              <div className="h-4 w-14 animate-pulse rounded bg-[#E5E7EB]" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function HotelListPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeFilter, setActiveFilter] = useState<HotelListFilterId | null>(null);

  const cityCode = searchParams.get("cityCode") ?? "";
  const cityName = searchParams.get("cityName") ?? cityCode;
  const checkIn = searchParams.get("checkIn") ?? "";
  const checkOut = searchParams.get("checkOut") ?? "";
  const keyword = searchParams.get("keyword") ?? "";
  const hotelType = parseHotelType(searchParams.get("hotelType"));

  const hasParams = Boolean(cityCode && checkIn && checkOut);

  useEffect(() => {
    if (!hasParams) navigate("/hotel", { replace: true });
  }, [hasParams, navigate]);

  usePageHeader({ visible: false });

  const listParams = useMemo(
    () =>
      hasParams
        ? {
            CityCode: cityCode,
            CityName: cityName,
            CheckInDate: checkIn,
            CheckOutDate: checkOut,
            Keyword: keyword || undefined,
            HotelType: hotelType,
          }
        : {},
    [hasParams, cityCode, cityName, checkIn, checkOut, keyword, hotelType],
  );

  const { data, isLoading, isFetching, error, refetch } = useHotelList(listParams);

  if (!hasParams) return null;

  const hotels = data?.Hotels ?? [];

  function goModifySearch() {
    navigate("/hotel");
  }

  function handleHotelTypeChange(next: HotelType) {
    const params = new URLSearchParams(searchParams);
    params.set("hotelType", next);
    setSearchParams(params, { replace: true });
  }

  function openDetail(hotelId: string) {
    const params = new URLSearchParams({
      checkIn,
      checkOut,
      cityCode,
    });
    navigate(`/hotel/${hotelId}?${params.toString()}`);
  }

  return (
    <div className="flex min-h-full flex-col bg-[#5099FE]">
      <div className="sticky top-0 z-20 shrink-0">
        <div style={{ backgroundColor: BRAND_HEADER_BG }}>
          <div className="pt-[env(safe-area-inset-top)]">
            <div className="flex items-center gap-0.5 px-1 pb-3 pt-1">
              <button
                type="button"
                className="flex h-11 w-10 shrink-0 items-center justify-center text-[26px] font-light leading-none text-white active:opacity-70"
                aria-label="返回"
                onClick={() => navigate(-1)}
              >
                ‹
              </button>
              <HotelListSearchBar
                cityName={cityName}
                checkIn={checkIn}
                checkOut={checkOut}
                keyword={keyword}
                onCityClick={goModifySearch}
                onDateClick={goModifySearch}
                onKeywordClick={goModifySearch}
              />
              <button
                type="button"
                className="flex h-11 w-10 shrink-0 items-center justify-center text-white active:opacity-70"
                aria-label="更多"
              >
                <MoreMenuIcon />
              </button>
            </div>
          </div>
        </div>

        <div className="rounded-t-[18px] bg-white">
          <HotelListFilterBar
            activeId={activeFilter}
            onSelect={(id) => setActiveFilter((prev) => (prev === id ? null : id))}
          />
          <HotelTypeTabs value={hotelType} onChange={handleHotelTypeChange} />
        </div>
      </div>

      <div className="flex-1 bg-white pb-4">
        {isLoading ? <HotelListSkeleton /> : null}

        {error ? (
          <div className="px-4 py-8 text-center">
            <p className="text-sm text-destructive">{formatApiError(error)}</p>
            <button
              type="button"
              className="mt-3 text-sm font-medium text-[#5099FE]"
              onClick={() => refetch()}
            >
              重试
            </button>
          </div>
        ) : null}

        {!isLoading && !error && hotels.length === 0 ? (
          <div className="px-4 py-16 text-center">
            <p className="text-sm text-[#716161]">暂无数据</p>
          </div>
        ) : null}

        {!isLoading && !error ? (
          <ul className="px-3 pt-1">
            {hotels.map((hotel, index) => (
              <li key={hotel.HotelId}>
                <HotelListItem hotel={hotel} onClick={() => openDetail(hotel.HotelId)} />
                {index < hotels.length - 1 ? (
                  <div aria-hidden className="ml-[114px] border-b border-[#2768FA]/30" />
                ) : null}
              </li>
            ))}
          </ul>
        ) : null}

        {isFetching && !isLoading ? (
          <p className="py-3 text-center text-xs text-[#9CA3AF]">更新中…</p>
        ) : null}
      </div>
    </div>
  );
}
