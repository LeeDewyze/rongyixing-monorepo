import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import type { HotelKeywordSearchResult } from "@ryx/shared-types";

import { usePageHeader } from "@/components/layout";
import { useHotelKeywordSearch } from "@/hooks/useHotelList";
import { formatApiError } from "@/lib/formatApiError";
import { loadHomeTravelMode, resolveProductChannel } from "@/lib/flight-travel-mode";
import { navigateBack } from "@/lib/navigation";

const HOTEL_KEYWORD_FONT =
  "[font-family:'HarmonyOS_Sans_SC','HarmonyOS_Sans','PingFang_SC',sans-serif]";
const SEARCH_DEBOUNCE_MS = 300;

function BackIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-5" aria-hidden>
      <path
        d="M15 5l-7 7 7 7"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ClearIcon() {
  return (
    <svg viewBox="0 0 16 16" className="size-3.5" aria-hidden>
      <path
        d="M4 4l8 8M12 4l-8 8"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg viewBox="0 0 20 20" className="size-[18px]" aria-hidden>
      <circle cx="8.5" cy="8.5" r="5.5" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <path d="M13 13l4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function ResultTypeIcon({ type }: { type: HotelKeywordSearchResult["type"] }) {
  if (type === "hotel") {
    return (
      <svg viewBox="0 0 24 24" className="size-5" aria-hidden>
        <path
          d="M6 20V5.5A1.5 1.5 0 0 1 7.5 4h9A1.5 1.5 0 0 1 18 5.5V20"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
        />
        <path d="M4 20h16M9 8h1.5M13.5 8H15M9 12h1.5M13.5 12H15M11 20v-4h2v4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" className="size-5" aria-hidden>
      <path
        d="M12 21s6-5.2 6-11a6 6 0 1 0-12 0c0 5.8 6 11 6 11Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <circle cx="12" cy="10" r="2" fill="none" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  );
}

function keywordReturnPath(params: URLSearchParams, selected?: HotelKeywordSearchResult, text?: string) {
  const next = new URLSearchParams();
  const cityCode = params.get("cityCode") ?? "";
  const cityName = params.get("cityName") ?? cityCode;
  const checkIn = params.get("checkIn") ?? "";
  const checkOut = params.get("checkOut") ?? "";
  const hotelType = params.get("hotelType") ?? "";
  const travelFormId = params.get("travelFormId") ?? params.get("travelformid") ?? "";
  const channel = params.get("channel") ?? "";

  next.set("cityCode", cityCode);
  next.set("cityName", cityName);
  next.set("checkIn", checkIn);
  next.set("checkOut", checkOut);
  if (hotelType) next.set("hotelType", hotelType);
  if (travelFormId) next.set("travelFormId", travelFormId);
  if (channel) next.set("channel", channel);

  if (selected?.type === "hotel" && selected.hotelId) {
    next.set("keyword", selected.text);
    next.set("keywordType", "hotel");
    next.set("hotelId", selected.hotelId);
  } else if (selected?.type === "address" && selected.lat && selected.lng) {
    next.set("keyword", selected.text);
    next.set("keywordType", "address");
    next.set("lat", selected.lat);
    next.set("lng", selected.lng);
  } else {
    const keyword = text?.trim();
    if (keyword) {
      next.set("keyword", keyword);
      next.set("keywordType", "text");
    }
  }

  return `/hotel/list?${next.toString()}`;
}

export function HotelKeywordSearchPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const cityCode = searchParams.get("cityCode") ?? "";
  const cityName = searchParams.get("cityName") ?? cityCode;
  const initialKeyword = searchParams.get("keyword") ?? "";
  const travelMode = useMemo(() => loadHomeTravelMode(), []);
  const productChannel = searchParams.get("channel") === "tourist"
    ? "tourist"
    : resolveProductChannel(travelMode);
  const [keyword, setKeyword] = useState(initialKeyword);
  const [debouncedKeyword, setDebouncedKeyword] = useState(initialKeyword.trim());

  usePageHeader({ visible: false });

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedKeyword(keyword.trim());
    }, SEARCH_DEBOUNCE_MS);
    return () => window.clearTimeout(timer);
  }, [keyword]);

  const queryParams = useMemo(
    () =>
      debouncedKeyword
        ? {
            PageIndex: 0,
            channel: productChannel,
            CityName: cityName,
            CityCode: cityCode,
            Keyword: debouncedKeyword,
          }
        : null,
    [cityCode, cityName, debouncedKeyword, productChannel],
  );

  const { data: results = [], isFetching, isError, error } = useHotelKeywordSearch(queryParams);
  const canSubmitText = Boolean(keyword.trim());

  function submitText() {
    if (!canSubmitText) return;
    const trimmed = keyword.trim();
    const exactHotel = results.find(
      (result) => result.type === "hotel" && result.text.trim() === trimmed && result.hotelId,
    );
    if (exactHotel) {
      navigate(keywordReturnPath(searchParams, exactHotel), { replace: true });
      return;
    }
    navigate(keywordReturnPath(searchParams, undefined, keyword), { replace: true });
  }

  function selectResult(result: HotelKeywordSearchResult) {
    navigate(keywordReturnPath(searchParams, result), { replace: true });
  }

  if (!cityCode || !cityName) {
    return null;
  }

  return (
    <div
      className={`min-h-dvh ${HOTEL_KEYWORD_FONT}`}
      style={{ background: "var(--brand-form-header-gradient)" }}
    >
      <div
        className="sticky top-0 z-30 px-3 pb-4 pt-[env(safe-area-inset-top)]"
        style={{ background: "var(--brand-form-header-gradient)" }}
      >
        <div className="mx-auto max-w-lg">
          <div className="flex h-12 items-center">
            <button
              type="button"
              className="flex h-10 w-9 shrink-0 items-center justify-center rounded-full text-brand-title active:bg-white/40"
              aria-label="返回"
              onClick={() => navigateBack(navigate, "/hotel")}
            >
              <BackIcon />
            </button>
            <h1 className="min-w-0 flex-1 truncate text-center text-[17px] font-medium leading-tight text-brand-title">
              搜索酒店
            </h1>
            <span className="h-10 w-9 shrink-0" aria-hidden />
          </div>
          <div className="flex items-center gap-2">
            <form
              className="flex h-10 min-w-0 flex-1 items-center gap-2 rounded-full bg-white px-3 shadow-[0_2px_8px_rgba(0,0,0,0.08)]"
              onSubmit={(event) => {
                event.preventDefault();
                submitText();
              }}
            >
              <span className="text-[#B0B0B0]">
                <SearchIcon />
              </span>
              <input
                autoFocus
                type="search"
                value={keyword}
                placeholder="地名/酒店/关键词"
                className="min-w-0 flex-1 border-0 bg-transparent text-[15px] font-medium text-brand-title outline-none placeholder:font-normal placeholder:text-[#B0B0B0]"
                onChange={(event) => setKeyword(event.target.value)}
              />
              {keyword ? (
                <button
                  type="button"
                  className="flex size-7 shrink-0 items-center justify-center rounded-full text-[#9CA3AF] active:bg-[#F3F4F6]"
                  aria-label="清除关键词"
                  onClick={() => setKeyword("")}
                >
                  <ClearIcon />
                </button>
              ) : null}
            </form>
            <button
              type="button"
              disabled={!canSubmitText}
              className="h-10 shrink-0 rounded-full px-2 text-[14px] font-medium text-brand-primary disabled:opacity-45 active:bg-white/40"
              onClick={submitText}
            >
              搜索
            </button>
          </div>
        </div>
      </div>

      <main className="mx-auto max-w-lg px-3 py-3">
        {!keyword.trim() ? (
          <div className="rounded-lg bg-white px-4 py-10 text-center text-[13px] text-[#9CA3AF]">
            输入酒店名、地标或地址
          </div>
        ) : null}

        {keyword.trim() && isFetching ? (
          <div className="flex flex-col gap-2">
            {Array.from({ length: 6 }, (_, index) => (
              <div key={index} className="flex h-14 items-center gap-3 rounded-lg bg-white px-3">
                <div className="size-8 animate-pulse rounded-full bg-[#E5E7EB]" />
                <div className="h-4 flex-1 animate-pulse rounded bg-[#E5E7EB]" />
              </div>
            ))}
          </div>
        ) : null}

        {keyword.trim() && isError && !isFetching ? (
          <div className="rounded-lg bg-white px-4 py-8 text-center">
            <p className="text-sm text-destructive">{formatApiError(error, "hotel")}</p>
            <button
              type="button"
              className="mt-3 text-sm font-medium text-brand-primary"
              onClick={submitText}
            >
              直接搜索当前关键词
            </button>
          </div>
        ) : null}

        {keyword.trim() && !isFetching && !isError && results.length === 0 ? (
          <div className="rounded-lg bg-white px-4 py-8 text-center">
            <p className="text-sm text-[#9CA3AF]">暂无相关结果</p>
            <button
              type="button"
              className="mt-3 text-sm font-medium text-brand-primary"
              onClick={submitText}
            >
              搜索「{keyword.trim()}」
            </button>
          </div>
        ) : null}

        {!isFetching && !isError && results.length > 0 ? (
          <ul className="overflow-hidden rounded-lg bg-white">
            {results.map((result, index) => (
              <li key={`${result.type}-${result.text}-${result.hotelId ?? result.lat ?? index}`}>
                <button
                  type="button"
                  className="flex min-h-14 w-full items-center gap-3 border-b border-[#F3F4F6] px-3 py-3 text-left last:border-b-0 active:bg-[#F7FAFF]"
                  onClick={() => selectResult(result)}
                >
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-[#EEF6FF] text-brand-primary">
                    <ResultTypeIcon type={result.type} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[15px] font-medium text-brand-title">
                      {result.text}
                    </span>
                    <span className="mt-0.5 block text-[12px] text-[#9CA3AF]">
                      {result.type === "hotel" ? "酒店" : "位置"}
                    </span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        ) : null}
      </main>
    </div>
  );
}
