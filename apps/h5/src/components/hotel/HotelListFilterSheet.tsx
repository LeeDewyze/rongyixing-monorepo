import { useEffect, useMemo, useState, type ReactNode } from "react";
import type { HotelAmenity, HotelBrand, HotelConditionResponse, HotelGeo } from "@ryx/shared-types";

import {
  createInitialHotelListFilter,
  HOTEL_LIST_CATEGORY_OPTIONS,
  HOTEL_LIST_PRICE_RANGES,
  HOTEL_LIST_SORT_OPTIONS,
  HOTEL_LIST_STAR_OPTIONS,
  isHotelListFilterSectionActive,
  type HotelListFilterSection,
  type HotelListFilterState,
} from "@/lib/hotel-list-filters";

import "@/components/flight/flight-filter-sheet.css";

const SHEET_ANIMATION_MS = 320;
const FONT = "[font-family:'HarmonyOS_Sans_SC','HarmonyOS_Sans','PingFang_SC',sans-serif]";

interface HotelListFilterSheetProps {
  open: boolean;
  filter: HotelListFilterState;
  initialSection?: HotelListFilterSection;
  visibleSections?: HotelListFilterSection[];
  conditions?: HotelConditionResponse;
  conditionsLoading?: boolean;
  conditionsError?: boolean;
  onChange: (filter: HotelListFilterState) => void;
  onClose: () => void;
  onConfirm: () => void;
}

const FILTER_TABS: { id: HotelListFilterSection; label: string }[] = [
  { id: "sort", label: "推荐排序" },
  { id: "star", label: "星级" },
  { id: "category", label: "酒店类型" },
  { id: "price", label: "价格" },
  { id: "location", label: "位置区域" },
  { id: "brand", label: "品牌" },
  { id: "theme", label: "主题" },
  { id: "service", label: "服务" },
  { id: "facility", label: "设施" },
];

const BRAND_TAG_SECTIONS: { key: string; title: string; tag: string; limit: number }[] = [
  { key: "economy", title: "经济（可多选）", tag: "Economy", limit: 20 },
  { key: "comfort", title: "舒适（可多选）", tag: "Comfort", limit: 10 },
  { key: "high", title: "高端（可多选）", tag: "High", limit: 10 },
  { key: "luxury", title: "豪华（可多选）", tag: "Luxury", limit: 10 },
];

function CloseButton({ onClose }: { onClose: () => void }) {
  return (
    <button
      type="button"
      className="flex size-8 items-center justify-center rounded-full bg-white/80 text-[#666666] shadow-sm ring-1 ring-black/5 active:bg-white"
      aria-label="关闭"
      onClick={onClose}
    >
      <svg viewBox="0 0 20 20" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M6 6l8 8M14 6l-8 8" strokeLinecap="round" />
      </svg>
    </button>
  );
}

function RadioMark({ selected }: { selected: boolean }) {
  return (
    <span
      className={`flight-filter-sheet__radio${selected ? " flight-filter-sheet__radio--selected" : ""}`}
      aria-hidden
    >
      <span className="flight-filter-sheet__radio-dot" />
    </span>
  );
}

function CheckboxMark({ checked }: { checked: boolean }) {
  return (
    <span
      className={`flight-filter-sheet__checkbox${checked ? " flight-filter-sheet__checkbox--checked" : ""}`}
      aria-hidden
    >
      <svg viewBox="0 0 12 12" className="flight-filter-sheet__checkbox-icon" fill="none" aria-hidden>
        <path
          d="M2.5 6l2.2 2.2 4.8-4.8"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  );
}

function FilterRow({
  label,
  selected,
  control,
  onClick,
}: {
  label: string;
  selected?: boolean;
  control: ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flight-filter-sheet__row${selected ? " flight-filter-sheet__row--selected" : ""}`}
    >
      <span className={`flight-filter-sheet__row-label ${FONT}`}>{label}</span>
      {control}
    </button>
  );
}

function toggleNumber(values: number[], id: number, limit = 3): number[] {
  if (values.includes(id)) return values.filter((value) => value !== id);
  return [...values, id].slice(-limit);
}

function toggleString(values: string[], id: string): string[] {
  if (values.includes(id)) return values.filter((value) => value !== id);
  return [...values, id];
}

function toggleLimitedString(values: string[], id: string, limit = 3): string[] {
  if (values.includes(id)) return values.filter((value) => value !== id);
  return [...values, id].slice(-limit);
}

function toggleStringWithinGroup(values: string[], id: string, groupIds: string[], limit = 3): string[] {
  if (values.includes(id)) return values.filter((value) => value !== id);
  const groupSet = new Set(groupIds);
  const selectedInGroup = values.filter((value) => groupSet.has(value));
  if (selectedInGroup.length < limit) return [...values, id];
  const overflow = selectedInGroup[0];
  return values.filter((value) => value !== overflow).concat(id);
}

function clearStringGroup(values: string[], groupIds: string[]): string[] {
  const groupSet = new Set(groupIds);
  return values.filter((value) => !groupSet.has(value));
}

function formatGeoGroup(tag?: string): string {
  const groupMap: Record<string, string> = {
    Metro: "地铁",
    District: "行政区",
    Mall: "商业中心",
    CommericalCenter: "商业中心",
    CommercialCenter: "商业中心",
    Landmark: "地标",
    Company: "兴趣点",
    Group: "兴趣点",
    RailwayStation: "火车站",
    Airport: "机场",
    Hospital: "医院",
    University: "大学",
    Scenic: "景点",
  };
  return groupMap[tag ?? ""] ?? (tag || "其他");
}

function parseGeoVariables(geo: HotelGeo): Record<string, unknown> {
  if (geo.VariablesObj && typeof geo.VariablesObj === "object") return geo.VariablesObj;
  if (geo.Variables && typeof geo.Variables === "object") return geo.Variables as Record<string, unknown>;
  if (typeof geo.Variables === "string") {
    try {
      const parsed = JSON.parse(geo.Variables) as unknown;
      return parsed && typeof parsed === "object" ? (parsed as Record<string, unknown>) : {};
    } catch {
      return {};
    }
  }
  return {};
}

function getGeoLineName(geo: HotelGeo): string {
  const raw = geo as HotelGeo & Record<string, unknown>;
  const vars = parseGeoVariables(geo);
  const line =
    raw.SubName ??
    raw.subName ??
    raw.LineName ??
    raw.lineName ??
    raw.ParentName ??
    raw.parentName ??
    raw.MetroLine ??
    raw.metroLine ??
    raw.Line ??
    raw.line ??
    vars.SubName ??
    vars.subName ??
    vars.LineName ??
    vars.lineName ??
    vars.ParentName ??
    vars.parentName ??
    vars.MetroLine ??
    vars.metroLine ??
    vars.Line ??
    vars.line;
  return line ? String(line) : "";
}

function EmptyPanel({ message }: { message: string }) {
  return (
    <div className={`flex flex-col items-center justify-center px-6 py-16 text-center ${FONT}`}>
      <span className="mb-2 flex size-12 items-center justify-center rounded-full bg-[#F5F7FA] text-[#B0B8C4]">
        <svg viewBox="0 0 24 24" className="size-6" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M4 8h16M4 12h10M4 16h6" strokeLinecap="round" />
        </svg>
      </span>
      <p className="text-[13px] leading-relaxed text-[#999999]">{message}</p>
    </div>
  );
}

function SortPanel({
  filter,
  onChange,
}: {
  filter: HotelListFilterState;
  onChange: (filter: HotelListFilterState) => void;
}) {
  return (
    <>
      {HOTEL_LIST_SORT_OPTIONS.map((option) => {
        const selected = filter.orderby === option.id;
        return (
          <FilterRow
            key={option.id || "default"}
            label={option.label}
            selected={selected}
            control={<RadioMark selected={selected} />}
            onClick={() => onChange({ ...filter, orderby: option.id })}
          />
        );
      })}
    </>
  );
}

function StarPanel({
  filter,
  onChange,
}: {
  filter: HotelListFilterState;
  onChange: (filter: HotelListFilterState) => void;
}) {
  return (
    <>
      <FilterRow
        label="不限"
        selected={filter.stars.length === 0}
        control={<RadioMark selected={filter.stars.length === 0} />}
        onClick={() => onChange({ ...filter, stars: [] })}
      />
      {HOTEL_LIST_STAR_OPTIONS.map((option) => {
        const selected = filter.stars.includes(option.id);
        return (
          <FilterRow
            key={option.id}
            label={option.label}
            selected={selected}
            control={<CheckboxMark checked={selected} />}
            onClick={() => onChange({ ...filter, stars: toggleNumber(filter.stars, option.id) })}
          />
        );
      })}
    </>
  );
}

function CategoryPanel({
  filter,
  onChange,
}: {
  filter: HotelListFilterState;
  onChange: (filter: HotelListFilterState) => void;
}) {
  return (
    <>
      <FilterRow
        label="不限"
        selected={filter.categories.length === 0}
        control={<RadioMark selected={filter.categories.length === 0} />}
        onClick={() => onChange({ ...filter, categories: [] })}
      />
      {HOTEL_LIST_CATEGORY_OPTIONS.map((option) => {
        const selected = filter.categories.includes(option.id);
        return (
          <FilterRow
            key={option.id}
            label={option.label}
            selected={selected}
            control={<CheckboxMark checked={selected} />}
            onClick={() =>
              onChange({ ...filter, categories: toggleString(filter.categories, option.id) })
            }
          />
        );
      })}
    </>
  );
}

function PricePanel({
  filter,
  onChange,
}: {
  filter: HotelListFilterState;
  onChange: (filter: HotelListFilterState) => void;
}) {
  return (
    <>
      {HOTEL_LIST_PRICE_RANGES.map((range) => {
        const selected =
          filter.priceRangeId === range.id &&
          !filter.customBeginPrice.trim() &&
          !filter.customEndPrice.trim();
        return (
          <FilterRow
            key={range.id || "none"}
            label={range.label}
            selected={selected}
            control={<RadioMark selected={selected} />}
            onClick={() =>
              onChange({
                ...filter,
                priceRangeId: range.id,
                customBeginPrice: "",
                customEndPrice: "",
              })
            }
          />
        );
      })}

      <div className={`border-b border-[#F5F6F9] px-4 py-4 ${FONT}`}>
        <p className="mb-3 text-[14px] font-medium text-[#333333]">自定义价格</p>
        <div className="flex items-center gap-2">
          <input
            value={filter.customBeginPrice}
            inputMode="numeric"
            pattern="[0-9]*"
            placeholder="最低"
            className="h-10 min-w-0 flex-1 rounded-xl bg-[#F5F7FA] px-3 text-center text-[14px] text-[#333333] outline-none ring-1 ring-transparent focus:ring-brand-primary"
            onChange={(event) =>
              onChange({
                ...filter,
                priceRangeId: "",
                customBeginPrice: event.target.value.replace(/\D/g, "").slice(0, 6),
              })
            }
          />
          <span className="h-px w-4 bg-[#D8DCE3]" aria-hidden />
          <input
            value={filter.customEndPrice}
            inputMode="numeric"
            pattern="[0-9]*"
            placeholder="最高"
            className="h-10 min-w-0 flex-1 rounded-xl bg-[#F5F7FA] px-3 text-center text-[14px] text-[#333333] outline-none ring-1 ring-transparent focus:ring-brand-primary"
            onChange={(event) =>
              onChange({
                ...filter,
                priceRangeId: "",
                customEndPrice: event.target.value.replace(/\D/g, "").slice(0, 6),
              })
            }
          />
        </div>
      </div>
    </>
  );
}

function LocationPanel({
  filter,
  conditions,
  loading,
  error,
  onChange,
}: {
  filter: HotelListFilterState;
  conditions?: HotelConditionResponse;
  loading?: boolean;
  error?: boolean;
  onChange: (filter: HotelListFilterState) => void;
}) {
  const geos = conditions?.Geos ?? [];
  const grouped = geos.reduce<Record<string, { tag: string; label: string; items: HotelGeo[] }>>((acc, geo) => {
    const tag = geo.Tag || "Other";
    const label = formatGeoGroup(geo.Tag);
    acc[tag] = {
      tag,
      label,
      items: [...(acc[tag]?.items ?? []), geo],
    };
    return acc;
  }, {});
  const orderedGroups = [
    "Metro",
    "Mall",
    "Landmark",
    "District",
    "Company",
    "Group",
    "Hospital",
    "University",
    "Scenic",
    "Other",
  ]
    .map((tag) => grouped[tag])
    .filter((group): group is { tag: string; label: string; items: HotelGeo[] } => Boolean(group));
  const orderedTags = new Set(orderedGroups.map((group) => group.tag));
  const geoGroups = [
    ...orderedGroups,
    ...Object.values(grouped).filter((group) => !orderedTags.has(group.tag)),
  ];
  const fallbackGroup = geoGroups[0];
  const [activeGeoTag, setActiveGeoTag] = useState(fallbackGroup?.tag ?? "");
  const activeGroup = geoGroups.find((group) => group.tag === activeGeoTag) ?? fallbackGroup;
  const isMetroGroup = activeGroup?.tag === "Metro";
  const metroLines =
    isMetroGroup
      ? Array.from(new Set(activeGroup.items.map(getGeoLineName).map((line) => line || "全部")))
      : [];
  const [activeMetroLine, setActiveMetroLine] = useState(metroLines[0] ?? "");
  const displayItems =
    isMetroGroup
      ? activeGroup.items.filter((geo) => {
          const line = getGeoLineName(geo) || "全部";
          return line === (activeMetroLine || metroLines[0]);
        })
      : (activeGroup?.items ?? []);

  useEffect(() => {
    if (!activeGroup && fallbackGroup) {
      setActiveGeoTag(fallbackGroup.tag);
    }
  }, [activeGroup, fallbackGroup]);

  useEffect(() => {
    if (activeGroup?.tag !== "Metro") return;
    if (!metroLines.length) return;
    if (!metroLines.includes(activeMetroLine)) {
      setActiveMetroLine(metroLines[0]);
    }
  }, [activeGroup?.tag, activeMetroLine, metroLines]);

  if (loading) return <EmptyPanel message="正在加载位置区域..." />;
  if (error) return <EmptyPanel message="位置区域加载失败，请稍后重试" />;
  if (!geos.length) return <EmptyPanel message="当前城市暂无位置区域数据" />;

  return (
    <div
      className={`grid h-full min-h-[260px] ${
        isMetroGroup ? "grid-cols-[88px_86px_minmax(0,1fr)]" : "grid-cols-[98px_minmax(0,1fr)]"
      } ${FONT}`}
    >
      <div className="overflow-y-auto border-r border-[#EEF1F6] bg-[#F8F9FC]">
        <button
          type="button"
          className={`flex min-h-11 w-full items-center px-3 text-left text-[13px] ${
            filter.geos.length === 0 ? "bg-white font-semibold text-brand-primary" : "text-[#666666]"
          }`}
          onClick={() => onChange({ ...filter, geoGroup: "", geos: [] })}
        >
          不限
        </button>
        {geoGroups.map((group) => (
          (() => {
            const dirty = group.items.some((geo) => filter.geos.includes(geo.Id));
            return (
              <button
                key={group.tag}
                type="button"
                className={`relative flex min-h-11 w-full items-center px-3 pr-5 text-left text-[13px] ${
                  activeGroup?.tag === group.tag
                    ? "bg-white font-semibold text-brand-primary"
                    : "text-[#666666]"
                }`}
                onClick={() => {
                  setActiveGeoTag(group.tag);
                  if (group.tag === "Metro") {
                    const firstLine = group.items.map(getGeoLineName).find(Boolean) ?? "全部";
                    setActiveMetroLine(firstLine ?? "");
                  }
                }}
              >
                <span className="min-w-0 flex-1 truncate">{group.label}</span>
                {dirty ? (
                  <span
                    className="absolute right-2 top-2 size-1.5 rounded-full bg-brand-primary"
                    aria-hidden
                  />
                ) : null}
              </button>
            );
          })()
        ))}
      </div>

      {isMetroGroup ? (
        <div className="overflow-y-auto border-r border-[#EEF1F6] bg-white">
          {metroLines.map((line) => (
            <button
              key={line}
              type="button"
              className={`flex min-h-11 w-full items-center px-3 text-left text-[13px] ${
                (activeMetroLine || metroLines[0]) === line
                  ? "font-semibold text-brand-primary"
                  : "text-[#333333]"
              }`}
              onClick={() => setActiveMetroLine(line)}
            >
              {line}
            </button>
          ))}
        </div>
      ) : null}

      <div className="overflow-y-auto bg-white">
        {displayItems.length ? (
          displayItems.map((geo) => {
            const selected = filter.geos.includes(geo.Id);
            const groupLabel = activeGroup?.label ?? formatGeoGroup(geo.Tag);
            return (
              <button
                key={geo.Id}
                type="button"
                className={`flex min-h-11 w-full items-center gap-2 border-b border-[#F5F6F9] px-3 text-left text-[13px] ${
                  selected ? "bg-[#F5F9FF] font-medium text-brand-primary" : "text-[#333333]"
                }`}
                onClick={() =>
                  onChange({
                    ...filter,
                    geoGroup: groupLabel,
                    geos:
                      filter.geoGroup && filter.geoGroup !== groupLabel
                        ? [geo.Id]
                        : toggleLimitedString(filter.geos, geo.Id),
                  })
                }
              >
                <span className="min-w-0 flex-1 truncate">{geo.Name}</span>
                <CheckboxMark checked={selected} />
              </button>
            );
          })
        ) : (
          <EmptyPanel message="当前分类暂无位置数据" />
        )}
      </div>
    </div>
  );
}

function OptionPanel<T extends { Id: string; Name: string }>({
  title,
  options,
  selectedIds,
  emptyMessage,
  onClear,
  onToggle,
}: {
  title: string;
  options: T[];
  selectedIds: string[];
  emptyMessage: string;
  onClear: () => void;
  onToggle: (id: string) => void;
}) {
  if (!options.length) return <EmptyPanel message={emptyMessage} />;
  return (
    <>
      <FilterRow
        label="不限"
        selected={selectedIds.length === 0}
        control={<RadioMark selected={selectedIds.length === 0} />}
        onClick={onClear}
      />
      <p className={`px-4 pb-1 pt-4 text-[12px] font-medium text-[#999999] ${FONT}`}>{title}</p>
      {options.map((option) => {
        const selected = selectedIds.includes(option.Id);
        return (
          <FilterRow
            key={option.Id}
            label={option.Name}
            selected={selected}
            control={<CheckboxMark checked={selected} />}
            onClick={() => onToggle(option.Id)}
          />
        );
      })}
    </>
  );
}

function uniqueOptionsById<T extends { Id: string }>(options: T[]): T[] {
  const seen = new Set<string>();
  return options.filter((option) => {
    if (seen.has(option.Id)) return false;
    seen.add(option.Id);
    return true;
  });
}

function BrandSection({
  title,
  brands,
  selectedIds,
  onClear,
  onToggle,
}: {
  title: string;
  brands: HotelBrand[];
  selectedIds: string[];
  onClear: () => void;
  onToggle: (id: string, groupIds: string[]) => void;
}) {
  if (!brands.length) return null;
  const groupIds = brands.map((brand) => brand.Id);
  const hasSelected = groupIds.some((id) => selectedIds.includes(id));

  return (
    <section className={`border-b border-[#F5F6F9] px-4 py-4 ${FONT}`}>
      <div className="mb-3 flex items-center justify-between gap-3">
        <h3 className="min-w-0 flex-1 truncate text-[13px] font-semibold text-[#333333]">{title}</h3>
        <button
          type="button"
          className={`shrink-0 text-[12px] ${hasSelected ? "text-brand-primary" : "text-[#999999]"}`}
          onClick={onClear}
        >
          不限
        </button>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {brands.map((brand) => {
          const selected = selectedIds.includes(brand.Id);
          return (
            <button
              key={brand.Id}
              type="button"
              className={`flex min-h-9 items-center justify-center rounded-lg px-2 text-center text-[13px] leading-[18px] ring-1 ${
                selected
                  ? "bg-[#F0F6FF] font-medium text-brand-primary ring-brand-primary"
                  : "bg-[#F7F8FA] text-[#333333] ring-transparent"
              }`}
              onClick={() => onToggle(brand.Id, groupIds)}
            >
              <span className="line-clamp-2 break-all">{brand.Name}</span>
            </button>
          );
        })}
      </div>
    </section>
  );
}

function BrandPanel({
  brands,
  selectedIds,
  emptyMessage,
  onChange,
}: {
  brands: HotelBrand[];
  selectedIds: string[];
  emptyMessage: string;
  onChange: (selectedIds: string[]) => void;
}) {
  if (!brands.length) return <EmptyPanel message={emptyMessage} />;

  const knownTags = new Set(BRAND_TAG_SECTIONS.map((section) => section.tag));
  const popularBrands = uniqueOptionsById(brands).slice(0, 8);
  const tagSections = BRAND_TAG_SECTIONS.map((section) => ({
    ...section,
    brands: uniqueOptionsById(brands.filter((brand) => brand.Tag === section.tag)).slice(0, section.limit),
  }));
  const displayedIds = new Set<string>([
    ...popularBrands.map((brand) => brand.Id),
    ...tagSections.flatMap((section) => section.brands.map((brand) => brand.Id)),
  ]);
  const otherBrands = uniqueOptionsById(
    brands.filter((brand) => !knownTags.has(brand.Tag ?? "") && !displayedIds.has(brand.Id)),
  );
  const sections = [
    { key: "popular", title: "热门品牌（可多选）", brands: popularBrands },
    ...tagSections,
    ...(otherBrands.length ? [{ key: "other", title: "其他（可多选）", brands: otherBrands }] : []),
  ];

  return (
    <>
      <FilterRow
        label="不限"
        selected={selectedIds.length === 0}
        control={<RadioMark selected={selectedIds.length === 0} />}
        onClick={() => onChange([])}
      />
      {sections.map((section) => (
        <BrandSection
          key={section.key}
          title={section.title}
          brands={section.brands}
          selectedIds={selectedIds}
          onClear={() => onChange(clearStringGroup(selectedIds, section.brands.map((brand) => brand.Id)))}
          onToggle={(id, groupIds) => onChange(toggleStringWithinGroup(selectedIds, id, groupIds))}
        />
      ))}
    </>
  );
}

function selectAmenities(conditions: HotelConditionResponse | undefined, tag: string): HotelAmenity[] {
  return (conditions?.Amenities ?? []).filter((item) => item.Tag === tag);
}

function getConditionEmptyMessage(
  loading: boolean | undefined,
  error: boolean | undefined,
  label: string,
): string {
  if (loading) return `正在加载${label}...`;
  if (error) return `${label}加载失败，请稍后重试`;
  return `当前城市暂无${label}数据`;
}

export function HotelListFilterSheet({
  open,
  filter,
  initialSection = "sort",
  visibleSections,
  conditions,
  conditionsLoading,
  conditionsError,
  onChange,
  onClose,
  onConfirm,
}: HotelListFilterSheetProps) {
  const [rendered, setRendered] = useState(open);
  const [visible, setVisible] = useState(false);
  const [activeTab, setActiveTab] = useState<HotelListFilterSection>(initialSection);
  const tabs = useMemo(
    () => FILTER_TABS.filter((tab) => !visibleSections || visibleSections.includes(tab.id)),
    [visibleSections],
  );
  const fallbackTab = tabs[0]?.id ?? initialSection;
  const showSidebar = tabs.length > 1;

  useEffect(() => {
    if (open) {
      setActiveTab(tabs.some((tab) => tab.id === initialSection) ? initialSection : fallbackTab);
      setRendered(true);
    }
  }, [fallbackTab, initialSection, open, tabs]);

  useEffect(() => {
    if (!tabs.some((tab) => tab.id === activeTab)) {
      setActiveTab(fallbackTab);
    }
  }, [activeTab, fallbackTab, tabs]);

  useEffect(() => {
    if (!rendered) return;

    if (open) {
      const frame = requestAnimationFrame(() => {
        requestAnimationFrame(() => setVisible(true));
      });
      return () => cancelAnimationFrame(frame);
    }

    setVisible(false);
    const timer = window.setTimeout(() => setRendered(false), SHEET_ANIMATION_MS);
    return () => window.clearTimeout(timer);
  }, [open, rendered]);

  if (!rendered) return null;

  return (
    <div
      className={`flight-filter-sheet${visible ? " flight-filter-sheet--visible" : ""}`}
      role="dialog"
      aria-modal="true"
      aria-label="酒店筛选"
    >
      <button
        type="button"
        className="flight-filter-sheet__backdrop"
        aria-label="关闭筛选"
        onClick={onClose}
      />

      <div className="flight-filter-sheet__panel mx-auto w-full max-w-lg">
        <span className="flight-filter-sheet__handle" aria-hidden />

        <header className={`flight-filter-sheet__header relative px-4 pb-4 pt-5 ${FONT}`}>
          <div className="flex items-center justify-between">
            <CloseButton onClose={onClose} />
            <h2 className="text-[17px] font-semibold text-brand-title">酒店筛选</h2>
            <span className="size-8" aria-hidden />
          </div>
        </header>

        <div className="flight-filter-sheet__body">
          <div className="flight-filter-sheet__body-main">
            {showSidebar ? (
              <nav className="flight-filter-sheet__sidebar" aria-label="筛选分类">
                {tabs.map((tab) => {
                  const dirty = isHotelListFilterSectionActive(filter, tab.id);
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      className={`flight-filter-sheet__tab ${FONT}${
                        activeTab === tab.id ? " flight-filter-sheet__tab--active" : ""
                      }${dirty ? " flight-filter-sheet__tab--dirty" : ""}`}
                      onClick={() => setActiveTab(tab.id)}
                    >
                      {tab.label}
                    </button>
                  );
                })}
              </nav>
            ) : null}

            <div className="flight-filter-sheet__content">
              <div className="flight-filter-sheet__content-scroll">
                {activeTab === "sort" ? <SortPanel filter={filter} onChange={onChange} /> : null}
                {activeTab === "star" ? <StarPanel filter={filter} onChange={onChange} /> : null}
                {activeTab === "category" ? (
                  <CategoryPanel filter={filter} onChange={onChange} />
                ) : null}
                {activeTab === "price" ? <PricePanel filter={filter} onChange={onChange} /> : null}
                {activeTab === "location" ? (
                  <LocationPanel
                    filter={filter}
                    conditions={conditions}
                    loading={conditionsLoading}
                    error={conditionsError}
                    onChange={onChange}
                  />
                ) : null}
                {activeTab === "brand" ? (
                  <BrandPanel
                    brands={conditions?.Brands ?? []}
                    selectedIds={filter.brands}
                    emptyMessage={getConditionEmptyMessage(conditionsLoading, conditionsError, "品牌")}
                    onChange={(brands) => onChange({ ...filter, brands })}
                  />
                ) : null}
                {activeTab === "theme" ? (
                  <OptionPanel<HotelAmenity>
                    title="主题"
                    options={selectAmenities(conditions, "Theme")}
                    selectedIds={filter.themes}
                    emptyMessage={getConditionEmptyMessage(conditionsLoading, conditionsError, "主题")}
                    onClear={() => onChange({ ...filter, themes: [] })}
                    onToggle={(id) =>
                      onChange({ ...filter, themes: toggleLimitedString(filter.themes, id) })
                    }
                  />
                ) : null}
                {activeTab === "service" ? (
                  <OptionPanel<HotelAmenity>
                    title="服务"
                    options={selectAmenities(conditions, "Service")}
                    selectedIds={filter.services}
                    emptyMessage={getConditionEmptyMessage(conditionsLoading, conditionsError, "服务")}
                    onClear={() => onChange({ ...filter, services: [] })}
                    onToggle={(id) =>
                      onChange({ ...filter, services: toggleLimitedString(filter.services, id) })
                    }
                  />
                ) : null}
                {activeTab === "facility" ? (
                  <OptionPanel<HotelAmenity>
                    title="设施"
                    options={selectAmenities(conditions, "Facility")}
                    selectedIds={filter.facilities}
                    emptyMessage={getConditionEmptyMessage(conditionsLoading, conditionsError, "设施")}
                    onClear={() => onChange({ ...filter, facilities: [] })}
                    onToggle={(id) =>
                      onChange({
                        ...filter,
                        facilities: toggleLimitedString(filter.facilities, id),
                      })
                    }
                  />
                ) : null}
              </div>
            </div>
          </div>

          <footer className="flight-filter-sheet__footer">
            <div className={`flex gap-3 ${FONT}`}>
              <button
                type="button"
                className="flex h-11 flex-1 items-center justify-center rounded-xl border border-[#5099fe] text-[15px] font-medium text-[#5099fe] active:bg-[#F0F6FF]"
                onClick={() => onChange(createInitialHotelListFilter())}
              >
                重置
              </button>
              <button
                type="button"
                className="flex h-11 flex-[2] items-center justify-center rounded-xl bg-gradient-to-r from-brand-btn-end to-brand-btn-start text-[15px] font-medium text-white shadow-[0_4px_12px_rgba(39,104,250,0.32)] active:opacity-90"
                onClick={onConfirm}
              >
                确定
              </button>
            </div>
          </footer>
        </div>
      </div>
    </div>
  );
}
