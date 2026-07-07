interface FlightCitySearchBarProps {
  value: string;
  onChange: (value: string) => void;
  onSearch?: () => void;
}

export function FlightCitySearchBar({
  value,
  onChange,
  onSearch,
}: FlightCitySearchBarProps) {
  return (
    <div className="mx-4 mt-3 rounded-xl bg-white px-3 py-2 shadow-sm">
      <div className="flex items-center gap-2">
        <div className="flex min-h-11 flex-1 items-center gap-2 rounded-lg bg-[#F5F6F8] px-3">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" aria-hidden>
            <circle cx="11" cy="11" r="7" stroke="#9CA3AF" strokeWidth="1.8" />
            <path d="M16.5 16.5 21 21" stroke="#9CA3AF" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
          <input
            type="search"
            value={value}
            onChange={(event) => onChange(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                onSearch?.();
              }
            }}
            placeholder="搜索城市或车站名称"
            className="min-h-11 flex-1 border-none bg-transparent text-sm text-[#1F2937] outline-none placeholder:text-[#9CA3AF]"
            aria-label="Search city or station"
          />
        </div>
        <button
          type="button"
          onClick={onSearch}
          className="min-h-11 shrink-0 rounded-lg bg-[#E8F1FF] px-4 text-sm font-medium text-[#2276DD]"
        >
          搜索
        </button>
      </div>
    </div>
  );
}
