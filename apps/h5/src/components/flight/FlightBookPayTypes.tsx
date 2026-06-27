import { useState } from "react";

import { FlightBookCollapseIcon } from "@/components/flight/FlightBookCollapseIcon";
import { HOTEL_DETAIL_FONT } from "@/components/hotel/hotel-detail-chrome";
import { FLIGHT_PAY_TYPE_PERSON, type FlightPayTypeOption } from "@/lib/flight-book-pay";

const payTypeOptionLabelClass =
  "text-[16px] font-medium leading-none text-[#010101] [font-family:'HarmonyOS_Sans_SC','HarmonyOS_Sans','PingFang_SC',sans-serif]";

interface FlightBookPayTypesProps {
  options: FlightPayTypeOption[];
  value: number;
  personHoldMinutes: number;
  onChange: (value: number) => void;
}

function resolveSelectedPayTypeLabel(options: FlightPayTypeOption[], value: number): string {
  const option = options.find((item) => item.value === value);
  return option?.label ?? "";
}

export function FlightBookPayTypes({
  options,
  value,
  personHoldMinutes,
  onChange,
}: FlightBookPayTypesProps) {
  const [expanded, setExpanded] = useState(true);

  if (!options.length) return null;

  const selectedLabel = resolveSelectedPayTypeLabel(options, value);

  return (
    <section
      className={`rounded-xl bg-white px-3 py-3 shadow-[0_2px_8px_rgba(0,0,0,0.04)] ${HOTEL_DETAIL_FONT}`}
    >
      <button
        type="button"
        className="flex w-full items-center justify-between gap-3"
        aria-expanded={expanded}
        onClick={() => setExpanded((current) => !current)}
      >
        <div className="min-w-0 text-left">
          <p className="text-[16px] font-semibold text-[#222222]">支付方式</p>
          {!expanded && selectedLabel ? (
            <p className="mt-0.5 truncate text-[13px] text-[#666666]">{selectedLabel}</p>
          ) : null}
        </div>
        <FlightBookCollapseIcon expanded={expanded} />
      </button>

      {expanded ? (
        <div className="mt-3 space-y-2 border-t border-[#F0F0F0] pt-3">
          {options.map((option) => (
            <label
              key={option.value}
              className="flex cursor-pointer items-center gap-3 rounded-lg bg-[#F6F8FC] px-3 py-3.5"
            >
              <div className="min-w-0 flex-1">
                <p className={payTypeOptionLabelClass}>
                  {option.label}
                  {option.value === FLIGHT_PAY_TYPE_PERSON ? (
                    <span className="ml-2 text-[13px] font-normal text-[#666666]">
                      （请在{personHoldMinutes}分钟内完成支付）
                    </span>
                  ) : null}
                </p>
              </div>
              <input
                type="radio"
                name="flightPayType"
                checked={value === option.value}
                onChange={() => onChange(option.value)}
                className="size-5 shrink-0 accent-[#2768FA]"
              />
            </label>
          ))}
        </div>
      ) : null}
    </section>
  );
}
