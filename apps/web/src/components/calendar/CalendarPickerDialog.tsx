import { useEffect, useRef, useState } from "react";

import { Dialog, DialogContent, DialogTitle } from "@ryx/ui/components/ui/dialog";

import { CalendarGrid } from "@/components/calendar/CalendarGrid";
import type { CalendarPickerConfig, DateRangeDraft } from "@/lib/calendar-picker";
import {
  calendarMaxSelectableDate,
  calendarMinSelectableDate,
  createDateRangeDraft,
  createEmptyDateRangeDraft,
  reduceCalendarSelection,
} from "@/lib/calendar-picker";

import "./calendar-grid.css";

const CONFIRM_DELAY_MS = 150;

export interface CalendarPickerDialogProps {
  open: boolean;
  config: CalendarPickerConfig;
  startDate: string;
  endDate: string;
  onClose: () => void;
  onConfirm: (start: string, end: string) => void;
}

function CloseIcon() {
  return (
    <svg viewBox="0 0 20 20" className="size-5 shrink-0 text-[#010101]" aria-hidden>
      <path
        d="M5 5l10 10M15 5 5 15"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

/** Pad/PC calendar dialog — same selection logic as H5 CalendarPickerSheet. */
export function CalendarPickerDialog({
  open,
  config,
  startDate,
  endDate,
  onClose,
  onConfirm,
}: CalendarPickerDialogProps) {
  const restoredDraft = createDateRangeDraft(startDate, endDate);
  const [interactionDraft, setInteractionDraft] = useState<DateRangeDraft>(() =>
    createEmptyDateRangeDraft(),
  );
  const [hint, setHint] = useState("");
  const confirmTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const displayDraft = interactionDraft.start !== null ? interactionDraft : restoredDraft;

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
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent className="flex h-[min(85vh,720px)] min-h-0 w-full max-w-lg flex-col gap-0 overflow-hidden p-0 sm:max-w-lg">
        <header
          className="relative flex h-14 shrink-0 items-center px-3"
          style={{ background: "linear-gradient(180deg, #7AB1FF 0%, #F5F6F9 99.64%)" }}
        >
          <button
            type="button"
            className="flex size-10 shrink-0 items-center justify-center rounded-full hover:bg-white/30"
            aria-label="关闭"
            onClick={onClose}
          >
            <CloseIcon />
          </button>
          <DialogTitle className="pointer-events-none absolute inset-x-0 text-center text-[17px] font-semibold text-[#010101] [font-family:'HarmonyOS_Sans_SC','HarmonyOS_Sans','PingFang_SC',sans-serif]">
            {config.title}
          </DialogTitle>
        </header>

        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <CalendarGrid
            config={config}
            draft={displayDraft}
            anchorDate={startDate}
            hint={hint}
            onSelectDate={handleSelectDate}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
