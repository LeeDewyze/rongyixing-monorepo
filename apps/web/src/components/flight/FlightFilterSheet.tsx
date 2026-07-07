import { useEffect, useState, type ReactNode } from "react";
import type { FlightFilterCondition, FlightFilterOption } from "@ryx/shared-types";

import {
  FLIGHT_FILTER_TIME_SPANS,
  isFlightFilterSectionActive,
  resetFlightFilterDraft,
  type FlightFilterSection,
} from "@/utils/flight-list";

import "./flight-filter-sheet.css";

const SHEET_ANIMATION_MS = 320;
const FONT = "[font-family:'HarmonyOS_Sans_SC','HarmonyOS_Sans','PingFang_SC',sans-serif]";

interface FlightFilterSheetProps {
  open: boolean;
  filter: FlightFilterCondition;
  onChange: (filter: FlightFilterCondition) => void;
  onClose: () => void;
  onConfirm: () => void;
}

const FILTER_TABS: { id: FlightFilterSection; label: string }[] = [
  { id: "time", label: "起飞时段" },
  { id: "airline", label: "航空公司" },
  { id: "fromAirport", label: "起飞机场" },
  { id: "toAirport", label: "到达机场" },
];

function CloseButton({ onClose }: { onClose: () => void }) {
  return (
    <button
      type="button"
      className="flex size-8 items-center justify-center rounded-full bg-white/80 text-[#666666] shadow-sm ring-1 ring-black/5 active:bg-white"
      aria-label="关闭"
      onClick={onClose}
    >
      <svg
        viewBox="0 0 20 20"
        className="size-4"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
      >
        <path d="M6 6l8 8M14 6l-8 8" strokeLinecap="round" />
      </svg>
    </button>
  );
}

function QuickToggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`flex flex-1 items-center justify-between rounded-xl px-3.5 py-3 text-left transition-all ${FONT} ${
        checked
          ? "bg-white text-brand-primary shadow-[0_2px_10px_rgba(39,104,250,0.14)] ring-1 ring-[#D6E4FF]"
          : "bg-white/70 text-[#333333] ring-1 ring-[#E8ECF3] active:bg-white"
      }`}
    >
      <span className="text-[14px] font-medium">{label}</span>
      <span
        className={`relative inline-flex h-[22px] w-[38px] shrink-0 items-center rounded-full transition-colors ${
          checked ? "bg-brand-primary" : "bg-[#E0E0E0]"
        }`}
        aria-hidden
      >
        <span
          className={`absolute size-[18px] rounded-full bg-white shadow-sm transition-transform ${
            checked ? "translate-x-[18px]" : "translate-x-[2px]"
          }`}
        />
      </span>
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
      <svg
        viewBox="0 0 12 12"
        className="flight-filter-sheet__checkbox-icon"
        fill="none"
        aria-hidden
      >
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

function FilterListRow({
  label,
  leading,
  selected,
  control,
  onClick,
}: {
  label: string;
  leading?: ReactNode;
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
      {leading}
      <span className={`flight-filter-sheet__row-label ${FONT}`}>{label}</span>
      {control}
    </button>
  );
}

function AirlineLogo({ icon, code, name }: { icon?: string; code: string; name: string }) {
  if (icon) {
    return (
      <span className="flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-white ring-1 ring-[#EEF1F6]">
        <img src={icon} alt="" className="size-7 object-contain" loading="lazy" />
      </span>
    );
  }

  return (
    <span
      className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#EEF4FF] to-[#F7FAFF] text-[11px] font-semibold text-brand-primary ring-1 ring-[#D6E4FF]"
      aria-hidden
    >
      {name.slice(0, 1) || code.slice(0, 2)}
    </span>
  );
}

function EmptyPanel({ message }: { message: string }) {
  return (
    <div className={`flex flex-col items-center justify-center px-6 py-16 text-center ${FONT}`}>
      <span className="mb-2 flex size-12 items-center justify-center rounded-full bg-[#F5F7FA] text-[#B0B8C4]">
        <svg
          viewBox="0 0 24 24"
          className="size-6"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
        >
          <path d="M4 8h16M4 12h10M4 16h6" strokeLinecap="round" />
        </svg>
      </span>
      <p className="text-[13px] leading-relaxed text-[#999999]">{message}</p>
    </div>
  );
}

function toggleOption(
  filter: FlightFilterCondition,
  key: "airCompanies" | "fromAirports" | "toAirports",
  id: string,
): FlightFilterCondition {
  return {
    ...filter,
    [key]: filter[key].map((o) => (o.id === id ? { ...o, isChecked: !o.isChecked } : o)),
  };
}

function clearOptionGroup(
  filter: FlightFilterCondition,
  key: "airCompanies" | "fromAirports" | "toAirports",
): FlightFilterCondition {
  return {
    ...filter,
    [key]: filter[key].map((o) => ({ ...o, isChecked: false })),
  };
}

function TimePanel({
  filter,
  onChange,
}: {
  filter: FlightFilterCondition;
  onChange: (filter: FlightFilterCondition) => void;
}) {
  return (
    <>
      {FLIGHT_FILTER_TIME_SPANS.map((span) => {
        const selected =
          span.value === null
            ? filter.takeOffTimeSpan === null
            : filter.takeOffTimeSpan?.lower === span.value.lower &&
              filter.takeOffTimeSpan?.upper === span.value.upper;

        return (
          <FilterListRow
            key={span.label}
            label={span.label}
            selected={selected}
            control={<RadioMark selected={selected} />}
            onClick={() => onChange({ ...filter, takeOffTimeSpan: span.value })}
          />
        );
      })}
    </>
  );
}

function AirlinePanel({
  filter,
  onChange,
}: {
  filter: FlightFilterCondition;
  onChange: (filter: FlightFilterCondition) => void;
}) {
  const anySelected = filter.airCompanies.some((o) => o.isChecked);

  if (!filter.airCompanies.length) {
    return <EmptyPanel message="当前列表暂无航司数据" />;
  }

  return (
    <>
      <FilterListRow
        label="不限"
        selected={!anySelected}
        control={<RadioMark selected={!anySelected} />}
        onClick={() => onChange(clearOptionGroup(filter, "airCompanies"))}
      />
      {filter.airCompanies.map((option) => (
        <FilterListRow
          key={option.id}
          label={`${option.label} (${option.id})`}
          leading={<AirlineLogo icon={option.icon} code={option.id} name={option.label} />}
          selected={option.isChecked}
          control={<CheckboxMark checked={option.isChecked} />}
          onClick={() => onChange(toggleOption(filter, "airCompanies", option.id))}
        />
      ))}
    </>
  );
}

function AirportPanel({
  options,
  anySelected,
  emptyMessage,
  onClear,
  onToggle,
}: {
  options: FlightFilterOption[];
  anySelected: boolean;
  emptyMessage: string;
  onClear: () => void;
  onToggle: (id: string) => void;
}) {
  if (!options.length) {
    return <EmptyPanel message={emptyMessage} />;
  }

  return (
    <>
      <FilterListRow
        label="不限"
        selected={!anySelected}
        control={<RadioMark selected={!anySelected} />}
        onClick={onClear}
      />
      {options.map((option) => (
        <FilterListRow
          key={option.id}
          label={option.label}
          selected={option.isChecked}
          control={<CheckboxMark checked={option.isChecked} />}
          onClick={() => onToggle(option.id)}
        />
      ))}
    </>
  );
}

/** Legacy `fly-filter` — sidebar categories with airline logos and time radios. */
export function FlightFilterSheet({
  open,
  filter,
  onChange,
  onClose,
  onConfirm,
}: FlightFilterSheetProps) {
  const [rendered, setRendered] = useState(open);
  const [visible, setVisible] = useState(false);
  const [activeTab, setActiveTab] = useState<FlightFilterSection>("time");

  useEffect(() => {
    if (open) setRendered(true);
  }, [open]);

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
      aria-label="航班筛选"
    >
      <button
        type="button"
        className="flight-filter-sheet__backdrop"
        aria-label="关闭筛选"
        onClick={onClose}
      />

      <div className="flight-filter-sheet__panel mx-auto w-full max-w-lg">
        <span className="flight-filter-sheet__handle" aria-hidden />

        <header className={`flight-filter-sheet__header relative px-4 pb-2 pt-5 ${FONT}`}>
          <div className="mb-3 flex items-center justify-between">
            <CloseButton onClose={onClose} />
            <h2 className="text-[17px] font-semibold text-brand-title">航班筛选</h2>
            <span className="size-8" aria-hidden />
          </div>
        </header>

        <div className="flight-filter-sheet__quick-filters">
          <QuickToggle
            label="仅直达"
            checked={filter.onlyDirect}
            onChange={(onlyDirect) => onChange({ ...filter, onlyDirect })}
          />
          <QuickToggle
            label="协议航司"
            checked={filter.isAgreement}
            onChange={(isAgreement) => onChange({ ...filter, isAgreement })}
          />
        </div>

        <div className="flight-filter-sheet__body">
          <div className="flight-filter-sheet__body-main">
            <nav className="flight-filter-sheet__sidebar" aria-label="筛选分类">
              {FILTER_TABS.map((tab) => {
                const dirty = isFlightFilterSectionActive(filter, tab.id);
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

            <div className="flight-filter-sheet__content">
              <div className="flight-filter-sheet__content-scroll">
                {activeTab === "time" ? <TimePanel filter={filter} onChange={onChange} /> : null}
                {activeTab === "airline" ? (
                  <AirlinePanel filter={filter} onChange={onChange} />
                ) : null}
                {activeTab === "fromAirport" ? (
                  <AirportPanel
                    options={filter.fromAirports}
                    anySelected={filter.fromAirports.some((o) => o.isChecked)}
                    emptyMessage="当前列表暂无起飞机场"
                    onClear={() => onChange(clearOptionGroup(filter, "fromAirports"))}
                    onToggle={(id) => onChange(toggleOption(filter, "fromAirports", id))}
                  />
                ) : null}
                {activeTab === "toAirport" ? (
                  <AirportPanel
                    options={filter.toAirports}
                    anySelected={filter.toAirports.some((o) => o.isChecked)}
                    emptyMessage="当前列表暂无到达机场"
                    onClear={() => onChange(clearOptionGroup(filter, "toAirports"))}
                    onToggle={(id) => onChange(toggleOption(filter, "toAirports", id))}
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
                onClick={() => onChange(resetFlightFilterDraft(filter))}
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
