import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import type { HotelCity } from "@ryx/shared-types";

import { HotelListFilterBar, type HotelListFilterId } from "@/components/hotel/HotelListFilterBar";
import { HotelListItem } from "@/components/hotel/HotelListItem";
import { HotelListSearchBar } from "@/components/hotel/HotelListSearchBar";
import { HotelStayDatePickerSheet } from "@/components/hotel/HotelStayDatePickerSheet";
import { CityPicker } from "@/components/search";
import { usePageHeader } from "@/components/layout";
import headerProfileIcon from "@/assets/hotel/header-profile.png";
import { useHotelCities, useHotelList } from "@/hooks/useHotelList";
import { formatApiError } from "@/lib/formatApiError";
import { navigateBack } from "@/lib/navigation";
import { CITY_HISTORY_KEYS, hotelCityFromQuery, hotelCityPickerAdapter } from "@/lib/hotel-search";

/** Figma hotel list — sky-blue header fading into filter panel (#EEF4FC). */
const HOTEL_LIST_HEADER_GRADIENT =
  "linear-gradient(180deg, #8EC8FF 0%, #B8DBFF 42%, #DCE9FA 78%, #EEF4FC 100%)";

/** Soft fade from header tail into list background. */
const HOTEL_LIST_HEADER_FADE = "linear-gradient(180deg, #EEF4FC 0%, #F5F6F9 100%)";

function BackIcon() {
  return (
    <svg viewBox="0 0 10 17" className="h-[17px] w-[10px] shrink-0 text-black" aria-hidden>
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

function ProfileHeaderIcon() {
  return (
    <img src={headerProfileIcon} alt="" className="size-6 shrink-0 object-contain" aria-hidden />
  );
}

function HotelListSkeleton() {
  return (
    <div className="flex flex-col gap-2">
      {Array.from({ length: 4 }, (_, i) => (
        <div key={i} className="flex gap-3 rounded-lg bg-white p-3">
          <div className="size-24 shrink-0 animate-pulse rounded-lg bg-[#E5E7EB]" />
          <div className="flex min-h-24 flex-1 flex-col justify-between py-0.5">
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
  const [searchParams] = useSearchParams();
  const [activeFilter, setActiveFilter] = useState<HotelListFilterId | null>(null);
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const [cityPickerOpen, setCityPickerOpen] = useState(false);

  const cityCode = searchParams.get("cityCode") ?? "";
  const cityName = searchParams.get("cityName") ?? cityCode;
  const checkIn = searchParams.get("checkIn") ?? "";
  const checkOut = searchParams.get("checkOut") ?? "";
  const keyword = searchParams.get("keyword") ?? "";

  const hasParams = Boolean(cityCode && checkIn && checkOut);

  const { data: cities = [], isLoading: citiesLoading } = useHotelCities();

  const resolvedCity = useMemo(
    () => (hasParams ? hotelCityFromQuery(cities, cityCode, cityName) : null),
    [hasParams, cities, cityCode, cityName],
  );

  const listReady = hasParams && !citiesLoading;

  useEffect(() => {
    if (!hasParams) navigate("/hotel", { replace: true });
  }, [hasParams, navigate]);

  useEffect(() => {
    if (!listReady || !resolvedCity || resolvedCity.Code === cityCode) return;
    const next = new URLSearchParams(searchParams);
    next.set("cityCode", resolvedCity.Code);
    next.set("cityName", resolvedCity.Name);
    navigate({ pathname: "/hotel/list", search: next.toString() }, { replace: true });
  }, [listReady, resolvedCity, cityCode, searchParams, navigate]);

  usePageHeader({ visible: false });

  const listParams = useMemo(
    () =>
      listReady && resolvedCity
        ? {
            CityCode: resolvedCity.Code,
            CityName: resolvedCity.Name,
            CheckInDate: checkIn,
            CheckOutDate: checkOut,
            Keyword: keyword || undefined,
          }
        : {},
    [listReady, resolvedCity, checkIn, checkOut, keyword],
  );

  const { data, isLoading, isFetching, error, refetch } = useHotelList(listParams);

  if (!hasParams) return null;

  const hotels = data?.Hotels ?? [];

  function goModifySearch() {
    navigate("/hotel");
  }

  function handleDateConfirm(nextCheckIn: string, nextCheckOut: string) {
    const next = new URLSearchParams(searchParams);
    next.set("checkIn", nextCheckIn);
    next.set("checkOut", nextCheckOut);
    navigate({ pathname: "/hotel/list", search: next.toString() }, { replace: true });
  }

  function handleCitySelect(city: HotelCity) {
    const next = new URLSearchParams(searchParams);
    next.set("cityCode", city.Code);
    next.set("cityName", city.Name);
    navigate({ pathname: "/hotel/list", search: next.toString() }, { replace: true });
    setCityPickerOpen(false);
  }

  function openDetail(hotel: (typeof hotels)[number]) {
    const params = new URLSearchParams({
      checkIn,
      checkOut,
      cityCode: resolvedCity?.Code ?? cityCode,
      cityName: resolvedCity?.Name ?? cityName,
      minPrice: String(hotel.MinPrice ?? ""),
    });
    navigate(`/hotel/${hotel.HotelId}?${params.toString()}`);
  }

  return (
    <div className="flex min-h-full flex-col bg-[#F5F6F9]">
      <div className="sticky top-0 z-20 shrink-0">
        <div
          className="pt-[env(safe-area-inset-top)]"
          style={{ background: HOTEL_LIST_HEADER_GRADIENT }}
        >
          <div className="relative flex h-11 items-center px-3">
            <button
              type="button"
              className="flex h-11 w-10 shrink-0 items-center justify-center active:opacity-70"
              aria-label="返回"
              onClick={() => navigateBack(navigate, "/hotel")}
            >
              <BackIcon />
            </button>
            <h1 className="pointer-events-none absolute inset-x-0 text-center text-[17px] font-semibold text-brand-title [font-family:'HarmonyOS_Sans_SC','HarmonyOS_Sans','PingFang_SC',sans-serif]">
              酒店查询
            </h1>
            <button
              type="button"
              className="ml-auto flex h-11 w-10 shrink-0 items-center justify-center active:opacity-70"
              aria-label="个人中心"
              onClick={() => navigate("/home/mine")}
            >
              <ProfileHeaderIcon />
            </button>
          </div>

          <div className="px-3 pt-1.5">
            <HotelListSearchBar
              cityName={cityName}
              checkIn={checkIn}
              checkOut={checkOut}
              keyword={keyword}
              onCityClick={() => setCityPickerOpen(true)}
              onDateClick={() => setDatePickerOpen(true)}
              onKeywordClick={goModifySearch}
            />
          </div>

          <HotelListFilterBar
            activeId={activeFilter}
            onSelect={(id) => setActiveFilter((prev) => (prev === id ? null : id))}
          />
        </div>

        <div className="h-2 shrink-0" style={{ background: HOTEL_LIST_HEADER_FADE }} aria-hidden />
      </div>

      <div className="flex-1 px-3 pb-2 pt-0">
        {citiesLoading || isLoading ? <HotelListSkeleton /> : null}

        {error ? (
          <div className="rounded-lg bg-white px-4 py-8 text-center">
            <p className="text-sm text-destructive">{formatApiError(error, "hotel")}</p>
            <button
              type="button"
              className="mt-3 text-sm font-medium text-brand-primary"
              onClick={() => refetch()}
            >
              重试
            </button>
          </div>
        ) : null}

        {!citiesLoading && !isLoading && !error && hotels.length === 0 ? (
          <div className="rounded-lg bg-white px-4 py-16 text-center">
            <p className="text-sm text-[#716161]">暂无数据</p>
          </div>
        ) : null}

        {!citiesLoading && !isLoading && !error && hotels.length > 0 ? (
          <ul className="flex flex-col gap-2">
            {hotels.map((hotel) => (
              <li key={hotel.HotelId} className="overflow-hidden rounded-lg bg-white">
                <HotelListItem hotel={hotel} onClick={() => openDetail(hotel)} />
              </li>
            ))}
          </ul>
        ) : null}

        {isFetching && !isLoading ? (
          <p className="py-3 text-center text-xs text-[#9CA3AF]">更新中…</p>
        ) : null}
      </div>

      <HotelStayDatePickerSheet
        open={datePickerOpen}
        checkIn={checkIn}
        checkOut={checkOut}
        onClose={() => setDatePickerOpen(false)}
        onConfirm={handleDateConfirm}
      />

      <CityPicker
        open={cityPickerOpen}
        items={cities}
        title="选择酒店城市"
        historyKey={CITY_HISTORY_KEYS.hotel}
        searchPlaceholder="搜索城市名称"
        hotTitle="热门城市"
        historyTitle="历史记录"
        hotGridColumns={3}
        onClose={() => setCityPickerOpen(false)}
        onSelect={handleCitySelect}
        {...hotelCityPickerAdapter}
      />
    </div>
  );
}
