interface HotelPassengerRequiredDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

/** Legacy CoreHelper.alert("请先添加旅客", true, "确定") — iOS-style prompt. */
export function HotelPassengerRequiredDialog({
  open,
  onClose,
  onConfirm,
}: HotelPassengerRequiredDialogProps) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-black/40 px-10 backdrop-blur-[2px]"
      role="presentation"
      onClick={onClose}
    >
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="hotel-passenger-required-title"
        aria-describedby="hotel-passenger-required-message"
        className="w-full max-w-[280px] overflow-hidden rounded-2xl bg-white shadow-[0_12px_40px_rgba(0,0,0,0.14)] ring-1 ring-black/[0.04]"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="px-5 pb-4 pt-5 text-center">
          <h2
            id="hotel-passenger-required-title"
            className="text-[17px] font-semibold tracking-tight text-[#1A1A1A]"
          >
            提示
          </h2>
          <p
            id="hotel-passenger-required-message"
            className="mt-2.5 text-[15px] leading-relaxed text-[#333333]"
          >
            请先添加旅客
          </p>
        </div>
        <div className="border-t border-[#E8ECF3]">
          <button
            type="button"
            className="flex h-11 w-full items-center justify-center text-[17px] font-medium text-brand-primary transition-colors active:bg-[#F5F8FF]"
            onClick={onConfirm}
          >
            确定
          </button>
        </div>
      </div>
    </div>
  );
}
