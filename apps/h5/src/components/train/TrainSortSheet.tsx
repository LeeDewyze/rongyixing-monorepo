import { useEffect, useState } from "react";
import { Button } from "@ryx/ui/components/ui/button";
import type { TrainSortKind } from "@ryx/shared-types";

interface TrainSortSheetProps {
  open: boolean;
  kind: TrainSortKind | null;
  durationShortToLong: boolean;
  timeEarlyToLate: boolean;
  priceLowToHigh: boolean;
  onClose: () => void;
  onConfirm: (kind: TrainSortKind, ascending: boolean) => void;
}

const DURATION_OPTIONS = [
  { label: "从短到长", value: true },
  { label: "从长到短", value: false },
] as const;

const TIME_OPTIONS = [
  { label: "从早到晚", value: true },
  { label: "从晚到早", value: false },
] as const;

const PRICE_OPTIONS = [
  { label: "从低到高", value: true },
  { label: "从高到低", value: false },
] as const;

function SortOption({
  label,
  selected,
  onSelect,
}: {
  label: string;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`flex w-full items-center justify-between rounded-lg border px-4 py-3 text-left text-sm ${
        selected
          ? "border-primary bg-primary/5 font-medium text-primary"
          : "border-border bg-background"
      }`}
    >
      {label}
      {selected && <span className="text-primary">✓</span>}
    </button>
  );
}

const TITLES: Record<TrainSortKind, string> = {
  duration: "耗时排序",
  time: "时间排序",
  price: "价格排序",
};

/** Bottom sheet for duration / time / price sort selection. */
export function TrainSortSheet({
  open,
  kind,
  durationShortToLong,
  timeEarlyToLate,
  priceLowToHigh,
  onClose,
  onConfirm,
}: TrainSortSheetProps) {
  const [draftDuration, setDraftDuration] = useState(durationShortToLong);
  const [draftTime, setDraftTime] = useState(timeEarlyToLate);
  const [draftPrice, setDraftPrice] = useState(priceLowToHigh);

  useEffect(() => {
    if (!open) return;
    setDraftDuration(durationShortToLong);
    setDraftTime(timeEarlyToLate);
    setDraftPrice(priceLowToHigh);
  }, [open, durationShortToLong, timeEarlyToLate, priceLowToHigh]);

  if (!open || !kind) return null;

  const activeKind = kind;

  function handleConfirm() {
    const ascending =
      activeKind === "duration" ? draftDuration : activeKind === "time" ? draftTime : draftPrice;
    onConfirm(activeKind, ascending);
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end bg-black/40">
      <button type="button" className="flex-1" aria-label="关闭排序" onClick={onClose} />
      <div className="rounded-t-2xl bg-background p-4 pb-6">
        <h2 className="mb-4 text-lg font-semibold">{TITLES[activeKind]}</h2>

        <div className="space-y-2">
          {activeKind === "duration" &&
            DURATION_OPTIONS.map((opt) => (
              <SortOption
                key={opt.label}
                label={opt.label}
                selected={draftDuration === opt.value}
                onSelect={() => setDraftDuration(opt.value)}
              />
            ))}
          {activeKind === "time" &&
            TIME_OPTIONS.map((opt) => (
              <SortOption
                key={opt.label}
                label={opt.label}
                selected={draftTime === opt.value}
                onSelect={() => setDraftTime(opt.value)}
              />
            ))}
          {activeKind === "price" &&
            PRICE_OPTIONS.map((opt) => (
              <SortOption
                key={opt.label}
                label={opt.label}
                selected={draftPrice === opt.value}
                onSelect={() => setDraftPrice(opt.value)}
              />
            ))}
        </div>

        <Button className="mt-6 h-11 w-full" onClick={handleConfirm}>
          确定
        </Button>
      </div>
    </div>
  );
}
