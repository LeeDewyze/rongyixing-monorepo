import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import {
  clearCityHistory,
  filterPickerItems,
  groupByFirstLetter,
  loadCityHistory,
  normalizePickerItems,
  PICKER_PAGE_SIZE,
  saveCityHistory,
  type CityPickerAdapter,
  type NormalizedPickerItem,
} from "@/lib/city-picker";

import { PickerShell } from "./PickerShell";

interface CityPickerProps<T> extends CityPickerAdapter<T> {
  open: boolean;
  items: T[];
  historyKey: string;
  onClose: () => void;
  onSelect: (item: T) => void;
  title?: string;
  browseFilter?: (item: T) => boolean;
  searchPlaceholder?: string;
  hotTitle?: string;
  historyTitle?: string;
  showCodeInSearch?: boolean;
  showCodeInBrowse?: boolean;
  hotGridColumns?: 2 | 3 | 4;
  showHistory?: boolean;
}

function CityChip({
  label,
  onClick,
}: {
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      className="flex min-h-[36px] items-center justify-center rounded-lg border border-black/[0.04] bg-white px-2 py-2.5 text-sm text-[#333333] shadow-sm active:bg-[#f0f0f0]"
      onClick={onClick}
    >
      {label}
    </button>
  );
}

function PickerListRow<T>({
  row,
  showCode,
  onSelect,
}: {
  row: NormalizedPickerItem<T>;
  showCode: boolean;
  onSelect: (item: T) => void;
}) {
  return (
    <button
      type="button"
      className="flex w-full items-center border-b border-[#eeeeee] bg-white px-4 py-3.5 text-left text-sm text-[#333333] active:bg-[#f5f5f5]"
      onClick={() => onSelect(row.item)}
    >
      <span className="flex-1 truncate">
        <span>{row.name}</span>
        {showCode && row.code ? (
          <span className="text-[#999999]"> ({row.code})</span>
        ) : null}
      </span>
    </button>
  );
}

function SearchResultRow<T>({
  row,
  showCode,
  onSelect,
}: {
  row: NormalizedPickerItem<T>;
  showCode: boolean;
  onSelect: (item: T) => void;
}) {
  return (
    <button
      type="button"
      className="flex w-full items-start gap-2 border-b border-[#eeeeee] bg-white px-4 py-3 text-left active:bg-[#f5f5f5]"
      onClick={() => onSelect(row.item)}
    >
      <span className="flex-1">
        <span className="font-medium text-[#333333]">{row.searchName}</span>
        {row.pinyin ? <span className="text-[#999999]"> ({row.pinyin})</span> : null}
      </span>
      {showCode && row.code ? (
        <span className="shrink-0 text-sm text-[#999999]">({row.code})</span>
      ) : null}
    </button>
  );
}

/** Full-screen city/station picker — MasterGo 选择出发城市 layout. */
export function CityPicker<T>({
  open,
  items,
  historyKey,
  onClose,
  onSelect,
  title = "选择城市",
  browseFilter,
  searchPlaceholder = "搜索城市或车站名称",
  hotTitle = "热门城市",
  historyTitle = "历史记录",
  showCodeInSearch = true,
  showCodeInBrowse = false,
  hotGridColumns = 3,
  showHistory = true,
  ...adapter
}: CityPickerProps<T>) {
  const [keyword, setKeyword] = useState("");
  const [visibleCount, setVisibleCount] = useState(PICKER_PAGE_SIZE);
  const [histories, setHistories] = useState<T[]>([]);
  const letterRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setKeyword("");
      setVisibleCount(PICKER_PAGE_SIZE);
      setHistories(loadCityHistory<T>(historyKey));
    }
  }, [open, historyKey]);

  const normalizedAll = useMemo(
    () => normalizePickerItems(items, adapter),
    [items, adapter],
  );

  const browseItems = useMemo(() => {
    if (!browseFilter) return normalizedAll;
    return normalizedAll.filter((row) => browseFilter(row.item));
  }, [browseFilter, normalizedAll]);

  const hotItems = useMemo(
    () => browseItems.filter((row) => row.isHot),
    [browseItems],
  );

  const { letters, groups } = useMemo(
    () => groupByFirstLetter(browseItems),
    [browseItems],
  );

  const historyRows = useMemo(() => {
    const map = new Map(normalizedAll.map((row) => [row.id, row]));
    return histories
      .map((item) => map.get(adapter.getId(item)))
      .filter((row): row is NormalizedPickerItem<T> => Boolean(row));
  }, [adapter, histories, normalizedAll]);

  const trimmedKeyword = keyword.trim();
  const isSearching = trimmedKeyword.length > 0;

  const searchResults = useMemo(
    () => (isSearching ? filterPickerItems(normalizedAll, trimmedKeyword) : []),
    [isSearching, trimmedKeyword, normalizedAll],
  );

  const visibleSearchResults = searchResults.slice(0, visibleCount);

  const handleSelect = useCallback(
    (item: T) => {
      const next = saveCityHistory(historyKey, item, adapter.getId);
      setHistories(next);
      onSelect(item);
      setKeyword("");
      onClose();
    },
    [adapter.getId, historyKey, onClose, onSelect],
  );

  const handleClearHistory = useCallback(() => {
    clearCityHistory(historyKey);
    setHistories([]);
  }, [historyKey]);

  const scrollToLetter = useCallback((letter: string) => {
    letterRefs.current[letter]?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  const handleListScroll = useCallback(
    (event: React.UIEvent<HTMLDivElement>) => {
      if (!isSearching) return;
      const el = event.currentTarget;
      if (el.scrollTop + el.clientHeight >= el.scrollHeight - 48) {
        if (visibleCount < searchResults.length) {
          setVisibleCount((count) => Math.min(count + PICKER_PAGE_SIZE, searchResults.length));
        }
      }
    },
    [isSearching, searchResults.length, visibleCount],
  );

  useEffect(() => {
    setVisibleCount(PICKER_PAGE_SIZE);
  }, [trimmedKeyword]);

  if (!open) return null;

  const hotGridClass =
    hotGridColumns === 2
      ? "grid-cols-2"
      : hotGridColumns === 4
        ? "grid-cols-4"
        : "grid-cols-3";

  return (
    <PickerShell
      title={title}
      searchPlaceholder={searchPlaceholder}
      keyword={keyword}
      onKeywordChange={setKeyword}
      onBack={onClose}
      onSearchClick={() => inputRef.current?.focus()}
      inputRef={inputRef}
      onBodyScroll={handleListScroll}
      bodyOverlay={
        !isSearching && letters.length > 0 ? (
          <div className="pointer-events-none absolute inset-y-0 right-0 flex w-5 flex-col items-center justify-center gap-0.5">
            {letters.map((letter) => (
              <button
                key={letter}
                type="button"
                className="pointer-events-auto text-[11px] leading-3 text-[#999999] active:text-brand-accent"
                onClick={() => scrollToLetter(letter)}
              >
                {letter}
              </button>
            ))}
          </div>
        ) : null
      }
    >
      {isSearching ? (
        <div className="pb-6">
          {visibleSearchResults.length === 0 ? (
            <p className="py-10 text-center text-sm text-[#999999]">没有符合条件的数据</p>
          ) : (
            <ul>
              {visibleSearchResults.map((row) => (
                <li key={row.id}>
                  <SearchResultRow row={row} showCode={showCodeInSearch} onSelect={handleSelect} />
                </li>
              ))}
              {visibleCount < searchResults.length ? (
                <li className="p-3 text-center text-xs text-[#999999]">加载更多…</li>
              ) : null}
            </ul>
          )}
        </div>
      ) : (
        <>
          {showHistory && historyRows.length > 0 ? (
            <section className="pb-2">
              <div className="flex items-center justify-between px-4 pb-2 pt-1">
                <h3 className="text-xs font-medium text-[#666666]">{historyTitle}</h3>
                <button
                  type="button"
                  className="text-xs text-[#999999] active:opacity-70"
                  onClick={handleClearHistory}
                >
                  清除
                </button>
              </div>
              <div className={`grid ${hotGridClass} gap-2 px-4`}>
                {historyRows.map((row) => (
                  <CityChip key={row.id} label={row.name} onClick={() => handleSelect(row.item)} />
                ))}
              </div>
            </section>
          ) : null}

          {hotItems.length > 0 ? (
            <section className="pb-2">
              <h3 className="px-4 pb-2 pt-2 text-xs font-medium text-[#666666]">{hotTitle}</h3>
              <div className={`grid ${hotGridClass} gap-2 px-4`}>
                {hotItems.map((row) => (
                  <CityChip key={row.id} label={row.name} onClick={() => handleSelect(row.item)} />
                ))}
              </div>
            </section>
          ) : null}

          <ul className="pb-16">
            {letters.map((letter) => (
              <li key={letter}>
                <div
                  ref={(el) => {
                    letterRefs.current[letter] = el;
                  }}
                  className="bg-[#e8eef8] px-4 py-1.5 text-sm font-semibold text-[#333333]"
                  data-letter={letter}
                >
                  {letter}
                </div>
                <ul>
                  {groups[letter]?.map((row) => (
                    <li key={row.id}>
                      <PickerListRow
                        row={row}
                        showCode={showCodeInBrowse}
                        onSelect={handleSelect}
                      />
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
        </>
      )}
    </PickerShell>
  );
}
