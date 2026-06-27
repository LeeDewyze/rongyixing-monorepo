import { HOTEL_DETAIL_FONT } from "@/components/hotel/hotel-detail-chrome";

interface FlightOrderCancelDialogProps {
  open: boolean;
  pending?: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

export function FlightOrderCancelDialog({
  open,
  pending = false,
  onConfirm,
  onClose,
}: FlightOrderCancelDialogProps) {
  if (!open) return null;

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-8 ${HOTEL_DETAIL_FONT}`}
    >
      <div className="w-full max-w-sm rounded-2xl bg-white p-5">
        <h3 className="text-center text-[16px] font-semibold text-[#333333]">取消预订</h3>
        <p className="mt-3 text-center text-[14px] leading-relaxed text-[#666666]">
          是否取消预订？
        </p>
        <div className="mt-5 flex gap-3">
          <button
            type="button"
            className="flex h-10 flex-1 items-center justify-center rounded-full border border-[#DDDDDD] text-[14px] text-[#666666]"
            onClick={onClose}
            disabled={pending}
          >
            否
          </button>
          <button
            type="button"
            className="flex h-10 flex-1 items-center justify-center rounded-full bg-[#2768FA] text-[14px] text-white disabled:opacity-50"
            onClick={onConfirm}
            disabled={pending}
          >
            {pending ? "取消中…" : "是"}
          </button>
        </div>
      </div>
    </div>
  );
}
