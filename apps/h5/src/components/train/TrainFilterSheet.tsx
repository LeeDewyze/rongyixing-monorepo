import { useEffect, useState, type ReactNode } from "react";
import type { TrainFilterCondition, TrainFilterOption } from "@ryx/shared-types";

import {
  resetTrainFilterDraft,
  toggleTrainTimeSpan,
  TRAIN_FILTER_TIME_SPANS,
} from "@/utils/train-list";

import "./train-filter-sheet.css";

const SHEET_ANIMATION_MS = 320;

interface TrainFilterSheetProps {
  open: boolean;
  filter: TrainFilterCondition;
  onChange: (filter: TrainFilterCondition) => void;
  onClose: () => void;
  onConfirm: () => void;
}

function FilterChip({
  label,
  selected,
  onClick,
}: {
  label: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex h-9 w-full items-center justify-center rounded-lg px-2 text-[13px] transition-colors [font-family:'HarmonyOS_Sans_SC','HarmonyOS_Sans','PingFang_SC',sans-serif] ${
        selected
          ? "bg-gradient-to-r from-[#2768FA] to-[#33A1F9] font-medium text-white shadow-[0_2px_8px_rgba(39,104,250,0.28)]"
          : "border border-[#E8ECF3] bg-white text-[#333333] active:bg-[#F0F4FA]"
      }`}
    >
      <span className="truncate">{label}</span>
    </button>
  );
}

function FilterSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="space-y-3">
      <h3 className="text-[13px] font-medium text-[#333333] [font-family:'HarmonyOS_Sans_SC','HarmonyOS_Sans','PingFang_SC',sans-serif]">
        {title}
      </h3>
      {children}
    </section>
  );
}

function TimeSpanGroup({
  value,
  onChange,
}: {
  value: { lower: number; upper: number } | null;
  onChange: (span: { lower: number; upper: number } | null) => void;
}) {
  return (
    <div className="grid grid-cols-3 gap-2">
      {TRAIN_FILTER_TIME_SPANS.map((span) => {
        const selected = value?.lower === span.value.lower && value?.upper === span.value.upper;
        return (
          <FilterChip
            key={span.label}
            label={span.label}
            selected={selected}
            onClick={() => onChange(toggleTrainTimeSpan(value, span.value))}
          />
        );
      })}
    </div>
  );
}

/** Bottom sheet for train list filters (legacy-aligned time spans and seat types). */
export function TrainFilterSheet({
  open,
  filter,
  onChange,
  onClose,
  onConfirm,
}: TrainFilterSheetProps) {
  const [rendered, setRendered] = useState(open);
  const [visible, setVisible] = useState(false);

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

  function toggleSeatType(option: TrainFilterOption) {
    onChange({
      ...filter,
      seatTypes: filter.seatTypes.map((item) =>
        item.id === option.id ? { ...item, isChecked: !item.isChecked } : item,
      ),
    });
  }

  return (
    <div
      className={`train-filter-sheet${visible ? " train-filter-sheet--visible" : ""}`}
      role="dialog"
      aria-modal="true"
      aria-label="筛选"
    >
      <button
        type="button"
        className="train-filter-sheet__backdrop"
        aria-label="关闭筛选"
        onClick={onClose}
      />
      <div className="train-filter-sheet__panel mx-auto w-full max-w-lg">
        <header className="train-filter-sheet__header px-4 pb-3 pt-4">
          <h2 className="text-center text-[17px] font-semibold text-[#010101] [font-family:'HarmonyOS_Sans_SC','HarmonyOS_Sans','PingFang_SC',sans-serif]">
            筛选
          </h2>
        </header>

        <div className="train-filter-sheet__body space-y-5 px-4 pb-4">
          <FilterSection title="车次类型">
            <div className="grid grid-cols-3 gap-2">
              <FilterChip
                label="只看有票"
                selected={filter.onlyHasTickets}
                onClick={() => onChange({ ...filter, onlyHasTickets: !filter.onlyHasTickets })}
              />
            </div>
          </FilterSection>

          {filter.seatTypes.length > 0 ? (
            <FilterSection title="席别">
              <div className="grid grid-cols-3 gap-2">
                {filter.seatTypes.map((option) => (
                  <FilterChip
                    key={option.id}
                    label={option.label}
                    selected={option.isChecked}
                    onClick={() => toggleSeatType(option)}
                  />
                ))}
              </div>
            </FilterSection>
          ) : null}

          <FilterSection title="出发时间">
            <TimeSpanGroup
              value={filter.departureTimeSpan}
              onChange={(departureTimeSpan) => onChange({ ...filter, departureTimeSpan })}
            />
          </FilterSection>

          <FilterSection title="到达时间">
            <TimeSpanGroup
              value={filter.arrivalTimeSpan}
              onChange={(arrivalTimeSpan) => onChange({ ...filter, arrivalTimeSpan })}
            />
          </FilterSection>
        </div>

        <footer className="train-filter-sheet__footer">
          <div className="flex gap-3">
            <button
              type="button"
              className="flex h-10 flex-1 items-center justify-center rounded-lg border border-[#5099fe] text-[15px] font-medium text-[#5099fe] active:bg-[#F0F6FF] [font-family:'HarmonyOS_Sans_SC','HarmonyOS_Sans','PingFang_SC',sans-serif]"
              onClick={() => onChange(resetTrainFilterDraft(filter))}
            >
              重置
            </button>
            <button
              type="button"
              className="flex h-10 flex-[2] items-center justify-center rounded-lg bg-gradient-to-r from-[#2768FA] to-[#33A1F9] text-[15px] font-medium text-white shadow-[0_4px_12px_rgba(39,104,250,0.32)] active:opacity-90 [font-family:'HarmonyOS_Sans_SC','HarmonyOS_Sans','PingFang_SC',sans-serif]"
              onClick={onConfirm}
            >
              确定
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
}
