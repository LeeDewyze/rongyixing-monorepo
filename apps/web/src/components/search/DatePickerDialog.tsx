import { useEffect, useMemo, useState } from "react";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@ryx/ui/components/ui/dialog";

import {
  addDays,
  buildDateRange,
  formatDayChip,
  parseLocalDate,
  todayDateString,
} from "@/lib/date-search";

interface DatePickerDialogProps {
  open: boolean;
  title?: string;
  value: string;
  onClose: () => void;
  onConfirm: (date: string) => void;
  /** Number of selectable days from today (default 60). */
  rangeDays?: number;
}

/** Pad/PC single-date picker dialog. */
export function DatePickerDialog({
  open,
  title = "选择日期",
  value,
  onClose,
  onConfirm,
  rangeDays = 60,
}: DatePickerDialogProps) {
  const [selected, setSelected] = useState(value);
  const today = todayDateString();

  useEffect(() => {
    if (open) setSelected(value);
  }, [open, value]);

  const dates = useMemo(() => buildDateRange(today, rangeDays), [today, rangeDays]);

  const weeks = useMemo(() => {
    const chunks: string[][] = [];
    let current: string[] = [];
    for (const date of dates) {
      const day = parseLocalDate(date)?.getDay() ?? 0;
      if (current.length === 0 && day > 0) {
        for (let i = 0; i < day; i += 1) current.push("");
      }
      current.push(date);
      if (current.length === 7) {
        chunks.push(current);
        current = [];
      }
    }
    if (current.length > 0) {
      while (current.length < 7) current.push("");
      chunks.push(current);
    }
    return chunks;
  }, [dates]);

  function handleConfirm() {
    onConfirm(selected);
    onClose();
  }

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent className="max-w-md gap-0 p-0">
        <DialogHeader className="border-b px-4 py-3">
          <DialogTitle className="text-base font-medium text-brand-title">{title}</DialogTitle>
        </DialogHeader>

        <div className="px-4 py-3">
          <div className="mb-2 grid grid-cols-7 gap-1 text-center text-xs text-[#999999]">
            {["日", "一", "二", "三", "四", "五", "六"].map((d) => (
              <span key={d}>{d}</span>
            ))}
          </div>
          <div className="space-y-1">
            {weeks.map((week, wi) => (
              <div key={wi} className="grid grid-cols-7 gap-1">
                {week.map((date, di) => {
                  if (!date) return <span key={`${wi}-${di}`} />;
                  const chip = formatDayChip(date);
                  const isSelected = date === selected;
                  const isToday = date === today;
                  return (
                    <button
                      key={date}
                      type="button"
                      className={`flex min-h-11 flex-col items-center justify-center rounded-lg text-sm pointer-coarse:min-h-12 ${
                        isSelected
                          ? "bg-brand-primary text-white"
                          : "hover:bg-[#F5F6F9] text-[#333333]"
                      }`}
                      onClick={() => setSelected(date)}
                    >
                      <span className="text-[10px] leading-none opacity-80">
                        {isToday ? "今天" : `周${chip.weekday}`}
                      </span>
                      <span className="mt-0.5 font-medium">{chip.label}</span>
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-end gap-2 border-t px-4 py-3">
          <button
            type="button"
            className="min-h-11 rounded-lg px-4 text-sm text-[#666666] hover:bg-muted pointer-coarse:px-5"
            onClick={onClose}
          >
            取消
          </button>
          <button
            type="button"
            className="min-h-11 rounded-lg bg-brand-primary px-5 text-sm font-medium text-white hover:opacity-90"
            onClick={handleConfirm}
          >
            确定
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

interface HotelStayDatePickerDialogProps {
  open: boolean;
  checkIn: string;
  checkOut: string;
  onClose: () => void;
  onConfirm: (checkIn: string, checkOut: string) => void;
  rangeDays?: number;
}

/** Pad/PC hotel check-in / check-out range picker. */
export function HotelStayDatePickerDialog({
  open,
  checkIn,
  checkOut,
  onClose,
  onConfirm,
  rangeDays = 60,
}: HotelStayDatePickerDialogProps) {
  const today = todayDateString();
  const [start, setStart] = useState(checkIn);
  const [end, setEnd] = useState(checkOut);
  const [pickingEnd, setPickingEnd] = useState(false);

  useEffect(() => {
    if (open) {
      setStart(checkIn);
      setEnd(checkOut);
      setPickingEnd(false);
    }
  }, [open, checkIn, checkOut]);

  const dates = useMemo(() => buildDateRange(today, rangeDays), [today, rangeDays]);

  function handleDateClick(date: string) {
    if (!pickingEnd) {
      setStart(date);
      const nextEnd = end > date ? end : addDays(date, 1);
      setEnd(nextEnd);
      setPickingEnd(true);
      return;
    }
    if (date <= start) {
      setStart(date);
      setEnd(addDays(date, 1));
      setPickingEnd(true);
      return;
    }
    setEnd(date);
  }

  function handleConfirm() {
    if (end <= start) {
      onConfirm(start, addDays(start, 1));
    } else {
      onConfirm(start, end);
    }
    onClose();
  }

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent className="max-w-lg gap-0 p-0">
        <DialogHeader className="border-b px-4 py-3">
          <DialogTitle className="text-base font-medium text-brand-title">
            选择入住离店日期
          </DialogTitle>
          <p className="text-left text-sm text-[#666666]">
            {pickingEnd ? "请选择离店日期" : "请选择入住日期"}
          </p>
        </DialogHeader>

        <div className="max-h-[50vh] overflow-y-auto px-4 py-3">
          <div className="grid grid-cols-4 gap-2 sm:grid-cols-5">
            {dates.map((date) => {
              const chip = formatDayChip(date);
              const inRange = date >= start && date <= end;
              const isEdge = date === start || date === end;
              return (
                <button
                  key={date}
                  type="button"
                  className={`flex min-h-11 flex-col items-center justify-center rounded-lg border text-sm pointer-coarse:min-h-12 ${
                    isEdge
                      ? "border-brand-primary bg-brand-primary text-white"
                      : inRange
                        ? "border-brand-primary/30 bg-brand-primary/10 text-[#333333]"
                        : "border-transparent hover:bg-[#F5F6F9] text-[#333333]"
                  }`}
                  onClick={() => handleDateClick(date)}
                >
                  <span className="text-[10px] leading-none opacity-80">周{chip.weekday}</span>
                  <span className="mt-0.5 font-medium">{chip.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex items-center justify-between border-t px-4 py-3">
          <span className="text-sm text-[#666666]">
            {start} → {end}
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              className="min-h-11 rounded-lg px-4 text-sm text-[#666666] hover:bg-muted"
              onClick={onClose}
            >
              取消
            </button>
            <button
              type="button"
              className="min-h-11 rounded-lg bg-brand-primary px-5 text-sm font-medium text-white hover:opacity-90"
              onClick={handleConfirm}
            >
              确定
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
