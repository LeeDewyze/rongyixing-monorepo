import type { TrainTypeFilter } from "@ryx/shared-types";

const OPTIONS: { value: TrainTypeFilter; label: string }[] = [
  { value: "all", label: "不限" },
  { value: "highSpeed", label: "只看高铁/动车" },
  { value: "regular", label: "只看普通列车" },
];

interface TrainTypeFilterBarProps {
  value: TrainTypeFilter;
  onChange: (value: TrainTypeFilter) => void;
}

function Checkbox({ checked }: { checked: boolean }) {
  return (
    <span
      className={`flex size-4 shrink-0 items-center justify-center rounded border ${
        checked ? "border-[#5099fe] bg-[#5099fe]" : "border-[#cccccc] bg-white"
      }`}
      aria-hidden
    >
      {checked ? (
        <svg viewBox="0 0 12 12" className="size-2.5 text-white">
          <path
            d="M2.5 6l2.5 2.5 4.5-5"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      ) : null}
    </span>
  );
}

export function TrainTypeFilterBar({ value, onChange }: TrainTypeFilterBarProps) {
  return (
    <div className="w-full bg-[#e4edfd] px-3 pb-2 pt-1">
      <div className="flex h-8 items-center rounded-lg bg-[#F5F6F9] px-2">
        {OPTIONS.map((option) => {
          const checked = value === option.value;
          return (
            <button
              key={option.value}
              type="button"
              className="flex min-w-0 flex-1 items-center justify-center gap-1.5 text-[13px] text-[#333333] active:opacity-80"
              onClick={() => onChange(option.value)}
            >
              <Checkbox checked={checked} />
              <span className="truncate">{option.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
