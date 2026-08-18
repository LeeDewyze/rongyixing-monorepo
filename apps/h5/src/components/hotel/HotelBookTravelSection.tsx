import type { FlightOutNumberField } from "@ryx/shared-types";

import { FlightBookCollapseIcon } from "@/components/flight/FlightBookCollapseIcon";
import { HOTEL_DETAIL_FONT } from "@/components/hotel/hotel-detail-chrome";
import { HotelBookOptionRow } from "@/components/hotel/HotelBookOptionRow";
import { useAutoFillTravelOutNumber } from "@/hooks/useAutoFillTravelOutNumber";
import { formatTravelOutNumberLabel, isTravelOutNumberField } from "@/lib/flight-book-outnumber";

interface HotelBookTravelSectionProps {
  fields: FlightOutNumberField[];
  values: Record<string, string>;
  expanded: boolean;
  /** Room occupant name — only needed to tell sections apart across multiple rooms. */
  subtitle?: string;
  onToggle: () => void;
  onOpenPicker: (field: FlightOutNumberField) => void;
  onChange: (key: string, value: string) => void;
}

export function HotelBookTravelSection({
  fields,
  values,
  expanded,
  subtitle,
  onToggle,
  onOpenPicker,
  onChange,
}: HotelBookTravelSectionProps) {
  const selectableTravelField = fields.find(
    (field) => field.canSelect && isTravelOutNumberField(field),
  );
  const travelFieldValue = selectableTravelField
    ? (values[selectableTravelField.key] ?? selectableTravelField.value ?? "").trim()
    : "";
  useAutoFillTravelOutNumber({
    field: selectableTravelField,
    currentValue: travelFieldValue,
    enabled: Boolean(selectableTravelField),
    onFill: (key, value) => onChange(key, value),
  });

  if (!fields.length) return null;

  return (
    <div
      className={`overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-[#EEF1F6] ${HOTEL_DETAIL_FONT}`}
    >
      <button
        type="button"
        className="flex w-full items-center justify-between px-4 py-3.5 text-left"
        onClick={onToggle}
      >
        <span className="min-w-0 truncate text-[14px] font-semibold text-[#333333]">
          出差信息
          {subtitle ? (
            <span className="ml-2 text-[12px] font-normal text-[#999999]">{subtitle}</span>
          ) : null}
        </span>
        <FlightBookCollapseIcon expanded={expanded} />
      </button>

      {expanded ? (
        <div className="border-t border-[#F0F2F5] px-4">
          {fields.map((field) =>
            field.canSelect ? (
              <HotelBookOptionRow
                key={field.key}
                variant="inline"
                label={formatTravelOutNumberLabel(field)}
                required={field.required}
                value={(values[field.key] ?? field.value ?? "").trim() || "请选择"}
                onClick={() => onOpenPicker(field)}
              />
            ) : (
              <div key={field.key} className="flex items-center gap-3 py-3">
                <span className="w-[5.5rem] shrink-0 whitespace-nowrap text-[14px] text-[#808080]">
                  {formatTravelOutNumberLabel(field)}
                  {field.required ? <span className="text-[#FF4D4F]"> *</span> : null}
                </span>
                <input
                  type="text"
                  value={values[field.key] ?? field.value ?? ""}
                  placeholder={`请输入${formatTravelOutNumberLabel(field)}`}
                  className="min-w-0 flex-1 bg-transparent text-right text-[14px] text-[#333333] outline-none placeholder:text-[#cccccc]"
                  onChange={(event) => onChange(field.key, event.target.value)}
                />
              </div>
            ),
          )}
        </div>
      ) : null}
    </div>
  );
}
