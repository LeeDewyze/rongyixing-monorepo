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

function SheetCloseButton({ onClose }: { onClose: () => void }) {
  return (
    <button
      type="button"
      className="flex size-8 items-center justify-center rounded-full bg-[#F5F6F9] text-[#999999] active:bg-[#EBEDF0]"
      aria-label="关闭"
      onClick={onClose}
    >
      <svg
        viewBox="0 0 20 20"
        className="size-4"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
      >
        <path d="M6 6l8 8M14 6l-8 8" strokeLinecap="round" />
      </svg>
    </button>
  );
}

function SelectedCheckIcon() {
  return (
    <svg
      viewBox="0 0 20 20"
      className="size-4 shrink-0 text-brand-primary"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden
    >
      <path d="M5 10l3 3 7-7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function FlightBookNotifyLanguageSheet({
  open,
  value,
  onClose,
  onSelect,
}: FlightBookNotifyLanguageSheetProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[70] flex flex-col justify-end bg-black/45">
      <button type="button" className="flex-1" aria-label="关闭" onClick={onClose} />
      <div
        className="flex max-h-[60vh] flex-col rounded-t-[20px] bg-white shadow-[0_-10px_40px_rgba(0,0,0,0.12)] pb-[max(1rem,env(safe-area-inset-bottom))]"
        role="dialog"
        aria-modal="true"
        aria-labelledby="flight-notify-language-title"
      >
        <div className="flex justify-center pt-2.5" aria-hidden>
          <span className="h-1 w-9 rounded-full bg-[#E0E0E0]" />
        </div>

        <div className="relative flex items-center justify-center px-4 pb-3 pt-1">
          <p id="flight-notify-language-title" className="text-[17px] font-semibold text-[#333333]">
            通知语言
          </p>
          <div className="absolute right-4 top-1">
            <SheetCloseButton onClose={onClose} />
          </div>
        </div>

        <ul className="min-h-0 flex-1 overflow-y-auto px-2 pb-1">
          {FLIGHT_NOTIFY_LANGUAGE_OPTIONS.map((option) => {
            const isSelected = option.value === value;

            return (
              <li key={option.value || "none"}>
                <button
                  type="button"
                  className={`flex w-full items-center justify-between rounded-xl px-3 py-3.5 text-left text-[14px] active:bg-[#F5F6F9] ${
                    isSelected ? "font-medium text-brand-primary" : "text-[#333333]"
                  }`}
                  onClick={() => {
                    onSelect(option.value);
                    onClose();
                  }}
                >
                  <span>{option.label}</span>
                  {isSelected ? <SelectedCheckIcon /> : null}
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
