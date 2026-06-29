import { TrainSeatType } from "@ryx/shared-types";

import { HOTEL_DETAIL_FONT } from "@/components/hotel/hotel-detail-chrome";
import { TrainSeatChairIcon } from "@/components/train/TrainSeatChairIcon";

import "./train-book-seat-picker.css";

const SEAT_TITLES: Record<string, string> = {
  A: "靠窗",
  B: "中间",
  C: "靠过道",
  D: "靠过道",
  F: "靠窗",
};

type SeatSideLayout = {
  left: string[];
  right: string[];
};

const LAYOUTS: Record<number, SeatSideLayout> = {
  [TrainSeatType.SecondClassSeat]: { left: ["A", "B", "C"], right: ["D", "F"] },
  [TrainSeatType.FirstClassSeat]: { left: ["A", "C"], right: ["D", "F"] },
  [TrainSeatType.BusinessSeat]: { left: ["A", "C"], right: ["F"] },
  [TrainSeatType.SpecialSeat]: { left: ["A", "C"], right: ["F"] },
};

export interface TrainBookSeatPickerProps {
  seatType?: number;
  passengerCount: number;
  value: string[];
  onChange: (value: string[]) => void;
}

export interface TrainBookPassengerSeatPickerProps {
  seatType?: number;
  value: string;
  onChange: (value: string) => void;
  /** Show allocation disclaimer below the seat row. */
  showDisclaimer?: boolean;
}

/** Toggle one passenger's seat preference; each row allows a single seat or direct switch. */
export function togglePassengerSeatSelection(
  current: string[],
  passengerIndex: number,
  passengerCount: number,
  code: string,
): string[] {
  const next = Array.from({ length: passengerCount }, (_, index) => current[index] ?? "");
  const currentSeat = next[passengerIndex] ?? "";
  next[passengerIndex] = currentSeat === code ? "" : code;
  return next;
}

function SeatLocationButton({
  code,
  title,
  selected,
  onSelect,
}: {
  code: string;
  title: string;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      title={title}
      onClick={onSelect}
      className="train-seat-picker__seat"
      aria-label={title}
      aria-pressed={selected}
    >
      <span className="train-seat-picker__seat-icon">
        <TrainSeatChairIcon code={code} selected={selected} />
      </span>
    </button>
  );
}

function WindowLabel() {
  return <span className="train-seat-picker__window">窗</span>;
}

function AisleLabel() {
  return <span className="train-seat-picker__aisle">过道</span>;
}

function SeatPickerRow({
  layout,
  selectedCode,
  onSelect,
}: {
  layout: SeatSideLayout;
  selectedCode: string;
  onSelect: (code: string) => void;
}) {
  const renderSeat = (code: string) => (
    <SeatLocationButton
      key={code}
      code={code}
      title={SEAT_TITLES[code] ?? code}
      selected={selectedCode === code}
      onSelect={() => onSelect(code)}
    />
  );

  return (
    <div className="train-seat-picker__row">
      <div className="train-seat-picker__track">
        <WindowLabel />
        {layout.left.map(renderSeat)}
        <AisleLabel />
        {layout.right.map(renderSeat)}
        <WindowLabel />
      </div>
    </div>
  );
}

function SeatPickerDisclaimer() {
  return (
    <p className="mt-3 text-[12px] font-normal leading-relaxed text-[#FF8C00]">
      如果本次列车剩余座位无法满足，系统将自动分配席位
    </p>
  );
}

function SeatPickerPanel({
  layout,
  selectedCode,
  onSelect,
}: {
  layout: SeatSideLayout;
  selectedCode: string;
  onSelect: (code: string) => void;
}) {
  return (
    <div className="train-seat-picker rounded-lg border-2 border-[#F8F9FD]">
      <SeatPickerRow layout={layout} selectedCode={selectedCode} onSelect={onSelect} />
    </div>
  );
}

/** Embedded seat picker for one passenger inside a book passenger section. */
export function TrainBookPassengerSeatPicker({
  seatType,
  value,
  onChange,
  showDisclaimer = false,
}: TrainBookPassengerSeatPickerProps) {
  const layout = seatType != null ? LAYOUTS[seatType] : undefined;
  const selected = value.trim();
  const selectedCount = selected ? 1 : 0;

  if (!layout) return null;

  const handleSelect = (code: string) => {
    onChange(selected === code ? "" : code);
  };

  return (
    <div className={HOTEL_DETAIL_FONT}>
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-[16px] font-semibold leading-none text-[#222222]">在线选座</h3>
        <span className="text-[13px] leading-none text-[#666666]">
          <span className="text-[#2768FA]">{selectedCount}</span>/1
        </span>
      </div>

      <SeatPickerPanel layout={layout} selectedCode={selected} onSelect={handleSelect} />

      {showDisclaimer ? <SeatPickerDisclaimer /> : null}
    </div>
  );
}

export function TrainBookSeatPicker({
  seatType,
  passengerCount,
  value,
  onChange,
}: TrainBookSeatPickerProps) {
  const layout = seatType != null ? LAYOUTS[seatType] : undefined;
  const maxSelections = Math.max(passengerCount, 1);
  const selections = Array.from({ length: maxSelections }, (_, index) => value[index] ?? "");
  const selectedCount = selections.filter(Boolean).length;
  const isMultiPassenger = maxSelections > 1;

  if (!layout) return null;

  const handleSelect = (passengerIndex: number, code: string) => {
    onChange(togglePassengerSeatSelection(value, passengerIndex, maxSelections, code));
  };

  return (
    <section
      className={`train-seat-picker mx-3 mb-3 rounded-xl bg-white px-3 py-3 shadow-[0_2px_8px_rgba(0,0,0,0.04)] ${HOTEL_DETAIL_FONT}`}
    >
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-[16px] font-semibold leading-none text-[#222222]">
          {isMultiPassenger ? "在线选座" : "选择坐席"}
        </h2>
        <span className="text-[13px] leading-none text-[#666666]">
          {isMultiPassenger ? (
            <>
              <span className="text-[#2768FA]">{selectedCount}</span>/{maxSelections}
            </>
          ) : (
            <>
              已选 <span className="text-[#2768FA]">{selectedCount}</span>/{maxSelections}
            </>
          )}
        </span>
      </div>

      <div className="divide-y divide-[#F0F2F6] rounded-lg border-2 border-[#F8F9FD]">
        {selections.map((selectedCode, passengerIndex) => (
          <SeatPickerRow
            key={passengerIndex}
            layout={layout}
            selectedCode={selectedCode}
            onSelect={(code) => handleSelect(passengerIndex, code)}
          />
        ))}
      </div>

      <SeatPickerDisclaimer />
    </section>
  );
}
