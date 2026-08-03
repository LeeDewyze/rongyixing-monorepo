interface PassengerPickerFooterProps {
  selectedCount: number;
  onShowSelected: () => void;
  onConfirm: () => void;
  confirmDisabled?: boolean;
}

export function PassengerPickerFooter({
  selectedCount,
  onShowSelected,
  onConfirm,
  confirmDisabled = false,
}: PassengerPickerFooterProps) {
  return (
    <div className="shrink-0 border-t border-[#eeeeee] bg-white px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
      <div className="mx-auto flex max-w-lg gap-3">
        <button
          type="button"
          className="flex h-11 flex-1 items-center justify-center rounded-full border border-[#5099fe] text-sm font-medium text-[#5099fe] active:bg-[#e8eeff]"
          onClick={onShowSelected}
        >
          已选择{selectedCount}人
        </button>
        <button
          type="button"
          disabled={confirmDisabled}
          className="flex h-11 flex-1 items-center justify-center rounded-full bg-[#5099fe] text-sm font-medium text-white active:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
          onClick={onConfirm}
        >
          确认
        </button>
      </div>
    </div>
  );
}
