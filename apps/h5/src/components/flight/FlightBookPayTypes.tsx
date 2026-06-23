import {
  FLIGHT_PAY_TYPE_PERSON,
  type FlightPayTypeOption,
} from "@/lib/flight-book-pay";

interface FlightBookPayTypesProps {
  options: FlightPayTypeOption[];
  value: number;
  personHoldMinutes: number;
  onChange: (value: number) => void;
}

export function FlightBookPayTypes({
  options,
  value,
  personHoldMinutes,
  onChange,
}: FlightBookPayTypesProps) {
  if (!options.length) return null;

  return (
    <section className="rounded-xl bg-white px-3 py-3 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
      <h2 className="text-[16px] font-semibold text-[#222222]">支付方式</h2>

      <div className="mt-3 space-y-2">
        {options.map((option) => (
          <label
            key={option.value}
            className="flex cursor-pointer items-center gap-3 rounded-lg bg-[#f6f8fc] px-3 py-3.5"
          >
            <div className="min-w-0 flex-1">
              <p className="text-[16px] font-medium text-[#333333]">
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
              className="size-5 shrink-0 accent-[#5099fe]"
            />
          </label>
        ))}
      </div>
    </section>
  );
}
