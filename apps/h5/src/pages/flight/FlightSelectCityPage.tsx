import { useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

import { AlphabetIndex } from "@/components/flight/AlphabetIndex";
import { CityAlphabetList } from "@/components/flight/CityAlphabetList";
import { CityChipSection } from "@/components/flight/CityChipSection";
import { CitySearchEmpty } from "@/components/flight/CitySearchEmpty";
import { FlightCitySearchBar } from "@/components/flight/FlightCitySearchBar";
import { useFlightAirports } from "@/hooks/useFlightAirports";
import {
  filterCities,
  getAvailableLetters,
  groupByFirstLetter,
  splitHotCities,
  type FlightCityOption,
} from "@/lib/city-list";

type HistoryNavigate = (
  to: number | string,
  options?: { state?: { selectedCity: FlightCityOption } },
) => void;

function exitPicker(navigate: ReturnType<typeof useNavigate>, selectedCity?: FlightCityOption) {
  const state = selectedCity ? { selectedCity } : undefined;
  const go = navigate as unknown as HistoryNavigate;
  if (window.history.length > 1) {
    go(-1, { state });
  } else {
    navigate("/home", { state });
  }
}

export function FlightSelectCityPage() {
  const navigate = useNavigate();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [keyword, setKeyword] = useState("");
  const { data: cities = [], isLoading, error } = useFlightAirports();

  const { hot: hotCities, all: allCities } = useMemo(() => splitHotCities(cities), [cities]);

  const filteredHot = useMemo(() => filterCities(hotCities, keyword), [hotCities, keyword]);
  const filteredAll = useMemo(() => filterCities(allCities, keyword), [allCities, keyword]);
  const groupedCities = useMemo(() => groupByFirstLetter(filteredAll), [filteredAll]);
  const availableLetters = useMemo(() => getAvailableLetters(groupedCities), [groupedCities]);

  const hasKeyword = keyword.trim().length > 0;
  const showHot = filteredHot.length > 0;
  const showAlphabet = availableLetters.length > 0;
  const showEmpty = hasKeyword && !showHot && !showAlphabet;

  const handleSelect = (city: FlightCityOption) => {
    exitPicker(navigate, city);
  };

  const handleJump = (letter: string) => {
    const container = scrollRef.current;
    const target = container?.querySelector(`#letter-${letter}`);
    if (!container || !target) {
      return;
    }

    const top =
      target.getBoundingClientRect().top -
      container.getBoundingClientRect().top +
      container.scrollTop;
    container.scrollTop = top;
  };

  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-[#F5F6F8] text-foreground">
      <header className="shrink-0 bg-gradient-to-b from-[#D6E8FF] to-[#F5F6F8] px-4 pb-2 pt-[max(0.75rem,env(safe-area-inset-top))]">
        <div className="flex min-h-11 items-center gap-2">
          <button
            type="button"
            aria-label="Go back"
            onClick={() => exitPicker(navigate)}
            className="flex h-10 w-10 items-center justify-center border-none bg-transparent p-0 text-[#1F2937]"
          >
            <svg viewBox="0 0 24 24" width="22" height="22" fill="none" aria-hidden>
              <path
                d="M14.5 6.5 9 12l5.5 5.5"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
          <h1 className="flex-1 text-center text-lg font-semibold text-[#1F2937] pr-10">
            选择出发城市
          </h1>
        </div>
      </header>

      <div className="shrink-0">
        <FlightCitySearchBar value={keyword} onChange={setKeyword} />
      </div>

      <div className="relative min-h-0 flex-1 overflow-hidden">
        <div ref={scrollRef} className="absolute inset-0 overflow-y-auto pb-6 pr-8">
          {isLoading ? (
            <p className="px-4 py-8 text-center text-sm text-[#9CA3AF]">加载中…</p>
          ) : null}

          {error ? (
            <p className="px-4 py-8 text-center text-sm text-red-500" role="alert">
              {error instanceof Error ? error.message : "加载失败"}
            </p>
          ) : null}

          {!isLoading && !error ? (
            <>
              {showHot ? (
                <CityChipSection title="热门城市" cities={filteredHot} onSelect={handleSelect} />
              ) : null}

              {showAlphabet ? (
                <CityAlphabetList groups={groupedCities} onSelect={handleSelect} />
              ) : null}

              {showEmpty ? <CitySearchEmpty /> : null}

              {!hasKeyword && !showHot && !showAlphabet ? (
                <p className="px-4 py-8 text-center text-sm text-[#9CA3AF]">暂无城市数据</p>
              ) : null}
            </>
          ) : null}
        </div>

        {!isLoading && !error && showAlphabet ? (
          <AlphabetIndex letters={availableLetters} onJump={handleJump} />
        ) : null}
      </div>
    </div>
  );
}
