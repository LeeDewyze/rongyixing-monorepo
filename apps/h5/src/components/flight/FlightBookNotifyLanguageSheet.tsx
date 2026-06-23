import {
  FLIGHT_NOTIFY_LANGUAGE_OPTIONS,
  type FlightNotifyLanguage,
} from "@/lib/flight-book-notify";

interface FlightBookNotifyLanguageSheetProps {
  open: boolean;
  value: FlightNotifyLanguage;
  onClose: () => void;
  onSelect: (value: FlightNotifyLanguage) => void;
}

export function FlightBookNotifyLanguageSheet({
  open,
  value,
  onClose,
  onSelect,
}: FlightBookNotifyLanguageSheetProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[70] flex flex-col justify-end bg-black/40">
      <button type="button" className="flex-1" aria-label="关闭" onClick={onClose} />
      <div className="rounded-t-2xl bg-white px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-4">
        <h2 className="mb-4 text-center text-base font-semibold text-[#333333]">通知语言</h2>
        <ul className="divide-y divide-[#eeeeee]">
          {FLIGHT_NOTIFY_LANGUAGE_OPTIONS.map((option) => {
            const selected = option.value === value;
            return (
              <li key={option.value || "none"}>
                <button
                  type="button"
                  className="flex w-full items-center justify-between py-4 text-left text-sm active:bg-[#f5f7fa]"
                  onClick={() => {
                    onSelect(option.value);
                    onClose();
                  }}
                >
                  <span className={selected ? "font-medium text-[#5099fe]" : "text-[#333333]"}>
                    {option.label}
                  </span>
                  {selected ? (
                    <span className="text-[#5099fe]" aria-hidden>
                      ✓
                    </span>
                  ) : null}
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
