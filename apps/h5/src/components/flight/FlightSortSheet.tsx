import { useEffect, useState } from "react";
import { Button } from "@ryx/ui/components/ui/button";

export type FlightSortKind = "time" | "price";

interface FlightSortSheetProps {
  open: boolean;
  kind: FlightSortKind | null;
  timeEarlyToLate: boolean;
  priceLowToHigh: boolean;
  onClose: () => void;
  onConfirm: (kind: FlightSortKind, ascending: boolean) => void;
}

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

/** Bottom sheet for time / price sort selection. */
export function FlightSortSheet({
  open,
  kind,
  timeEarlyToLate,
  priceLowToHigh,
  onClose,
  onConfirm,
}: FlightSortSheetProps) {
  const [draftTime, setDraftTime] = useState(timeEarlyToLate);
  const [draftPrice, setDraftPrice] = useState(priceLowToHigh);

  useEffect(() => {
    if (!open) return;
    setDraftTime(timeEarlyToLate);
    setDraftPrice(priceLowToHigh);
  }, [open, timeEarlyToLate, priceLowToHigh]);

  if (!open || !kind) return null;

  const title = kind === "time" ? "时间排序" : "价格排序";

  function handleConfirm() {
    onConfirm(kind!, kind === "time" ? draftTime : draftPrice);
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end bg-black/40">
      <button type="button" className="flex-1" aria-label="关闭排序" onClick={onClose} />
      <div className="rounded-t-2xl bg-background p-4 pb-6">
        <h2 className="mb-4 text-lg font-semibold">{title}</h2>

        <div className="space-y-2">
          {kind === "time" &&
            TIME_OPTIONS.map((opt) => (
              <SortOption
                key={opt.label}
                label={opt.label}
                selected={draftTime === opt.value}
                onSelect={() => setDraftTime(opt.value)}
              />
            ))}
          {kind === "price" &&
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
