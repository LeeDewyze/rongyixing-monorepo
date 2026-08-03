interface CityPairFieldProps {
  fromLabel: string;
  toLabel: string;
  swapping?: boolean;
  onSelectFrom: () => void;
  onSelectTo: () => void;
  onSwap: () => void;
  fromPlaceholder?: string;
  toPlaceholder?: string;
}

export function CityPairField({
  fromLabel,
  toLabel,
  swapping = false,
  onSelectFrom,
  onSelectTo,
  onSwap,
  fromPlaceholder = "出发地",
  toPlaceholder = "目的地",
}: CityPairFieldProps) {
  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        className="flex-1 text-left text-2xl font-semibold text-primary"
        onClick={onSelectFrom}
      >
        {fromLabel || fromPlaceholder}
      </button>
      <button
        type="button"
        aria-label="交换"
        className={`rounded-full p-2 text-primary transition-transform ${swapping ? "rotate-180" : ""}`}
        onClick={onSwap}
      >
        ⇄
      </button>
      <button
        type="button"
        className="flex-1 text-right text-2xl font-semibold text-primary"
        onClick={onSelectTo}
      >
        {toLabel || toPlaceholder}
      </button>
    </div>
  );
}
