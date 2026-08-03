import { useEffect, useRef, useState } from "react";

import { CalendarGrid } from "./CalendarGrid";
import type { CalendarPickerConfig, DateRangeDraft } from "@/lib/calendar-picker";
import {
  calendarMaxSelectableDate,
  calendarMinSelectableDate,
  createDateRangeDraft,
  createEmptyDateRangeDraft,
  reduceCalendarSelection,
} from "@/lib/calendar-picker";

import "./calendar-picker-sheet.css";

const CONFIRM_DELAY_MS = 150;
const SHEET_ANIMATION_MS = 320;

export interface CalendarPickerSheetProps {
  open: boolean;
  config: CalendarPickerConfig;
  startDate: string;
  endDate: string;
  onClose: () => void;
  onConfirm: (start: string, end: string) => void;
}

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

export function CalendarPickerSheet({
  open,
  config,
  startDate,
  endDate,
  onClose,
  onConfirm,
}: CalendarPickerSheetProps) {
  const restoredDraft = createDateRangeDraft(startDate, endDate);
  const [interactionDraft, setInteractionDraft] = useState<DateRangeDraft>(() =>
    createEmptyDateRangeDraft(),
  );
  const [hint, setHint] = useState("");
  const [rendered, setRendered] = useState(open);
  const [visible, setVisible] = useState(false);
  const confirmTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const displayDraft = interactionDraft.start !== null ? interactionDraft : restoredDraft;

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

  useEffect(() => {
    if (!open) return;
    setInteractionDraft(createEmptyDateRangeDraft());
    setHint("");
    if (confirmTimerRef.current) {
      clearTimeout(confirmTimerRef.current);
      confirmTimerRef.current = null;
    }
  }, [open, startDate, endDate]);

  useEffect(() => {
    return () => {
      if (confirmTimerRef.current) clearTimeout(confirmTimerRef.current);
    };
  }, []);

  if (!rendered) return null;

  function handleSelectDate(date: string) {
    const minDate = calendarMinSelectableDate(config);
    const maxDate = calendarMaxSelectableDate(config);
    const base = interactionDraft.start !== null ? interactionDraft : createEmptyDateRangeDraft();
    const result = reduceCalendarSelection(config, base, date, minDate, maxDate);
    if (result.type === "noop") return;

    setInteractionDraft(result.draft);
    setHint(result.hint);

    if (result.type === "complete" && result.draft.start && result.draft.end) {
      if (confirmTimerRef.current) clearTimeout(confirmTimerRef.current);
      confirmTimerRef.current = setTimeout(() => {
        onConfirm(result.draft.start!, result.draft.end!);
        onClose();
      }, CONFIRM_DELAY_MS);
    }
  }

  return (
    <div
      className={`calendar-picker-sheet${visible ? " calendar-picker-sheet--visible" : ""}`}
      role="dialog"
      aria-modal="true"
      aria-label={config.title}
    >
      <button
        type="button"
        className="calendar-picker-sheet__backdrop"
        aria-label="关闭"
        onClick={onClose}
      />
      <div className="calendar-picker-sheet__panel">
        <header
          className="relative flex h-14 shrink-0 items-center px-3"
          style={{ background: "linear-gradient(180deg, #7AB1FF 0%, #F5F6F9 99.64%)" }}
        >
          <button
            type="button"
            className="flex h-11 w-10 shrink-0 items-center justify-center active:opacity-70"
            aria-label="返回"
            onClick={onClose}
          >
            <BackIcon />
          </button>
          <h2 className="pointer-events-none absolute inset-x-0 text-center text-[17px] font-semibold text-[#010101] [font-family:'HarmonyOS_Sans_SC','HarmonyOS_Sans','PingFang_SC',sans-serif]">
            {config.title}
          </h2>
        </header>

        <CalendarGrid
          config={config}
          draft={displayDraft}
          anchorDate={startDate}
          hint={hint}
          onSelectDate={handleSelectDate}
        />
      </div>
    </div>
  );
}
