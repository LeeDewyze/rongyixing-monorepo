interface FlightBookPickerSheetProps {
  open: boolean;
  title: string;
  options: string[];
  selected?: string;
  onClose: () => void;
  onSelect: (value: string) => void;
}

export function FlightBookPickerSheet({
  open,
  title,
  options,
  selected,
  onClose,
  onSelect,
}: FlightBookPickerSheetProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end bg-black/40">
      <button type="button" className="flex-1" aria-label="关闭" onClick={onClose} />
      <div className="max-h-[60vh] overflow-y-auto rounded-t-2xl bg-white pb-[max(1rem,env(safe-area-inset-bottom))]">
        <div className="sticky top-0 flex items-center justify-between border-b border-[#eeeeee] bg-white px-4 py-3">
          <p className="text-[16px] font-semibold text-[#333333]">{title}</p>
          <button type="button" className="text-[22px] text-[#999999]" onClick={onClose}>
            ×
          </button>
        </div>
        <ul>
          {options.map((option) => (
            <li key={option} className="border-b border-[#eeeeee] last:border-b-0">
              <button
                type="button"
                className={`flex w-full px-4 py-3.5 text-left text-[14px] ${
                  selected === option ? "text-[#5099fe]" : "text-[#333333]"
                }`}
                onClick={() => {
                  onSelect(option);
                  onClose();
                }}
              >
                {option}
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
